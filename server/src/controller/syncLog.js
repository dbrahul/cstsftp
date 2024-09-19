const sheets = require("../config/googleSheetLog");
require("dotenv").config();
const db = require("../db.js");

let isRunning = false;

// Function to get the last processed row from the database
const getLastRow = async () => {
  try {
    const [result] = await db.query(
      "SELECT LastRow FROM `calls_log` ORDER BY LastRow DESC LIMIT 1"
    );
    console.log("Last row fetched from the database:", result);
    return result.length ? result[0].LastRow : 0;
  } catch (error) {
    console.error("Error fetching last row from the database:", error);
    throw new Error("Failed to fetch last row from the database.");
  }
};

// Function to fetch call log data from Google Sheets
const getCallLogData = async (startRow) => {
  try {
    const localStartRow = startRow === 0 ? 1 : startRow + 2;
    const endrows = localStartRow + 5;

    console.log(`Fetching data from Google Sheet starting at row ${localStartRow}`);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Call Log!A${localStartRow}:Z${endrows}`,
    });

    const rows = response.data.values || [];
    
    if (rows.length) {
      console.log(`Fetched ${rows.length} rows from Google Sheets.`);
      return rows;
    } else {
      console.log("No new data found in the Google Sheet.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    throw new Error("Failed to fetch data from Google Sheets.");
  }
};

// Function to format and store the fetched data into the database
const storeDataInDB = async () => {
  if (isRunning) {
    console.log("Sync is already running. Skipping this execution.");
    return;
  }

  isRunning = true;
  try {
    const lastRow = await getLastRow(); // Get the last row processed
    const data = await getCallLogData(lastRow);

    if (!data.length) {
      console.log("No new data to insert.");
      return;
    }

    // Format the data: Remove the empty element at index 7 from each row
    let formattedData = data.map((row) => row.filter((_, index) => index !== 7));

    console.log("Formatted Data:", formattedData);

    if (lastRow === 0) {
      formattedData = formattedData.slice(1); // Remove headers if it's the first sync
    }

    // Append current row numbers to each row
    let currentRow = lastRow;
    formattedData = formattedData.map((row) => {
      ++currentRow;
      return [...row, currentRow]; // Append the row number
    });

    const query =
      "INSERT INTO `calls_log` (sessionId, fromNumber, ToName, HandleTime, CallStartTime, queue, qualified, Team, LastRow) VALUES ?";

    const result = await db.query(query, [formattedData]);
    console.log(`Inserted ${result.affectedRows} rows into the database.`);
  } catch (error) {
    console.error("Error storing data in the database:", error);
    throw new Error("Failed to store data in the database.");
  } finally {
    isRunning = false;
    console.log("Data sync completed.");
  }
};

// Controller to handle the sync request
exports.syncCallLog = async (req, res, next) => {
  try {
    await storeDataInDB(); // Ensure the sync completes before responding
    return res.status(200).json({
      status: "success",
      message: "Data synced successfully.",
    });
  } catch (error) {
    console.error("Error syncing call log data:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "An error occurred during data syncing.",
    });
  }
};
