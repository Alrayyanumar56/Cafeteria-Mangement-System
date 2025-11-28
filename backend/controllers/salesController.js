// backend/controllers/salesController.js
const db = require('../models/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sales ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { items, total_amount, payment_type } = req.body;
    const itemsJson = JSON.stringify(items);
    const [r] = await db.query(
      'INSERT INTO sales (items_json, total_amount, payment_type) VALUES (?, ?, ?)',
      [itemsJson, total_amount, payment_type]
    );
    res.json({ id: r.insertId, items, total_amount, payment_type });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
