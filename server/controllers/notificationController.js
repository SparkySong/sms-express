/**
 * 通知控制器
 */
const notificationModel = require('../models/notificationModel');
const logger = require('../utils/logger');

/**
 * 通知控制器类
 */
class NotificationController {
  /**
   * 获取用户通知列表
   * @param {object} req - 请求对象
   * @param {object} res - 响应对象
   * @returns {object} 响应结果
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: '用户ID不能为空' });
      }
      
      const notifications = await notificationModel.getUserNotifications(userId, page, pageSize);
      const unreadCount = await notificationModel.getUnreadCount(userId);
      
      return res.status(200).json({
        success: true,
        data: {
          list: notifications,
          unreadCount: unreadCount,
          totalCount: notifications.length
        }
      });
    } catch (error) {
      logger.error('获取用户通知失败:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '获取通知列表失败'
      });
    }
  }
  
  /**
   * 获取未读通知数量
   * @param {object} req - 请求对象
   * @param {object} res - 响应对象
   * @returns {object} 响应结果
   */
  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: '用户ID不能为空' });
      }
      
      const count = await notificationModel.getUnreadCount(userId);
      
      return res.status(200).json({
        success: true,
        data: { count }
      });
    } catch (error) {
      logger.error('获取未读通知数量失败:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '获取未读通知数量失败'
      });
    }
  }
  
  /**
   * 标记通知为已读
   * @param {object} req - 请求对象
   * @param {object} res - 响应对象
   * @returns {object} 响应结果
   */
  async markAsRead(req, res) {
    try {
      const userId = req.user.id;
      const { notificationId } = req.params;
      
      if (!userId || !notificationId) {
        return res.status(400).json({
          success: false,
          message: '用户ID和通知ID不能为空'
        });
      }
      
      const result = await notificationModel.markAsRead(notificationId, userId);
      
      return res.status(200).json({
        success: result,
        message: result ? '标记已读成功' : '标记已读失败'
      });
    } catch (error) {
      logger.error('标记通知已读失败:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '标记通知已读失败'
      });
    }
  }
  
  /**
   * 标记所有通知为已读
   * @param {object} req - 请求对象
   * @param {object} res - 响应对象
   * @returns {object} 响应结果
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: '用户ID不能为空' });
      }
      
      const result = await notificationModel.markAllAsRead(userId);
      
      return res.status(200).json({
        success: true,
        message: '所有通知已标记为已读'
      });
    } catch (error) {
      logger.error('标记所有通知已读失败:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '标记所有通知已读失败'
      });
    }
  }
  
  /**
   * 清空所有通知
   * @param {object} req - 请求对象
   * @param {object} res - 响应对象
   * @returns {object} 响应结果
   */
  async clearAllNotifications(req, res) {
    try {
      const userId = req.user.id;
      
      if (!userId) {
        return res.status(400).json({ success: false, message: '用户ID不能为空' });
      }
      
      const result = await notificationModel.clearAllNotifications(userId);
      
      return res.status(200).json({
        success: true,
        message: '通知已清空'
      });
    } catch (error) {
      logger.error('清空通知失败:', error);
      return res.status(500).json({
        success: false,
        message: error.message || '清空通知失败'
      });
    }
  }
}

module.exports = new NotificationController(); 