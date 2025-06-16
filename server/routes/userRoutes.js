const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

/**
 * 用户路由
 */

// 公开路由
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/wechat/login', userController.wechatLogin);

// 需要认证的路由
router.get('/profile', verifyToken, userController.getCurrentUser);
router.put('/profile', verifyToken, userController.updateUserInfo);
router.put('/change-password', verifyToken, userController.changePassword);
router.get('/stats', verifyToken, userController.getUserStats);

// 文件上传路由
router.post(
  '/avatar/upload',
  verifyToken,
  upload.single('avatar'),
  handleUploadError,
  userController.uploadAvatar
);

module.exports = router;