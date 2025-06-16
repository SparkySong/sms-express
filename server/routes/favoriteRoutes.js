const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { verifyToken } = require('../middleware/auth');

/**
 * 收藏路由
 */

// 所有收藏路由都需要认证
router.use(verifyToken);

// 获取用户收藏列表
router.get('/', favoriteController.getUserFavorites);

// 添加收藏
router.post('/', favoriteController.addFavorite);

// 取消收藏
router.delete('/:article_id', favoriteController.removeFavorite);

// 清空所有收藏
router.delete('/all', favoriteController.clearAllFavorites);

// 检查文章是否已收藏
router.get('/check/:article_id', favoriteController.checkFavorite);

module.exports = router;