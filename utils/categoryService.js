/**
 * 分类相关API服务
 */
const request = require('./request');

/**
 * 获取所有分类
 * @returns {Promise} 分类列表
 */
const getAllCategories = () => {
  return request.get('/categories');
};

/**
 * 获取热门分类
 * @returns {Promise} 热门分类列表
 */
const getHotCategories = () => {
  return request.get('/categories/hot');
};

/**
 * 获取分类详情
 * @param {Number} id 分类ID
 * @returns {Promise} 分类详情
 */
const getCategoryDetail = (id) => {
  return request.get(`/categories/${id}`);
};

/**
 * 获取分类下的文章
 * @param {Number} categoryId 分类ID
 * @param {Object} params 查询参数 {page, pageSize, sortBy, order, keyword}
 * @returns {Promise} 文章列表
 */
const getCategoryArticles = (categoryId, params = {}) => {
  return request.get(`/categories/${categoryId}/articles`, params);
};

module.exports = {
  getAllCategories,
  getHotCategories,
  getCategoryDetail,
  getCategoryArticles
}; 