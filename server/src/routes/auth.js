const { signinValidator, handleValidationResult } = require('../validator/signin');
const { signin, updatePassword } = require('../controller/auth');
const bcrypt = require('bcryptjs/dist/bcrypt');
const db = require('../db');
const isAuth = require('../middleware/isAuthenticated');

const router = require('express').Router();


router.post("/login", signinValidator, handleValidationResult, signin);

router.post('/update-password' , isAuth ,updatePassword)


router.get("/add-admin", async (req, res) => {
    try {
      const password = "1234567"; // Define your password here or retrieve it from the request
      const hashedPw = await bcrypt.hash(password, 12);
  
      const query = "INSERT INTO `user` (email, password, role) VALUES (?, ?, ?)";
      await db.query(query, ["dbrahul03@gmail.com", hashedPw, "admin"]);
  
      return res.status(200).json({
        status: "success",
        message: "Data inserted successfully",
      });
    } catch (error) {
      console.error("Error inserting data:", error);
  
      return res.status(500).json({
        status: "error",
        message: "An error occurred while inserting data",
      });
    }
  });
  

module.exports = router;