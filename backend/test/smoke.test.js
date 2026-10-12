'use strict';
const os = require('os'), path = require('path'), fs = require('fs');
const test = require('node:test'), assert = require('node:assert/strict');
process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cafepos-')), 'test.db');
process.env.NO_BACKUP = '1';
const app = require('../server');
let base, server;
let cookie = '';   // current session; starts as the manager created in setup
const api = async (m, u, b, ck = cookie) => {
  const headers = { ...(b ? { 'Content-Type': 'application/json' } : {}), ...(ck ? { Cookie: ck } : {}) };
  const r = await fetch(base + u, { method: m, headers, body: b ? JSON.stringify(b) : undefined });
  const sc = r.headers.get('set-cookie');
  return { s: r.status, b: await r.json().catch(() => null), cookie: sc ? sc.split(';')[0] : null };
};
test.before(async () => { await new Promise(r => { server = app.listen(0, '127.0.0.1', r); }); base = `http://127.0.0.1:${server.address().port}`;  cookie = (await api('POST', '/api/auth/setup', { name: 'Boss', pin: '123456' }, '')).cookie; });
test.after(() => server.close());
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

test('custom item to kitchen; proof trail times; wait time; lookup by day', async () => {
  const r = await api('POST', '/api/sales', { items: [{ name: 'Special Roll', price: 180, qty: 2, kitchen: 1 }], cash_received: 400 });
  assert.equal(r.s, 200); assert.equal(r.b.to_kitchen, true); assert.equal(r.b.change, 40);
  const id = r.b.id;
  let k = (await api('GET', '/api/kitchen')).b.find(o => o.id === id);
  assert.equal(k.status, 'new'); assert.equal(typeof k.age_min, 'number'); assert.equal(k.ready_time, null);
  await api('PUT', '/api/kitchen/' + id, { status: 'ready' });
  await api('PUT', '/api/kitchen/' + id, { status: 'served' });
  const o = (await api('GET', '/api/orders?token=' + r.b.token)).b[0];
  assert.equal(o.status, 'served');
  assert.match(o.ready_time, /^\d\d:\d\d$/); assert.match(o.served_time, /^\d\d:\d\d$/);
  await api('PUT', '/api/kitchen/' + id, { status: 'new' });                       // undo clears the times
  const u = (await api('GET', '/api/orders?token=' + r.b.token)).b[0];
  assert.equal(u.ready_time, null); assert.equal(u.served_time, null);
  assert.equal((await api('GET', '/api/orders?date=2001-01-01')).b.length, 0);
  assert.equal((await api('POST', '/api/sales', { items: [{ name: '', price: 5, qty: 1 }], cash_received: 5 })).s, 400);
});

test('an older database file is upgraded in place', async () => {
  const { DatabaseSync } = require('node:sqlite');
  const old = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'cafepos-old-')), 'old.db');
  const d = new DatabaseSync(old);
  d.exec(`CREATE TABLE sale_items (id INTEGER PRIMARY KEY, sale_id INTEGER, menu_item_id INTEGER, name TEXT, qty INTEGER, price REAL, kitchen INTEGER, status TEXT DEFAULT 'new');`);
  d.close();
  const { spawnSync } = require('node:child_process');
  const out = spawnSync(process.execPath, ['-e', `process.env.NO_BACKUP='1';process.env.DB_PATH=${JSON.stringify(old)};const db=require(${JSON.stringify(path.join(__dirname, '..', 'db.js'))});console.log(db.prepare('PRAGMA table_info(sale_items)').all().map(c=>c.name).join())`], { encoding: 'utf8' });
  assert.match(out.stdout, /ready_at,served_at/, out.stderr);
});

