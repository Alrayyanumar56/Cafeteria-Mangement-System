'use strict';
const router = require('express').Router();
const menu = require('../controllers/menuController');
const inv = require('../controllers/inventoryController');
const sales = require('../controllers/salesController');

router.get('/categories', menu.catList);
router.post('/categories', menu.catCreate);
router.put('/categories/:id', menu.catUpdate);
router.delete('/categories/:id', menu.catRemove);

router.get('/menu', menu.getAll);
router.post('/menu', menu.create);
router.put('/menu/:id', menu.update);
router.delete('/menu/:id', menu.remove);

router.get('/inventory', inv.getAll);
router.post('/inventory', inv.create);
router.put('/inventory/:id', inv.update);
router.delete('/inventory/:id', inv.remove);

router.post('/sales', sales.create);
router.get('/salesRecords', sales.getSalesRecords);
router.get('/salesBills', sales.getSalesBills);

router.get('/kitchen', sales.kitchen);
router.put('/kitchen/:id', sales.setKitchenStatus);
router.get('/orders', sales.orders);

router.use((req, res) => res.status(404).json({ error: 'Not found' }));
module.exports = router;
