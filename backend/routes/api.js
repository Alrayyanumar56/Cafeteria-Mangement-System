// backend/routes/api.js
const express = require('express');
const router = express.Router();

const menuController = require('../controllers/menuController');
const inventoryController = require('../controllers/inventoryController');
const salesController = require('../controllers/salesController');

// ---------------------
// MENU ROUTES (FIXED)
// ---------------------
router.get('/menu', menuController.getAll);
router.post('/menu', menuController.create);
router.put('/menu/:id', menuController.update);
router.delete('/menu/:id', menuController.remove);

// ---------------------
// INVENTORY ROUTES
// ---------------------
router.get('/inventory', inventoryController.getAll);
router.post('/inventory', inventoryController.create);
router.put('/inventory/:id', inventoryController.update);
router.delete('/inventory/:id', inventoryController.remove);

// ---------------------
// SALES ROUTES
// ---------------------
router.get('/sales', salesController.getAll);
router.post('/sales', salesController.create);

// Reports
router.get('/salesRecords', salesController.getSalesRecords);
router.get('/salesBills', salesController.getSalesBills);

module.exports = router;
