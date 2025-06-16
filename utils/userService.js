/**
 * 用户相关API服务
 */
const request = require('./request');

/**
 * 获取当前用户信息
 * @returns {Promise} 用户信息
 */
const getCurrentUser = () => {
  return request.get('/users/profile');
};

/**
 * 更新用户信息
 * @param {Object} userInfo 用户信息对象
 * @returns {Promise} 更新结果
 */
const updateUserInfo = (userInfo) => {
  return request.put('/users/profile', userInfo);
};

/**
 * 获取用户统计信息
 * @returns {Promise} 统计信息
 */
const getUserStats = () => {
  return request.get('/users/stats');
};

/**
 * 修改密码
 * @param {String} oldPassword 旧密码
 * @param {String} newPassword 新密码
 * @returns {Promise} 修改结果
 */
const changePassword = (oldPassword, newPassword) => {
  return request.put('/users/change-password', { oldPassword, newPassword });
};

/**
 * 上传头像
 * @param {String} filePath 文件临时路径
 * @param {Function} progressCallback 上传进度回调
 * @returns {Promise} 上传结果
 */
const uploadAvatar = (filePath, progressCallback = null) => {
  return new Promise((resolve, reject) => {
    // 获取token
    const token = wx.getStorageSync('token');
    
    if (!token) {
      return reject(new Error('未登录状态，请先登录'));
    }
    
    // 上传文件
    const uploadTask = wx.uploadFile({
      url: 'http://127.0.0.1:3000/api/v1/users/avatar/upload',
      filePath: filePath,
      name: 'avatar',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (e) {
            reject(new Error('解析响应数据失败'));
          }
        } else if (res.statusCode === 401) {
          // 身份验证失败，清除token
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          reject(new Error('登录已过期，请重新登录'));
        } else {
          let errorMsg = '上传失败';
          try {
            const data = JSON.parse(res.data);
            errorMsg = data.message || errorMsg;
          } catch (e) {}
          reject(new Error(errorMsg));
        }
      },
      fail: (err) => {
        reject(new Error('网络请求失败: ' + err.errMsg));
      }
    });
    
    // 监听上传进度
    if (progressCallback && typeof progressCallback === 'function') {
      uploadTask.onProgressUpdate((res) => {
        progressCallback(res.progress);
      });
    }
    
    return uploadTask;
  });
};

/**
 * 账号密码登录
 * @param {String} username 用户名
 * @param {String} password 密码
 * @returns {Promise} 登录结果
 */
const login = (username, password) => {
  return request.post('/users/login', { username, password });
};

/**
 * 微信登录
 * @param {String} code 微信登录code
 * @param {Object} userInfo 用户信息
 * @returns {Promise} 登录结果
 */
const wechatLogin = (code, userInfo = {}) => {
  return request.post('/users/wechat/login', { 
    code,
    nickname: userInfo.nickName,
    avatar_url: userInfo.avatarUrl,
    gender: userInfo.gender
  });
};

/**
 * 用户注册
 * @param {String} username 用户名
 * @param {String} password 密码
 * @param {String} nickname 昵称
 * @returns {Promise} 注册结果
 */
const register = (username, password, nickname) => {
  return request.post('/users/register', { username, password, nickname });
};

module.exports = {
  getCurrentUser,
  updateUserInfo,
  getUserStats,
  changePassword,
  login,
  wechatLogin,
  register,
  uploadAvatar
}; 