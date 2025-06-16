// 引入分类服务
const categoryService = require('../../utils/categoryService');
const articleService = require('../../utils/articleService');

// 最近浏览分类的存储键
const RECENT_CATEGORIES_KEY = 'recent_categories';
// 最大保存的最近浏览分类数量
const MAX_RECENT_CATEGORIES = 10;

Page({
  data: {
    searchValue: '',
    categories: [],      // 所有分类
    hotCategories: [],   // 热门分类
    recentCategories: [], // 最近浏览分类
    isLoading: true,     // 加载状态
    refreshing: false    // 刷新状态
  },
  
  onLoad: function (options) {
    this.initTabBar();
    this.loadCategories();
    this.loadRecentCategories();
  },
  
  onShow: function() {
    // 每次页面显示时更新最近浏览
    this.loadRecentCategories();
  },
  
  onPullDownRefresh: function() {
    this.setData({ refreshing: true });
    this.loadCategories();
  },
  
  // 加载分类数据
  loadCategories: function() {
    this.setData({ isLoading: true });
    
    // 同时请求所有分类、热门分类和每个分类的文章数量
    Promise.all([
      categoryService.getAllCategories(),
      categoryService.getHotCategories(),
      articleService.getCategoriesCount()
    ])
    .then(([allResult, hotResult, countResult]) => {
      let categories = [];
      let hotCategories = [];
      let articleCounts = {};
      
      if (countResult && countResult.success) {
        articleCounts = countResult.data || {};
      }
      
      if (allResult && allResult.success) {
        // 添加文章数量到分类对象
        categories = allResult.data.map(cat => {
          return {
            ...cat,
            articleCount: articleCounts[cat.id] || 0
          };
        });
        
        this.setData({ categories });
      }
      
      if (hotResult && hotResult.success) {
        // 添加文章数量到热门分类对象
        hotCategories = hotResult.data.map(cat => {
          return {
            ...cat,
            articleCount: articleCounts[cat.id] || 0
          };
        });
        
        this.setData({ hotCategories });
      }
    })
    .catch(err => {
      console.error('获取分类失败:', err);
      wx.showToast({
        title: '获取分类失败，请重试',
        icon: 'none'
      });
    })
    .finally(() => {
      this.setData({ 
        isLoading: false,
        refreshing: false 
      });
      wx.stopPullDownRefresh();
    });
  },
  
  // 加载最近浏览的分类
  loadRecentCategories: function() {
    try {
      // 从本地存储获取最近浏览的分类
      const recentCategoriesStr = wx.getStorageSync(RECENT_CATEGORIES_KEY);
      if (recentCategoriesStr) {
        const recentCategories = JSON.parse(recentCategoriesStr);
        this.setData({ recentCategories });
      }
    } catch (e) {
      console.error('读取最近浏览分类失败:', e);
    }
  },
  
  // 清空最近浏览记录
  clearRecentCategories: function() {
    wx.showModal({
      title: '提示',
      content: '确定要清空最近浏览记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync(RECENT_CATEGORIES_KEY);
          this.setData({ recentCategories: [] });
          
          wx.showToast({
            title: '已清空',
            icon: 'success'
          });
        }
      }
    });
  },
  
  // 保存最近浏览的分类
  saveRecentCategory: function(category) {
    try {
      // 获取已有记录
      let recentCategories = [];
      const recentCategoriesStr = wx.getStorageSync(RECENT_CATEGORIES_KEY);
      
      if (recentCategoriesStr) {
        recentCategories = JSON.parse(recentCategoriesStr);
      }
      
      // 移除已存在的相同ID分类
      recentCategories = recentCategories.filter(item => item.id !== category.id);
      
      // 添加到前面
      recentCategories.unshift(category);
      
      // 限制保存数量
      if (recentCategories.length > MAX_RECENT_CATEGORIES) {
        recentCategories = recentCategories.slice(0, MAX_RECENT_CATEGORIES);
      }
      
      // 保存到本地
      wx.setStorageSync(RECENT_CATEGORIES_KEY, JSON.stringify(recentCategories));
      
      // 更新界面
      this.setData({ recentCategories });
    } catch (e) {
      console.error('保存最近浏览分类失败:', e);
    }
  },
  
  initTabBar: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1 // 设置选中分类标签页
      });
    }
  },
  
  // 搜索框输入变化
  onSearchChange: function(e) {
    this.setData({
      searchValue: e.detail
    });
  },
  
  // 搜索提交
  onSearch: function(e) {
    const keyword = e.detail || this.data.searchValue;
    if (keyword.trim() === '') {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    
    // 跳转到搜索结果页面
    wx.navigateTo({
      url: `/pages/search/result?keyword=${encodeURIComponent(keyword)}`
    });
  },
  
  // 点击常规分类
  onCategoryTap: function(e) {
    const categoryId = e.currentTarget.dataset.id;
    const category = this.data.categories.find(item => item.id === categoryId) || 
                     this.data.recentCategories.find(item => item.id === categoryId);
    
    if (!category) return;
    
    // 保存到最近浏览
    this.saveRecentCategory(category);
    
    // 跳转到对应分类新闻列表
    this.navigateToNewsList(categoryId, category.name);
  },
  
  // 点击热门分类
  onHotCategoryTap: function(e) {
    const categoryId = e.currentTarget.dataset.id;
    const category = this.data.hotCategories.find(item => item.id === categoryId);
    
    if (!category) return;
    
    // 保存到最近浏览
    this.saveRecentCategory(category);
    
    // 跳转到对应分类新闻列表
    this.navigateToNewsList(categoryId, category.name);
  },
  
  // 统一的新闻列表页面跳转方法
  navigateToNewsList: function(categoryId, categoryName) {
    // 跳转到分类新闻列表页
    wx.navigateTo({
      url: `/pages/category/list/list?id=${categoryId}&name=${categoryName}`
    });
  },
  
  // 分享功能
  onShareAppMessage: function() {
    return {
      title: '简讯速递 - 精选资讯分类',
      path: '/pages/category/category',
      imageUrl: '/static/images/share-category.png'
    };
  },
  
  // 点击分享到朋友圈
  onShareTimeline: function() {
    return {
      title: '简讯速递 - 浏览精选资讯分类',
      query: '',
      imageUrl: '/static/images/share-category.png'
    };
  }
}) 