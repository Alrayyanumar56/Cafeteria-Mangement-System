// backend/controllers/salesController.js
const db = require('../models/db');

// Get all sales (raw)
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sales ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new sale
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

// For report: Flattened sales items
exports.getSalesRecords = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sales ORDER BY created_at DESC');
    const records = [];
    rows.forEach(r => {
      const items = JSON.parse(r.items_json || '[]');
      items.forEach(it => {
        records.push({
          date: r.created_at.toISOString().split('T')[0],
          name: it.name,
          qty: it.qty,
          price: it.price,
          payment: r.payment_type
        });
      });
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// For report: Bills
exports.getSalesBills = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sales ORDER BY created_at DESC');
    const bills = rows.map(r => ({
      id: r.id,
      date: r.created_at,
      dateSimple: r.created_at.toISOString().split('T')[0],
      items: JSON.parse(r.items_json || '[]'),
      total: r.total_amount,
      payments: {
        cash: r.payment_type === 'cash' ? r.total_amount : 0,
        online: r.payment_type === 'online' ? r.total_amount : 0
      }
    }));
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
