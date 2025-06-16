/**
 * 阅读历史相关API服务
 */
const request = require('./request');

/**
 * 获取用户阅读历史列表
 * @param {Number} page 页码
 * @param {Number} limit 每页条数
 * @returns {Promise} 阅读历史列表
 */
const getUserHistory = (page = 1, limit = 20) => {
  return request.get('/history', { page, limit });
};

/**
 * 添加阅读历史
 * @param {Number} articleId 文章ID
 * @returns {Promise} 添加结果
 */
const addHistory = (articleId) => {
  return request.post('/history', { article_id: articleId });
};

/**
 * 删除单条阅读历史
 * @param {Number} historyId 历史记录ID
 * @returns {Promise} 删除结果
 */
const removeHistory = (historyId) => {
  return request.delete(`/history/${historyId}`);
};

/**
 * 批量删除阅读历史
 * @param {Array<Number>} historyIds 历史记录ID数组
 * @returns {Promise} 删除结果
 */
const removeMultiHistory = (historyIds) => {
  return request.post('/history/batch-delete', { history_ids: historyIds });
};

/**
 * 清空所有阅读历史
 * @returns {Promise} 清空结果
 */
const clearAllHistory = () => {
  return request.delete('/history/all');
};

module.exports = {
  getUserHistory,
  addHistory,
  removeHistory,
  removeMultiHistory,
  clearAllHistory
}; 