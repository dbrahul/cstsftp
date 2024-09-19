// require("dotenv").config();
// const { google } = require("googleapis");
// async function getGoogleSheetData() {
  
//   // Authenticate using the environment variables
//   const auth = new google.auth.GoogleAuth({
//     credentials: {
//       client_email: process.env.GOOGLE_CLIENT_EMAIL,
//       private_key: process.env.GOOGLE_SHEET_API_KEY.replace(/\\n/g, '\n'),
//     },
//     scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
//   });

//   // console.log(process.env.GOOGLE_SHEET_API_KEY)
//   const sheets = google.sheets({ version: "v4", auth });
//   // console.log("sheets", process.env.GOOGLE_SHEET_API_KEY);
//   try {
//     const response = await sheets.spreadsheets.values.get({
//       spreadsheetId: process.env.GOOGLE_SHEET_ID,
//       range: "Day Team Averages",
//     });

//     const rows = response.data.values;
//     console.log("This is response", rows);

//     if (rows.length) {
//       // console.log("row", rows);
//       return rows;
//     } else {
//       console.log("No data found in the Google Sheet.");
//     }
//   } catch (error) {
//     console.error("Error fetching data from Google Sheets:", error);
//   }
// }

// // getGoogleSheetData();

// module.exports = getGoogleSheetData;

// Run the function
