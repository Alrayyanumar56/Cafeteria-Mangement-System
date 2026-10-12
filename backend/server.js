'use strict';
const express = require('express');
const path = require('path');
const app = express();
app.use(express.json({ limit: '2mb' }));          // item photos are sent as small base64 strings
app.use('/api', require('./routes/api'));
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/', (req, res) => res.redirect('/pages/index.html'));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  // Default: only this PC can open the app. CAFEPOS_LAN=1 (start-lan.bat) also lets another device on the same network open it (login is still required).
  const lan = process.env.CAFEPOS_LAN === '1';
  app.listen(PORT, lan ? '0.0.0.0' : '127.0.0.1', () => {
    console.log(`CafePOS running: http://localhost:${PORT}`);
    if (lan) for (const list of Object.values(require('os').networkInterfaces()))
      for (const n of list) if (n.family === 'IPv4' && !n.internal)
        console.log(`Kitchen screen on another device: http://${n.address}:${PORT}/pages/kitchen.html`);
  });
}
module.exports = app;
