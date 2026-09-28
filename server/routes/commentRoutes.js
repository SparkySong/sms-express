const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken, optionalAuth } = require('../middleware/auth');

/**
 * @route GET /api/v1/articles/:articleId/comments
 * @desc 获取文章评论列表
 * @access Public
 */
router.get('/:articleId/comments', optionalAuth, commentController.getArticleComments);

/**
 * @route POST /api/v1/comments
 * @desc 创建评论
 * @access Private
 */
router.post('/', verifyToken, commentController.createComment);

/**
 * @route POST /api/v1/comments/:commentId/like
 * @desc 点赞评论
 * @access Private
 */
router.post('/:commentId/like', verifyToken, commentController.likeComment);

/**
 * @route DELETE /api/v1/comments/:commentId
 * @desc 删除评论（作者或管理员，管理员删除时级联子评论）
 * @access Private
 */
router.delete('/:commentId', verifyToken, commentController.deleteComment);

module.exports = router; 