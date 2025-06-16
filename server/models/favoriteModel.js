const { pool } = require('../config/db');
const config = require('../config/config');

/**
 * 收藏模型
 */
class FavoriteModel {
  /**
   * 获取用户收藏列表
   * @param {number} userId - 用户ID
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   * @returns {Promise<Object>} - 收藏文章列表和分页信息
   */
  async getUserFavorites(userId, page = 1, limit = 10) {
    try {
      // 验证并调整分页参数
      page = Math.max(1, page);
      limit = Math.min(Math.max(1, limit), config.pagination.maxLimit);
      const offset = (page - 1) * limit;
      
      // 查询总数
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) as total FROM favorites WHERE user_id = ?',
        [userId]
      );
      
      const total = countResult[0].total;
      
      // 查询收藏列表，使用query代替execute来处理LIMIT参数
      const [rows] = await pool.query(
        `SELECT 
          f.id as favorite_id, f.article_id, f.create_time as favorite_time,
          a.id, a.title, a.abstract, a.cover_url, a.category_id,
          a.source, a.author, a.publish_time, a.view_count, 
          a.like_count, a.comment_count, c.name as category_name
        FROM favorites f
        JOIN articles a ON f.article_id = a.id
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE f.user_id = ? AND a.status = 1
        ORDER BY f.create_time DESC
        LIMIT ?, ?`,
        [userId, offset, limit]
      );
      
      // 处理结果，格式化数据
      const items = rows.map(row => ({
        favorite_id: row.favorite_id,
        article_id: row.article_id,
        favorite_time: row.favorite_time,
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
      throw new Error(`获取收藏列表失败: ${error.message}`);
    }
  }

  /**
   * 添加收藏
   * @param {number} userId - 用户ID
   * @param {number} articleId - 文章ID
   * @returns {Promise<Object>} - 收藏信息
   */
  async addFavorite(userId, articleId) {
    try {
      // 检查文章是否存在
      const [articleCheck] = await pool.execute(
        'SELECT id FROM articles WHERE id = ? AND status = 1',
        [articleId]
      );
      
      if (articleCheck.length === 0) {
        throw new Error('文章不存在或已被删除');
      }
      
      // 检查是否已收藏
      const [favoriteCheck] = await pool.execute(
        'SELECT id FROM favorites WHERE user_id = ? AND article_id = ?',
        [userId, articleId]
      );
      
      if (favoriteCheck.length > 0) {
        return { id: favoriteCheck[0].id, message: '已经收藏过此文章' };
      }
      
      // 添加收藏
      const [result] = await pool.execute(
        'INSERT INTO favorites (user_id, article_id) VALUES (?, ?)',
        [userId, articleId]
      );
      
      if (result.affectedRows === 0) {
        throw new Error('收藏失败');
      }
      
      return {
        id: result.insertId,
        user_id: userId,
        article_id: articleId,
        create_time: new Date(),
        message: '收藏成功'
      };
    } catch (error) {
      throw new Error(`添加收藏失败: ${error.message}`);
    }
  }

  /**
   * 取消收藏
   * @param {number} userId - 用户ID
   * @param {number} articleId - 文章ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async removeFavorite(userId, articleId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM favorites WHERE user_id = ? AND article_id = ?',
        [userId, articleId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`取消收藏失败: ${error.message}`);
    }
  }

  /**
   * 清空用户所有收藏
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async clearUserFavorites(userId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM favorites WHERE user_id = ?',
        [userId]
      );
      
      return true;
    } catch (error) {
      throw new Error(`清空收藏失败: ${error.message}`);
    }
  }

  /**
   * 检查文章是否被用户收藏
   * @param {number} userId - 用户ID
   * @param {number} articleId - 文章ID
   * @returns {Promise<boolean>} - 是否已收藏
   */
  async checkFavorite(userId, articleId) {
    try {
      const [rows] = await pool.execute(
        'SELECT id FROM favorites WHERE user_id = ? AND article_id = ?',
        [userId, articleId]
      );
      
      return rows.length > 0;
    } catch (error) {
      throw new Error(`检查收藏状态失败: ${error.message}`);
    }
  }
}

module.exports = new FavoriteModel();