// pages/category/list/list.js

// 引入分类服务
const categoryService = require('../../../utils/categoryService');

// 设置默认封面图片
const DEFAULT_COVER = 'https://img.yzcdn.cn/vant/cat.jpeg';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    categoryId: 0,         // 当前分类ID
    categoryName: '',      // 当前分类名称
    searchValue: '',       // 搜索框值
    isLoading: true,       // 是否正在加载
    loadAll: false,        // 是否已加载全部
    page: 1,               // 当前页码
    pageSize: 10,          // 每页条数
    articles: [],          // 文章列表
    sortBy: 'publish_time',// 排序字段
    order: 'desc',         // 排序方式：desc降序，asc升序
    keyword: ''            // 搜索关键词
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { id, name } = options;

    if (!id) {
      wx.showToast({
        title: '参数错误',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 设置导航栏标题
    if (name) {
      wx.setNavigationBarTitle({
        title: name
      });
    }

    this.setData({
      categoryId: parseInt(id),
      categoryName: name || '分类浏览'
    });

    // 加载文章列表
    this.loadArticles(true);
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
    this.refreshArticles();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    if (!this.data.loadAll && !this.data.isLoading) {
      this.loadMoreArticles();
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: `${this.data.categoryName} - 简讯速递`,
      path: `/pages/category/list/list?id=${this.data.categoryId}&name=${this.data.categoryName}`
    };
  },

  /**
   * 加载文章列表
   * @param {boolean} isRefresh 是否刷新
   */
  loadArticles(isRefresh = false) {
    if (isRefresh) {
      this.setData({
        page: 1,
        loadAll: false
      });
    }

    this.setData({
      isLoading: true
    });

    const { categoryId, page, pageSize, sortBy, order, keyword } = this.data;

    // 构建参数对象
    const params = {
      page,
      pageSize,
      sortBy,
      order
    };

    // 如果有搜索关键词，添加到请求参数
    if (keyword) {
      params.keyword = keyword;

    }


    // 调用API获取分类文章
    categoryService.getCategoryArticles(categoryId, params)
      .then(result => {
        if (result && result.success && result.data) {
          const newArticles = result.data.articles || [];
          const total = result.data.total || 0;

          // 处理文章数据，确保图片路径正确
          const processedArticles = newArticles.map(article => {
            // 修正图片URL字段名
            if (article.cover_url && !article.coverUrl) {
              article.coverUrl = article.cover_url;
            }

            // 处理发布时间
            if (article.publish_time && !article.publishTime) {
              article.publishTime = this.formatTime(article.publish_time);
            }

            // 确保摘要字段
            if (!article.abstract && article.content) {
              article.abstract = this.extractAbstract(article.content);
            }

            return article;
          });

          this.setData({
            articles: isRefresh ? processedArticles : [...this.data.articles, ...processedArticles],
            loadAll: newArticles.length < pageSize || (page * pageSize >= total)
          });
        } else {
          wx.showToast({
            title: result.message || '获取文章失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('获取分类文章失败:', err);
        wx.showToast({
          title: '获取文章列表失败，请重试',
          icon: 'none'
        });
      })
      .finally(() => {
        this.setData({
          isLoading: false
        });

        if (isRefresh && wx.stopPullDownRefresh) {
          wx.stopPullDownRefresh();
        }
      });
  },

  /**
   * 从内容中提取摘要
   */
  extractAbstract(content) {
    if (!content) return '';

    // 移除HTML标签
    const text = content.replace(/<[^>]+>/g, '');
    // 截取前100个字符作为摘要
    return text.substring(0, 100) + (text.length > 100 ? '...' : '');
  },

  /**
   * 格式化时间
   */
  formatTime(dateString) {
    if (!dateString) return '';

    // 检查是否已经是Date对象
    let date;
    if (dateString instanceof Date) {
      date = dateString;
    } else {
      // 处理日期字符串
      try {
        // 尝试使用iOS兼容的格式解析
        if (typeof dateString === 'string') {
          // 标准化日期字符串 - 处理可能的格式
          if (dateString.indexOf('T') > -1) {
            // 如果是ISO格式，直接使用
            date = new Date(dateString);
          } else if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/)) {
            // YYYY-MM-DD HH:MM[:SS] 格式
            const parts = dateString.split(' ');
            const datePart = parts[0];
            const timePart = parts[1];
            // 转换为ISO格式
            date = new Date(`${datePart}T${timePart}`);
          } else if (dateString.match(/^\d{2}-\d{2} \d{2}:\d{2}$/)) {
            // 旧格式的MM-DD HH:MM
            const parts = dateString.split(' ');
            const dateParts = parts[0].split('-');
            const timeParts = parts[1].split(':');
            
            if (dateParts.length === 2 && timeParts.length === 2) {
              const currentYear = new Date().getFullYear();
              const month = parseInt(dateParts[0]) - 1; // 月份从0开始
              const day = parseInt(dateParts[1]);
              const hours = parseInt(timeParts[0]);
              const minutes = parseInt(timeParts[1]);
              
              date = new Date(currentYear, month, day, hours, minutes);
            }
          } else {
            // 尝试直接解析
            date = new Date(dateString);
          }
        } else {
          // 其他类型，尝试直接转换
          date = new Date(dateString);
        }
      } catch (e) {
        console.error('日期解析失败:', e);
        return dateString; // 返回原始字符串
      }
    }

    // 确保日期有效
    if (!date || isNaN(date.getTime())) {
      console.warn('无效的日期:', dateString);
      return dateString; // 返回原始字符串
    }

    const now = new Date();

    // 今天的日期
    if (date.toDateString() === now.toDateString()) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `今天 ${hours}:${minutes}`;
    }

    // 昨天的日期
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `昨天 ${hours}:${minutes}`;
    }

    // 其他日期
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * 刷新文章列表
   */
  refreshArticles() {
    this.loadArticles(true);
  },

  /**
   * 加载更多文章
   */
  loadMoreArticles() {
    if (this.data.loadAll || this.data.isLoading) return;

    this.setData({
      page: this.data.page + 1
    });

    this.loadArticles(false);
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
      // 如果关键词为空但之前有搜索过，则清除搜索条件并重新加载
      if (this.data.keyword) {
        this.setData({
          keyword: '',
          page: 1
        });
        this.loadArticles(true);
      } else {
        wx.showToast({
          title: '请输入搜索内容',
          icon: 'none'
        });
      }
      return;
    }

    // 在当前分类中搜索
    this.setData({
      keyword: keyword,
      page: 1,
      loadAll: false
    });

    this.loadArticles(true);
  },

  /**
   * 文章点击事件
   */
  onArticleTap(e) {
    const id = e.currentTarget.dataset.id;

    wx.navigateTo({
      url: `/pages/news/detail/detail?id=${id}`
    });
  },

  /**
   * 图片加载错误处理
   */
  onImageError(e) {
    const index = e.currentTarget.dataset.index;
    const articles = this.data.articles;

    // 设置为默认图片
    articles[index].coverUrl = DEFAULT_COVER;

    this.setData({
      articles: articles
    });
  },

  /**
   * 更改排序
   */
  changeSort(e) {
    const { field, order } = e.currentTarget.dataset;

    if (field && order) {
      this.setData({
        sortBy: field,
        order: order,
        page: 1,
        loadAll: false
      });

      this.loadArticles(true);
    }
  }
})