const express = require("express");
const errorHandler = require("./src/middleware/errorHandler");
const cors = require("cors");
// const auth = require("./src/routes/auth");
// const tables = require("./src/routes/table");
// const webHooks = require("./src/routes/webhook");
// const jobStart = require("./src/jobs/AllJob");
// const dashboard = require("./src/routes/dashboard");
// const summary = require("./src/routes/summary");
// const checkSftpConnection  = require("./src/sftp");
const sftp = require("./src/routes/sftp");
// checkSftpConnection()
// jobStart();
const app = express();
app.use(express.json());
require("dotenv").config();
app.use(cors());


// app.use("/api/auth", auth);
// app.use("/api/tables", tables);
// app.use("/api/dashboard", dashboard);
// app.use("/api/summary", summary);

// app.use("/api/webhooks", webHooks);

app.use("/sftp" , sftp)

// Route to handle 404 errors
app.all("*", (req, res) => {
  return res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Global error handling middleware
app.use(errorHandler);

// Function to start the server
function startServer(port) {
  if (port > 65535) {
    console.error("No available ports in the valid range.");
    return;
  }

  app
    .listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    })
    .on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} is already in use, trying next port...`);
        startServer(port + 1);
      } else {
        console.error(err);
      }
    });
}

//error middleware
// app.use(errorMiddleware);
// Start server
const PORT = process.env.SERVER_PORT || 8080;

startServer(PORT);
