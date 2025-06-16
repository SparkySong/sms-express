const { pool } = require('../config/db');
const config = require('../config/config');

/**
 * 阅读历史模型
 */
class HistoryModel {
  /**
   * 获取用户阅读历史列表
   * @param {number} userId - 用户ID
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} - 阅读历史文章列表和分页信息
   */
  async getUserHistory(userId, page = 1, limit = 20) {
    try {
      // 验证并调整分页参数
      page = Math.max(1, page);
      limit = Math.min(Math.max(1, limit), config.pagination.maxLimit);
      const offset = (page - 1) * limit;
      
      // 查询总数
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM read_history WHERE user_id = ?',
        [userId]
      );
      
      const total = countResult[0].total;
      
      // 查询阅读历史列表，使用query处理LIMIT参数
      const [rows] = await pool.query(
        `SELECT 
          h.id as history_id, h.article_id, h.create_time as read_time,
          a.id, a.title, a.abstract, a.cover_url, a.category_id,
          a.source, a.author, a.publish_time, a.view_count, 
          a.like_count, a.comment_count, c.name as category_name
        FROM read_history h
        JOIN articles a ON h.article_id = a.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE h.user_id = ? AND a.status = 1
        ORDER BY h.create_time DESC
        LIMIT ?, ?`,
        [userId, offset, limit]
      );
      
      // 处理结果，格式化数据
      const items = rows.map(row => ({
        history_id: row.history_id,
        article_id: row.article_id,
        read_time: row.read_time,
        article: {
          id: row.id,
          title: row.title,
          abstract: row.abstract,
          cover_url: row.cover_url,
          source: row.source,
          author: row.author,
          publish_time: row.publish_time,
          view_count: row.view_count,
          like_count: row.like_count,
          comment_count: row.comment_count,
          category: row.category_id ? {
            id: row.category_id,
            name: row.category_name
          } : null
        }
      }));
      
      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        items
      };
    } catch (error) {
      throw new Error(`获取阅读历史失败: ${error.message}`);
    }
  }

  /**
   * 添加阅读历史
   * @param {number} userId - 用户ID
   * @param {number} articleId - 文章ID
   * @returns {Promise<Object>} - 新增的历史记录信息
   */
  async addHistory(userId, articleId) {
    try {
      // 检查文章是否存在
      const [articleCheck] = await pool.execute(
        'SELECT id FROM articles WHERE id = ? AND status = 1',
        [articleId]
      );
      
      if (articleCheck.length === 0) {
        throw new Error('文章不存在或已被删除');
      }
      
      // 先删除已有的相同文章记录（保证最新的在最前面）
      await pool.execute(
        'DELETE FROM read_history WHERE user_id = ? AND article_id = ?',
        [userId, articleId]
      );
      
      // 添加新的阅读记录
      const [result] = await pool.execute(
        'INSERT INTO read_history (user_id, article_id) VALUES (?, ?)',
        [userId, articleId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('添加阅读历史失败');
      }
      
      return {
        id: result.insertId,
        user_id: userId,
        article_id: articleId,
        create_time: new Date()
      };
    } catch (error) {
      throw new Error(`添加阅读历史失败: ${error.message}`);
    }
  }

  /**
   * 删除阅读历史
   * @param {number} userId - 用户ID
   * @param {number} historyId - 历史记录ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async removeHistory(userId, historyId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM read_history WHERE id = ? AND user_id = ?',
        [historyId, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`删除阅读历史失败: ${error.message}`);
    }
  }

  /**
   * 删除多条阅读历史
   * @param {number} userId - 用户ID
   * @param {Array<number>} historyIds - 历史记录ID数组
   * @returns {Promise<number>} - 删除的记录数
   */
  async removeMultiHistory(userId, historyIds) {
    try {
      // 验证参数
      if (!Array.isArray(historyIds) || historyIds.length === 0) {
        return 0;
      }

      // 构建SQL的IN子句参数
      const placeholders = historyIds.map(() => '?').join(',');
      
      // 执行删除操作
      const [result] = await pool.execute(
        `DELETE FROM read_history WHERE id IN (${placeholders}) AND user_id = ?`,
        [...historyIds, userId]
      );
      
      return result.affectedRows;
    } catch (error) {
      throw new Error(`批量删除阅读历史失败: ${error.message}`);
    }
  }

  /**
   * 清空用户所有阅读历史
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async clearUserHistory(userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM read_history WHERE user_id = ?',
        [userId]
      );
      
      return true;
    } catch (error) {
      throw new Error(`清空阅读历史失败: ${error.message}`);
    }
  }
}

module.exports = new HistoryModel(); 