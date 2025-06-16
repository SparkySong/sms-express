// pages/search/result.js
const { get } = require('../../utils/request');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    keyword: '',         // 搜索关键词
    searchValue: '',     // 搜索框输入值
    isLoading: true,     // 是否正在加载
    loadAll: false,      // 是否已加载全部
    page: 1,             // 当前页码
    results: [],         // 搜索结果列表
    showActionSheet: false, // 是否显示筛选面板
    sortOptions: [
      { text: '最新发布', value: 'publish_time' },
      { text: '最多浏览', value: 'view_count' },
      { text: '最多评论', value: 'comment_count' }
    ],
    currentSort: 'publish_time'  // 当前排序方式
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { keyword } = options;
    
    if (keyword) {
      const decodedKeyword = decodeURIComponent(keyword);
      this.setData({
        keyword: decodedKeyword,
        searchValue: decodedKeyword
      });
      
      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: `搜索: ${decodedKeyword}`
      });
      
      // 加载搜索结果
      this.search(true);
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.search(true);
    
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (!this.data.loadAll && !this.data.isLoading) {
      this.loadMore();
    }
  },
  
  /**
   * 搜索结果
   * @param {boolean} isRefresh 是否刷新
   */
  search(isRefresh = false) {
    if (isRefresh) {
      this.setData({
        page: 1,
        loadAll: false
      });
    }
    
    if (!this.data.keyword.trim()) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      isLoading: true
    });
    
    // 构建查询参数
    const params = {
      keyword: this.data.keyword,
      page: this.data.page,
      limit: 10,
      sort: this.data.currentSort,
      order: 'desc'
    };
    
    // 调用文章API进行搜索
    get('/articles', params)
      .then(res => {
        if (!res.success) {
          throw new Error(res.message || '搜索失败');
        }
        
        const newResults = this.formatArticleResults(res.data.data || []);
        
        this.setData({
          results: isRefresh ? newResults : [...this.data.results, ...newResults],
          isLoading: false,
          loadAll: newResults.length === 0 || newResults.length < 10 || this.data.page >= res.data.totalPages
        });
      })
      .catch(err => {
        console.error('搜索失败:', err);
        this.setData({
          isLoading: false
        });
        
        wx.showToast({
          title: '搜索失败，请稍后重试',
          icon: 'none'
        });
      });
  },
  
  /**
   * 格式化文章结果数据
   * @param {Array} articles - 文章数据
   * @returns {Array} - 格式化后的结果数据
   */
  formatArticleResults(articles) {
    return articles.map(article => {
      return {
        id: article.id,
        title: article.title,
        abstract: article.abstract,
        source: article.source || '未知来源',
        publishTime: this.formatDate(article.publish_time),
        views: article.view_count,
        category: article.category_name,
        coverUrl: article.cover_url || 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png'
      };
    });
  },
  
  /**
   * 格式化日期
   * @param {string} dateString - 日期字符串
   * @returns {string} - 格式化的日期字符串 (MM-DD)
   */
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
  },
  
  /**
   * 加载更多搜索结果
   */
  loadMore() {
    if (this.data.loadAll || this.data.isLoading) return;
    
    this.setData({
      page: this.data.page + 1
    });
    
    this.search(false);
  },
  
  /**
   * 搜索框输入变化
   */
  onSearchChange(e) {
    this.setData({
      searchValue: e.detail
    });
  },
  
  /**
   * 搜索提交
   */
  onSearch() {
    const keyword = this.data.searchValue.trim();
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      keyword: keyword
    });
    
    // 更新导航栏标题
    wx.setNavigationBarTitle({
      title: `搜索: ${keyword}`
    });
    
    // 执行搜索
    this.search(true);
  },
  
  /**
   * 点击结果项
   */
  onResultTap(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.navigateTo({
      url: `/pages/news/detail/detail?id=${id}`
    });
  },
  
  /**
   * 显示排序选项
   */
  showSortOptions() {
    this.setData({
      showActionSheet: true
    });
  },
  
  /**
   * 关闭排序选项
   */
  onClose() {
    this.setData({
      showActionSheet: false
    });
  },
  
  /**
   * 选择排序方式
   */
  onSelect(e) {
    const { value } = e.detail;
    
    if (value !== this.data.currentSort) {
      this.setData({
        currentSort: value,
        showActionSheet: false
      });
      
      // 重新搜索
      this.search(true);
    } else {
      this.setData({
        showActionSheet: false
      });
    }
  }
}) 