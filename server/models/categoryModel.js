/**
 * 分类模型
 */
const db = require('../utils/db');

class CategoryModel {
  /**
   * 获取所有分类
   * @returns {Promise<Array>} 分类列表
   */
  async getAllCategories() {
    try {
      const [rows] = await db.query(
        `SELECT 
          id, name, icon, bg_color, color_start, color_end, sort_order, is_hot 
        FROM categories 
        ORDER BY sort_order, id`
      );
      return rows;
    } catch (error) {
      throw new Error(`获取分类列表失败: ${error.message}`);
    }
  }

  /**
   * 获取热门分类
   * @param {Number} limit 限制数量，默认为6
   * @returns {Promise<Array>} 热门分类列表
   */
  async getHotCategories(limit = 6) {
    try {
      const [rows] = await db.query(
        `SELECT 
          id, name, icon, bg_color, color_start, color_end, sort_order 
        FROM categories 
        WHERE is_hot = 1 
        ORDER BY sort_order, id 
        LIMIT ?`,
        [limit]
      );
      return rows;
    } catch (error) {
      throw new Error(`获取热门分类失败: ${error.message}`);
    }
  }

  /**
   * 根据ID获取分类
   * @param {number} id - 分类ID
   * @returns {Promise<Object|null>} 分类信息或null
   */
  async getCategoryById(id) {
    try {
      const [rows] = await db.query(
        `SELECT 
          id, name, icon, bg_color, color_start, color_end, sort_order, is_hot 
        FROM categories 
        WHERE id = ?`,
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`获取分类详情失败: ${error.message}`);
    }
  }

  /**
   * 创建新分类
   * @param {Object} categoryData - 分类数据
   * @returns {Promise<Object>} 创建的分类
   */
  async createCategory(categoryData) {
    try {
      const result = await db.insert('categories', categoryData);
      return await this.getCategoryById(result.insertId);
    } catch (error) {
      throw new Error(`创建分类失败: ${error.message}`);
    }
  }

  /**
   * 更新分类
   * @param {number} id - 分类ID
   * @param {Object} updateData - 更新的数据
   * @returns {Promise<Object>} 更新后的分类
   */
  async updateCategory(id, updateData) {
    try {
      await db.update('categories', updateData, { id });
      return await this.getCategoryById(id);
    } catch (error) {
      throw new Error(`更新分类失败: ${error.message}`);
    }
  }

  /**
   * 删除分类
   * @param {number} id - 分类ID
   * @returns {Promise<boolean>} 是否成功
   */
  async deleteCategory(id) {
    try {
      // 首先检查是否有文章使用此分类
      const [articles] = await db.query(
        'SELECT COUNT(*) as count FROM articles WHERE category_id = ?',
        [id]
      );

      if (articles[0].count > 0) {
        throw new Error('无法删除已被文章使用的分类');
      }

      // 删除分类
      const result = await db.remove('categories', { id });
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`删除分类失败: ${error.message}`);
    }
  }
}

module.exports = new CategoryModel();