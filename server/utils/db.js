/**
 * 数据库工具模块
 */
const { pool } = require('../config/db');
const logger = require('./logger');

// 测试连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info('数据库连接成功');
    connection.release();
    return true;
  } catch (error) {
    logger.error('数据库连接失败:', error.message);
    return false;
  }
};

/**
 * 执行SQL查询
 * @param {String} sql - SQL语句
 * @param {Array} params - 查询参数
 * @returns {Promise} 查询结果
 */
const query = async (sql, params = []) => {
  try {
    return await pool.query(sql, params);
  } catch (error) {
    logger.error(`SQL执行失败: ${error.message}`);
    logger.error(`SQL语句: ${sql}`);
    logger.error(`参数: ${JSON.stringify(params)}`);
    throw error;
  }
};

/**
 * 执行单行插入
 * @param {String} table - 表名
 * @param {Object} data - 要插入的数据
 * @returns {Promise} 插入结果
 */
const insert = async (table, data) => {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');
  
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  
  const [result] = await query(sql, values);
  return result;
};

/**
 * 执行单行更新
 * @param {String} table - 表名
 * @param {Object} data - 要更新的数据
 * @param {Object} where - 更新条件
 * @returns {Promise} 更新结果
 */
const update = async (table, data, where) => {
  const setParts = Object.keys(data).map(key => `${key} = ?`);
  const whereParts = Object.keys(where).map(key => `${key} = ?`);
  
  const sql = `UPDATE ${table} SET ${setParts.join(', ')} WHERE ${whereParts.join(' AND ')}`;
  
  const values = [...Object.values(data), ...Object.values(where)];
  const [result] = await query(sql, values);
  
  return result;
};

/**
 * 执行删除操作
 * @param {String} table - 表名
 * @param {Object} where - 删除条件
 * @returns {Promise} 删除结果
 */
const remove = async (table, where) => {
  const whereParts = Object.keys(where).map(key => `${key} = ?`);
  const sql = `DELETE FROM ${table} WHERE ${whereParts.join(' AND ')}`;
  
  const values = Object.values(where);
  const [result] = await query(sql, values);
  
  return result;
};

// 关闭连接池
const end = async () => {
  try {
    await pool.end();
    logger.info('数据库连接池已关闭');
  } catch (error) {
    logger.error('关闭数据库连接池失败:', error.message);
  }
};

module.exports = {
  pool,
  testConnection,
  query,
  insert,
  update,
  remove,
  end
}; 