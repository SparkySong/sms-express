const userService = require('../../utils/userService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户信息
    userInfo: {
      nickname: '',
      username: '',
      avatarUrl: '',
      gender: 0, // 0-未知，1-男，2-女
      introduction: ''
    },
    // 原始用户信息（用于检测是否有修改）
    originalUserInfo: null,
    // 加载状态
    loading: false,
    // 提交状态
    submitting: false,
    // 头像上传状态
    uploadingAvatar: false,
    // 头像上传进度
    uploadProgress: 0,
    // 性别选项
    genderOptions: [
      { name: '未设置', value: 0 },
      { name: '男', value: 1 },
      { name: '女', value: 2 }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadUserInfo();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo: function() {
    this.setData({ loading: true });

    userService.getCurrentUser()
      .then(res => {
        if (res && res.success) {
          const userData = res.data;
          const userInfo = {
            nickname: userData.nickname || '',
            username: userData.username || '',
            avatarUrl: userData.avatar_url || 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png',
            gender: userData.gender || 0,
            introduction: userData.introduction || ''
          };

          this.setData({
            userInfo: userInfo,
            originalUserInfo: JSON.parse(JSON.stringify(userInfo))
          });
        } else {
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      })
      .catch(err => {
        console.error('获取用户信息失败:', err);
        wx.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  /**
   * 输入框内容变化事件
   */
  onInputChange: function(e) {
    const { field } = e.currentTarget.dataset;
    const { value } = e.detail;
    
    this.setData({
      [`userInfo.${field}`]: value
    });
  },

  /**
   * 选择器变化事件
   */
  onPickerChange: function(e) {
    const value = parseInt(e.detail.value);
    this.setData({
      'userInfo.gender': value
    });
  },

  /**
   * 选择头像
   */
  chooseAvatar: function() {
    wx.showActionSheet({
      itemList: ['从相册选择', '拍照'],
      success: (res) => {
        // 选择的来源类型: 0 - 相册, 1 - 拍照
        const sourceType = res.tapIndex === 0 ? ['album'] : ['camera'];
        
        wx.chooseImage({
          count: 1, // 只选择一张图片
          sizeType: ['compressed'], // 压缩图
          sourceType: sourceType,
          success: (res) => {
            // 获取临时文件路径
            const tempFilePath = res.tempFilePaths[0];
            
            // 显示上传提示
            this.setData({
              uploadingAvatar: true,
              uploadProgress: 0
            });
            
            // 上传图片到服务器
            userService.uploadAvatar(tempFilePath, (progress) => {
              this.setData({ uploadProgress: progress });
            })
              .then(res => {
                if (res && res.success) {
                  // 更新头像URL
                  this.setData({
                    'userInfo.avatarUrl': res.data.avatar_url
                  });
                  
                  wx.showToast({
                    title: '头像上传成功',
                    icon: 'success'
                  });
                } else {
                  throw new Error(res.message || '上传失败');
                }
              })
              .catch(err => {
                console.error('头像上传失败:', err);
                wx.showToast({
                  title: err.message || '头像上传失败',
                  icon: 'none'
                });
                
                // 恢复原头像
                this.setData({
                  'userInfo.avatarUrl': this.data.originalUserInfo.avatarUrl
                });
              })
              .finally(() => {
                this.setData({ uploadingAvatar: false });
              });
          }
        });
      }
    });
  },

  /**
   * 保存用户信息
   */
  saveUserInfo: function() {
    // 检查是否有修改
    if (JSON.stringify(this.data.userInfo) === JSON.stringify(this.data.originalUserInfo)) {
      wx.showToast({
        title: '未做任何修改',
        icon: 'none'
      });
      return;
    }
    
    // 如果正在上传头像，提示等待
    if (this.data.uploadingAvatar) {
      wx.showToast({
        title: '头像正在上传中，请稍候',
        icon: 'none'
      });
      return;
    }
    
    // 表单验证
    if (!this.data.userInfo.nickname.trim()) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submitting: true });
    
    // 构造请求数据
    const updateData = {
      nickname: this.data.userInfo.nickname,
      gender: this.data.userInfo.gender,
      introduction: this.data.userInfo.introduction
    };
    
    // 如果头像已更新，则不需要在更新请求中包含头像
    // 因为头像已经在前面的上传过程中更新了
    
    // 提交更新请求
    userService.updateUserInfo(updateData)
      .then(res => {
        if (res && res.success) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });
          
          // 更新成功后返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          throw new Error(res.message || '更新失败');
        }
      })
      .catch(err => {
        console.error('更新用户信息失败:', err);
        wx.showToast({
          title: err.message || '保存失败，请重试',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({ submitting: false });
      });
  },

  /**
   * 取消修改
   */
  cancelEdit: function() {
    // 检查是否有修改
    if (JSON.stringify(this.data.userInfo) !== JSON.stringify(this.data.originalUserInfo)) {
      wx.showModal({
        title: '提示',
        content: '确定放弃已做的修改吗？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  }
}) 