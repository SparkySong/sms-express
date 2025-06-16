/**
 * 封装的HTTP请求工具函数
 */

// 开发环境API基础路径 - 这里将通过API配置统一管理
// 注意：这个常量保留做为默认值，但实际使用时会优先使用options.baseUrl
const BASE_URL = 'http://127.0.0.1:3000/api/v1';
// 请求超时时间（毫秒）
const TIMEOUT = 10000;

/**
 * 发送HTTP请求
 * @param {Object} options 请求选项
 * @returns {Promise} Promise对象
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 获取token
    const token = wx.getStorageSync('token');
    
    // 合并请求头
    const header = {
      'Content-Type': 'application/json',
      ...options.header
    };
    
    // 如果有token则添加到请求头
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }
    
    // 显示加载中
    if (!options.hideLoading) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    }
    
    // 拼接完整URL
    const url = options.baseUrl ? 
      (options.url.startsWith('http') ? options.url : `${options.baseUrl}${options.url}`) :
      (options.url.startsWith('http') ? options.url : `${BASE_URL}${options.url}`);
    
    // 发送请求
    const requestTask = wx.request({
      url,
      data: options.data,
      method: options.method || 'GET',
      header,
      timeout: options.timeout || TIMEOUT,
      success: (res) => {
        // 隐藏加载提示
        if (!options.hideLoading) {
          wx.hideLoading();
        }
        
        // 请求成功但业务状态不成功
        if (res.statusCode === 200) {
          // 返回数据
          resolve(res.data);
        } 
        // 身份验证错误
        else if (res.statusCode === 401) {
          // 清除登录状态
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          
          // 构造一个标准响应格式，避免直接抛出错误
          const response = {
            success: false,
            message: '登录已过期，请重新登录',
            code: 401,
            data: null
          };
          
          // 重新登录提示
          if (!options.hideErrorMsg) {
            wx.showModal({
              title: '提示',
              content: '登录已过期，请重新登录',
              showCancel: false,
              success: (res) => {
                if (res.confirm) {
                  wx.navigateTo({
                    url: '/pages/login/login'
                  });
                }
              }
            });
          }
          
          // 返回401响应而不是抛出错误
          resolve(response);
        } 
        // 其他错误
        else {
          if (!options.hideErrorMsg) {
            wx.showToast({
              title: res.data.message || '请求失败',
              icon: 'none',
              duration: 2000
            });
          }
          reject(res.data);
        }
      },
      fail: (err) => {
        // 隐藏加载提示
        if (!options.hideLoading) {
          wx.hideLoading();
        }
        
        // 网络错误或其他错误
        if (!options.hideErrorMsg) {
          wx.showToast({
            title: '网络异常，请稍后重试',
            icon: 'none',
            duration: 2000
          });
        }
        
        reject(err);
      }
    });
    
    // 返回requestTask，方便调用方取消请求
    return requestTask;
  });
};

/**
 * GET请求
 * @param {String} url 请求路径
 * @param {Object} data 请求参数
 * @param {Object} options 其他选项
 * @returns {Promise} Promise对象
 */
const get = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: 'GET',
    ...options
  });
};

/**
 * POST请求
 * @param {String} url 请求路径
 * @param {Object} data 请求参数
 * @param {Object} options 其他选项
 * @returns {Promise} Promise对象
 */
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: 'POST',
    ...options
  });
};

/**
 * PUT请求
 * @param {String} url 请求路径
 * @param {Object} data 请求参数
 * @param {Object} options 其他选项
 * @returns {Promise} Promise对象
 */
const put = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: 'PUT',
    ...options
  });
};

/**
 * DELETE请求
 * @param {String} url 请求路径
 * @param {Object} data 请求参数
 * @param {Object} options 其他选项
 * @returns {Promise} Promise对象
 */
const del = (url, data = {}, options = {}) => {
  return request({
    url,
    data,
    method: 'DELETE',
    ...options
  });
};

module.exports = {
  request,
  get,
  post,
  put,
  delete: del
}; 