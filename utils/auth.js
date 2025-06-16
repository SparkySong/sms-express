/**
 * 登录相关工具函数
 */

// 获取App实例来获取baseUrl
let baseUrl = 'http://127.0.0.1:3000/api/v1'; // 默认值

// 动态获取baseUrl的方法
const getBaseUrl = () => {
  const app = getApp();
  if (app && app.globalData && app.globalData.baseUrl) {
    return app.globalData.baseUrl;
  }
  return baseUrl;
};

/**
 * 检查用户是否已登录
 * @returns {Boolean} 是否已登录
 */
const isLoggedIn = () => {
  const token = wx.getStorageSync('token');
  return !!token;
};

/**
 * 获取当前用户信息
 * @returns {Object|null} 用户信息
 */
const getUserInfo = () => {
  const userInfo = wx.getStorageSync('userInfo');
  return userInfo || null;
};

/**
 * 获取用户信息从服务器
 * @returns {Promise} 用户信息
 */
const fetchUserInfo = () => {
  return new Promise((resolve, reject) => {
    if (!isLoggedIn()) {
      reject('用户未登录');
      return;
    }

    wx.request({
      url: `${getBaseUrl()}/users/info`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getToken()}`
      },
      success: (res) => {
        if (res.data.success) {
          // 更新用户信息
          const userInfo = {
            id: res.data.data.id,
            username: res.data.data.username,
            nickName: res.data.data.nickname,
            avatarUrl: res.data.data.avatar_url
          };
          wx.setStorageSync('userInfo', userInfo);
          resolve(userInfo);
        } else {
          reject(res.data.message || '获取用户信息失败');
        }
      },
      fail: (err) => {
        reject('网络错误，请重试');
      }
    });
  });
};

/**
 * 获取授权token
 * @returns {String|null} token
 */
const getToken = () => {
  return wx.getStorageSync('token') || null;
};

/**
 * 退出登录
 */
const logout = () => {
  wx.removeStorageSync('token');
  wx.removeStorageSync('userInfo');
};

/**
 * 跳转到登录页
 * @param {Boolean} direct 是否直接跳转
 */
const navigateToLogin = (direct = false) => {
  if (direct) {
    wx.navigateTo({
      url: '/pages/login/login'
    });
    return;
  }
  
  wx.showModal({
    title: '提示',
    content: '您需要登录后才能继续操作',
    confirmText: '去登录',
    cancelText: '取消',
    success(res) {
      if (res.confirm) {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }
    }
  });
};

/**
 * 检查登录状态，未登录则提示并跳转
 * @returns {Boolean} 是否已登录
 */
const checkLoginStatus = () => {
  if (!isLoggedIn()) {
    navigateToLogin();
    return false;
  }
  return true;
};

/**
 * 账号密码登录
 * @param {Object} data 登录数据
 * @returns {Promise} 登录结果
 */
const accountLogin = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getBaseUrl()}/users/login`,
      method: 'POST',
      data: data,
      success: (res) => {
        if (res.data.success) {
          // 保存登录信息
          const userData = res.data.data;
          wx.setStorageSync('token', userData.token);
          wx.setStorageSync('userInfo', {
            id: userData.user.id,
            username: userData.user.username,
            nickName: userData.user.nickname,
            avatarUrl: userData.user.avatar_url || 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png'
          });
          resolve(userData);
        } else {
          reject(res.data.message || '登录失败');
        }
      },
      fail: (err) => {
        reject('网络错误，请重试');
      }
    });
  });
};

/**
 * 注册新账号
 * @param {Object} data 注册数据
 * @returns {Promise} 注册结果
 */
const register = (data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${getBaseUrl()}/users/register`,
      method: 'POST',
      data: data,
      success: (res) => {
        if (res.data.success) {
          resolve(res.data.data);
        } else {
          reject(res.data.message || '注册失败');
        }
      },
      fail: (err) => {
        reject('网络错误，请重试');
      }
    });
  });
};

/**
 * 微信登录
 * @returns {Promise} 登录结果
 */
const wechatLogin = () => {
  return new Promise((resolve, reject) => {
    // 先获取微信用户信息
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (profileRes) => {
        const userInfo = profileRes.userInfo;
        
        // 获取登录凭证
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              // 调用后端微信登录API
              wx.request({
                url: `${getBaseUrl()}/users/wechat/login`,
                method: 'POST',
                data: {
                  code: loginRes.code,
                  nickname: userInfo.nickName,
                  avatar_url: userInfo.avatarUrl,
                  gender: userInfo.gender
                },
                success: (res) => {
                  if (res.data.success) {
                    // 登录成功
                    const userData = res.data.data;
                    
                    // 保存登录信息
                    wx.setStorageSync('token', userData.token);
                    wx.setStorageSync('userInfo', {
                      id: userData.user.id,
                      username: userData.user.username,
                      nickName: userData.user.nickname,
                      avatarUrl: userData.user.avatar_url || userInfo.avatarUrl,
                      isLogin: true,
                      loginType: 'wechat'
                    });
                    
                    resolve(userData);
                  } else {
                    reject(res.data.message || '微信登录失败');
                  }
                },
                fail: (err) => {
                  reject('网络错误，请重试');
                }
              });
            } else {
              reject('获取微信登录凭证失败');
            }
          },
          fail: (err) => {
            reject('微信登录失败');
          }
        });
      },
      fail: (err) => {
        reject('获取用户信息已取消');
      }
    });
  });
};

module.exports = {
  isLoggedIn,
  getUserInfo,
  getToken,
  logout,
  navigateToLogin,
  checkLoginStatus,
  accountLogin,
  register,
  wechatLogin
}; 