/**
 * 收藏相关API服务
 */
const request = require('./request');

/**
 * 获取用户收藏列表
 * @param {Number} page 页码
 * @param {Number} limit 每页条数
 * @returns {Promise} 收藏列表
 */
const getUserFavorites = (page = 1, limit = 10) => {
  return request.get('/favorites', { page, limit });
};

/**
 * 添加收藏
 * @param {Number} articleId 文章ID
 * @returns {Promise} 添加结果
 */
const addFavorite = (articleId) => {
  return request.post('/favorites', { article_id: articleId });
};

/**
 * 取消收藏
 * @param {Number} articleId 文章ID
 * @returns {Promise} 取消结果
 */
const removeFavorite = (articleId) => {
  return request.delete(`/favorites/${articleId}`);
};

/**
 * 清空所有收藏
 * @returns {Promise} 清空结果
 */
const clearAllFavorites = () => {
  return request.delete('/favorites/all');
};

/**
 * 检查文章是否已收藏
 * @param {Number} articleId 文章ID
 * @returns {Promise} 检查结果
 */
const checkFavorite = (articleId) => {
  return request.get(`/favorites/check/${articleId}`);
};

module.exports = {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  clearAllFavorites,
  checkFavorite
}; 