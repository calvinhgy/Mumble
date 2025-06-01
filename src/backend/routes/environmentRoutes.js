const express = require('express');
const environmentController = require('../controllers/environmentController');
const { validateDeviceId } = require('../middleware/authMiddleware');

const router = express.Router();

// 提交环境数据
router.post('/', validateDeviceId, environmentController.submitEnvironmentData);

// 获取环境数据
router.get('/:environmentId', environmentController.getEnvironmentData);

module.exports = router;
