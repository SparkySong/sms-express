/**
 * 统一API响应格式
 */

// 成功响应
const success = (res, data = null, message = '操作成功') => {
  return res.status(200).json({
    success: true,
    code: 200,
    message,
    data
  });
};

// 创建成功响应
const created = (res, data = null, message = '创建成功') => {
  return res.status(201).json({
    success: true,
    code: 201,
    message,
    data
  });
};

// 错误响应
const error = (res, status = 500, message = '服务器内部错误', errors = null) => {
  return res.status(status).json({
    success: false,
    code: status,
    message,
    errors
  });
};

// 未授权响应
const unauthorized = (res, message = '未授权访问') => {
  return error(res, 401, message);
};

// 禁止访问响应
const forbidden = (res, message = '禁止访问') => {
  return error(res, 403, message);
};

// 资源不存在响应
const notFound = (res, message = '资源不存在') => {
  return error(res, 404, message);
};

// 参数验证失败响应
const validationError = (res, errors, message = '参数验证失败') => {
  return error(res, 422, message, errors);
};

module.exports = {
  success,
  created,
  error,
  unauthorized,
  forbidden,
  notFound,
  validationError
}; 