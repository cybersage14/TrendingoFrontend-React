const express = require('express');
const router = express.Router();
const { addNewOrder, orderDevService } = require('../controllers/orderController');

router.post('/add-new-order', addNewOrder);
router.post('/order-dev-service', orderDevService)

module.exports = router;