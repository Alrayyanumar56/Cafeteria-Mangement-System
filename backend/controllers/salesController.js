'use strict';
const db = require('../db');
const { h, bad, round, localDate, localDateTime } = require('../utils');

// ---------- Checkout ----------
// The server recomputes every price and total itself; the browser only says WHAT was ordered.
exports.create = h(req => {
  const { items, cash_received = 0, online_amount = 0 } = req.body;
  const customer = String(req.body.customer_name || '').trim().slice(0, 40);
  if (!Array.isArray(items) || !items.length) throw bad('The cart is empty');

  const getItem = db.prepare('SELECT * FROM menu_items WHERE id=?');
  const lines = items.map(it => {
    const qty = Math.floor(Number(it.qty));
    if (!(qty >= 1 && qty <= 99)) throw bad('Quantity must be 1 to 99');
    if (it.id) {
      const m = getItem.get(it.id);
      if (!m) throw bad('An item in the cart no longer exists');
      if (!m.available) throw bad(`"${m.name}" is not available right now`);
      return { menu_item_id: m.id, name: m.name, price: m.price, qty, kitchen: m.kitchen };
    }
    const name = String(it.name || '').trim(), price = Number(it.price);   // custom one-off item
    if (!name || !(price >= 0)) throw bad('Custom item needs a name and a price');
    return { menu_item_id: null, name, price, qty, kitchen: it.kitchen ? 1 : 0 };
  });

  const total = round(lines.reduce((s, l) => s + l.price * l.qty, 0));
  const cashIn = Number(cash_received), online = Number(online_amount);
  if (!(cashIn >= 0) || !(online >= 0)) throw bad('Payment amounts must be numbers');
  if (online > total) throw bad('Online amount is more than the bill');
  if (round(cashIn + online) < total) throw bad(`Payment is short. Bill is ${total}`);

  const cashKept = round(total - online);          // cash that actually stays in the drawer
  const change = round(cashIn - cashKept);
  const type = online === 0 ? 'cash' : cashKept === 0 ? 'online' : 'mixed';

  return db.transaction(() => {
    const now = new Date(), date = localDate(now);
    const token = db.prepare('SELECT COALESCE(MAX(token),0)+1 t FROM sales WHERE sale_date=?').get(date).t;
    const id = db.prepare(`INSERT INTO sales (token, sale_date, customer_name, total, cash_paid, online_paid, change_given, payment_type, created_at)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(token, date, customer, total, cashKept, online, change, type, localDateTime(now)).lastInsertRowid;
    const ins = db.prepare('INSERT INTO sale_items (sale_id, menu_item_id, name, qty, price, kitchen) VALUES (?,?,?,?,?,?)');
    lines.forEach(l => ins.run(id, l.menu_item_id, l.name, l.qty, l.price, l.kitchen));
    return { id, token, total, change, payment_type: type, to_kitchen: lines.some(l => l.kitchen) };
  })();
});

// ---------- Reports (same shapes the report page already uses) ----------
function window_(q) {
  const ok = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '');
  const to = ok(q.to) ? q.to : localDate();
  const d = new Date(to + 'T00:00:00'); d.setDate(d.getDate() - 90);
  return [ok(q.from) ? q.from : localDate(d), to];
}
const ITEMS = db.prepare('SELECT name, qty, price FROM sale_items WHERE sale_id=?');

exports.getSalesBills = h(req => {
  const [from, to] = window_(req.query);
  return db.prepare('SELECT * FROM sales WHERE sale_date BETWEEN ? AND ? ORDER BY id DESC').all(from, to).map(r => ({
    id: r.id, token: r.token, date: r.created_at.replace(' ', 'T'), dateSimple: r.sale_date,
    items: ITEMS.all(r.id), total: r.total, payments: { cash: r.cash_paid, online: r.online_paid }
  }));
});
exports.getSalesRecords = h(req => {
  const [from, to] = window_(req.query);
  return db.prepare(`SELECT s.sale_date AS date, i.name, i.qty, i.price, s.payment_type AS payment
    FROM sale_items i JOIN sales s ON s.id = i.sale_id
    WHERE s.sale_date BETWEEN ? AND ? ORDER BY s.id DESC`).all(from, to);
});

// ---------- Kitchen screen + order lookup ----------
const hm = t => (t ? t.slice(11, 16) : null);
const order = (s, items) => {
  const k = items.filter(i => i.kitchen);
  return {
    id: s.id, token: s.token, name: s.customer_name, time: hm(s.created_at), total: s.total, date: s.sale_date,
    status: k.length ? k[0].status : 'no-kitchen',
    ready_time: k.length ? hm(k[0].ready_at) : null,      // proof trail: when the cook marked it ready
    served_time: k.length ? hm(k[0].served_at) : null,     // ... and when it was handed over
    age_min: Math.max(0, Math.floor((Date.now() - Date.parse(s.created_at.replace(' ', 'T'))) / 60000)),
    items: items.map(i => ({ name: i.name, qty: i.qty, kitchen: !!i.kitchen }))
  };
};
const itemsOf = db.prepare('SELECT name, qty, kitchen, status, ready_at, served_at FROM sale_items WHERE sale_id=?');

// Today's orders that have kitchen items and are not served yet. Only kitchen items are listed.
exports.kitchen = h(() => {
  const rows = db.prepare(`SELECT * FROM sales WHERE sale_date=? AND id IN
    (SELECT sale_id FROM sale_items WHERE kitchen=1 AND status<>'served') ORDER BY id`).all(localDate());
  return rows.map(s => { const o = order(s, itemsOf.all(s.id)); o.items = o.items.filter(i => i.kitchen); return o; });
});
exports.setKitchenStatus = h(req => {
  const st = req.body.status;
  if (!['new', 'ready', 'served'].includes(st)) throw bad('Bad status');
  const now = localDateTime();
  const r = db.prepare(`UPDATE sale_items SET status=?,
      ready_at  = CASE WHEN ? = 'new' THEN NULL ELSE COALESCE(ready_at, ?) END,
      served_at = CASE WHEN ? = 'served' THEN ? ELSE NULL END
    WHERE sale_id=? AND kitchen=1`).run(st, st, now, st, now, req.params.id);
  if (!r.changes) throw bad('No kitchen items on that order');
  return { message: 'Updated' };
});
exports.orders = h(req => {
  const t = parseInt(req.query.token, 10);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || '') ? req.query.date : localDate();   // default: today
  const rows = Number.isInteger(t)
    ? db.prepare('SELECT * FROM sales WHERE sale_date=? AND token=?').all(day, t)
    : db.prepare('SELECT * FROM sales WHERE sale_date=? ORDER BY id DESC LIMIT 100').all(day);
  return rows.map(s => order(s, itemsOf.all(s.id)));
});
