const express = require('express');
const preferenceController = require('../controllers/preferenceController');
const { validateDeviceId } = require('../middleware/authMiddleware');

const router = express.Router();

// 获取用户偏好
router.get('/', validateDeviceId, preferenceController.getPreferences);

// 更新用户偏好
router.patch('/', validateDeviceId, preferenceController.updatePreferences);

module.exports = router;
