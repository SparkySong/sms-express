const { pool } = require('../config/db');
const config = require('../config/config');
const db = require('../utils/db');

/**
 * 文章模型
 */
class ArticleModel {
  /**
   * 获取文章列表
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码，从1开始
   * @param {number} options.limit - 每页数量
   * @param {number} options.categoryId - 分类ID，可选
   * @param {string} options.keyword - 搜索关键词，可选
   * @param {string} options.sort - 排序字段，可选
   * @param {string} options.order - 排序方向，asc或desc，可选
   * @returns {Promise<Object>} - 文章列表和总数
   */
  async getArticles(options = {}) {
    try {
      const page = parseInt(options.page) || 1;
      const limit = Math.min(parseInt(options.limit) || config.pagination.defaultLimit, config.pagination.maxLimit);
      const offset = (page - 1) * limit;

      // 构建查询条件
      let whereClause = 'WHERE a.status = 1';
      const queryParams = [];

      // 按分类筛选
      if (options.categoryId) {
        whereClause += ' AND a.category_id = ?';
        queryParams.push(parseInt(options.categoryId));
      }

      // 按关键词搜索
      if (options.keyword) {
        whereClause += ' AND (a.title LIKE ? OR a.abstract LIKE ? OR a.content LIKE ?)';
        const keyword = `%${options.keyword}%`;
        queryParams.push(keyword, keyword, keyword);
      }

      // 构建排序条件
      const validSortFields = ['publish_time', 'update_time', 'view_count', 'like_count', 'comment_count'];
      const sortField = validSortFields.includes(options.sort) ? options.sort : 'publish_time';
      const sortOrder = options.order?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // 首先查询满足条件的文章总数
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total FROM articles a ${whereClause}`,
        queryParams
      );

      const total = countResult[0].total;

      // 查询文章列表，使用query方法正确处理LIMIT参数
      const sql = `SELECT 
        a.id, a.title, a.abstract, a.cover_url, a.category_id, a.source,
        a.author, a.user_id, a.publish_time, a.view_count, a.like_count, a.comment_count,
        a.is_top, c.name as category_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.is_top DESC, a.${sortField} ${sortOrder}
      LIMIT ?, ?`;

      const [rows] = await pool.query(sql, [...queryParams, offset, limit]);

      return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: rows
      };
    } catch (error) {
      throw new Error(`获取文章列表失败: ${error.message}`);
    }
  }

  /**
   * 获取头条文章
   * @param {number} limit - 获取数量
   * @returns {Promise<Array>} - 头条文章列表
   */
  async getHeadlineArticles(limit = 5) {
    try {
      // 确保limit是整数
      const limitNum = parseInt(limit);

      // 使用query方法而不是execute来处理LIMIT参数
      const [rows] = await pool.query(
        `SELECT 
          id, title, abstract, cover_url, source, author, publish_time
        FROM articles 
        WHERE status = 1 
        ORDER BY is_top DESC, view_count DESC, publish_time DESC 
        LIMIT ?`,
        [limitNum]
      );

      return rows;
    } catch (error) {
      throw new Error(`获取头条文章失败: ${error.message}`);
    }
  }

  /**
   * 按分类获取热门文章
   * @param {number} categoryId - 分类ID
   * @param {number} limit - 获取数量
   * @returns {Promise<Array>} - 热门文章列表
   */
  async getHotArticlesByCategory(categoryId, limit = 10) {
    try {
      // 确保参数是整数
      const catId = parseInt(categoryId);
      const limitNum = parseInt(limit);

      // 使用query方法而不是execute来处理LIMIT参数
      const [rows] = await pool.query(
        `SELECT 
          id, title, abstract, cover_url, source, author, publish_time, view_count
        FROM articles 
        WHERE status = 1 AND category_id = ?
        ORDER BY view_count DESC, publish_time DESC 
        LIMIT ?`,
        [catId, limitNum]
      );

      return rows;
    } catch (error) {
      throw new Error(`获取热门文章失败: ${error.message}`);
    }
  }

  /**
   * 获取文章详情
   * @param {number} id - 文章ID
   * @param {boolean} incrementView - 是否增加阅读量，默认true
   * @returns {Promise<Object|null>} - 文章详情或null
   */
  async getArticleById(id, incrementView = true) {
    try {
      // 确保ID是整数
      const articleId = parseInt(id);

      // 查询文章主体信息
      const [rows] = await pool.execute(
        `SELECT 
          a.id, a.title, a.abstract, a.content, a.cover_url, a.category_id,
          a.source, a.author, a.user_id, a.publish_time, a.update_time, a.view_count,
          a.like_count, a.comment_count, a.is_top, c.name as category_name
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.id = ? AND a.status = 1`,
        [articleId]
      );

      if (rows.length === 0) {
        return null;
      }

      const article = rows[0];

      // 查询文章图片
      const [images] = await pool.execute(
        `SELECT id, image_url, sort_order
         FROM article_images
         WHERE article_id = ?
         ORDER BY sort_order`,
        [articleId]
      );

      article.images = images;

      // 增加阅读量
      if (incrementView) {
        await pool.execute(
          'UPDATE articles SET view_count = view_count + 1 WHERE id = ?',
          [articleId]
        );
        article.view_count += 1;
      }

      return article;
    } catch (error) {
      throw new Error(`获取文章详情失败: ${error.message}`);
    }
  }

  /**
   * 创建新文章
   * @param {Object} articleData - 文章数据
   * @returns {Promise<Object>} - 创建的文章
   */
  async createArticle(articleData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 提取并处理文章图片
      const { images, ...articleFields } = articleData;

      // 将undefined值转换为null
      for (const key in articleFields) {
        if (articleFields[key] === undefined) {
          articleFields[key] = null;
        }
      }

      // 构造SQL插入语句
      const fields = Object.keys(articleFields).join(', ');
      const placeholders = Object.keys(articleFields).map(() => '?').join(', ');
      const values = Object.values(articleFields);

      // 插入文章主体
      const [result] = await connection.execute(
        `INSERT INTO articles (${fields}) VALUES (${placeholders})`,
        values
      );

      const articleId = result.insertId;

      // 插入文章图片
      if (images && images.length > 0) {
        const imageValues = images.map((img, index) => [
          articleId,
          img.image_url,
          index
        ]);

        await connection.query(
          `INSERT INTO article_images (article_id, image_url, sort_order) VALUES ?`,
          [imageValues]
        );
      }

      await connection.commit();

      // 返回创建的文章
      return await this.getArticleById(articleId, false);
    } catch (error) {
      await connection.rollback();
      throw new Error(`创建文章失败: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * 更新文章
   * @param {number} id - 文章ID
   * @param {Object} articleData - 更新的文章数据
   * @returns {Promise<Object>} - 更新后的文章
   */
  async updateArticle(id, articleData) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 提取并处理文章图片
      const { images, ...articleFields } = articleData;

      // 如果有字段要更新
      if (Object.keys(articleFields).length > 0) {
        // 构建更新SQL
        const fields = Object.keys(articleFields);
        const updates = fields.map(field => `${field} = ?`).join(',');
        const values = [...Object.values(articleFields), id];

        // 更新文章主体
        await connection.execute(
          `UPDATE articles SET ${updates} WHERE id = ?`,
          values
        );
      }

      // 如果提供了图片数据，则替换所有图片
      if (images) {
        // 先删除现有图片
        await connection.execute(
          'DELETE FROM article_images WHERE article_id = ?',
          [id]
        );

        // 插入新图片
        if (images.length > 0) {
          const imageValues = images.map((img, index) => [
            id,
            img.image_url,
            index
          ]);

          await connection.query(
            `INSERT INTO article_images (article_id, image_url, sort_order) VALUES ?`,
            [imageValues]
          );
        }
      }

      await connection.commit();

      // 返回更新后的文章
      return await this.getArticleById(id, false);
    } catch (error) {
      await connection.rollback();
      throw new Error(`更新文章失败: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * 删除文章（设置状态为不可见）
   * @param {number} id - 文章ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async deleteArticle(id) {
    try {
      const articleId = parseInt(id);

      const [result] = await pool.execute(
        'UPDATE articles SET status = 0 WHERE id = ?',
        [articleId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`删除文章失败: ${error.message}`);
    }
  }

  /**
   * 检查用户是否已点赞文章
   * @param {number} userId - 用户ID
   * @param {number} articleId - 文章ID
   * @returns {Promise<boolean>} - 是否已点赞
   */
  async checkLikeStatus(userId, articleId) {
    try {
      // 查询是否有点赞记录
      const [rows] = await pool.execute(
        `SELECT COUNT(*) as count 
         FROM article_likes 
         WHERE user_id = ? AND article_id = ?`,
        [userId, articleId]
      );
      
      return rows[0].count > 0;
    } catch (error) {
      // 如果表不存在，则意味着用户未点赞
      if (error.code === 'ER_NO_SUCH_TABLE') {
        // 创建表
        await this.createArticleLikesTable();
        return false;
      }
      
      throw new Error(`检查点赞状态失败: ${error.message}`);
    }
  }

  /**
   * 创建文章点赞表（如果不存在）
   * @returns {Promise<void>}
   */
  async createArticleLikesTable() {
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS article_likes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          article_id INT NOT NULL,
          create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY (user_id, article_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
        ) COMMENT '文章点赞表';
      `);
    } catch (error) {
      throw new Error(`创建点赞表失败: ${error.message}`);
    }
  }

