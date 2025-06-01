const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

// API状态检查
router.get('/', healthController.checkHealth);

module.exports = router;
