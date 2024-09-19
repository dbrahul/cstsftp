const sheets = require("../config/googleSheetLog");
const { CronJob } = require("cron");
require("dotenv").config();
const db = require("../db.js");

let isRunning = false;

const getLastRow = async () => {
  const [result] = await db.query(
    "SELECT lastRow FROM `tax_investigation` ORDER BY lastRow DESC LIMIT 1"
  );
  // console.log("Last row fetched from the database:", result);
  return result.length ? result[0].lastRow : 0;
};

const getTaxInvestigationData = async (startRow) => {
  try {
    let localStartRow;

    if (startRow === 0) {
      localStartRow = 1;
    } else {
      localStartRow = startRow + 2;
    }
    let endrows = localStartRow + 100;
    // console.log(
    //   `Getting data from Google Sheet starting from row ${localStartRow}`
    // );

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
    console.log("Error fetching data:", error);
    return [];
  }
};

const StoreDataInDB = async () => {
  console.log("taxInvestigationJob");
  if (isRunning) {
    console.log("Previous job still running, skipping this execution.");
    return;
  }

  isRunning = true;
  try {
    const lastRow = await getLastRow(); // Get the last row that was processed
    const data = await getTaxInvestigationData(lastRow);

    // console.log("Fetched Data:", data);

    // If no new data is found, exit the function\
    if (!data.length) {
      isRunning = false;
      console.log("No new data found in the Google Sheet.");
      return;
    }

    // Remove the empty element at index 7 from each row
    let formattedData = data;

    // console.log("This is formated Data", formattedData);

    if (lastRow === 0) {
      formattedData = formattedData.slice(1);
    }

    let currentRow = lastRow;

    // Insert each new row into the database and update LastRow
    for (const row of formattedData) {
      ++currentRow;
      const query =
        "INSERT INTO `tax_investigation` (case_number, date_created, date_sold, settlement_officer, source, phone_number, amount_owed, true_source, team, unknown1, unknown2, lastRow) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      await db.query(query, [...row, currentRow]);
    }

    console.log(`Inserted ${formattedData.length} rows into the database.`);
  } catch (error) {
    console.log("Error storing data:", error);
  } finally {
    isRunning = false;
  }
};

const tax_investigationJob = new CronJob(
  "*/2 * * * *",
 function () {
  const d = new Date();
  StoreDataInDB();
},
true,
);

module.exports = tax_investigationJob;

