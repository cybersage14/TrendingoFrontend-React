const express = require('express');
const router = express.Router();
const { getAllServiceTypes } = require('../controllers/serviceController');

router.get('/get-all-service-types', getAllServiceTypes);

module.exports = router;