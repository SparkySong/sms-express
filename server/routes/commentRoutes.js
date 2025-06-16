const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { requireAuth } = require('../middleware/authMiddleware');

/**
 * @route GET /api/v1/articles/:articleId/comments
 * @desc 获取文章评论列表
 * @access Public
 */
router.get('/:articleId/comments', commentController.getArticleComments);

/**
 * @route POST /api/v1/comments
 * @desc 创建评论
 * @access Private
 */
router.post('/', requireAuth, commentController.createComment);

/**
 * @route POST /api/v1/comments/:commentId/like
 * @desc 点赞评论
 * @access Private
 */
router.post('/:commentId/like', requireAuth, commentController.likeComment);

/**
 * @route DELETE /api/v1/comments/:commentId
 * @desc 删除评论
 * @access Private
 */
router.delete('/:commentId', requireAuth, commentController.deleteComment);

module.exports = router; 