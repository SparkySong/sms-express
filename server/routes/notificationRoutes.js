/**
 * 通知相关路由
 */
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

// 所有通知路由都需要身份验证
router.use(verifyToken);

// 获取用户通知列表
router.get('/', notificationController.getUserNotifications);

// 获取未读通知数量
router.get('/unread-count', notificationController.getUnreadCount);

// 标记单个通知为已读
router.put('/:notificationId/read', notificationController.markAsRead);

// 标记所有通知为已读
router.put('/read-all', notificationController.markAllAsRead);

// 清空所有通知
router.delete('/clear-all', notificationController.clearAllNotifications);

module.exports = router; 