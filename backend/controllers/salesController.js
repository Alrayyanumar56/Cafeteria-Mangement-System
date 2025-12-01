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
    rows.forEach(sale => {
      let items = [];
      try { items = JSON.parse(sale.items_json); } catch { items = []; }

      items.forEach(it => {
        records.push({
          date: sale.created_at.toISOString().split("T")[0],
          name: it.name,
          qty: Number(it.qty) || 0,
          price: Number(it.price) || 0,
          payment: sale.payment_type || "cash"
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

    const bills = rows.map(sale => {
      let items = [];
      try { items = JSON.parse(sale.items_json); } catch { items = []; }

      return {
        id: sale.id,
        date: sale.created_at,
        dateSimple: sale.created_at.toISOString().split("T")[0],

        items: items.map(it => ({
          id: it.id,
          name: it.name,
          qty: Number(it.qty) || 0,
          price: Number(it.price) || 0
        })),

        total: Number(sale.total_amount) || 0,

        payments: {
          cash: sale.payment_type === "cash" ? Number(sale.total_amount) : 0,
          online: sale.payment_type === "online" ? Number(sale.total_amount) : 0
        }
      };
    });

    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
