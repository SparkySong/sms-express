const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const logger = require('./logger');

// 管理员默认配置
const ADMIN_CONFIG = {
  username: 'admin',
  password: 'admin123',
  nickname: '管理员',
  role: 'admin',
  status: 1
};

/**
 * 初始化管理员账号
 * 如果管理员账号不存在则自动创建
 */
async function initAdmin() {
  try {
    // 检查是否已存在管理员账号
    const [rows] = await pool.execute(
      'SELECT id, username, role FROM users WHERE role = ?',
      ['admin']
    );

    if (rows.length > 0) {
      logger.info('管理员账号已存在，跳过初始化');
      return;
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, salt);

    // 创建管理员账号
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, nickname, role, status) VALUES (?, ?, ?, ?, ?)',
      [ADMIN_CONFIG.username, hashedPassword, ADMIN_CONFIG.nickname, ADMIN_CONFIG.role, ADMIN_CONFIG.status]
    );

    if (result.affectedRows > 0) {
      logger.info(`管理员账号初始化成功！用户名: ${ADMIN_CONFIG.username}，密码: ${ADMIN_CONFIG.password}`);
      logger.info('⚠️  请尽快登录后修改默认密码！');
    }
  } catch (error) {
    // 如果是字段不存在的错误，尝试添加 role 字段
    if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('role')) {
      logger.info('检测到 users 表缺少 role 字段，正在添加...');
      try {
        await pool.execute(
          "ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' COMMENT '用户角色: admin/user'"
        );
        logger.info('role 字段添加成功，重新初始化管理员账号...');
        await initAdmin();
      } catch (alterError) {
        logger.error(`添加 role 字段失败: ${alterError.message}`);
      }
      return;
    }
    logger.error(`管理员账号初始化失败: ${error.message}`);
  }
}

module.exports = { initAdmin };
