// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Use unified routes
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});
