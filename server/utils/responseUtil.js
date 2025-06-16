/**
 * 响应工具模块
 * 提供统一的API响应格式处理
 */

const { success, error } = require('./response');

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {string} message - 响应消息
 * @returns {Object} - 格式化的响应
 */
const successResponse = (res, data = null, message = '操作成功') => {
  return success(res, data, message);
};

/**
 * 错误响应
 * @param {Object} res - Express响应对象
 * @param {string} message - 错误消息
 * @param {number} status - HTTP状态码
 * @param {Object} errors - 错误详情
 * @returns {Object} - 格式化的错误响应
 */
const errorResponse = (res, message = '操作失败', status = 500, errors = null) => {
  return error(res, status, message, errors);
};

module.exports = {
  successResponse,
  errorResponse
}; 