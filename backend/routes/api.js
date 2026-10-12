'use strict';
const router = require('express').Router();
const menu = require('../controllers/menuController');
const inv = require('../controllers/inventoryController');
const sales = require('../controllers/salesController');
const auth = require('../controllers/authController');
const { requireLogin, requireManager: mgr } = auth;

// ---- Public: login screen needs these ----
router.get('/auth/status', auth.status);
router.post('/auth/setup', auth.setup);
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);

// ---- Everything below needs a logged-in user ----
router.use(requireLogin);
router.get('/auth/me', auth.me);

// ---- Manager only ----
router.get('/users', mgr, auth.list);
router.post('/users', mgr, auth.create);
router.put('/users/:id', mgr, auth.update);

router.get('/categories', menu.catList);
router.post('/categories', mgr, menu.catCreate);
router.put('/categories/:id', mgr, menu.catUpdate);
router.delete('/categories/:id', mgr, menu.catRemove);

router.get('/menu', menu.getAll);
router.post('/menu', mgr, menu.create);
router.put('/menu/:id', mgr, menu.update);
router.delete('/menu/:id', mgr, menu.remove);

router.get('/inventory', mgr, inv.getAll);
router.post('/inventory', mgr, inv.create);
router.put('/inventory/:id', mgr, inv.update);
router.delete('/inventory/:id', mgr, inv.remove);

router.post('/sales', sales.create);
router.get('/salesRecords', mgr, sales.getSalesRecords);
router.get('/salesBills', mgr, sales.getSalesBills);

router.get('/kitchen', sales.kitchen);
router.put('/kitchen/:id', sales.setKitchenStatus);
router.get('/orders', sales.orders);

router.use((req, res) => res.status(404).json({ error: 'Not found' }));
module.exports = router;