test('login: closed without it; setup only once; counter is limited', async () => {
  assert.equal((await api('GET', '/api/menu', null, '')).s, 401);
  assert.equal((await api('POST', '/api/sales', { items: [] }, '')).s, 401);
  assert.equal((await api('GET', '/api/menu', null, 'cafepos_session=fake')).s, 401);
  assert.equal((await api('POST', '/api/auth/setup', { name: 'Evil', pin: '999999' }, '')).s, 403);
  const st = (await api('GET', '/api/auth/status', null, '')).b;
  assert.equal(st.needs_setup, false); assert.deepEqual(st.users.map(u => u.name), ['Boss']);

  assert.equal((await api('POST', '/api/users', { name: 'Ali', pin: '12', role: 'counter' })).s, 400);
  assert.equal((await api('POST', '/api/users', { name: 'Eve', pin: '12345', role: 'manager' })).s, 400);
  const ali = (await api('POST', '/api/users', { name: 'Ali', pin: '4321', role: 'counter' })).b.id;
  assert.equal((await api('POST', '/api/users', { name: 'ali', pin: '4321' })).s, 400, 'duplicate name');

  const c = (await api('POST', '/api/auth/login', { user_id: ali, pin: '4321' }, '')).cookie;
  assert.ok(c);
  for (const [m, u] of [['GET', '/api/users'], ['GET', '/api/inventory'], ['GET', '/api/salesBills'], ['GET', '/api/salesRecords'],
                        ['POST', '/api/menu'], ['DELETE', '/api/menu/1'], ['POST', '/api/categories'], ['DELETE', '/api/categories/1']])
    assert.equal((await api(m, u, m === 'GET' ? null : {}, c)).s, 403, m + ' ' + u);
  assert.equal((await api('GET', '/api/menu', null, c)).s, 200);
  assert.equal((await api('GET', '/api/categories', null, c)).s, 200);
  assert.equal((await api('GET', '/api/kitchen', null, c)).s, 200);
  assert.equal((await api('GET', '/api/orders', null, c)).s, 200);
  const m = (await api('GET', '/api/menu')).b.find(x => x.available);
  const sale = await api('POST', '/api/sales', { items: [{ id: m.id, qty: 1 }], cash_received: 100000 }, c);
  assert.equal(sale.s, 200);
  assert.equal((await api('GET', '/api/orders?token=' + sale.b.token)).b[0].cashier, 'Ali', 'sale remembers the cashier');
});

test('login: wrong PIN, lockout, deactivate kicks out, last manager protected, logout', async () => {
  const users = (await api('GET', '/api/users')).b, boss = users.find(u => u.name === 'Boss').id;
  const bob = (await api('POST', '/api/users', { name: 'Bob', pin: '1111', role: 'counter' })).b.id;
  const bc = (await api('POST', '/api/auth/login', { user_id: bob, pin: '1111' }, '')).cookie;
  assert.equal((await api('GET', '/api/menu', null, bc)).s, 200);
  await api('PUT', '/api/users/' + bob, { active: false });
  assert.equal((await api('GET', '/api/menu', null, bc)).s, 401, 'deactivated user is kicked out');
  assert.equal((await api('POST', '/api/auth/login', { user_id: bob, pin: '1111' }, '')).s, 401);
  await api('PUT', '/api/users/' + bob, { active: true, pin: '2222' });
  for (let i = 0; i < 5; i++) assert.equal((await api('POST', '/api/auth/login', { user_id: bob, pin: '0000' }, '')).s, 401);
  assert.equal((await api('POST', '/api/auth/login', { user_id: bob, pin: '2222' }, '')).s, 429, 'locked even with the right PIN');
  assert.equal((await api('PUT', '/api/users/' + boss, { active: false })).s, 400, 'last manager protected');
  assert.equal((await api('PUT', '/api/users/' + boss, { role: 'counter' })).s, 400);
  const out = (await api('POST', '/api/auth/login', { user_id: boss, pin: '123456' }, '')).cookie;
  await api('POST', '/api/auth/logout', {}, out);
  assert.equal((await api('GET', '/api/auth/me', null, out)).s, 401, 'logout ends the session');
});
