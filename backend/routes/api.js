// backend/routes/api.js
const express = require('express');
const router = express.Router();

const menuController = require('../controllers/menuController');
const inventoryController = require('../controllers/inventoryController');
const salesController = require('../controllers/salesController');

// Menu routes
router.get('/menu', menuController.getAll);

// Inventory routes
router.get('/inventory', inventoryController.getAll);
router.post('/inventory', inventoryController.create);
router.put('/inventory/:id', inventoryController.update);
router.delete('/inventory/:id', inventoryController.remove);

// Sales routes
router.get('/sales', salesController.getAll);
router.post('/sales', salesController.create);

// Report endpoints
router.get('/salesRecords', salesController.getSalesRecords);
router.get('/salesBills', salesController.getSalesBills);

module.exports = router;
