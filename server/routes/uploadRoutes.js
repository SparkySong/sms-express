const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 图片上传路由 - 本地存储模式
 */

// 上传单张图片
router.post('/image', verifyToken, upload.single('file'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return response.validationError(res, null, '未接收到文件');
    }

    // 本地文件路径和文件名
    const fileName = req.file.filename;
    
    // 返回可访问的URL（通过静态文件服务访问）
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;

    logger.info(`图片上传成功: ${imageUrl}`);

    return response.success(res, { url: imageUrl }, '图片上传成功');
  } catch (error) {
    logger.error(`上传图片失败: ${error.message}`);
    return response.error(res, 500, '上传图片失败');
  }
});

module.exports = router; 