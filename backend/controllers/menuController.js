// backend/controllers/menuController.js
const db = require('../models/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu_items ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, category, price, unit } = req.body;
    const [result] = await db.query(
      'INSERT INTO menu_items (name, category, price, unit) VALUES (?, ?, ?, ?)',
      [name, category, price, unit]
    );
    res.json({ id: result.insertId, name, category, price, unit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { name, category, price, unit } = req.body;
    await db.query(
      'UPDATE menu_items SET name=?, category=?, price=?, unit=? WHERE id=?',
      [name, category, price, unit, id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const id = req.params.id;
    await db.query('DELETE FROM menu_items WHERE id=?', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
