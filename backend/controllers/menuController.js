'use strict';
const db = require('../db');
const { h, bad } = require('../utils');

// ---------- Categories ----------
exports.catList = h(() => db.prepare(`
  SELECT c.*, (SELECT COUNT(*) FROM menu_items m WHERE m.category_id = c.id) AS item_count
  FROM categories c ORDER BY c.id`).all());

function catBody(b) {
  const name = String(b.name || '').trim();
  if (!name) throw bad('Category name is required');
  return [name, b.kitchen ? 1 : 0];
}
const uniq = e => { if (/UNIQUE/.test(e.message)) throw bad('That category already exists'); throw e; };
exports.catCreate = h(req => {
  try { const r = db.prepare('INSERT INTO categories (name, kitchen) VALUES (?, ?)').run(...catBody(req.body));
        return { id: r.lastInsertRowid }; } catch (e) { uniq(e); }
});
exports.catUpdate = h(req => {
  try { db.prepare('UPDATE categories SET name=?, kitchen=? WHERE id=?').run(...catBody(req.body), req.params.id);
        return { message: 'Updated' }; } catch (e) { uniq(e); }
});
exports.catRemove = h(req => {
  const n = db.prepare('SELECT COUNT(*) n FROM menu_items WHERE category_id=?').get(req.params.id).n;
  if (n) throw bad(`This category still has ${n} item(s). Move or delete them first.`);
  db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id);
  return { message: 'Deleted' };
});

// ---------- Menu items ----------
const SELECT = `SELECT m.*, c.name AS category FROM menu_items m JOIN categories c ON c.id = m.category_id`;
exports.getAll = h(() => db.prepare(SELECT + ' ORDER BY m.id DESC').all());

function itemBody(b) {
  const name = String(b.name || '').trim(), price = Number(b.price);
  if (!name) throw bad('Item name is required');
  if (!(price >= 0)) throw bad('Price must be a number');
  if (!db.prepare('SELECT 1 FROM categories WHERE id=?').get(b.category_id)) throw bad('Choose a category');
  return { name, price, category_id: b.category_id, unit: b.unit || '', image: b.image || '',
           kitchen: b.kitchen ? 1 : 0, available: b.available === false || b.available === 0 ? 0 : 1 };
}
exports.create = h(req => {
  const v = itemBody(req.body);
  const r = db.prepare(`INSERT INTO menu_items (name, category_id, price, unit, image, kitchen, available)
    VALUES (@name, @category_id, @price, @unit, @image, @kitchen, @available)`).run(v);
  return { id: r.lastInsertRowid };
});
exports.update = h(req => {
  const v = itemBody(req.body);
  db.prepare(`UPDATE menu_items SET name=@name, category_id=@category_id, price=@price, unit=@unit,
    image=@image, kitchen=@kitchen, available=@available WHERE id=@id`).run({ ...v, id: req.params.id });
  return { message: 'Updated' };
});
exports.remove = h(req => {   // old bills keep working: sale_items stores its own name/price
  db.prepare('DELETE FROM menu_items WHERE id=?').run(req.params.id);
  return { message: 'Deleted' };
});
