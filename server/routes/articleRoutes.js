const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const commentController = require('../controllers/commentController');
const { verifyToken, optionalAuth } = require('../middleware/auth');

/**
 * 文章路由
 */

// 公开路由
router.get('/', articleController.getArticles);
router.get('/headlines', articleController.getHeadlines);
router.get('/hot', articleController.getHotArticles);
router.get('/random', articleController.getRandomArticles);
router.get('/categories/count', articleController.getCategoriesCount);
router.get('/:id', optionalAuth, articleController.getArticleDetail);
router.get('/:articleId/comments', commentController.getArticleComments);

// 需要认证的路由
router.post('/:id/like', verifyToken, articleController.likeArticle);
router.get('/:id/like/check', verifyToken, articleController.checkLikeStatus);

// 需要认证的路由（普通用户可创建，作者和管理员可编辑/删除）
router.post('/', verifyToken, articleController.createArticle);
router.put('/:id', verifyToken, articleController.updateArticle);
router.delete('/:id', verifyToken, articleController.deleteArticle);

module.exports = router;