require("dotenv").config();
const mysql = require("mysql2/promise");
const db = mysql.createPool({
  host: process.env.Dbhost,
  user: process.env.Dbusername,
  password: process.env.Dbpassword,
  database: process.env.Dbdatabase,
  port: process.env.Dbport,
});

module.exports = db;
