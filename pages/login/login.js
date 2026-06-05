const auth = require('../../utils/auth.js');

Page({
  data: {
    username: '',
    password: '',
    showPassword: false,
    loading: false,
    errorMessage: '',
    statusBarHeight: 20, // 默认状态栏高度
    baseUrl: 'http://127.0.0.1:3000/api/v1' // 后端API基础URL
  },

  onLoad() {
    // 获取状态栏高度
    const windowInfo = wx.getWindowInfo();
    this.setData({
      statusBarHeight: windowInfo.statusBarHeight
    });
  },

  // 输入用户名
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    });
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  // 切换密码可见性
  togglePasswordVisibility() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },

  // 账号密码登录
  accountLogin() {
    // 表单验证
    if (!this.data.username.trim()) {
      this.setData({
        errorMessage: '请输入用户名'
      });
      return;
    }
    if (!this.data.password) {
      this.setData({
        errorMessage: '请输入密码'
      });
      return;
    }

    this.setData({
      loading: true,
      errorMessage: ''
    });

    // 调用后端登录API
    wx.request({
      url: `${this.data.baseUrl}/users/login`,
      method: 'POST',
      data: {
        username: this.data.username,
        password: this.data.password
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
            avatarUrl: userData.user.avatar_url || 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png',
            role: userData.user.role || 'user',
            isLogin: true,
            loginType: 'account'
          });
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
          
          // 返回到上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        } else {
          // 登录失败
          this.setData({
            errorMessage: res.data.message || '登录失败',
            loading: false
          });
        }
      },
      fail: (err) => {
        this.setData({
          errorMessage: '网络错误，请重试',
          loading: false
        });
      }
    });
  },

  // 微信登录
  wechatLogin() {
    this.setData({
      loading: true,
      errorMessage: ''
    });

    // 先获取微信用户信息
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (profileRes) => {
        const userInfo = profileRes.userInfo;
        
        // 获取登录凭证
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              // 提交code到后端，进行登录验证
              this.wechatLoginRequest(loginRes.code, userInfo);
            } else {
              this.setData({
                errorMessage: '获取微信登录凭证失败',
                loading: false
              });
            }
          },
          fail: (err) => {
            this.setData({
              errorMessage: '微信登录失败',
              loading: false
            });
          }
        });
      },
      fail: (err) => {
        this.setData({
          errorMessage: '获取用户信息已取消',
          loading: false
        });
      }
    });
  },

  // 发送微信登录请求到后端
  wechatLoginRequest(code, userInfo) {
    // 调用后端微信登录API
    wx.request({
      url: `${this.data.baseUrl}/users/wechat/login`,
      method: 'POST',
      data: {
        code: code,
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
            role: userData.user.role || 'user',
            isLogin: true,
            loginType: 'wechat'
          });
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
          
          // 返回到上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        } else {
          // 登录失败
          this.setData({
            errorMessage: res.data.message || '微信登录失败',
            loading: false
          });
        }
      },
      fail: (err) => {
        this.setData({
          errorMessage: '网络错误，请重试',
          loading: false
        });
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },
  
  // 跳转到注册页
  goToRegister: function() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  }
}) 