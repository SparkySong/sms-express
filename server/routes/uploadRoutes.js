const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const ossUtil = require('../utils/ossUtil');
const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 图片上传路由
 */

// 上传单张图片
router.post('/image', verifyToken, upload.single('file'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return response.validationError(res, null, '未接收到文件');
    }

    // 获取本地临时文件路径
    const localFilePath = req.file.path;
    const fileName = req.file.filename;
    
    // 上传到阿里云OSS
    const imageUrl = await ossUtil.uploadFile(localFilePath, fileName);
    
    // 删除本地临时文件
    fs.unlink(localFilePath, (err) => {
      if (err) {
        logger.error(`删除临时文件失败: ${err.message}`);
      }
    });

    return response.success(res, { url: imageUrl }, '图片上传成功');
  } catch (error) {
    logger.error(`上传图片失败: ${error.message}`);
    return response.error(res, 500, '上传图片失败');
  }
});

module.exports = router; 