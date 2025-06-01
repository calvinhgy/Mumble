const express = require('express');
const imageController = require('../controllers/imageController');
const { validateDeviceId } = require('../middleware/authMiddleware');

const router = express.Router();

// 请求生成图像
router.post('/generate', validateDeviceId, imageController.generateImage);

// 获取图像生成状态
router.get('/status/:requestId', imageController.getImageStatus);

// 获取图库
router.get('/', validateDeviceId, imageController.getGallery);

// 获取图像详情
router.get('/:imageId', imageController.getImageDetails);

// 导出图像
router.get('/:imageId/export', imageController.exportImage);

// 删除图像
router.delete('/:imageId', validateDeviceId, imageController.deleteImage);

module.exports = router;
