const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const AppError = require("../utils/AppError");
const db = require("../db");

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Query to find the user by email
    const query = "SELECT * FROM user WHERE email = ?";
    const [rows] = await db.query(query, [email]);

    // Check if user exists
    if (rows.length === 0) {
      return next(new AppError("User not found.", 401));
    }

    const user = rows[0];
    if (user.status !== "active") {
      return next(new AppError("Your account is deactivated by admin", 400));
    }

    // Check if the password is correct
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      return next(new AppError("Wrong password!", 401));
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        email: user.email,
        userId: user.id.toString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "100h" }
    );

    return res.status(200).json({
      status: "success",
      message: "User logged in!",
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    // Check if oldPassword and newPassword are provided
    if (!oldPassword || !newPassword) {
      return next(new AppError("Both oldPassword and newPassword are required.", 400));
    }
    const { email} = req;
    const query = "SELECT * FROM user WHERE email = ?";
    const [rows] = await db.query(query, [email]);

    if (rows.length === 0) {
      return next(new AppError("User not found.", 401));
    }

    const user = rows[0];
    if (user.status !== "active") {
      return next(new AppError("Your account is deactivated by admin", 400));
    }
    
    const isEqual = await bcrypt.compare(oldPassword, user.password);
    if (!isEqual) {
      return next(new AppError("Wrong password!", 401));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const updateQuery = "UPDATE user SET password = ? WHERE email = ?";
    await db.query(updateQuery, [hashedPassword, email]);

    return res.status(200).json({
      status: "success",
      message: "Password updated!",
    });
  } catch (error) {
    console.error(error.statusCode);
    next(error);
  }
};
