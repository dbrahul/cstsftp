const router = require("express").Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Client = require("ssh2-sftp-client");
require("dotenv").config();
const sftp = new Client();

// SFTP configuration
const sftpConfig = {
  host: "159.121.130.149",
  port: "2220",
  username: "Yteltest",
  password: process.env.SFTP_PASSWORD,
  readyTimeout: 20000, // Increased timeout
};

console.log("SFTP configuration:", process.env.SFTP_PASSWORD);

const MAX_RETRIES = 3; // Maximum number of retries for SFTP upload

// Function to generate the current date string
const getCurrentDateString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
};

// Controller for handling the entire process
const handleFileTransfer = async (req, res) => {
  try {
    const { url } = req.query; // Get the URL from the query parameter

    if (!url) {
      return res.status(400).json({
        status: "error",
        message: "Please enter a valid URL",
      });
    }

    // Extract the original file name from the URL
    const originalFileName = path.basename(url); // e.g., "Qualified1.mp3"

    // Generate the new file name with the current date
    const currentDate = getCurrentDateString();
    const newFileName = `${
      path.parse(originalFileName).name
    }-${currentDate}${path.extname(originalFileName)}`; // e.g., "Qualified1-2024-09-19.mp3"

    // Define the temp directory path
    const tempFolderPath = path.join(__dirname, "temp");

    // Ensure the temp directory exists
    if (!fs.existsSync(tempFolderPath)) {
      fs.mkdirSync(tempFolderPath);
    }

    // Define the local file path (where the file will be saved locally with the new name)
    const localFilePath = path.join(tempFolderPath, newFileName);

    // Step 1: Download the file from the provided URL and save it to the temp folder
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream", // Fetch the file as a stream
    });

    // Create a write stream to save the file locally
    const writer = fs.createWriteStream(localFilePath);

    // Pipe the response data to the file
    response.data.pipe(writer);

    // Wait for the file to finish writing
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(`File successfully downloaded and saved to ${localFilePath}`);

    // Step 2: Upload the file to the SFTP server
    const remoteFilePath = `/US_Transfer/${newFileName}`; // Use the new file name for SFTP

    const uploadMp3ToSftp = async (retries = 0) => {
      try {
        await sftp.connect(sftpConfig);
        console.log("Successfully connected to the SFTP server!");

        // Upload the file to the SFTP server
        await sftp.put(localFilePath, remoteFilePath);
        console.log(`File successfully uploaded to SFTP at ${remoteFilePath}`);
      } catch (err) {
        console.error("Error during file upload:", err.message);

        // Retry if failed and within the retry limit
        if (retries < MAX_RETRIES) {
          console.log(`Retrying upload (${retries + 1}/${MAX_RETRIES})...`);
          await uploadMp3ToSftp(retries + 1);
        } else {
          throw new Error("File upload failed after maximum retries");
        }
      } finally {
        await sftp.end(); // Always close the connection to SFTP server
      }
    };

    // Call the upload function
    await uploadMp3ToSftp();

    // Step 3: Delete the file from the local temp folder after successful upload
    fs.unlink(localFilePath, (err) => {
      if (err) {
        console.error("Error deleting local file:", err.message);
      } else {
        console.log("Local file deleted successfully:", localFilePath);
      }
    });

    // Send success response
    return res.status(200).json({
      status: "success",
      message: "successfully uploaded the file to the SFTP server",
    });
  } catch (error) {
    console.error("Error in handleFileTransfer:", error.message);
    return res.status(500).json({
      status: "error",
      message: "An error occurred during the file transfer process",
    });
  }
};

router.get("/url", handleFileTransfer);

module.exports = router;
