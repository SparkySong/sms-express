// 引入收藏服务
const favoriteService = require('../../utils/favoriteService');
// 引入工具函数
const util = require('../../utils/util');
// 设置默认封面图片
const DEFAULT_COVER = 'https://img.yzcdn.cn/vant/cat.jpeg';

Page({
  data: {
    isEditMode: false,  // 是否处于编辑模式
    selectedItems: [],  // 选中的项目ID列表
    favorites: [],      // 收藏列表
    isLoading: true,    // 是否正在加载
    loadAll: false,     // 是否已加载全部
    page: 1,            // 当前页码
    limit: 10           // 每页条数
  },
  
  onLoad: function (options) {
    this.initTabBar();
    this.loadFavorites(true);
  },

  /**
   * 页面显示时执行
   */
  onShow: function() {
    this.initTabBar();
    if (this.data.favorites.length === 0) {
      this.loadFavorites(true);
    }
  },

  // 设置TabBar选中状态
  initTabBar: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2 // 假设收藏页是第3个标签
      });
    }
  },
  
  /**
   * 加载收藏列表
   * @param {boolean} isRefresh 是否刷新
   */
  loadFavorites: function(isRefresh = false) {
    // 检查是否已登录
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录后查看收藏',
        showCancel: true,
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
        }
      });
      this.setData({
        isLoading: false,
        favorites: []
      });
      return;
    }
    
    if (isRefresh) {
      this.setData({
        page: 1,
        loadAll: false
      });
    }
    
    this.setData({
      isLoading: true
    });
    
    favoriteService.getUserFavorites(this.data.page, this.data.limit)
      .then(result => {
        if (result && result.success) {
          // 获取收藏项目
          const favoriteItems = result.data.items || [];
          
          // 格式化收藏列表数据
          const formattedFavorites = favoriteItems.map(item => {
            const article = item.article;
            return {
              id: article.id,
              title: article.title || '未知标题',
              source: article.source || '未知来源',
              time: util.formatTime(new Date(article.publish_time)) || '未知时间',
              category: article.category?.name || '未分类',
              imageUrl: article.cover_url || DEFAULT_COVER
            };
          });
          
          this.setData({
            favorites: isRefresh ? formattedFavorites : [...this.data.favorites, ...formattedFavorites],
            loadAll: favoriteItems.length < this.data.limit || (result.data.total <= this.data.page * this.data.limit),
            isLoading: false
          });
        } else {
          this.setData({
            isLoading: false
          });
          
          wx.showToast({
            title: result?.message || '获取收藏失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('获取收藏列表失败:', err);
        this.setData({
          isLoading: false
        });
        
        wx.showToast({
          title: '获取收藏失败，请重试',
          icon: 'none'
        });
      });
  },
  
  // 切换编辑模式
  toggleEditMode: function() {
    this.setData({
      isEditMode: !this.data.isEditMode,
      selectedItems: []
    });
  },
  
  // 选择收藏项
  onCheckboxChange: function(event) {
    this.setData({
      selectedItems: event.detail
    });
  },

  // 删除选中的收藏
  deleteSelected: function() {
    if (this.data.selectedItems.length === 0) {
      wx.showToast({
        title: '请选择要删除的项目',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定要删除选中的 ${this.data.selectedItems.length} 条收藏吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            mask: true
          });
          
          // 逐个删除收藏
          const deletePromises = this.data.selectedItems.map(articleId => 
            favoriteService.removeFavorite(articleId)
          );
          
          Promise.all(deletePromises)
            .then(() => {
              // 过滤掉选中的项目
              const newFavorites = this.data.favorites.filter(item => 
                !this.data.selectedItems.includes(item.id.toString())
              );
              
              this.setData({
                favorites: newFavorites,
                selectedItems: []
              });
              
              // 如果删除后列表为空，退出编辑模式
              if (newFavorites.length === 0) {
                this.setData({ isEditMode: false });
              }
              
              wx.hideLoading();
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            })
            .catch(err => {
              console.error('批量删除收藏失败:', err);
              wx.hideLoading();
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  },
  
  // 查看新闻详情
  viewNews: function(e) {
    if (this.data.isEditMode) return;
    
    const newsId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/news/detail/detail?id=${newsId}`
    });
  },
  
  // 删除单个收藏
  removeFavorite: function(e) {
    const newsId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '取消收藏',
      content: '确定要移除此收藏吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中...',
            mask: true
          });
          
          favoriteService.removeFavorite(newsId)
            .then(() => {
              // 从收藏列表中移除
              const newFavorites = this.data.favorites.filter(item => item.id !== newsId);
              
              this.setData({
                favorites: newFavorites
              });
              
              wx.hideLoading();
              wx.showToast({
                title: '已移除收藏',
                icon: 'success'
              });
            })
            .catch(err => {
              console.error('删除收藏失败:', err);
              wx.hideLoading();
              wx.showToast({
                title: '删除失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  },
  
  // 加载更多
  loadMoreFavorites: function() {
    if (this.data.loadAll || this.data.isLoading) return;
    
    this.setData({
      page: this.data.page + 1
    });
    
    this.loadFavorites(false);
  },
  
  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadFavorites(true);
    wx.stopPullDownRefresh();
  },
  
  // 上拉触底
  onReachBottom: function() {
    this.loadMoreFavorites();
  },
  
  // 全选/取消全选
  selectAll: function() {
    if (this.data.selectedItems.length === this.data.favorites.length) {
      // 如果已全选，则取消全选
      this.setData({
        selectedItems: []
      });
    } else {
      // 如果未全选，则全选
      const allIds = this.data.favorites.map(item => item.id.toString());
      this.setData({
        selectedItems: allIds
      });
    }
  },
  
  // 前往首页
  goToIndex: function() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },
  
  // 清空所有收藏
  clearAllFavorites: function() {
    if (this.data.favorites.length === 0) {
      wx.showToast({
        title: '暂无收藏内容',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '清空收藏',
      content: '确定要清空所有收藏吗？此操作不可恢复！',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '清空中...',
            mask: true
          });
          
          favoriteService.clearAllFavorites()
            .then(() => {
              this.setData({
                favorites: [],
                selectedItems: [],
                isEditMode: false
              });
              
              wx.hideLoading();
              wx.showToast({
                title: '已清空所有收藏',
                icon: 'success'
              });
            })
            .catch(err => {
              console.error('清空收藏失败:', err);
              wx.hideLoading();
              wx.showToast({
                title: '操作失败，请重试',
                icon: 'none'
              });
            });
        }
      }
    });
  }
}) 