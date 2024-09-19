const { dashboardData } = require("../controller/dasbhoardData");
const isAuth = require("../middleware/isAuthenticated");

const router = require("express").Router();

router.get("/get", isAuth ,dashboardData);

module.exports = router;
