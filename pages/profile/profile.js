// pages/profile/profile.js
const userService = require('../../utils/userService');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      avatarUrl: 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png',
      nickName: '游客',
      isLogin: false
    },
    stats: {
      readCount: 0,
      favoriteCount: 0,
      historyCount: 0
    },
    menuItems: [
      { icon: 'user-o', text: '个人信息', id: 'edit_profile' },
      { icon: 'clock-o', text: '阅读历史', id: 'history' },
      { icon: 'chat-o', text: '消息通知', id: 'notifications' },
      { icon: 'setting-o', text: '系统设置', id: 'settings' },
      { icon: 'question-o', text: '帮助反馈', id: 'help' }
    ],
    loading: false // 加载状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化用户信息
    this.initUserInfo();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 获取 TabBar 实例，设置选中状态
    this.initTabBar();

    // 更新用户信息状态
    this.initUserInfo();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新时重新加载用户信息和统计数据
    this.initUserInfo();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 初始化TabBar
  initTabBar: function () {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3 // 假设"我的"是第4个标签
      });
    }
  },

  // 初始化用户信息
  initUserInfo: function () {
    // 检查是否已登录
    const token = wx.getStorageSync('token');

    if (!token) {
      // 未登录状态
      this.setData({
        userInfo: {
          avatarUrl: 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png',
          nickName: '游客',
          isLogin: false
        }
      });
      // 使用本地存储获取统计数据
      this.getLocalStats();
      return;
    }

    // 设置加载状态
    this.setData({ loading: true });

    // 获取用户信息
    userService.getCurrentUser()
      .then(res => {
        if (res && res.success) {
          const userData = res.data;
          // 更新用户信息
          this.setData({
            userInfo: {
              id: userData.id,
              avatarUrl: userData.avatar_url || 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png',
              nickName: userData.nickname || userData.username,
              username: userData.username,
              isLogin: true
            }
          });

          // 获取统计数据
          this.getStats();
        } else {
          // 获取用户信息失败
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
          this.getLocalStats();
        }
      })
      .catch(err => {
        console.error('获取用户信息失败:', err);
        // 获取用户信息失败时使用本地缓存
        this.getLocalStats();
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  // 获取用户统计数据
  getStats: function () {
    userService.getUserStats()
      .then(res => {
        if (res && res.success) {
          // 更新统计数据
          const statsData = res.data;
          this.setData({
            stats: {
              readCount: statsData.readCount > 99 ? '99+' : statsData.readCount,
              favoriteCount: statsData.favoriteCount,
              historyCount: statsData.historyCount
            }
          });
        } else {
          // 获取统计失败，使用本地存储
          this.getLocalStats();
        }
      })
      .catch(err => {
        console.error('获取统计数据失败:', err);
        // 获取统计失败时使用本地缓存
        this.getLocalStats();
      });
  },

  // 从本地存储获取统计数据
  getLocalStats: function () {
    // 从本地存储获取统计数据
    const readHistory = wx.getStorageSync('read_history') || [];
    const favorites = wx.getStorageSync('favorites') || [];

    // 更新统计数据
    this.setData({
      'stats.readCount': readHistory.length > 99 ? '99+' : readHistory.length,
      'stats.favoriteCount': favorites.length,
      'stats.historyCount': readHistory.length
    });
  },

  // 用户登录 - 修改为跳转到登录页
  login: function () {
    if (this.data.userInfo.isLogin) return;

    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 退出登录
  logout: function () {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除用户信息和token
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');

          const userInfo = {
            avatarUrl: 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png',
            nickName: '游客',
            isLogin: false
          };

          this.setData({
            userInfo: userInfo
          });

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });

          // 重新获取本地统计数据
          this.getLocalStats();
        }
      }
    });
  },

  // 点击菜单项
  onMenuItemTap: function (e) {
    const itemId = e.currentTarget.dataset.id;

    // 根据ID执行不同操作
    switch (itemId) {
      case 'history':
        wx.navigateTo({
          url: '/pages/history/history'
        });
        break;
      case 'notifications':
        wx.navigateTo({
          url: '/pages/notifications/notifications'
        });
        break;
      case 'edit_profile':
        // 检查是否已登录
        if (!this.data.userInfo.isLogin) {
          wx.showToast({
            title: '请先登录',
            icon: 'none'
          });
          return;
        }
        wx.navigateTo({
          url: '/pages/profile-edit/profile-edit'
        });
        break;
      case 'settings':
        wx.navigateTo({
          url: '/pages/settings/settings'
        });
        break;
      case 'help':
        wx.navigateTo({
          url: '/pages/help/help'
        });
        break;
      default:
        wx.showToast({
          title: '点击了: ' + itemId,
          icon: 'none'
        });
    }
  },

  // 点击统计项
  onStatTap: function (e) {
    const type = e.currentTarget.dataset.type;

    switch (type) {
      case 'read':
        // 未实现阅读统计详情页，跳转到历史记录页
        wx.navigateTo({
          url: '/pages/history/history'
        });
        break;
      case 'favorite':
        wx.switchTab({
          url: '/pages/favorite/favorite'
        });
        break;
      case 'history':
        wx.navigateTo({
          url: '/pages/history/history'
        });
        break;
    }
  },

  // 编辑个人信息
  editProfile: function () {
    if (!this.data.userInfo.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/profile-edit/profile-edit'
    });
  }
})