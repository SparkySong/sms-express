const FavoriteModel = require('../models/favoriteModel');
const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 收藏控制器
 */
class FavoriteController {
  /**
   * 获取用户收藏列表
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getUserFavorites(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      const result = await FavoriteModel.getUserFavorites(
        userId,
        parseInt(page),
        parseInt(limit)
      );
      
      return response.success(res, result);
    } catch (error) {
      logger.error(`获取收藏列表失败: ${error.message}`);
      return response.error(res, 500, '获取收藏列表失败');
    }
  }

  /**
   * 添加收藏
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async addFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { article_id } = req.body;
      
      if (!article_id || isNaN(parseInt(article_id))) {
        return response.validationError(res, null, '无效的文章ID');
      }
      
      const result = await FavoriteModel.addFavorite(userId, parseInt(article_id));
      
      return response.success(res, result, result.message || '收藏成功');
    } catch (error) {
      logger.error(`添加收藏失败: ${error.message}`);
      return response.error(res, 500, `添加收藏失败: ${error.message}`);
    }
  }

  /**
   * 取消收藏
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async removeFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { article_id } = req.params;
      
      if (!article_id || isNaN(parseInt(article_id))) {
        return response.validationError(res, null, '无效的文章ID');
      }
      
      const result = await FavoriteModel.removeFavorite(userId, parseInt(article_id));
      
      if (!result) {
        return response.notFound(res, '收藏记录不存在或已被删除');
      }
      
      return response.success(res, null, '取消收藏成功');
    } catch (error) {
      logger.error(`取消收藏失败: ${error.message}`);
      return response.error(res, 500, '取消收藏失败');
    }
  }

  /**
   * 清空用户所有收藏
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async clearAllFavorites(req, res) {
    try {
      const userId = req.user.id;
      
      await FavoriteModel.clearUserFavorites(userId);
      
      return response.success(res, null, '清空收藏成功');
    } catch (error) {
      logger.error(`清空收藏失败: ${error.message}`);
      return response.error(res, 500, '清空收藏失败');
    }
  }

  /**
   * 检查文章是否已收藏
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async checkFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { article_id } = req.params;
      
      if (!article_id || isNaN(parseInt(article_id))) {
        return response.validationError(res, null, '无效的文章ID');
      }
      
      const isFavorite = await FavoriteModel.checkFavorite(userId, parseInt(article_id));
      
      return response.success(res, { is_favorite: isFavorite });
    } catch (error) {
      logger.error(`检查收藏状态失败: ${error.message}`);
      return response.error(res, 500, '检查收藏状态失败');
    }
  }
}

module.exports = new FavoriteController();