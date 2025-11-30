// backend/models/db.js
const mysql = require('mysql2');
require('dotenv').config({ path: __dirname + '/../.env' }); // make sure .env path is correct

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'cafe123',
  database: process.env.DB_NAME || 'cafeteria', // <- must match your actual DB name
  port: process.env.DB_PORT || 3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();
