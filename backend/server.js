// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const menuRoutes = require('./routes/menu');
const invRoutes = require('./routes/inventory');
const salesRoutes = require('./routes/sales');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/menu', menuRoutes);
app.use('/api/inventory', invRoutes);
app.use('/api/sales', salesRoutes);

app.get('/', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});
