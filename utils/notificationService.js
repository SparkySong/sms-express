/**
 * 通知相关服务
 */
import { request } from './request';

// 接口基础路径
const BASE_URL = '/notifications';

/**
 * 获取用户通知列表
 * @param {Object} params - 请求参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise<Object>} 通知列表数据
 */
export function getUserNotifications(params = {}) {
  return request({
    url: BASE_URL,
    method: 'GET',
    data: params
  });
}

/**
 * 获取未读通知数量
 * @returns {Promise<Object>} 未读数量
 */
export function getUnreadCount() {
  return request({
    url: `${BASE_URL}/unread-count`,
    method: 'GET'
  });
}

/**
 * 标记通知为已读
 * @param {number} notificationId - 通知ID
 * @returns {Promise<Object>} 标记结果
 */
export function markAsRead(notificationId) {
  return request({
    url: `${BASE_URL}/${notificationId}/read`,
    method: 'PUT'
  });
}

/**
 * 标记所有通知为已读
 * @returns {Promise<Object>} 标记结果
 */
export function markAllAsRead() {
  return request({
    url: `${BASE_URL}/read-all`,
    method: 'PUT'
  });
}

/**
 * 清空所有通知
 * @returns {Promise<Object>} 清空结果
 */
export function clearAllNotifications() {
  return request({
    url: `${BASE_URL}/clear-all`,
    method: 'DELETE'
  });
}

/**
 * 本地存储键名
 */
const NOTIFICATION_STORAGE_KEY = 'notification_last_check';

/**
 * 更新最后检查时间
 */
export function updateLastCheckTime() {
  try {
    wx.setStorageSync(NOTIFICATION_STORAGE_KEY, Date.now());
  } catch (error) {
    console.error('保存通知检查时间失败:', error);
  }
}

/**
 * 获取上次检查时间
 * @returns {number} 时间戳
 */
export function getLastCheckTime() {
  try {
    return wx.getStorageSync(NOTIFICATION_STORAGE_KEY) || 0;
  } catch (error) {
    console.error('获取通知检查时间失败:', error);
    return 0;
  }
} 