import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "inventory_db"   // your DB name
});

// Test DB connection
db.connect(err => {
    if (err) {
        console.log("MySQL Error:", err);
    } else {
        console.log("MySQL Connected!");
    }
});

// Example route
app.get("/items", (req, res) => {
    const sql = "SELECT * FROM inventory";
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
