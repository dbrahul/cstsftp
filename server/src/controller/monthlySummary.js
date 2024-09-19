const AppError = require("../utils/AppError");
const db = require("../db");


function AverageByMonth(number , workingDays) {

  if (
    number == 0 ||
    number === null ||
    number === undefined ||
    number === "0"
  ) {
    return "0.0";
  }
  return (number / workingDays).toFixed(2);
}

const getWorkingDaysInMonth = (monthString) => {
  const [year, month] = monthString.split("-").map(Number);

  // Get the first and last day of the month
  const firstDay = new Date(year, month - 1, 1); // month is zero-based
  const lastDay = new Date(year, month, 0); // zero day of next month gives last day of the month

  let workingDaysCount = 0;

  // Loop through each day of the month
  for (let day = firstDay; day <= lastDay; day.setDate(day.getDate() + 1)) {
    const dayOfWeek = day.getDay();
    // Check if the day is not Saturday (6) or Sunday (0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDaysCount++;
    }
  }

  return workingDaysCount;
};


const monthlySummary = async (req, res, next) => {
    try {

      let { month } = req.query;
      if (!month) {
        return next(
          new AppError("Please provide a month to fetch the summary", 400)
        );
      }


      const workingDays = getWorkingDaysInMonth(month);

      const callLogQuery = `
        SELECT 
            Team,
            ToName as name,
            COUNT(*) as totalCall,
            SUM(CASE WHEN qualified = 'TRUE' THEN 1 ELSE 0 END) as totalQualifiedCall,
            (SELECT COUNT(*) 
             FROM calls_log cl2 
             WHERE cl2.Team = cl1.Team 
               AND DATE_FORMAT(STR_TO_DATE(cl2.CallStartTime, '%m/%d/%Y %H:%i:%s'), '%Y-%m') = ? 
            ) as teamTotalCall,
            (SELECT SUM(CASE WHEN cl2.qualified = 'TRUE' THEN 1 ELSE 0 END)
             FROM calls_log cl2 
             WHERE cl2.Team = cl1.Team 
               AND DATE_FORMAT(STR_TO_DATE(cl2.CallStartTime, '%m/%d/%Y %H:%i:%s'), '%Y-%m') = ?
            ) as teamTotalQualifiedCall,
            (SELECT COUNT(DISTINCT cl2.ToName)
             FROM calls_log cl2 
             WHERE cl2.Team = cl1.Team 
               AND DATE_FORMAT(STR_TO_DATE(cl2.CallStartTime, '%m/%d/%Y %H:%i:%s'), '%Y-%m') = ?
            ) as totalPlayers
        FROM calls_log cl1
        WHERE DATE_FORMAT(STR_TO_DATE(CallStartTime, '%m/%d/%Y %H:%i:%s'), '%Y-%m') = ?
        GROUP BY Team, ToName
      `;
  
      const [rows] = await db.query(callLogQuery, [month, month, month, month]);
  
      const taxInvestigationQuery = `
        SELECT 
          team,
          settlement_officer AS player,
          COUNT(*) AS totalDealsByPlayer,
          SUM(CASE WHEN date_sold = date_created THEN 1 ELSE 0 END) AS sameDayDealsByPlayer,
          (SELECT COUNT(*) 
           FROM tax_investigation ti2 
           WHERE ti2.team = ti1.team 
             AND DATE_FORMAT(STR_TO_DATE(ti2.date_created, '%m/%d/%Y'), '%Y-%m') = ?
          ) AS totalDealsByTeam,
          (SELECT SUM(CASE WHEN ti2.date_sold = ti2.date_created THEN 1 ELSE 0 END) 
           FROM tax_investigation ti2 
           WHERE ti2.team = ti1.team 
             AND DATE_FORMAT(STR_TO_DATE(ti2.date_created, '%m/%d/%Y'), '%Y-%m') = ?
          ) AS sameDayDealsByTeam
        FROM tax_investigation ti1
        WHERE DATE_FORMAT(STR_TO_DATE(ti1.date_created, '%m/%d/%Y'), '%Y-%m') = ?
        GROUP BY team, settlement_officer;
      `;
  
      const [taxRows] = await db.query(taxInvestigationQuery, [month, month, month]);
  
      // Transform the data into the desired structure
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
          totalCallAverage: AverageByMonth(totalCall , workingDays),
          totalQualified: totalQualifiedCall,
          totalQualifiedAverage: AverageByMonth(totalQualifiedCall , workingDays),
          totalDealsByPlayer: 0,
          totalDealAverage : "0.0",
          totalSameDayDealAverage : "0.0",
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
          playerData.totalDealAverage =  AverageByMonth(totalDealsByPlayer, workingDays);
          playerData.totalSameDayDealAverage = AverageByMonth(sameDayDealsByPlayer , workingDays);
          playerData.sameDayDealsByPlayer = sameDayDealsByPlayer;
          playerData.closingRatio =
            playerData.totalQualified > 0
              ? (
                  (playerData.totalDealsByPlayer / playerData.totalQualified) *
                  100
                ).toFixed(2)
              : 0;
          playerData.sameDayClosingRatio =
            playerData.totalQualified > 0
              ? (
                  (playerData.sameDayDealsByPlayer / playerData.totalQualified) *
                  100
                ).toFixed(2)
              : 0;
        } else {
          // If the player doesn't exist, add them with the tax investigation data
          teams[team].teamPlayers.push({
            name: player,
            totalCall: 0, // Will be set from the previous query
            totalQualified: 0, // Will be set from the previous query
            totalDealsByPlayer: totalDealsByPlayer,
            sameDayDealsByPlayer: sameDayDealsByPlayer,
            closingRatio: 0,
            sameDayClosingRatio: 0,
            totalDealAverage: AverageByMonth(totalDealsByPlayer , workingDays),
            totalSameDayDealAverage: AverageByMonth(sameDayDealsByPlayer , workingDays),
            totalCallAverage: '0.0',
            totalQualifiedAverage: '0.0',
          });
        }
      });
  
      // Send the structured response
      res.status(200).json({
        status: "success",
        message: `Monthly summary for ${month} grouped by team fetched successfully.`,
        result: teams,
      });
    } catch (error) {
      console.log("Error:", error);
      next(
        new AppError("An error occurred while retrieving the monthly summary.", 500)
      );
    }
  };


module.exports = monthlySummary;