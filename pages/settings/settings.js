import Dialog from '@vant/weapp/dialog/dialog';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    settings: {
      darkMode: false,         // 深色模式
      fontSize: 16,            // 字体大小(px)
      noImageMode: false,      // 无图模式
      pushNotification: true,  // 推送通知
    },
    cacheSize: '0KB',          // 缓存大小
    cacheLimit: '0KB',         // 缓存限制
    cacheItems: 0              // 缓存项数
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadSettings();
    this.calculateCacheSize();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadSettings();
    this.calculateCacheSize();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 500);
  },

  /**
   * 加载设置数据
   */
  loadSettings() {
    const settingsData = wx.getStorageSync('app_settings');
    if (settingsData) {
      this.setData({
        settings: { ...this.data.settings, ...settingsData }
      });
    }
  },

  /**
   * 保存设置到存储
   */
  saveSettings() {
    wx.setStorageSync('app_settings', this.data.settings);
  },

  /**
   * 重置设置
   */
  resetSettings() {
    Dialog.confirm({
      title: '确认重置',
      message: '确定要将所有设置恢复到默认状态吗？',
    }).then(() => {
      // 默认设置
      const defaultSettings = {
        darkMode: false,
        fontSize: 16,
        noImageMode: false,
        pushNotification: true
      };
      
      this.setData({
        settings: defaultSettings
      });
      
      this.saveSettings();
      
      wx.showToast({
        title: '已重置所有设置',
        icon: 'success',
        duration: 2000
      });
    }).catch(() => {
      // 用户取消
    });
  },

  /**
   * 计算缓存大小
   */
  calculateCacheSize() {
    wx.getStorageInfo({
      success: (res) => {
        const sizeKB = res.currentSize;
        let sizeStr = '';
        
        if (sizeKB < 1024) {
          sizeStr = sizeKB + 'KB';
        } else {
          sizeStr = (sizeKB / 1024).toFixed(2) + 'MB';
        }
        
        this.setData({
          cacheSize: sizeStr,
          cacheLimit: res.limitSize + 'KB',
          cacheItems: res.keys.length
        });
        
        // 当缓存使用超过80%，提示用户清理
        if (sizeKB > 0.8 * res.limitSize) {
          wx.showToast({
            title: '缓存空间即将用尽，建议清理',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },

  /**
   * 清除缓存
   */
  clearCache() {
    Dialog.confirm({
      title: '确认清除',
      message: '确定要清除所有缓存数据吗？\n这将清除阅读历史、浏览记录等数据，但不会影响您的设置。',
    }).then(() => {
      // 保存当前设置和登录信息
      const currentSettings = this.data.settings;
      const token = wx.getStorageSync('token');
      const userInfo = wx.getStorageSync('userInfo');
      
      // 获取所有缓存键
      wx.getStorageInfo({
        success: (res) => {
          const keys = res.keys;
          
          // 选择性清除缓存，保留重要数据
          keys.forEach(key => {
            // 保留设置和登录信息，清除其他缓存
            if (key !== 'app_settings' && key !== 'token' && key !== 'userInfo') {
              // 单独清除每个缓存项，而不是直接清除所有
              if (key.startsWith('likes_') || key.startsWith('favorites_') || 
                  key === 'read_history' || key === 'recent_categories') {
                wx.removeStorageSync(key);
              }
            }
          });
          
          // 重新存储设置和登录信息
          if (currentSettings) {
            wx.setStorageSync('app_settings', currentSettings);
          }
          if (token) {
            wx.setStorageSync('token', token);
          }
          if (userInfo) {
            wx.setStorageSync('userInfo', userInfo);
          }
          
          // 重新计算缓存大小
          this.calculateCacheSize();
          
          wx.showToast({
            title: '缓存已清除',
            icon: 'success',
            duration: 2000
          });
        }
      });
    }).catch(() => {
      // 用户取消
    });
  },
  
  /**
   * 智能清理缓存
   * 新增方法：只清理过期和不常用的缓存
   */
  smartClearCache() {
    wx.getStorageInfo({
      success: (res) => {
        const keys = res.keys;
        const now = Date.now();
        const ONE_WEEK = 7 * 24 * 60 * 60 * 1000; // 一周的毫秒数
        let clearedItems = 0;
        
        // 遍历所有缓存项
        keys.forEach(key => {
          // 处理点赞和收藏缓存（保留最近7天的）
          if (key.startsWith('likes_') || key.startsWith('favorites_')) {
            try {
              const timestampKey = `${key}_timestamp`;
              const timestamp = wx.getStorageSync(timestampKey) || 0;
              
              // 如果缓存超过7天，清除
              if (now - timestamp > ONE_WEEK) {
                wx.removeStorageSync(key);
                wx.removeStorageSync(timestampKey);
                clearedItems++;
              }
            } catch (e) {
              // 如果读取失败，也清除
              wx.removeStorageSync(key);
              clearedItems++;
            }
          }
        });
        
        // 处理阅读历史，只保留最近20条
        try {
          const history = wx.getStorageSync('read_history') || [];
          if (history.length > 20) {
            wx.setStorageSync('read_history', history.slice(0, 20));
            clearedItems++;
          }
        } catch (e) {
          console.error('处理阅读历史失败:', e);
        }
        
        // 重新计算缓存大小
        this.calculateCacheSize();
        
        wx.showToast({
          title: `已清理${clearedItems}项缓存`,
          icon: 'success',
          duration: 2000
        });
      }
    });
  },

  /**
   * 深色模式切换
   */
  onDarkModeChange(event) {
    this.setData({
      'settings.darkMode': event.detail
    });
    this.saveSettings();
    
    // 提示需要重启应用生效
    if (event.detail) {
      wx.showToast({
        title: '已开启深色模式',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: '已关闭深色模式',
        icon: 'success'
      });
    }
  },

  /**
   * 字体大小滑块变化
   */
  onFontSizeChange(event) {
    this.setData({
      'settings.fontSize': event.detail
    });
    this.saveSettings();
  },

  /**
   * 无图模式设置切换
   */
  onNoImageModeChange(event) {
    this.setData({
      'settings.noImageMode': event.detail
    });
    this.saveSettings();
    
    if (event.detail) {
      wx.showToast({
        title: '已开启无图模式',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: '已关闭无图模式',
        icon: 'success'
      });
    }
  },

  /**
   * 推送通知设置切换
   */
  onPushNotificationChange(event) {
    this.setData({
      'settings.pushNotification': event.detail
    });
    this.saveSettings();
  }
}) 