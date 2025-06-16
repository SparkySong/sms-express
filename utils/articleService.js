/**
 * 文章相关服务
 */
import { request } from './request';

// 接口基础路径
const BASE_URL = '/articles';

/**
 * 获取文章列表
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getArticles(params = {}) {
  return request({
    url: BASE_URL,
    method: 'GET',
    data: params
  });
}

/**
 * 获取文章详情
 * @param {number} id 文章ID
 * @returns {Promise} Promise对象
 */
export function getArticleDetail(id) {
  return request({
    url: `${BASE_URL}/${id}`,
    method: 'GET'
  });
}

/**
 * 获取分类下的文章
 * @param {number} categoryId 分类ID
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getArticlesByCategory(categoryId, params = {}) {
  return request({
    url: `${BASE_URL}/category/${categoryId}`,
    method: 'GET',
    data: params
  });
}

/**
 * 获取热门文章
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getHotArticles(params = {}) {
  return request({
    url: `${BASE_URL}/hot`,
    method: 'GET',
    data: params
  });
}

/**
 * 获取推荐文章
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getRecommendArticles(params = {}) {
  return request({
    url: `${BASE_URL}/recommend`,
    method: 'GET',
    data: params
  });
}

/**
 * 搜索文章
 * @param {string} keyword 关键词
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function searchArticles(keyword, params = {}) {
  return request({
    url: `${BASE_URL}/search`,
    method: 'GET',
    data: {
      keyword,
      ...params
    }
  });
}

/**
 * 获取随机文章
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getRandomArticles(params = {}) {
  return request({
    url: `${BASE_URL}/random`,
    method: 'GET',
    data: params
  });
}

/**
 * 获取每个分类的文章数量
 * @returns {Promise} Promise对象
 */
export function getCategoriesCount() {
  return request({
    url: `${BASE_URL}/categories/count`,
    method: 'GET'
  });
}

/**
 * 获取相关文章
 * @param {number} articleId 文章ID
 * @param {Object} params 查询参数
 * @returns {Promise} Promise对象
 */
export function getRelatedArticles(articleId, params = {}) {
  return request({
    url: `${BASE_URL}/${articleId}/related`,
    method: 'GET',
    data: params
  });
}

module.exports = {
  getArticles,
  getArticleDetail,
  getArticlesByCategory,
  getHotArticles,
  getRecommendArticles,
  searchArticles,
  getRandomArticles,
  getCategoriesCount,
  getRelatedArticles
}; 