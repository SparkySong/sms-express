const commentModel = require('../models/commentModel');
const { successResponse, errorResponse } = require('../utils/responseUtil');
const logger = require('../utils/logger');
const { validateToken } = require('../middleware/authMiddleware');

/**
 * 评论控制器
 */
class CommentController {
  /**
   * 获取文章评论
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async getArticleComments(req, res) {
    try {
      const articleId = parseInt(req.params.articleId);
      
      if (isNaN(articleId)) {
        return errorResponse(res, '无效的文章ID', 400);
      }
      
      // 获取用户ID，未登录用户传递null
      let userId = null;
      try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          const decoded = await validateToken(token);
          if (decoded && decoded.id) {
            userId = decoded.id;
          }
        }
      } catch (error) {
        // Token无效或已过期，继续以游客身份获取评论
        logger.warn(`获取评论时Token验证失败: ${error.message}`);
      }
      
      const comments = await commentModel.getArticleComments(articleId, userId);
      
      return successResponse(res, comments);
    } catch (error) {
      logger.error(`获取文章评论失败: ${error.message}`);
      return errorResponse(res, '获取文章评论失败', 500);
    }
  }

  /**
   * 创建评论
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async createComment(req, res) {
    try {
      const { article_id, content, parent_id } = req.body;
      const userId = req.user.id;
      
      // 验证请求数据
      if (!article_id || !content) {
        return errorResponse(res, '缺少必要参数', 400);
      }
      
      if (typeof content !== 'string' || content.trim().length === 0) {
        return errorResponse(res, '评论内容不能为空', 400);
      }
      
      // 创建评论数据对象
      const commentData = {
        user_id: userId,
        article_id: parseInt(article_id),
        content: content.trim(),
        parent_id: parent_id ? parseInt(parent_id) : null
      };
      
      // 创建评论
      const newComment = await commentModel.createComment(commentData);
      
      return successResponse(res, newComment);
    } catch (error) {
      logger.error(`创建评论失败: ${error.message}`);
      return errorResponse(res, '创建评论失败', 500);
    }
  }

  /**
   * 点赞评论
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async likeComment(req, res) {
    try {
      const commentId = parseInt(req.params.commentId);
      const userId = req.user.id;
      
      if (isNaN(commentId)) {
        return errorResponse(res, '无效的评论ID', 400);
      }
      
      const result = await commentModel.toggleCommentLike(commentId, userId);
      
      return successResponse(res, result);
    } catch (error) {
      logger.error(`评论点赞操作失败: ${error.message}`);
      return errorResponse(res, '评论点赞操作失败', 500);
    }
  }

  /**
   * 删除评论
   * @param {Object} req - 请求对象
   * @param {Object} res - 响应对象
   */
  async deleteComment(req, res) {
    try {
      const commentId = parseInt(req.params.commentId);
      const userId = req.user.id;
      
      if (isNaN(commentId)) {
        return errorResponse(res, '无效的评论ID', 400);
      }
      
      await commentModel.deleteComment(commentId, userId);
      
      return successResponse(res, { message: '评论删除成功' });
    } catch (error) {
      logger.error(`删除评论失败: ${error.message}`);
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = new CommentController(); 