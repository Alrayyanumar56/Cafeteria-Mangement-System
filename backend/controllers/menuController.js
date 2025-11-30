// backend/controllers/menuController.js
const db = require('../models/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM menu_items ORDER BY id DESC');
    // Merge categories for frontend compatibility
    const filtered = rows
      .filter(item => item.category !== 'fast-food' && item.category !== 'essentials')
      .map(item => {
        let category = item.category;
        if (category === 'cold-drinks' || category === 'hot-drinks') category = 'drinks';
        return { ...item, category };
      });
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    let { name, category, price, unit } = req.body;
    // Merge/ignore categories
    if (category === 'cold-drinks' || category === 'hot-drinks') category = 'drinks';
    if (category === 'fast-food' || category === 'essentials') {
      return res.status(400).json({ error: 'Category not allowed' });
    }
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
    let { name, category, price, unit } = req.body;
    if (category === 'cold-drinks' || category === 'hot-drinks') category = 'drinks';
    if (category === 'fast-food' || category === 'essentials') {
      return res.status(400).json({ error: 'Category not allowed' });
    }
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
