const errorHandler = (err, req, res, next) => {
   console.log("top",err)
  let statusCode = err.statusCode || 500;
  let status = err.status || "error";

  // Log error details in development environment
  if (process.env.NODE_ENV === "development") {
    console.error("ERROR:development", err);
    return res.status(statusCode).json({
      status,
      message: err.message,
      stack: err.stack,
      details: err.details || null,
    });
  }

  // In production, do not leak stack trace to the client
  if (process.env.NODE_ENV === "production") {
    console.error("ERROR:productions", err);
    if (err.isOperational) {
      return res.status(statusCode).json({
        status,
        message: err.message,
      });
    }

    // For unknown errors, send a generic message
    return res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

module.exports = errorHandler;
