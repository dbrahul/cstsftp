const sheets = require("../config/googleSheetLog.js");
require("dotenv").config();
const db = require("../db.js");

let isRunning = false;

// Get the last processed row from the database
const getLastRow = async () => {
  try {
    const [result] = await db.query(
      "SELECT lastRow FROM `tax_investigation` ORDER BY lastRow DESC LIMIT 1"
    );
    return result.length ? result[0].lastRow : 0;
  } catch (error) {
    console.error("Error fetching last row from the database:", error);
    throw new Error("Failed to retrieve last row.");
  }
};

// Fetch data from Google Sheets starting from the last row
const getTaxInvestigationData = async (startRow) => {
  try {
    const localStartRow = startRow === 0 ? 1 : startRow + 2;
    const endrows = localStartRow + 4; // Fetch 4 rows at a time

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `TI log!A${localStartRow}:Z${endrows}`,
    });

    const rows = response.data.values;

    if (rows && rows.length) {
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

// Store fetched data into the database
const storeDataInDB = async () => {
  if (isRunning) {
    console.log("Sync is already running. Skipping this execution.");
    return;
  }

  isRunning = true;
  console.log("Data sync started...");

  try {
    const lastRow = await getLastRow();
    const data = await getTaxInvestigationData(lastRow);

    if (!data.length) {
      console.log("No new data to insert.");
      return;
    }

    let currentRow = lastRow;
    let formattedData = data;

    // Skip header row if it's the first run
    if (lastRow === 0) {
      formattedData = formattedData.slice(1);
    }

    formattedData = formattedData.map((row) => {
      ++currentRow;
      return [...row, currentRow]; // Append the row number to the data
    });

    const query =
      "INSERT INTO `tax_investigation` (case_number, date_created, date_sold, settlement_officer, source, phone_number, amount_owed, true_source, team, unknown1, unknown2, lastRow) VALUES ?";

    const result = await db.query(query, [formattedData]);
    console.log(`Inserted ${result.affectedRows} rows into the database.`);
  } catch (error) {
    console.error("Error during data sync:", error);
    throw new Error("Failed to store data in the database.");
  } finally {
    isRunning = false;
    console.log("Data sync completed.");
  }
};

// Controller to handle the sync request
exports.syncTaxInvestigation = async (req, res, next) => {
  try {
    await storeDataInDB(); // Wait for the data sync to complete
    return res.status(200).json({
      status: "success",
      message: "Data synced successfully.",
    });
  } catch (error) {
    console.error("Error syncing data:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "An error occurred during data syncing.",
    });
  }
};
