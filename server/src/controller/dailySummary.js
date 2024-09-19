const AppError = require("../utils/AppError");
const db = require("../db");

const dailySummary = async (req, res, next) => {
  try {
    let { day } = req.query;
    if (!day) {
      return next(
        new AppError("Please provide a day to fetch the summary)", 400)
      );
    }
    // console.log("Day:", day);
    // day = "2023-06-26"; // Specify the date in the format YYYY-MM-DD

    // Query of calls_log

    const query = `
      SELECT 
          Team,
          ToName as name,
          COUNT(*) as totalCall,
          SUM(CASE WHEN qualified = 'TRUE' THEN 1 ELSE 0 END) as totalQualifiedCall,
          (SELECT COUNT(*) 
           FROM calls_log cl2 
           WHERE cl2.Team = cl1.Team 
             AND DATE(STR_TO_DATE(cl2.CallStartTime, '%m/%d/%Y %H:%i:%s')) = ?
          ) as teamTotalCall,
          (SELECT SUM(CASE WHEN cl2.qualified = 'TRUE' THEN 1 ELSE 0 END)
           FROM calls_log cl2 
           WHERE cl2.Team = cl1.Team 
             AND DATE(STR_TO_DATE(cl2.CallStartTime, '%m/%d/%Y %H:%i:%s')) = ?
          ) as teamTotalQualifiedCall,
          (SELECT COUNT(DISTINCT cl2.ToName)
           FROM calls_log cl2 
           WHERE cl2.Team = cl1.Team 
             AND DATE(STR_TO_DATE(cl2.CallStartTime, '%m/%d/%Y %H:%i:%s')) = ?
          ) as totalPlayers
      FROM calls_log cl1
      WHERE DATE(STR_TO_DATE(CallStartTime, '%m/%d/%Y %H:%i:%s')) = ?
      GROUP BY Team, ToName
    `;

    const [rows] = await db.query(query, [day, day, day, day]);
    // query of tax investigation
    const taxInvestigationQuery = `
    SELECT 
      team,
      settlement_officer AS player,
      COUNT(*) AS totalDealsByPlayer,
      SUM(CASE WHEN date_sold = date_created THEN 1 ELSE 0 END) AS sameDayDealsByPlayer,
      (SELECT COUNT(*) 
       FROM tax_investigation ti2 
       WHERE ti2.team = ti1.team 
         AND STR_TO_DATE(ti2.date_created, '%m/%d/%Y') = '${day}') AS totalDealsByTeam,
      (SELECT SUM(CASE WHEN ti2.date_sold = ti2.date_created THEN 1 ELSE 0 END) 
       FROM tax_investigation ti2 
       WHERE ti2.team = ti1.team 
         AND STR_TO_DATE(ti2.date_created, '%m/%d/%Y') = '${day}') AS sameDayDealsByTeam
    FROM tax_investigation ti1
    WHERE STR_TO_DATE(ti1.date_created, '%m/%d/%Y') = ?
    GROUP BY team, settlement_officer;
  `;

    const [taxRows] = await db.query(taxInvestigationQuery, [day, day]);
    // console.log("Result for tax_investigation log:", taxRows);
    // console.log("Result for tax_investigation log:", rows);
    // Transform data into the desired structure
    let teams = {};
    rows.forEach((row) => {
      const {
        Team,
        name,
        totalCall,
        totalQualifiedCall,
        teamTotalCall,
        teamTotalQualifiedCall,
        totalPlayers,
      } = row;

      // Initialize the team object if it doesn't exist
      if (!teams[Team]) {
        teams[Team] = {
          teamPlayers: [],
          totalCalls: teamTotalCall,
          totalQualified: teamTotalQualifiedCall,
          totalPlayers: totalPlayers,
          averageCallsPerPlayer: (teamTotalCall / totalPlayers).toFixed(1), // Calculate the average total calls per player
          averageQualifiedCallsPerPlayer: (
            teamTotalQualifiedCall / totalPlayers
          ).toFixed(1), // Calculate the average qualified calls per player
        };
      }

      // Add the player to the team
      teams[Team].teamPlayers.push({
        name,
        totalCall,
        totalQualified: totalQualifiedCall,
        totalDealsByPlayer: 0,
        sameDayDealsByPlayer: 0,
        closingRatio: 0,
        sameDayClosingRatio: 0,
      });
    });

    // Merge tax investigation data with the previous data
    taxRows.forEach((taxRow) => {
      const {
        team,
        player,
        totalDealsByPlayer,
        sameDayDealsByPlayer,
        totalDealsByTeam,
        sameDayDealsByTeam,
      } = taxRow;

      // Initialize team data in the previous data if it doesn't exist
      if (!teams[team]) {
        teams[team] = {
          teamPlayers: [],
          totalCalls: 0, // Will be set from the previous query
          totalQualified: 0, // Will be set from the previous query
          totalDealsByTeam: totalDealsByTeam,
          sameDayDealsByTeam: sameDayDealsByTeam,
        };
      } else {
        teams[team].totalDealsByTeam = totalDealsByTeam;
        teams[team].sameDayDealsByTeam = sameDayDealsByTeam;
        teams[team].averageDealsPerPlayer = (
          totalDealsByTeam / teams[team].totalPlayers
        ).toFixed(1);
        teams[team].averageSameDayDealsPerPlayer = (
          sameDayDealsByTeam / teams[team].totalPlayers
        ).toFixed(1);
        teams[team].closingRatio = (
          (teams[team].totalDealsByTeam / teams[team].totalQualified) *
          100
        ).toFixed(2);
        teams[team].sameDayClosingRatio = (
          (teams[team].sameDayDealsByTeam / teams[team].totalQualified) *
          100
        ).toFixed(2);
      }

      // Find the player in the teamPlayers array
      const playerData = teams[team].teamPlayers.find((p) => p.name === player);

      if (playerData) {
        // Update the player with the tax investigation data

        playerData.totalDealsByPlayer = totalDealsByPlayer;
        playerData.sameDayDealsByPlayer = sameDayDealsByPlayer;
        playerData.closingRatio = (
          playerData.totalQualified > 0
            ? ((playerData.totalDealsByPlayer / playerData.totalQualified) * 100).toFixed(2)
            : 0
        );
        playerData.sameDayClosingRatio = (
          playerData.totalQualified > 0
            ? ((playerData.sameDayDealsByPlayer / playerData.totalQualified) * 100).toFixed(2)
            : 0
        );
      } else {
        // If the player doesn't exist, add them with the tax investigation data
        // console.log("Player not found:", player);
        teams[team].teamPlayers.push({
          name: player,
          totalCall: 0, // Will be set from the previous query
          totalQualified: 0, // Will be set from the previous query
          totalDealsByPlayer: totalDealsByPlayer,
          sameDayDealsByPlayer: sameDayDealsByPlayer,
          closingRatio: 0,
          sameDayClosingRatio: 0,
        });
      }
    });
    // Send the structured response
    res.status(200).json({
      status: "success",
      message: `Daily summary for ${day} grouped by team fetched successfully.`,
      result: teams,
    });
  } catch (error) {
    console.log("Error:", error);
    next(
      new AppError("An error occurred while retrieving the daily summary.", 500)
    );
  }
};

module.exports = dailySummary;
