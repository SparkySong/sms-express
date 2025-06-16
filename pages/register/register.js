const auth = require('../../utils/auth.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    showPassword: false,
    showConfirmPassword: false,
    loading: false,
    errorMessage: '',
    statusBarHeight: 20 // 默认状态栏高度
  },

  /**
   * 生命周期函数--监听页面加载
   */
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
      username: e.detail.value,
      errorMessage: ''
    });
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value,
      errorMessage: ''
    });
  },
  
  // 确认密码输入
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value,
      errorMessage: ''
    });
  },
  
  // 输入昵称
  onNicknameInput(e) {
    this.setData({
      nickname: e.detail.value,
      errorMessage: ''
    });
  },

  // 切换密码可见性
  togglePasswordVisibility() {
    this.setData({
      showPassword: !this.data.showPassword
    });
  },
  
  // 切换确认密码可见性
  toggleConfirmPasswordVisibility() {
    this.setData({
      showConfirmPassword: !this.data.showConfirmPassword
    });
  },

  // 注册账号
  register() {
    // 表单验证
    if (!this.data.username.trim()) {
      this.setData({
        errorMessage: '请输入用户名'
      });
      return;
    }
    
    if (!/^[a-zA-Z0-9_]{4,20}$/.test(this.data.username)) {
      this.setData({
        errorMessage: '用户名只能包含字母、数字和下划线，长度4-20位'
      });
      return;
    }
    
    if (!this.data.password) {
      this.setData({
        errorMessage: '请输入密码'
      });
      return;
    }
    
    if (this.data.password.length < 6) {
      this.setData({
        errorMessage: '密码长度不能少于6位'
      });
      return;
    }
    
    if (this.data.password !== this.data.confirmPassword) {
      this.setData({
        errorMessage: '两次输入的密码不一致'
      });
      return;
    }

    this.setData({
      loading: true,
      errorMessage: ''
    });

    // 调用注册API
    auth.register({
      username: this.data.username,
      password: this.data.password,
      nickname: this.data.nickname || this.data.username
    }).then(result => {
      // 注册成功，自动登录
      this.loginAfterRegister();
    }).catch(error => {
      this.setData({
        errorMessage: error,
        loading: false
      });
    });
  },
  
  // 注册成功后自动登录
  loginAfterRegister() {
    auth.accountLogin({
      username: this.data.username,
      password: this.data.password
    }).then(userData => {
      wx.showToast({
        title: '注册成功',
        icon: 'success'
      });
      
      // 返回到上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }).catch(error => {
      // 登录失败但注册成功
      wx.showToast({
        title: '注册成功，请登录',
        icon: 'success'
      });
      
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        });
      }, 1000);
    }).finally(() => {
      this.setData({
        loading: false
      });
    });
  },
  
  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
}) 