const express = require('express');
const router = express.Router();
const { addNewOrder } = require('../controllers/orderController');

router.post('/add-new-order', addNewOrder);

module.exports = router;