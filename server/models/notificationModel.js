/**
 * 通知模型
 */
const { pool } = require('../config/db');
const logger = require('../utils/logger');

/**
 * 通知模型类
 */
class NotificationModel {
  /**
   * 获取用户的所有通知
   * @param {number} userId - 用户ID
   * @param {number} page - 页码
   * @param {number} pageSize - 每页条数
   * @returns {Promise<Array>} 通知数组
   */
  async getUserNotifications(userId, page = 1, pageSize = 20) {
    try {
      const offset = (page - 1) * pageSize;
      
      // 查询用户的特定通知和全局通知
      // 使用query代替execute来处理LIMIT参数
      const [notifications] = await pool.query(
        `SELECT 
          id, title, content, type, is_read, 
          create_time,
          CASE 
            WHEN type = 1 THEN 'info-o'
            WHEN type = 2 THEN 'chat-o'
            WHEN type = 3 THEN 'like-o'
            ELSE 'bell'
          END as icon,
          CASE 
            WHEN type = 1 THEN '#1989fa'
            WHEN type = 2 THEN '#ff976a'
            WHEN type = 3 THEN '#ee0a24'
            ELSE '#1989fa'
          END as iconBg
        FROM notifications 
        WHERE user_id = ? OR user_id IS NULL
        ORDER BY create_time DESC
        LIMIT ?, ?`,
        [userId, offset, pageSize]
      );
      
      // 格式化返回数据
      return notifications.map(notification => {
        return {
          id: notification.id,
          title: notification.title,
          content: notification.content,
          time: this.formatDateTime(notification.create_time),
          isRead: notification.is_read === 1,
          type: notification.type,
          icon: notification.icon,
          iconBg: notification.iconBg
        };
      });
    } catch (error) {
      logger.error('获取用户通知失败:', error);
      throw new Error('获取通知列表失败');
    }
  }

  /**
   * 获取用户未读通知数量
   * @param {number} userId - 用户ID
   * @returns {Promise<number>} 未读通知数量
   */
  async getUnreadCount(userId) {
    try {
      const [result] = await pool.execute(
        `SELECT COUNT(*) as count 
        FROM notifications 
        WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
        [userId]
      );
      
      return result[0].count;
    } catch (error) {
      logger.error('获取未读通知数量失败:', error);
      throw new Error('获取未读通知数量失败');
    }
  }

  /**
   * 标记通知为已读
   * @param {number} notificationId - 通知ID
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否成功
   */
  async markAsRead(notificationId, userId) {
    try {
      const [result] = await pool.execute(
        `UPDATE notifications 
         SET is_read = 1 
         WHERE id = ? AND (user_id = ? OR user_id IS NULL)`,
        [notificationId, userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('标记通知已读失败:', error);
      throw new Error('标记通知已读失败');
    }
  }

  /**
   * 标记用户所有通知为已读
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否成功
   */
  async markAllAsRead(userId) {
    try {
      const [result] = await pool.execute(
        `UPDATE notifications 
         SET is_read = 1 
         WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0`,
        [userId]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('标记所有通知已读失败:', error);
      throw new Error('标记所有通知已读失败');
    }
  }

  /**
   * 清空用户的所有通知
   * @param {number} userId - 用户ID
   * @returns {Promise<boolean>} 是否成功
   */
  async clearAllNotifications(userId) {
    try {
      // 删除用户特定通知，全局通知不删除(只标记为已读)
      const [deleteResult] = await pool.execute(
        `DELETE FROM notifications WHERE user_id = ?`,
        [userId]
      );
      
      // 标记全局通知为已读
      await pool.execute(
        `UPDATE notifications SET is_read = 1 WHERE user_id IS NULL AND is_read = 0`
      );
      
      return true;
    } catch (error) {
      logger.error('清空通知失败:', error);
      throw new Error('清空通知失败');
    }
  }

  /**
   * 添加通知（系统内部使用）
   * @param {object} notification - 通知对象
   * @param {string} notification.title - 标题
   * @param {string} notification.content - 内容
   * @param {number} notification.type - 类型
   * @param {number|null} notification.userId - 用户ID，null为全局通知
   * @returns {Promise<number>} 新建通知ID
   */
  async addNotification(notification) {
    try {
      const { title, content, type, userId } = notification;
      
      const [result] = await pool.execute(
        `INSERT INTO notifications (title, content, type, user_id) 
         VALUES (?, ?, ?, ?)`,
        [title, content, type, userId]
      );
      
      return result.insertId;
    } catch (error) {
      logger.error('添加通知失败:', error);
      throw new Error('添加通知失败');
    }
  }

  /**
   * 格式化日期时间
   * @param {Date} date - 日期对象
   * @returns {string} 格式化后的字符串 
   */
  formatDateTime(date) {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}

module.exports = new NotificationModel(); 