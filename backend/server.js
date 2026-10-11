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
  app.listen(PORT, '127.0.0.1', () => console.log(`CafePOS running: http://localhost:${PORT}`));
}
module.exports = app;
