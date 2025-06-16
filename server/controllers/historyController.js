const HistoryModel = require('../models/historyModel');
const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 阅读历史控制器
 */
class HistoryController {
  /**
   * 获取用户阅读历史列表
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getUserHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20 } = req.query;
      
      const result = await HistoryModel.getUserHistory(
        userId,
        parseInt(page),
        parseInt(limit)
      );
      
      return response.success(res, result);
    } catch (error) {
      logger.error(`获取阅读历史失败: ${error.message}`);
      return response.error(res, 500, '获取阅读历史失败');
    }
  }

  /**
   * 添加阅读历史
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async addHistory(req, res) {
    try {
      const userId = req.user.id;
      const { article_id } = req.body;
      
      if (!article_id || isNaN(parseInt(article_id))) {
        return response.validationError(res, null, '无效的文章ID');
      }
      
      const result = await HistoryModel.addHistory(userId, parseInt(article_id));
      
      return response.success(res, result, '添加阅读历史成功');
    } catch (error) {
      logger.error(`添加阅读历史失败: ${error.message}`);
      return response.error(res, 500, `添加阅读历史失败: ${error.message}`);
    }
  }

  /**
   * 删除阅读历史
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async removeHistory(req, res) {
    try {
      const userId = req.user.id;
      const { history_id } = req.params;
      
      if (!history_id || isNaN(parseInt(history_id))) {
        return response.validationError(res, null, '无效的历史记录ID');
      }
      
      const result = await HistoryModel.removeHistory(userId, parseInt(history_id));
      
      if (!result) {
        return response.notFound(res, '历史记录不存在或已被删除');
      }
      
      return response.success(res, null, '删除历史记录成功');
    } catch (error) {
      logger.error(`删除历史记录失败: ${error.message}`);
      return response.error(res, 500, '删除历史记录失败');
    }
  }

  /**
   * 批量删除阅读历史
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async removeMultiHistory(req, res) {
    try {
      const userId = req.user.id;
      const { history_ids } = req.body;
      
      if (!Array.isArray(history_ids) || history_ids.length === 0) {
        return response.validationError(res, null, '无效的历史记录ID列表');
      }
      
      // 确保所有ID都是数字
      const parsedIds = history_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
      
      if (parsedIds.length === 0) {
        return response.validationError(res, null, '无效的历史记录ID列表');
      }
      
      const deletedCount = await HistoryModel.removeMultiHistory(userId, parsedIds);
      
      return response.success(res, { deleted_count: deletedCount }, '批量删除历史记录成功');
    } catch (error) {
      logger.error(`批量删除历史记录失败: ${error.message}`);
      return response.error(res, 500, '批量删除历史记录失败');
    }
  }

  /**
   * 清空用户所有阅读历史
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async clearUserHistory(req, res) {
    try {
      const userId = req.user.id;
      
      await HistoryModel.clearUserHistory(userId);
      
      return response.success(res, null, '清空阅读历史成功');
    } catch (error) {
      logger.error(`清空阅读历史失败: ${error.message}`);
      return response.error(res, 500, '清空阅读历史失败');
    }
  }
}

module.exports = new HistoryController(); 