// const Client = require("ssh2-sftp-client");
// const path = require("path");
// const fs = require("fs").promises;

// const sftp = new Client();

// const config = {
//   host: "",
//   port: "2220",
//   username: "Yteltest",
//   password: "",
//   readyTimeout: 20000, // Increased timeout
// };

// // File paths
// const localFilePath = path.join(__dirname, "delete.mp3");
// const remoteFilePath = "/US_Transfer/your-file.mp3";

// const MAX_RETRIES = 3; // Maximum number of retries

// async function uploadMp3ToSftp(retries = 0) {
//   try {
//     // Connect to the SFTP server
//     await sftp.connect(config);
//     console.log("Successfully connected to the SFTP server!");

//     // Upload the MP3 file
//     await sftp.put(localFilePath, remoteFilePath);
//     console.log(`Successfully uploaded the file to: ${remoteFilePath}`);

//     try {
//       const fileExists = await fs.access(localFilePath);
//       console.log("File exists locally, proceeding to delete...", fileExists);

//       // Delete the local file after successful upload
//       await fs.unlink(localFilePath);
//       console.log("Successfully deleted the local file:", localFilePath);
//     } catch (err) {
//       console.error("Error deleting the local file:", err.message);
//     }
//   } catch (err) {
//     console.error("Error during file upload:", err.message);

//     // If an error occurs, retry up to MAX_RETRIES times
//     if (retries < MAX_RETRIES) {
//       console.log(`Retrying upload (${retries + 1}/${MAX_RETRIES})...`);
//       await uploadMp3ToSftp(retries + 1);
//     } else {
//       console.error("File upload failed after maximum retries");
//     }
//   } finally {
//     // Close the connection
//     await sftp.end();
//   }
// }

// // Run the upload function
// // uploadMp3ToSftp();

// module.exports = uploadMp3ToSftp;
