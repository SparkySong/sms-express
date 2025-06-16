// app.js
const auth = require('./utils/auth');

// 后端API基础URL
const BASE_URL = 'http://127.0.0.1:3000/api/v1'; 

App({
  onLaunch() {
    // 设置baseUrl
    this.globalData.baseUrl = BASE_URL;
    
    // 检查服务器连接
    this.checkServerConnection();
    
    // 检查登录状态
    if (auth.isLoggedIn()) {
      this.globalData.isLogin = true;
      this.globalData.userInfo = auth.getUserInfo();
      this.globalData.token = auth.getToken();
    }
    
    // 清理不必要的缓存，减少内存占用
    this.cleanupStorage();
  },
  
  // 检查服务器连接状态
  checkServerConnection() {
    wx.request({
      url: `${BASE_URL}/status`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.status === 'ok') {
          console.log('服务器连接正常:', res.data);
          this.globalData.serverConnected = true;
        } else {
          console.error('服务器连接异常:', res);
          this.globalData.serverConnected = false;
          this.showServerError();
        }
      },
      fail: (err) => {
        console.error('无法连接到服务器:', err);
        this.globalData.serverConnected = false;
        this.showServerError();
      }
    });
  },
  
  // 显示服务器连接错误
  showServerError() {
    wx.showToast({
      title: '服务器连接失败',
      icon: 'none',
      duration: 3000
    });
  },
  
  // 清理不必要的缓存
  cleanupStorage() {
    try {
      // 获取所有缓存的key
      wx.getStorageInfo({
        success: (res) => {
          const keys = res.keys;
          
          // 清理点赞缓存
          keys.forEach(key => {
            if (key.startsWith('likes_') || key.startsWith('favorites_')) {
              wx.removeStorageSync(key);
            }
          });
          
          // 清理阅读历史缓存，使用后端接口替代
          if (keys.includes('read_history')) {
            wx.removeStorageSync('read_history');
          }
          
          console.log('缓存清理完成');
        }
      });
    } catch (e) {
      console.error('清理缓存失败:', e);
    }
  },
  
  globalData: {
    userInfo: null,
    isLogin: false,
    token: null,
    auth: auth, // 添加auth工具到全局数据
    baseUrl: BASE_URL, // 后端API基础URL
    serverConnected: false // 服务器连接状态
  }
})