  /**
   * 点赞文章
   * @param {number} userId - 用户ID
   * @param {number} articleId - 文章ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async likeArticle(userId, articleId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查是否已经点赞
      const [checkRows] = await connection.execute(
        `SELECT COUNT(*) as count 
         FROM article_likes 
         WHERE user_id = ? AND article_id = ?`,
        [userId, articleId]
      );
      
      const alreadyLiked = checkRows[0].count > 0;
      
      if (alreadyLiked) {
        // 如果已点赞，则取消点赞
        await connection.execute(
          'DELETE FROM article_likes WHERE user_id = ? AND article_id = ?',
          [userId, articleId]
        );
        
        // 减少文章点赞数
        await connection.execute(
          'UPDATE articles SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?',
          [articleId]
        );
        
        await connection.commit();
        return false; // 返回false表示取消点赞
      } else {
        // 如果未点赞，则添加点赞
        await connection.execute(
          'INSERT INTO article_likes (user_id, article_id) VALUES (?, ?)',
          [userId, articleId]
        );
        
        // 增加文章点赞数
        await connection.execute(
          'UPDATE articles SET like_count = like_count + 1 WHERE id = ?',
          [articleId]
        );
        
        await connection.commit();
        return true; // 返回true表示点赞成功
      }
    } catch (error) {
      await connection.rollback();
      
      // 如果表不存在，则创建表并重试
      if (error.code === 'ER_NO_SUCH_TABLE') {
        await this.createArticleLikesTable();
        return await this.likeArticle(userId, articleId);
      }
      
      throw new Error(`点赞/取消点赞失败: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * 获取随机文章
   * @param {Object} options - 查询选项
   * @param {number} options.limit - 获取数量
   * @param {number} options.excludeId - 排除的文章ID
   * @param {string} options.excludeIds - 逗号分隔的排除文章ID列表
   * @returns {Promise<Array>} - 随机文章列表
   */
  async getRandomArticles(options = {}) {
    try {
      // 确保limit是整数
      const limit = Math.min(parseInt(options.limit) || 5, 20);

      // 构建排除条件
      let excludeClause = '';
      const queryParams = [];

      // 排除单个ID
      if (options.excludeId && !isNaN(parseInt(options.excludeId))) {
        excludeClause = 'AND id != ?';
        queryParams.push(parseInt(options.excludeId));
      }

      // 排除多个ID
      if (options.excludeIds) {
        const ids = options.excludeIds.split(',')
          .map(id => parseInt(id.trim()))
          .filter(id => !isNaN(id));

        if (ids.length > 0) {
          excludeClause = `AND id NOT IN (${ids.map(() => '?').join(',')})`;
          queryParams.push(...ids);
        }
      }

      // 查询随机文章
      queryParams.push(limit);
      const [rows] = await pool.query(
        `SELECT 
          id, title, abstract, cover_url, source, author, publish_time, category_id
        FROM articles 
        WHERE status = 1 ${excludeClause}
        ORDER BY RAND()
        LIMIT ?`,
        queryParams
      );

      return rows;
    } catch (error) {
      throw new Error(`获取随机文章失败: ${error.message}`);
    }
  }

