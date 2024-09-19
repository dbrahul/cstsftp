const { checkSchema, validationResult } = require("express-validator");


const signinValidator = checkSchema({
  email: {
    notEmpty: {
      required: true,
      errorMessage: "Email is required",
    },
    isEmail: {
      errorMessage: "Email is not valid",
    },
    normalizeEmail: true,
    trim: true,
    escape: true, // Sanitize input to prevent script execution
  },
  password: {
    notEmpty: {
      required: true,
      errorMessage: "Password is required",
    },
    isLength: {
      options: { min: 6 },
      errorMessage: "Password should be at least 6 chars long",
    },
    trim: true,
    escape: true, // Sanitize input to prevent script execution
  },
});

const handleValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array();
    return res.status(400).json({
      status: "error",
      message: message[0].msg || "Validation failed",
    });
  }
  next();
};

module.exports = { signinValidator, handleValidationResult };

