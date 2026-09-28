const { pool } = require('../config/db');
const logger = require('../utils/logger');
const notificationModel = require('./notificationModel');

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

      // 通知闭环：提醒文章作者与被回复者（失败不影响评论主流程）
      await this._notifyCommentInteraction(commentData);

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
   * 评论/回复互动通知（内部使用，通知失败仅记录日志不影响主流程）
   * @param {Object} commentData - 评论数据
   */
  async _notifyCommentInteraction(commentData) {
    try {
      const [users] = await pool.execute(
        'SELECT nickname, username FROM users WHERE id = ?',
        [commentData.user_id]
      );
      const commenter = users[0]?.nickname || users[0]?.username || '有人';

      const [articles] = await pool.execute(
        'SELECT user_id, title FROM articles WHERE id = ?',
        [commentData.article_id]
      );
      const article = articles[0];

      const notified = new Set();

      // 通知文章作者（评论者评论自己的文章时跳过）
      if (article && article.user_id && article.user_id !== commentData.user_id) {
        await notificationModel.addNotification({
          title: '新的评论',
          content: `${commenter} 评论了你的文章《${article.title}》`,
          type: 2,
          userId: article.user_id
        });
        notified.add(article.user_id);
      }

      // 回复时额外通知被回复者（与文章作者重复或回复自己时跳过）
      if (commentData.parent_id) {
        const [parents] = await pool.execute(
          'SELECT user_id FROM comments WHERE id = ?',
          [commentData.parent_id]
        );
        const parent = parents[0];
        if (parent && parent.user_id &&
            parent.user_id !== commentData.user_id &&
            !notified.has(parent.user_id)) {
          await notificationModel.addNotification({
            title: '新的回复',
            content: `${commenter} 回复了你的评论`,
            type: 2,
            userId: parent.user_id
          });
        }
      }
    } catch (error) {
      logger.error(`评论通知发送失败: ${error.message}`);
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

      // 通知闭环：点赞成功时提醒评论作者（失败不影响点赞主流程）
      if (liked) {
        try {
          const [targets] = await pool.execute(
            `SELECT c.user_id AS comment_user_id, a.title AS article_title
             FROM comments c
             JOIN articles a ON c.article_id = a.id
             WHERE c.id = ?`,
            [commentId]
          );
          const target = targets[0];
          if (target && target.comment_user_id && target.comment_user_id !== userId) {
            const [likers] = await pool.execute(
              'SELECT nickname, username FROM users WHERE id = ?',
              [userId]
            );
            const liker = likers[0]?.nickname || likers[0]?.username || '有人';
            await notificationModel.addNotification({
              title: '评论获赞',
              content: `${liker} 赞了你在《${target.article_title}》下的评论`,
              type: 2,
              userId: target.comment_user_id
            });
          }
        } catch (error) {
          logger.error(`评论点赞通知发送失败: ${error.message}`);
        }
      }

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
   * 删除评论（作者或管理员；删除主评论时级联软删除其可见子评论）
   * @param {number} commentId - 评论ID
   * @param {number} userId - 用户ID (用于权限验证)
   * @param {boolean} isAdmin - 是否为管理员
   * @returns {Promise<boolean>} - 是否删除成功
   */
  async deleteComment(commentId, userId, isAdmin = false) {
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

      // 检查权限：评论作者或管理员可以删除
      if (comment.user_id !== userId && !isAdmin) {
        throw new Error('无权删除此评论');
      }

      // 统计当前可见的子评论数，用于级联删除与计数同步
      const [replyCountRows] = await connection.execute(
        'SELECT COUNT(*) AS reply_count FROM comments WHERE parent_id = ? AND status = 1',
        [commentId]
      );
      const replyCount = replyCountRows[0].reply_count;

      // 软删除评论及其可见子评论
      await connection.execute(
        'UPDATE comments SET status = 0 WHERE id = ? OR (parent_id = ? AND status = 1)',
        [commentId, commentId]
      );

      // 更新文章评论数（主评论 + 级联子评论）
      await connection.execute(
        'UPDATE articles SET comment_count = GREATEST(comment_count - ?, 0) WHERE id = ?',
        [1 + replyCount, comment.article_id]
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