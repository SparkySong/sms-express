const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * 用户模型
 */
class UserModel {
  /**
   * 通过ID查找用户
   * @param {number} id - 用户ID
   * @param {boolean} withPassword - 是否包含密码字段
   * @returns {Promise<Object|null>} - 用户信息或null
   */
  async findById(id, withPassword = false) {
    try {
      const fields = withPassword 
        ? 'id, openid, username, password, nickname, avatar_url, gender, phone, register_time, last_login_time, status' 
        : 'id, openid, username, nickname, avatar_url, gender, phone, register_time, last_login_time, status';
      
      const [rows] = await pool.execute(
        `SELECT ${fields} FROM users WHERE id = ?`,
        [id]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`查询用户失败: ${error.message}`);
    }
  }

  /**
   * 通过用户名查找用户
   * @param {string} username - 用户名
   * @param {boolean} withPassword - 是否包含密码字段
   * @returns {Promise<Object|null>} - 用户信息或null
   */
  async findByUsername(username, withPassword = false) {
    try {
      const fields = withPassword 
        ? 'id, openid, username, password, nickname, avatar_url, gender, phone, register_time, last_login_time, status, role' 
        : 'id, openid, username, nickname, avatar_url, gender, phone, register_time, last_login_time, status, role';
      
      const [rows] = await pool.execute(
        `SELECT ${fields} FROM users WHERE username = ?`,
        [username]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`查询用户失败: ${error.message}`);
    }
  }

  /**
   * 通过微信OpenID查找用户
   * @param {string} openid - 微信OpenID
   * @param {boolean} withPassword - 是否包含密码字段
   * @returns {Promise<Object|null>} - 用户信息或null
   */
  async findByOpenId(openid, withPassword = false) {
    try {
      const fields = withPassword 
        ? 'id, openid, username, password, nickname, avatar_url, gender, phone, register_time, last_login_time, status' 
        : 'id, openid, username, nickname, avatar_url, gender, phone, register_time, last_login_time, status';
      
      const [rows] = await pool.execute(
        `SELECT ${fields} FROM users WHERE openid = ?`,
        [openid]
      );

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`查询用户失败: ${error.message}`);
    }
  }

  /**
   * 创建新用户
   * @param {Object} userData - 用户数据
   * @returns {Promise<Object>} - 创建的用户信息
   */
  async create(userData) {
    try {
      // 如果提供了密码，则进行加密
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      // 构建插入SQL
      const fields = Object.keys(userData);
      const placeholders = fields.map(() => '?').join(',');
      const values = Object.values(userData);

      // 插入数据
      const [result] = await pool.execute(
        `INSERT INTO users (${fields.join(',')}) VALUES (${placeholders})`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('创建用户失败');
      }

      // 返回创建的用户信息
      return await this.findById(result.insertId);
    } catch (error) {
      throw new Error(`创建用户失败: ${error.message}`);
    }
  }

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} userData - 更新的用户数据
   * @returns {Promise<Object>} - 更新后的用户信息
   */
  async update(id, userData) {
    try {
      // 如果提供了密码，则进行加密
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }

      // 构建更新SQL
      const fields = Object.keys(userData);
      const updates = fields.map(field => `${field} = ?`).join(',');
      const values = [...Object.values(userData), id];

      // 更新数据
      const [result] = await pool.execute(
        `UPDATE users SET ${updates} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('更新用户失败');
      }

      // 返回更新后的用户信息
      return await this.findById(id);
    } catch (error) {
      throw new Error(`更新用户失败: ${error.message}`);
    }
  }

  /**
   * 更新用户最后登录时间
   * @param {number} id - 用户ID
   * @returns {Promise<boolean>} - 是否成功
   */
  async updateLastLoginTime(id) {
    try {
      const [result] = await pool.execute(
        'UPDATE users SET last_login_time = NOW() WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`更新登录时间失败: ${error.message}`);
    }
  }

  /**
   * 验证用户密码
   * @param {string} inputPassword - 输入的密码
   * @param {string} storedPassword - 存储的加密密码
   * @returns {Promise<boolean>} - 密码是否匹配
   */
  async verifyPassword(inputPassword, storedPassword) {
    return await bcrypt.compare(inputPassword, storedPassword);
  }
}

module.exports = new UserModel();