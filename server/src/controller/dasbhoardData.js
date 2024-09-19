const db = require("../db");
const AppError = require("../utils/AppError");

exports.dashboardData = async (req, res, next) => {
  try {
    if (!db) {
      throw new AppError("Database connection is not available", 500);
    }

    const [callLogsResult, teamsResult, taxInvestigationResult] = await Promise.all([
      db.query("SELECT COUNT(*) as count FROM calls_log"),
      db.query("SELECT COUNT(*) as count FROM team_members"),
      db.query("SELECT COUNT(*) as count FROM tax_investigation"),
    ]);

    console.log(callLogsResult[0][0].count ,teamsResult[0][0].count , taxInvestigationResult[0][0].count)
    // Access the first row of each result set
    const callLogs = callLogsResult[0][0].count || 0;
    const teams = teamsResult[0][0].count || 0;
    const taxInvestigation = taxInvestigationResult[0][0].count || 0;

    res.status(200).json({
      status: "success",
      data: {
        callLogs,
        teams,
        taxInvestigation,
      },
    });
  } catch (error) {
    console.error("Error occurred in dashboardData:", error.message);
    next(error);
  }
};

