'use strict';
const db = require('../db');
const { h, bad } = require('../utils');
const body = b => {
  const name = String(b.item_name || '').trim();
  if (!name) throw bad('Item name is required');
  return [name, Number(b.quantity) || 0, b.unit || '', b.note || ''];
};
exports.getAll = h(() => db.prepare('SELECT * FROM inventory ORDER BY id DESC').all());
exports.create = h(req => ({ id: db.prepare('INSERT INTO inventory (item_name, quantity, unit, note) VALUES (?,?,?,?)').run(...body(req.body)).lastInsertRowid }));
exports.update = h(req => { db.prepare("UPDATE inventory SET item_name=?, quantity=?, unit=?, note=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(...body(req.body), req.params.id); return { message: 'Updated' }; });
exports.remove = h(req => { db.prepare('DELETE FROM inventory WHERE id=?').run(req.params.id); return { message: 'Deleted' }; });
