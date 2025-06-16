const express = require('express');
const router = express.Router();

// 导入子路由
const userRoutes = require('./userRoutes');
const articleRoutes = require('./articleRoutes');
const categoryRoutes = require('./categoryRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const historyRoutes = require('./historyRoutes');
const notificationRoutes = require('./notificationRoutes');
const commentRoutes = require('./commentRoutes');

// 导入上传路由
const uploadRoutes = require('./uploadRoutes');

// API版本前缀
const API_PREFIX = '/api/v1';

// 注册路由
router.use(`${API_PREFIX}/users`, userRoutes);
router.use(`${API_PREFIX}/articles`, articleRoutes);
router.use(`${API_PREFIX}/categories`, categoryRoutes);
router.use(`${API_PREFIX}/favorites`, favoriteRoutes);
router.use(`${API_PREFIX}/history`, historyRoutes);
router.use(`${API_PREFIX}/notifications`, notificationRoutes);
router.use(`${API_PREFIX}/comments`, commentRoutes);
router.use(`${API_PREFIX}/upload`, uploadRoutes);

// API状态检查路由
router.get(`${API_PREFIX}/status`, (req, res) => {
  res.json({
    status: 'ok',
    message: '简讯速递API服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

module.exports = router;