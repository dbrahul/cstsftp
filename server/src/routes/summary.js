const dailySummary = require("../controller/dailySummary");
const weekSummary = require("../controller/weekSummary");
const monthlySummary = require("../controller/monthlySummary");
const router = require("express").Router();

router.get("/daily",dailySummary);
router.get("/weekly",weekSummary);
router.get("/monthly",monthlySummary);



module.exports = router;


