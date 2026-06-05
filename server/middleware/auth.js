const jwt = require('jsonwebtoken');
const config = require('../config/config');
const response = require('../utils/response');
const { pool } = require('../config/db');

/**
 * 验证JWT令牌
 */
const verifyToken = async (req, res, next) => {
  try {
    // 获取请求头中的token
    const token = req.headers.authorization?.split(' ')[1];
    
    // 如果没有token，返回未授权错误
    if (!token) {
      return response.unauthorized(res, '请提供访问令牌');
    }
    
    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 查询用户是否存在且状态正常
    const [rows] = await pool.execute(
      'SELECT id, username, role, status FROM users WHERE id = ?',
      [decoded.id]
    );
    
    // 如果用户不存在
    if (rows.length === 0) {
      return response.unauthorized(res, '用户不存在');
    }
    
    // 如果用户账号被禁用
    if (rows[0].status !== 1) {
      return response.forbidden(res, '账号已被禁用');
    }
    
    // 将用户信息添加到请求对象中
    req.user = {
      id: rows[0].id,
      username: rows[0].username,
      role: rows[0].role || 'user'
    };
    
    // 继续处理请求
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return response.unauthorized(res, '访问令牌已过期');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return response.unauthorized(res, '无效的访问令牌');
    }
    
    // 其他错误
    return response.error(res, 500, '认证过程中发生错误');
  }
};

/**
 * 可选的token验证，不强制要求登录
 */
const optionalAuth = async (req, res, next) => {
  try {
    // 获取请求头中的token
    const token = req.headers.authorization?.split(' ')[1];
    
    // 如果没有token，继续处理请求但不设置用户信息
    if (!token) {
      return next();
    }
    
    // 验证token
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // 查询用户是否存在且状态正常
      const [rows] = await pool.execute(
        'SELECT id, username, role, status FROM users WHERE id = ?',
        [decoded.id]
      );
      
      // 如果用户存在且状态正常
      if (rows.length > 0 && rows[0].status === 1) {
        // 将用户信息添加到请求对象中
        req.user = {
          id: rows[0].id,
          username: rows[0].username,
          role: rows[0].role || 'user'
        };
      }
    } catch (error) {
      // Token验证失败，但不返回错误，继续处理请求
    }
    
    // 继续处理请求
    next();
  } catch (error) {
    // 发生错误时仍继续处理请求
    next();
  }
};

/**
 * 验证管理员权限
 */
const verifyAdmin = async (req, res, next) => {
  try {
    // 先验证用户是否已登录
    const token = req.headers.authorization?.split(' ')[1];
    
    // 如果没有token，返回未授权错误
    if (!token) {
      return response.unauthorized(res, '请提供访问令牌');
    }
    
    // 验证token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 查询用户是否存在且是管理员
    const [rows] = await pool.execute(
      'SELECT id, username, status, role FROM users WHERE id = ?',
      [decoded.id]
    );
    
    // 如果用户不存在
    if (rows.length === 0) {
      return response.unauthorized(res, '用户不存在');
    }
    
    // 如果用户账号被禁用
    if (rows[0].status !== 1) {
      return response.forbidden(res, '账号已被禁用');
    }
    
    // 检查是否是管理员
    if (rows[0].role !== 'admin') {
      return response.forbidden(res, '需要管理员权限');
    }
    
    // 将用户信息添加到请求对象中
    req.user = {
      id: rows[0].id,
      username: rows[0].username,
      role: rows[0].role
    };
    
    // 继续处理请求
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return response.unauthorized(res, '访问令牌已过期');
    }
    
    if (error.name === 'JsonWebTokenError') {
      return response.unauthorized(res, '无效的访问令牌');
    }
    
    // 其他错误
    return response.error(res, 500, '认证过程中发生错误');
  }
};

module.exports = {
  verifyToken,
  optionalAuth,
  verifyAdmin
}; 