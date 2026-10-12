'use strict';
// Login, sessions and staff accounts. PINs are never stored, only a salted scrypt hash.
const crypto = require('crypto');
const db = require('../db');
const { h, bad, fail } = require('../utils');

const COOKIE = 'cafepos_session', SESSION_MS = 12 * 3600 * 1000;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');

function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pin, salt, 32).toString('hex');
}
function checkPin(pin, stored) {
  const [salt, hash] = stored.split(':');
  const a = Buffer.from(hash, 'hex'), b = crypto.scryptSync(pin, salt, 32);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function validPin(pin, role) {
  pin = String(pin || '');
  if (!/^\d+$/.test(pin)) throw bad('PIN must be digits only');
  if (role === 'manager' && (pin.length < 6 || pin.length > 10)) throw bad('Manager PIN must be 6 to 10 digits');
  if (role !== 'manager' && (pin.length < 4 || pin.length > 6)) throw bad('PIN must be 4 to 6 digits');
  return pin;
}
const cookieToken = req => {
  const c = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='));
  return c ? c.slice(COOKIE.length + 1) : '';
};

// A random token goes to the browser; only its hash is stored, so a stolen database file cannot be used to log in.
function startSession(res, userId) {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?,?,?)').run(sha(token), userId, Date.now() + SESSION_MS);
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}`);
}

// ---------- Middleware ----------
exports.requireLogin = (req, res, next) => {
  const tok = cookieToken(req);
  const row = tok && db.prepare(`SELECT u.id, u.name, u.role, s.expires_at FROM sessions s
    JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND u.active = 1`).get(sha(tok));
  if (!row || row.expires_at < Date.now()) return res.status(401).json({ error: 'Please log in' });
  req.user = { id: row.id, name: row.name, role: row.role };
  next();
};
exports.requireManager = (req, res, next) =>
  req.user.role === 'manager' ? next() : res.status(403).json({ error: 'Only the manager can do this' });

// ---------- Public auth routes ----------
exports.status = h(() => ({
  needs_setup: db.prepare('SELECT COUNT(*) n FROM users').get().n === 0,
  users: db.prepare('SELECT id, name, role FROM users WHERE active=1 ORDER BY role DESC, name').all()   // names shown as buttons on the login screen
}));

exports.setup = h((req, res) => {          // very first run only: creates the manager
  if (db.prepare('SELECT COUNT(*) n FROM users').get().n > 0) throw fail(403, 'Setup is already done');
  const name = String(req.body.name || '').trim().slice(0, 30);
  if (!name) throw bad('Enter a name');
  const id = db.prepare("INSERT INTO users (name, role, pin_hash) VALUES (?, 'manager', ?)").run(name, hashPin(validPin(req.body.pin, 'manager'))).lastInsertRowid;
  startSession(res, id);
  return { id, name, role: 'manager' };
});

const fails = new Map();                   // userId -> { n, until }: 5 wrong PINs = locked for 2 minutes
exports.login = h((req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id=? AND active=1').get(req.body.user_id);
  if (!u) throw fail(401, 'Wrong PIN');
  const f = fails.get(u.id) || { n: 0, until: 0 };
  if (f.until > Date.now()) throw fail(429, `Too many wrong PINs. Wait ${Math.ceil((f.until - Date.now()) / 1000)} seconds`);
  if (!checkPin(String(req.body.pin || ''), u.pin_hash)) {
    f.n++; if (f.n >= 5) { f.n = 0; f.until = Date.now() + 120000; }
    fails.set(u.id, f);
    throw fail(401, 'Wrong PIN');
  }
  fails.delete(u.id);
  startSession(res, u.id);
  return { id: u.id, name: u.name, role: u.role };
});

exports.logout = h((req, res) => {
  const t = cookieToken(req);
  if (t) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(t));
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
  return { message: 'Logged out' };
});
exports.me = h(req => req.user);

// ---------- Staff accounts (manager only) ----------
exports.list = h(() => db.prepare('SELECT id, name, role, active FROM users ORDER BY active DESC, role DESC, name').all());

exports.create = h(req => {
  const name = String(req.body.name || '').trim().slice(0, 30), role = req.body.role === 'manager' ? 'manager' : 'counter';
  if (!name) throw bad('Enter a name');
  try {
    return { id: db.prepare('INSERT INTO users (name, role, pin_hash) VALUES (?,?,?)').run(name, role, hashPin(validPin(req.body.pin, role))).lastInsertRowid };
  } catch (e) { if (/UNIQUE/.test(e.message)) throw bad('That name is already used'); throw e; }
});

exports.update = h(req => {
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!u) throw bad('No such user');
  const b = req.body;
  const name = b.name !== undefined ? String(b.name).trim().slice(0, 30) : u.name;
  const role = b.role ? (b.role === 'manager' ? 'manager' : 'counter') : u.role;
  const active = b.active === undefined ? u.active : (b.active ? 1 : 0);
  if (!name) throw bad('Enter a name');
  if (u.role === 'manager' && u.active && (role !== 'manager' || !active) &&
      db.prepare("SELECT COUNT(*) n FROM users WHERE role='manager' AND active=1 AND id<>?").get(u.id).n === 0)
    throw bad('There must always be at least one active manager');
  let pinHash = u.pin_hash;
  if (b.pin) pinHash = hashPin(validPin(b.pin, role));
  else if (role === 'manager' && u.role !== 'manager') throw bad('Set a new 6+ digit PIN when making someone a manager');
  try { db.prepare('UPDATE users SET name=?, role=?, active=?, pin_hash=? WHERE id=?').run(name, role, active, pinHash, u.id); }
  catch (e) { if (/UNIQUE/.test(e.message)) throw bad('That name is already used'); throw e; }
  if (b.pin || !active || role !== u.role) db.prepare('DELETE FROM sessions WHERE user_id=?').run(u.id);   // kick them out
  return { message: 'Updated' };
});
