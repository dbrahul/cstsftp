const db = require("../db");
const AppError = require("../utils/AppError");
const callLogs = async (req, res, next) => {
    const { page = 1, limit = 10, teamName } = req.query;
    const offset = (page - 1) * limit;
    try {
      let query = "SELECT COUNT(*) as count FROM calls_log";
      let queryParams = [];
  
      if (teamName) {
        query += " WHERE Team = ?";
        queryParams.push(teamName);
      }
  
      const [totalRows] = await db.query(query, queryParams);
      const callLogs = totalRows[0].count;
  
      let dataQuery = "SELECT * FROM calls_log";
      let dataParams = [];
  
      if (teamName) {
        dataQuery += " WHERE Team = ?";
        dataParams.push(teamName);
      }
  
      dataQuery += " LIMIT ? OFFSET ?";
      dataParams.push(parseInt(limit), parseInt(offset));
  
      const [rows] = await db.query(dataQuery, dataParams);
  
      if (rows.length === 0) {
        return next(new AppError("No call logs found.", 404));
      }
  
      // Calculate total pages
      const totalPages = Math.ceil(callLogs / limit);
  
      // Return the paginated call logs
      res.status(200).json({
        status: "success",
        data: {
          team: teamName || "All Teams",
          callLogs: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: totalPages,
            callLogs: callLogs,
            limit: parseInt(limit),
          },
        },
      });
    } catch (error) {
      console.error(error);
      next(new AppError("An error occurred while retrieving the call logs.", 500));
    }
  };
  
module.exports = callLogs;
  