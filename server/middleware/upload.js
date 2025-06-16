const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名，避免冲突
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// 文件过滤器，检查文件类型
const fileFilter = (req, file, cb) => {
  // 接受的图片类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型。仅支持: ' + allowedTypes.join(', ')), false);
  }
};

// 配置上传实例
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 限制文件大小为5MB
  }
});

/**
 * 错误处理中间件，用于处理multer上传错误
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // multer 错误
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        code: 400,
        message: '文件大小超过限制 (最大5MB)'
      });
    }
    logger.error(`Multer上传错误: ${err.message}`);
    return res.status(400).json({
      success: false,
      code: 400,
      message: `上传失败: ${err.message}`
    });
  }
  
  if (err) {
    // 其他错误
    logger.error(`文件上传错误: ${err.message}`);
    return res.status(400).json({
      success: false,
      code: 400,
      message: err.message
    });
  }
  
  next();
};

// 清理临时文件
const cleanupUploadedFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    logger.error(`清理临时文件失败: ${error.message}`);
  }
};

module.exports = {
  upload,
  handleUploadError,
  cleanupUploadedFile,
  uploadDir
}; 