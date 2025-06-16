const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { verifyToken } = require('../middleware/auth');

/**
 * 阅读历史路由
 */

// 所有阅读历史路由都需要认证
router.use(verifyToken);

// 获取用户阅读历史列表
router.get('/', historyController.getUserHistory);

// 添加阅读历史
router.post('/', historyController.addHistory);

// 删除单条阅读历史
router.delete('/:history_id', historyController.removeHistory);

// 批量删除阅读历史
router.post('/batch-delete', historyController.removeMultiHistory);

// 清空所有阅读历史
router.delete('/all', historyController.clearUserHistory);

module.exports = router; 