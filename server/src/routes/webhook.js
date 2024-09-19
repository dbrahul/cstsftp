const router = require("express").Router();
const db = require("../db.js");
router.post("/zapier", (req, res) => {
  try {
    console.log("in post webhooks", req.body);
    res.status(200).json({
      status: "success",
      message: "Data received successfully.",
    });
  } catch (error) {
    console.error(error);
    console.log("error in post request", error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while processing the request.",
    });
  }
});

router.get("/zapier", async (req, res) => {
  try {
    let unProcessCall = ({
      QuerystringHandleTime,
      QuerystringAgent,
      QuerystringQueue,
      QuerystringPhoneNumber,
      QuerystringRecording,
      QuerystringFirstName,
      QuerystringLastName,
      QuerystringEmail,
      QuerystringCaseID,
      QuerystringDebtamout,
      QuerystringSource,
      QuerystringStatus,
      QuerystringAgentname,
      QuerystringAgentemail,
      QuerystringAgentgroup,
    } = req.query);

    unProcessCall.ProcessedStatus = false;
    unProcessCall.Created_At = new Date();

    let callUrl = `${process.env.CallRecordingBaseUrl}/${
      unProcessCall.QuerystringCaseID
    }/${new Date().toISOString().split("T")[0]}/${
      unProcessCall.QuerystringRecording
    }-all.mp3`;
    unProcessCall.callRecording = callUrl;

    const query =
      "INSERT INTO `unProcess_call` (QuerystringHandleTime, QuerystringAgent, QuerystringQueue, QuerystringPhoneNumber, QuerystringRecording, QuerystringFirstName, QuerystringLastName, QuerystringEmail, QuerystringCaseID, QuerystringDebtamout, QuerystringSource, QuerystringStatus, QuerystringAgentname, QuerystringAgentemail, QuerystringAgentgroup, ProcessedStatus, Created_At, callRecording ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    const values = [
      unProcessCall.QuerystringHandleTime,
      unProcessCall.QuerystringAgent,
      unProcessCall.QuerystringQueue,
      unProcessCall.QuerystringPhoneNumber,
      unProcessCall.QuerystringRecording,
      unProcessCall.QuerystringFirstName,
      unProcessCall.QuerystringLastName,
      unProcessCall.QuerystringEmail,
      unProcessCall.QuerystringCaseID,
      unProcessCall.QuerystringDebtamout,
      unProcessCall.QuerystringSource,
      unProcessCall.QuerystringStatus,
      unProcessCall.QuerystringAgentname,
      unProcessCall.QuerystringAgentemail,
      unProcessCall.QuerystringAgentgroup,
      unProcessCall.ProcessedStatus,
      unProcessCall.Created_At,
      unProcessCall.callRecording,
    ];

    const [row] = await db.query(query, values);
    res.status(200).json({
      status: "success",
      message: "Data received successfully.",
      result: row,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "An error occurred while processing the request.",
    });
  }
});

module.exports = router;
