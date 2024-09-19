const db = require("../db");
const AppError = require("../utils/AppError");

const teams = async (req, res, next) => {
  const { page = 1, limit = 10, teamName } = req.query;
  const offset = (page - 1) * limit;
  try {
    if (!teamName) {
      return next(new AppError("Please provide a team name.", 400));
    }

    const [totalRows] = await db.query(
      "SELECT COUNT(*) as count FROM team_members WHERE Team = ?",
      [teamName]
    );
    const totalMembers = totalRows[0].count;

    const [rows] = await db.query(
      "SELECT * FROM team_members WHERE Team = ? LIMIT ? OFFSET ?",
      [teamName, parseInt(limit), parseInt(offset)]
    );

    if (rows.length === 0) {
      return next(
        new AppError("Team not found or no members in this team.", 404)
      );
    }

    // Calculate total pages
    const totalPages = Math.ceil(totalMembers / limit);

    // Return the paginated team members
    res.status(200).json({
      status: "success",
      data: {
        team: teamName,
        members: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: totalPages,
          totalMembers: totalMembers,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error(error);
    next(
      new AppError("An error occurred while retrieving the team members.", 500)
    );
  }
};

module.exports = teams;
