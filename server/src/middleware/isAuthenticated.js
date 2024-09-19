const jwt = require("jsonwebtoken");
require("dotenv").config();
const db = require("../db");
const AppError = require("../utils/AppError");

const isAuth = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader) {
      next(new AppError("Not authenticated.", 401));
    }

    const token = authHeader.split(" ")[1];
    let decodedToken;

    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      err.statusCode = 500;
      throw err;
    }

    if (!decodedToken) {
      next(new AppError("Not authenticated.", 401));
    }

    req.email = decodedToken.email;
    next();
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    if (!error.message) {
      error.message = "An error occurred.";
    }
    next(error); // Pass the error to the next middleware in the stack
  }
};

module.exports = isAuth;