  /**
   * 获取分类下的文章列表
   * @param {Number} categoryId - 分类ID
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 文章列表和总数
   */
  async getArticlesByCategory(categoryId, options = {}) {
    try {
      const { page = 1, pageSize = 10, sortBy = 'publish_time', order = 'desc', keyword } = options;

      console.log(`执行getArticlesByCategory查询: categoryId=${categoryId}, keyword=${keyword || '无'}`);

      // 验证排序字段
      const allowedSortFields = ['publish_time', 'view_count', 'like_count', 'comment_count'];
      const field = allowedSortFields.includes(sortBy) ? sortBy : 'publish_time';

      // 验证排序方式
      const direction = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      // 计算偏移量
      const offset = (page - 1) * pageSize;

      // 构建查询条件
      let whereClause = 'articles.category_id = ? AND articles.status = 1';
      const queryParams = [categoryId];

      // 如果有关键词，添加搜索条件
      if (keyword) {
        whereClause += ' AND (articles.title LIKE ? OR articles.abstract LIKE ? OR articles.content LIKE ?)';
        const keywordParam = `%${keyword}%`;
        queryParams.push(keywordParam, keywordParam, keywordParam);
      }

      // 查询文章总数
      const countQuery = `
        SELECT COUNT(*) AS total 
        FROM articles 
        WHERE articles.category_id = ? AND articles.status = 1
        ${keyword ? ' AND (articles.title LIKE ? OR articles.abstract LIKE ? OR articles.content LIKE ?)' : ''}
      `;

      const countParams = keyword
        ? [categoryId, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
        : [categoryId];


      const [countResult] = await db.query(countQuery, countParams);

      const total = countResult[0].total;

      // 如果没有文章，直接返回空数组
      if (total === 0) {
        return {
          articles: [],
          total: 0
        };
      }

      // 查询文章列表
      const listQuery = `
        SELECT 
          articles.id,
          articles.title,
          articles.abstract,
          articles.cover_url,
          articles.source,
          articles.author,
          articles.publish_time,
          articles.view_count,
          articles.like_count,
          articles.comment_count,
          categories.name AS category_name
        FROM articles
        LEFT JOIN categories ON articles.category_id = categories.id
        WHERE articles.category_id = ? AND articles.status = 1
        ${keyword ? ' AND (articles.title LIKE ? OR articles.abstract LIKE ? OR articles.content LIKE ?)' : ''}
        ORDER BY articles.${field} ${direction}
        LIMIT ? OFFSET ?
      `;

      const listParams = keyword
        ? [categoryId, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, pageSize, offset]
        : [categoryId, pageSize, offset];


      const [articles] = await db.query(listQuery, listParams);

      // 处理发布时间格式
      articles.forEach(article => {
        if (article.publish_time) {
          article.publish_time = this.formatDate(article.publish_time);
        }
      });

      return {
        articles,
        total
      };
    } catch (error) {

      throw new Error(`获取分类文章失败: ${error.message}`);
    }
  }

  /**
   * 格式化日期时间
   * @param {Date} date - 日期对象
   * @returns {String} 格式化后的日期字符串
   */
  formatDate(date) {
    if (!date) return '';

    const d = new Date(date);
    
    // 确保日期有效
    if (isNaN(d.getTime())) {
      return '';
    }
    
    // 使用ISO格式的日期，确保iOS兼容性
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');

    // 返回"YYYY-MM-DD HH:MM"格式，兼容iOS
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }

  /**
   * 获取所有分类的文章数量
   * @returns {Promise<Object>} - 每个分类的文章数量
   */
  async getCategoriesArticleCount() {
    try {
      const [rows] = await pool.query(
        `SELECT 
          category_id, COUNT(*) as article_count
        FROM articles 
        WHERE status = 1
        GROUP BY category_id`
      );

      // 转换为 {分类ID: 文章数量} 的对象格式
      const categoryCounts = {};
      for (const row of rows) {
        categoryCounts[row.category_id] = row.article_count;
      }

      return categoryCounts;
    } catch (error) {
      throw new Error(`获取分类文章数量失败: ${error.message}`);
    }
  }
}

module.exports = new ArticleModel();