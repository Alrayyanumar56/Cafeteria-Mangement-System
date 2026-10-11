'use strict';
const os = require('os'), path = require('path'), fs = require('fs');
const test = require('node:test'), assert = require('node:assert/strict');
process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cafepos-')), 'test.db');
process.env.NO_BACKUP = '1';
const app = require('../server');
let base, server;
test.before(async () => { await new Promise(r => { server = app.listen(0, '127.0.0.1', r); }); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());
const api = async (m, u, b) => { const r = await fetch(base + u, { method: m, headers: b ? { 'Content-Type': 'application/json' } : undefined, body: b ? JSON.stringify(b) : undefined }); return { s: r.status, b: await r.json().catch(() => null) }; };
const ids = {};

test('categories seeded, editable, protected delete', async () => {
  const l = await api('GET', '/api/categories'); assert.ok(l.b.length >= 5);
  l.b.forEach(c => ids[c.name] = c.id);
  const c = await api('POST', '/api/categories', { name: 'Halwa Puri', kitchen: true }); assert.equal(c.s, 200);
  assert.equal((await api('POST', '/api/categories', { name: 'Halwa Puri' })).s, 400);
  await api('POST', '/api/menu', { name: 'Halwa Puri', category_id: c.b.id, price: 150 });
  assert.equal((await api('DELETE', '/api/categories/' + c.b.id)).s, 400);
});
test('menu: add item with apostrophe, shawarma goes to kitchen', async () => {
  await api('POST', '/api/menu', { name: "Chef's Biryani", category_id: ids['Meals'], price: 250 });
  await api('POST', '/api/menu', { name: 'Chicken Shawarma', category_id: ids['Shawarma & Rolls'], price: 200, kitchen: true });
  const m = (await api('GET', '/api/menu')).b;
  ids.bir = m.find(x => x.name === "Chef's Biryani").id; ids.sh = m.find(x => x.name === 'Chicken Shawarma').id;
  assert.equal(m.find(x => x.id === ids.sh).kitchen, 1);
});
test('checkout: cash overpay gives change, only kept cash reported; tokens count up', async () => {
  const a = await api('POST', '/api/sales', { items: [{ id: ids.bir, qty: 1 }], cash_received: 500 });
  assert.equal(a.b.token, 1); assert.equal(a.b.change, 250); assert.equal(a.b.to_kitchen, false);
  const b = await api('POST', '/api/sales', { items: [{ id: ids.sh, qty: 2, price: 1 }], cash_received: 400 });
  assert.equal(b.b.token, 2); assert.equal(b.b.total, 400); assert.equal(b.b.to_kitchen, true);   // client price ignored
  const bills = (await api('GET', '/api/salesBills')).b;
  assert.equal(bills[1].payments.cash, 250); assert.equal(bills[1].payments.online, 0);
});
test('checkout: split payment and bad payments', async () => {
  const s = await api('POST', '/api/sales', { items: [{ id: ids.bir, qty: 1 }], cash_received: 100, online_amount: 150 });
  assert.equal(s.b.payment_type, 'mixed'); assert.equal(s.b.change, 0);
  assert.equal((await api('POST', '/api/sales', { items: [{ id: ids.bir, qty: 1 }], cash_received: 100 })).s, 400);
  assert.equal((await api('POST', '/api/sales', { items: [] })).s, 400);
  const bills = (await api('GET', '/api/salesBills')).b;
  assert.deepEqual(bills[0].payments, { cash: 100, online: 150 });
});
test('kitchen: appears, new -> ready -> served; order lookup by token', async () => {
  let k = (await api('GET', '/api/kitchen')).b; assert.equal(k.length, 1); assert.equal(k[0].token, 2);
  await api('PUT', '/api/kitchen/' + k[0].id, { status: 'ready' });
  assert.equal((await api('GET', '/api/kitchen')).b[0].status, 'ready');
  await api('PUT', '/api/kitchen/' + k[0].id, { status: 'served' });
  assert.equal((await api('GET', '/api/kitchen')).b.length, 0);
  assert.equal((await api('GET', '/api/orders?token=2')).b[0].items[0].name, 'Chicken Shawarma');
});
test('deleting a menu item keeps history; unavailable item cannot be sold; reports shape', async () => {
  await api('PUT', '/api/menu/' + ids.bir, { name: "Chef's Biryani", category_id: ids['Meals'], price: 250, available: false });
  assert.equal((await api('POST', '/api/sales', { items: [{ id: ids.bir, qty: 1 }], cash_received: 250 })).s, 400);
  await api('DELETE', '/api/menu/' + ids.bir);
  const r = (await api('GET', '/api/salesRecords')).b;
  assert.ok(r.some(x => x.name === "Chef's Biryani") && 'payment' in r[0] && 'date' in r[0]);
  assert.equal((await api('GET', '/api/nope')).s, 404);
});
