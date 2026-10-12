'use strict';
const pad = n => String(n).padStart(2, '0');
exports.localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
exports.localDateTime = (d = new Date()) => `${exports.localDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
exports.round = n => Math.round(n * 100) / 100;
exports.fail = (status, msg) => Object.assign(new Error(msg), { status });
exports.bad = msg => Object.assign(new Error(msg), { status: 400 });
// Wrap a handler so thrown errors become JSON responses.
exports.h = fn => (req, res) => {
  try { res.json(fn(req, res)); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
};
