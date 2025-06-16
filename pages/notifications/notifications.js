import Dialog from '@vant/weapp/dialog/dialog';
import * as notificationService from '../../utils/notificationService';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    notificationsList: [], // 所有消息列表
    loading: false, // 是否正在加载
    showDetailDialog: false, // 是否显示消息详情弹窗
    currentNotification: {}, // 当前查看的消息
    hasError: false, // 是否有加载错误
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadNotifications();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.refreshNotifications();
  },

  /**
   * 加载消息通知数据
   */
  async loadNotifications() {
    wx.showLoading({
      title: '加载中',
    });
    
    this.setData({
      loading: true,
      hasError: false
    });
    
    try {
      const res = await notificationService.getUserNotifications();
      
      if (res && res.success) {
        this.setData({
          notificationsList: res.data.list || [],
          loading: false
        });
      } else {
        // 如果返回401表示登录过期，使用本地数据但不在控制台打印错误
        if (res && res.code === 401) {
          // 使用本地模拟数据
          const mockData = this.getMockNotifications();
          
          this.setData({
            notificationsList: mockData,
            loading: false,
            hasError: true
          });
          
          // 不显示额外的提示，因为request.js中已经显示了登录过期提示
        } else {
          throw new Error(res?.message || '获取通知失败');
        }
      }
    } catch (error) {
      console.error('获取通知列表失败:', error);
      
      // 加载失败时使用本地模拟数据
      const mockData = this.getMockNotifications();
      
      this.setData({
        notificationsList: mockData,
        loading: false,
        hasError: true
      });
      
      wx.showToast({
        title: '获取通知失败，已显示本地数据',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
      wx.stopPullDownRefresh();
    }
  },
  
  /**
   * 刷新通知数据
   */
  refreshNotifications() {
    this.loadNotifications();
  },
  
  /**
   * 获取模拟消息数据（作为备用数据）
   */
  getMockNotifications() {
    return [
      {
        id: 1,
        title: '欢迎使用简讯速递',
        content: '感谢您使用简讯速递App，希望您喜欢我们的服务！',
        time: '2023-12-20 10:30',
        isRead: false,
        icon: 'info-o',
        iconBg: '#1989fa'
      },
      {
        id: 2,
        title: '您的收藏文章已更新',
        content: '您收藏的文章《量子计算取得重大突破》有更新内容，点击查看详情。',
        time: '2023-12-19 15:45',
        isRead: true,
        icon: 'star-o',
        iconBg: '#ff976a'
      },
      {
        id: 3,
        title: '新年福利活动',
        content: '2024年新年活动即将开始，届时将有丰富奖励等您来领取！',
        time: '2023-12-18 09:15',
        isRead: false,
        icon: 'gift-o',
        iconBg: '#ee0a24'
      },
      {
        id: 4,
        title: '系统升级通知',
        content: '系统将于2023年12月25日凌晨2:00-4:00进行版本升级，届时部分功能将暂时无法使用，请提前做好准备。',
        time: '2023-12-17 18:30',
        isRead: true,
        icon: 'setting-o',
        iconBg: '#1989fa'
      },
      {
        id: 5,
        title: '阅读挑战赛开始啦',
        content: '12月阅读挑战赛已经开始，完成挑战即可获得积分奖励和实物好礼！',
        time: '2023-12-16 14:20',
        isRead: false,
        icon: 'fire-o',
        iconBg: '#ff976a'
      }
    ];
  },
  
  /**
   * 查看消息详情
   */
  async viewNotification(e) {
    const id = Number(e.currentTarget.dataset.id);
    const notification = this.data.notificationsList.find(item => item.id === id);
    
    if (notification) {
      this.setData({
        currentNotification: notification,
        showDetailDialog: true
      });
      
      // 标记为已读
      if (!notification.isRead) {
        try {
          await this.markNotificationAsRead(id);
        } catch (error) {
          console.error('标记通知已读失败:', error);
        }
      }
    }
  },
  
  /**
   * 标记消息为已读
   */
  async markNotificationAsRead(id) {
    if (!id) return;
    
    try {
      // 乐观更新UI
      const { notificationsList } = this.data;
      const updatedList = notificationsList.map(item => {
        if (item.id === id) {
          return { ...item, isRead: true };
        }
        return item;
      });
      
      this.setData({
        notificationsList: updatedList
      });
      
      // 发送API请求
      const res = await notificationService.markAsRead(id);
      
      if (!res || !res.success) {
        throw new Error(res?.message || '标记已读失败');
      }
    } catch (error) {
      console.error('标记通知已读失败:', error);
      wx.showToast({
        title: '标记已读失败',
        icon: 'none'
      });
    }
  },
  
  /**
   * 确认已读
   */
  markAsRead() {
    this.setData({
      showDetailDialog: false
    });
  },
  
  /**
   * 关闭消息详情弹窗
   */
  closeDetailDialog() {
    this.setData({
      showDetailDialog: false
    });
  },
  
  /**
   * 清空所有通知
   */
  clearAllNotifications() {
    if (this.data.notificationsList.length === 0) {
      wx.showToast({
        title: '没有消息可清空',
        icon: 'none'
      });
      return;
    }
    
    Dialog.confirm({
      title: '确认清空',
      message: '确定要清空所有消息吗？',
    }).then(async () => {
      try {
        const res = await notificationService.clearAllNotifications();
        
        if (res && res.success) {
          this.setData({
            notificationsList: []
          });
          
          wx.showToast({
            title: '已清空',
            icon: 'success'
          });
          
          // 更新最后检查时间
          notificationService.updateLastCheckTime();
        } else {
          throw new Error(res?.message || '清空通知失败');
        }
      } catch (error) {
        console.error('清空通知失败:', error);
        wx.showToast({
          title: '清空通知失败',
          icon: 'none'
        });
      }
    }).catch(() => {
      // 取消操作
    });
  }
}) 