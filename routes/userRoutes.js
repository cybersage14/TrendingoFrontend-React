const express = require('express');
const router = express.Router();
const { addUser, influence, checkWhetherInfluencer } = require('../controllers/userController');

router.post('/add-user', addUser);
router.post('/influence', influence);
router.get('/check-whether-influencer/:userId', checkWhetherInfluencer)

module.exports = router;