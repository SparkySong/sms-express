const jwt = require('jsonwebtoken');
const config = require('../config/config');
const response = require('../utils/response');
const { pool } = require('../config/db');

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @returns {Promise<object>} - 解码后的用户信息
 */
const validateToken = async (token) => {
  // 验证token
  const decoded = jwt.verify(token, config.jwt.secret);
  
  // 查询用户是否存在且状态正常
  const [rows] = await pool.execute(
    'SELECT id, username, status FROM users WHERE id = ?',
    [decoded.id]
  );
  
  // 如果用户不存在或状态异常
  if (rows.length === 0 || rows[0].status !== 1) {
    throw new Error('无效的用户');
  }
  
  // 返回用户信息
  return {
    id: rows[0].id,
    username: rows[0].username
  };
};

/**
 * 需要认证的中间件
 */
const requireAuth = async (req, res, next) => {
  try {
    // 获取请求头中的token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.unauthorized(res, '请提供访问令牌');
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // 验证token
      const user = await validateToken(token);
      
      // 将用户信息添加到请求对象中
      req.user = user;
      
      // 继续处理请求
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return response.unauthorized(res, '访问令牌已过期');
      }
      
      if (error.name === 'JsonWebTokenError') {
        return response.unauthorized(res, '无效的访问令牌');
      }
      
      return response.unauthorized(res, error.message || '认证失败');
    }
  } catch (error) {
    // 其他错误
    return response.error(res, 500, '认证过程中发生错误');
  }
};

module.exports = {
  validateToken,
  requireAuth
}; 