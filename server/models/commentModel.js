const { pool } = require('../config/db');
const logger = require('../utils/logger');

/**
 * 评论模型类
 */
class CommentModel {
  /**
   * 获取文章的评论列表
   * @param {number} articleId - 文章ID
   * @param {number} userId - 用户ID (用于检查是否已点赞，可选)
   * @returns {Promise<Array>} - 评论列表
   */
  async getArticleComments(articleId, userId = null) {
    try {
      // 获取主评论（parent_id为null的评论）
      const [mainComments] = await pool.execute(
        `SELECT 
          c.id, 
          c.content, 
          c.like_count, 
          c.create_time, 
          c.user_id,
          u.username as user_name, 
          u.nickname, 
          u.avatar_url,
          IF(cl.id IS NOT NULL, 1, 0) as is_liked
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = ?
        WHERE c.article_id = ? AND c.parent_id IS NULL AND c.status = 1
        ORDER BY c.create_time DESC`,
        [userId || 0, articleId]
      );

      // 如果有主评论，获取所有回复（子评论）
      if (mainComments.length > 0) {
        // 获取所有主评论的ID
        const commentIds = mainComments.map(comment => comment.id);
        
        // 获取这些主评论的回复
        const [replies] = await pool.execute(
          `SELECT 
            c.id, 
            c.content, 
            c.parent_id,
            c.like_count, 
            c.create_time, 
            c.user_id,
            u.username as user_name, 
            u.nickname, 
            u.avatar_url,
            p.user_id as reply_to_user_id,
            pu.username as reply_to_name,
            IF(cl.id IS NOT NULL, 1, 0) as is_liked
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          LEFT JOIN comments p ON c.parent_id = p.id
          LEFT JOIN users pu ON p.user_id = pu.id
          LEFT JOIN comment_likes cl ON c.id = cl.comment_id AND cl.user_id = ?
          WHERE c.parent_id IN (?) AND c.status = 1
          ORDER BY c.create_time ASC`,
          [userId || 0, commentIds]
        );
        
        // 将回复添加到对应的主评论中
        const commentMap = {};
        mainComments.forEach(comment => {
          comment.replies = [];
          commentMap[comment.id] = comment;
        });
        
        replies.forEach(reply => {
          if (commentMap[reply.parent_id]) {
            commentMap[reply.parent_id].replies.push(reply);
          }
        });
      }
      
      return mainComments;
    } catch (error) {
      logger.error(`获取文章评论失败: ${error.message}`);
      throw new Error(`获取文章评论失败: ${error.message}`);
    }
  }

  /**
   * 添加评论
   * @param {Object} commentData - 评论数据
   * @param {number} commentData.user_id - 用户ID
   * @param {number} commentData.article_id - 文章ID
   * @param {string} commentData.content - 评论内容
   * @param {number} commentData.parent_id - 父评论ID (可选)
   * @returns {Promise<Object>} - 新增的评论
   */
  async createComment(commentData) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 插入评论
      const [result] = await connection.execute(
        'INSERT INTO comments (user_id, article_id, content, parent_id) VALUES (?, ?, ?, ?)',
        [
          commentData.user_id, 
          commentData.article_id, 
          commentData.content, 
          commentData.parent_id || null
        ]
      );
      
      const commentId = result.insertId;
      
      // 更新文章评论数
      await connection.execute(
        'UPDATE articles SET comment_count = comment_count + 1 WHERE id = ?',
        [commentData.article_id]
      );
      
      await connection.commit();
      
      // 获取新增评论的完整信息
      const [comments] = await pool.execute(
        `SELECT 
          c.id, 
          c.content, 
          c.like_count, 
          c.create_time, 
          c.parent_id,
          c.user_id,
          u.username as user_name, 
          u.nickname, 
          u.avatar_url
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = ?`,
        [commentId]
      );
      
      return comments[0];
    } catch (error) {
      await connection.rollback();
      logger.error(`创建评论失败: ${error.message}`);
      throw new Error(`创建评论失败: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * 点赞/取消点赞评论
   * @param {number} commentId - 评论ID
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} - 更新后的评论信息
   */
  async toggleCommentLike(commentId, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 检查是否已经点赞
      const [likes] = await connection.execute(
        'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?',
        [commentId, userId]
      );
      
      let liked = false;
      
      if (likes.length > 0) {
        // 已点赞，取消点赞
        await connection.execute(
          'DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?',
          [commentId, userId]
        );
        
        await connection.execute(
          'UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?',
          [commentId]
        );
      } else {
        // 未点赞，添加点赞
        await connection.execute(
          'INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)',
          [commentId, userId]
        );
        
        await connection.execute(
          'UPDATE comments SET like_count = like_count + 1 WHERE id = ?',
          [commentId]
        );
        
        liked = true;
      }
      
      await connection.commit();
      
      // 获取更新后的评论信息
      const [comments] = await pool.execute(
        'SELECT id, like_count FROM comments WHERE id = ?',
        [commentId]
      );
      
      return {
        ...comments[0],
        is_liked: liked
      };
    } catch (error) {
      await connection.rollback();
      logger.error(`评论点赞操作失败: ${error.message}`);
      throw new Error(`评论点赞操作失败: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * 删除评论
   * @param {number} commentId - 评论ID
   * @param {number} userId - 用户ID (用于权限验证)
   * @returns {Promise<boolean>} - 是否删除成功
   */
  async deleteComment(commentId, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // 获取评论信息以及验证权限
      const [comments] = await connection.execute(
        'SELECT article_id, user_id FROM comments WHERE id = ?',
        [commentId]
      );
      
      if (comments.length === 0) {
        throw new Error('评论不存在');
      }
      
      const comment = comments[0];
      
      // 检查权限：只有评论作者可以删除
      if (comment.user_id !== userId) {
        throw new Error('无权删除此评论');
      }
      
      // 软删除评论 (更新状态)
      await connection.execute(
        'UPDATE comments SET status = 0 WHERE id = ?',
        [commentId]
      );
      
      // 更新文章评论数
      await connection.execute(
        'UPDATE articles SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = ?',
        [comment.article_id]
      );
      
      await connection.commit();
      
      return true;
    } catch (error) {
      await connection.rollback();
      logger.error(`删除评论失败: ${error.message}`);
      throw new Error(`删除评论失败: ${error.message}`);
    } finally {
      connection.release();
    }
  }
}

module.exports = new CommentModel(); 