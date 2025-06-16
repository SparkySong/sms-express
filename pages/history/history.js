import Dialog from '@vant/weapp/dialog/dialog';
const historyService = require('../../utils/historyService');
const util = require('../../utils/util');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    historyList: [], // 阅读历史列表
    groupedHistoryList: [], // 按日期分组后的列表
    editMode: false, // 是否处于编辑模式
    selectedItems: [], // 选中的项目ID
    isAllSelected: false, // 是否全选
    loading: false, // 是否正在加载
    pageIndex: 1, // 当前页码
    pageSize: 20, // 每页数量
    hasMore: true, // 是否还有更多
    isUserLoggedIn: false // 用户是否已登录
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    this.setData({
      isUserLoggedIn: !!token
    });
    
    if (this.data.isUserLoggedIn) {
      this.loadHistoryData();
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 检查登录状态
    const token = wx.getStorageSync('token');
    const loginStatus = !!token;
    
    // 如果登录状态发生变化，重新加载数据
    if (loginStatus !== this.data.isUserLoggedIn) {
      this.setData({
        isUserLoggedIn: loginStatus
      });
      
      if (loginStatus) {
        this.loadHistoryData();
      } else {
        this.setData({
          historyList: [],
          groupedHistoryList: []
        });
      }
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.refreshHistoryData();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreHistoryData();
    }
  },
  
  /**
   * 加载阅读历史数据
   */
  loadHistoryData() {
    // 如果未登录，不加载数据
    if (!this.data.isUserLoggedIn) {
      wx.stopPullDownRefresh();
      return;
    }
    
    // 显示加载状态
    wx.showLoading({
      title: '加载中',
    });
    
    this.setData({
      loading: true
    });
    
    // 从API获取阅读历史
    historyService.getUserHistory(this.data.pageIndex, this.data.pageSize)
      .then(result => {
        if (result && result.success) {
          // 获取历史记录
          const historyItems = result.data.items || [];
          
          // 处理数据，为每条记录添加阅读时间
          const processedData = historyItems.map(item => {
            const timestamp = new Date(item.read_time).getTime();
            return {
              id: item.history_id,
              articleId: item.article_id,
              title: item.article.title,
              source: item.article.source || '未知来源',
              timestamp: timestamp,
              readTime: this.formatReadTime(timestamp),
              category: item.article.category?.name,
              imageUrl: item.article.cover_url
            };
          });
          
          this.setData({
            historyList: processedData,
            loading: false,
            pageIndex: 1,
            hasMore: historyItems.length === this.data.pageSize
          });
          
          // 按日期对数据进行分组
          this.groupHistoryByDate();
        } else {
          this.setData({
            loading: false,
            historyList: [],
            groupedHistoryList: []
          });
          
          wx.showToast({
            title: result?.message || '获取历史记录失败',
            icon: 'none'
          });
        }
        
        wx.hideLoading();
        wx.stopPullDownRefresh();
      })
      .catch(err => {
        console.error('获取历史记录失败:', err);
        this.setData({
          loading: false,
          historyList: [],
          groupedHistoryList: []
        });
        
        wx.hideLoading();
        wx.stopPullDownRefresh();
        wx.showToast({
          title: '获取历史记录失败',
          icon: 'none'
        });
      });
  },
  
  /**
   * 刷新历史数据
   */
  refreshHistoryData() {
    this.setData({
      pageIndex: 1,
      hasMore: true,
      selectedItems: [],
      editMode: false
    });
    
    this.loadHistoryData();
  },
  
  /**
   * 加载更多历史数据
   */
  loadMoreHistoryData() {
    if (!this.data.hasMore || this.data.loading || !this.data.isUserLoggedIn) return;
    
    this.setData({
      loading: true,
      pageIndex: this.data.pageIndex + 1
    });
    
    // 从API加载更多历史数据
    historyService.getUserHistory(this.data.pageIndex, this.data.pageSize)
      .then(result => {
        if (result && result.success) {
          // 获取更多历史记录
          const historyItems = result.data.items || [];
          
          if (historyItems.length === 0) {
            this.setData({
              hasMore: false,
              loading: false
            });
            return;
          }
          
          // 处理数据
          const processedData = historyItems.map(item => {
            const timestamp = new Date(item.read_time).getTime();
            return {
              id: item.history_id,
              articleId: item.article_id,
              title: item.article.title,
              source: item.article.source || '未知来源',
              timestamp: timestamp,
              readTime: this.formatReadTime(timestamp),
              category: item.article.category?.name,
              imageUrl: item.article.cover_url
            };
          });
          
          // 合并数据
          const newHistoryList = [...this.data.historyList, ...processedData];
          
          this.setData({
            historyList: newHistoryList,
            loading: false,
            hasMore: historyItems.length === this.data.pageSize
          });
          
          // 重新分组
          this.groupHistoryByDate();
        } else {
          this.setData({
            loading: false,
            hasMore: false
          });
        }
      })
      .catch(err => {
        console.error('加载更多历史记录失败:', err);
        this.setData({
          loading: false,
          hasMore: false
        });
      });
  },
  
  /**
   * 按日期对历史数据进行分组
   */
  groupHistoryByDate() {
    const { historyList } = this.data;
    
    if (!historyList || historyList.length === 0) {
      this.setData({
        groupedHistoryList: []
      });
      return;
    }
    
    const groupMap = {};
    
    historyList.forEach(item => {
      const timestamp = item.timestamp;
      // 获取日期组标识
      const dateKey = this.getDateGroup(timestamp);
      
      if (!groupMap[dateKey]) {
        groupMap[dateKey] = {
          date: dateKey,
          items: []
        };
      }
      
      groupMap[dateKey].items.push(item);
    });
    
    // 转成数组并按日期倒序排列
    const groupedList = Object.values(groupMap).sort((a, b) => {
      // 获取日期的第一个时间戳进行比较
      if (a.items[0].timestamp > b.items[0].timestamp) {
        return -1;
      }
      return 1;
    });
    
    this.setData({
      groupedHistoryList: groupedList
    });
  },
  
  /**
   * 获取日期分组的名称
   */
  getDateGroup(timestamp) {
    if (!timestamp) return '未知日期';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // 今天
    if (date >= today) {
      return '今天';
    }
    
    // 昨天
    if (date >= yesterday) {
      return '昨天';
    }
    
    // 本周 (最近7天)
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    if (date >= lastWeek) {
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return dayNames[date.getDay()];
    }
    
    // 更早的日期
    return `${month}月${day}日`;
  },
  
  /**
   * 格式化阅读时间
   */
  formatReadTime(timestamp) {
    if (!timestamp) return '';
    
    const now = new Date();
    const readTime = new Date(timestamp);
    
    const diff = Math.floor((now - readTime) / 1000); // 差异秒数
    
    if (diff < 60) {
      return '刚刚';
    }
    
    if (diff < 3600) {
      return `${Math.floor(diff / 60)}分钟前`;
    }
    
    if (diff < 86400) {
      return `${Math.floor(diff / 3600)}小时前`;
    }
    
    if (diff < 604800) {
      return `${Math.floor(diff / 86400)}天前`;
    }
    
    // 超过7天显示具体日期
    const year = readTime.getFullYear();
    const month = readTime.getMonth() + 1;
    const day = readTime.getDate();
    
    return `${month}月${day}日`;
  },
  
  /**
   * 查看新闻详情
   */
  viewNews(e) {
    const newsId = e.currentTarget.dataset.id;
    
    wx.navigateTo({
      url: `/pages/news/detail/detail?id=${newsId}`
    });
  },
  
  /**
   * 切换编辑模式
   */
  toggleEditMode() {
    this.setData({
      editMode: !this.data.editMode,
      selectedItems: []
    });
  },
  
  /**
   * 切换选中状态
   */
  toggleSelect(e) {
    const id = e.currentTarget.dataset.id;
    const { selectedItems } = this.data;
    
    if (selectedItems.includes(id)) {
      // 取消选中
      this.setData({
        selectedItems: selectedItems.filter(item => item !== id),
        isAllSelected: false
      });
    } else {
      // 选中
      this.setData({
        selectedItems: [...selectedItems, id]
      });
      
      // 检查是否已全选
      this.checkIsAllSelected();
    }
  },
  
  /**
   * 检查是否全选
   */
  checkIsAllSelected() {
    const { selectedItems, historyList } = this.data;
    
    if (historyList.length > 0 && selectedItems.length === historyList.length) {
      this.setData({
        isAllSelected: true
      });
    } else {
      this.setData({
        isAllSelected: false
      });
    }
  },
  
  /**
   * 全选/取消全选
   */
  selectAll() {
    const { isAllSelected, historyList } = this.data;
    
    if (isAllSelected) {
      // 取消全选
      this.setData({
        selectedItems: [],
        isAllSelected: false
      });
    } else {
      // 全选
      const allIds = historyList.map(item => item.id);
      this.setData({
        selectedItems: allIds,
        isAllSelected: true
      });
    }
  },
  
  /**
   * 删除选中项
   */
  deleteSelected() {
    const { selectedItems } = this.data;
    
    if (selectedItems.length === 0) {
      wx.showToast({
        title: '请选择要删除的项目',
        icon: 'none'
      });
      return;
    }
    
    Dialog.confirm({
      title: '确认删除',
      message: `确定要删除选中的 ${selectedItems.length} 条历史记录吗？`,
    }).then(() => {
      // 确认删除
      this.doDeleteItems(selectedItems);
    }).catch(() => {
      // 取消操作
    });
  },
  
  /**
   * 删除单个历史记录
   */
  deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    
    Dialog.confirm({
      title: '确认删除',
      message: '确定要删除这条历史记录吗？',
    }).then(() => {
      // 确认删除
      this.doDeleteItems([id]);
    }).catch(() => {
      // 取消操作
    });
  },
  
  /**
   * 处理删除历史记录
   */
  doDeleteItems(idsToDelete) {
    if (!this.data.isUserLoggedIn) return;
    
    wx.showLoading({
      title: '删除中...',
    });
    
    // 使用API删除历史记录
    if (idsToDelete.length === 1) {
      // 删除单条记录
      historyService.removeHistory(idsToDelete[0])
        .then(result => {
          if (result && result.success) {
            this.handleDeleteSuccess(idsToDelete);
          } else {
            this.handleDeleteError(result?.message);
          }
        })
        .catch(err => {
          console.error('删除历史记录失败:', err);
          this.handleDeleteError('删除失败，请重试');
        });
    } else {
      // 批量删除记录
      historyService.removeMultiHistory(idsToDelete)
        .then(result => {
          if (result && result.success) {
            this.handleDeleteSuccess(idsToDelete);
          } else {
            this.handleDeleteError(result?.message);
          }
        })
        .catch(err => {
          console.error('批量删除历史记录失败:', err);
          this.handleDeleteError('删除失败，请重试');
        });
    }
  },
  
  /**
   * 删除成功后处理
   */
  handleDeleteSuccess(idsToDelete) {
    // 过滤掉需要删除的记录
    const newHistoryList = this.data.historyList.filter(item => !idsToDelete.includes(item.id));
    
    // 更新页面数据
    this.setData({
      historyList: newHistoryList,
      selectedItems: this.data.selectedItems.filter(id => !idsToDelete.includes(id))
    });
    
    // 重新分组
    this.groupHistoryByDate();
    
    wx.hideLoading();
    wx.showToast({
      title: '删除成功',
      icon: 'success'
    });
    
    // 如果删除后列表为空，退出编辑模式
    if (newHistoryList.length === 0) {
      this.setData({
        editMode: false
      });
    }
  },
  
  /**
   * 删除失败处理
   */
  handleDeleteError(errorMsg) {
    wx.hideLoading();
    wx.showToast({
      title: errorMsg || '删除失败，请重试',
      icon: 'none'
    });
  },
  
  /**
   * 滑动单元格点击事件
   */
  onSwipeCellClick(e) {
    const { position, instance } = e.detail;
    
    if (position === 'right') {
      // 点击了删除按钮
      const id = e.currentTarget.dataset.id;
      this.deleteItem({ currentTarget: { dataset: { id } } });
      
      // 关闭滑动状态
      instance.close();
    }
  },
  
  /**
   * 前往登录页面
   */
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  /**
   * 前往首页
   */
  goToIndex() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
}) 