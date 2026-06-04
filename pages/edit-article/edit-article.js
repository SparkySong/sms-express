// pages/edit-article/edit-article.js
const api = require('../../utils/api');

Page({

  data: {
    title: '',
    content: '',
    abstract: '',
    source: '',
    coverUrl: '',
    coverFile: null,
    categories: [],
    categoryIndex: 0,
    isSubmitting: false,
    articleId: null
  },

  onLoad(options) {
    if (!options.article_id) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.setData({ articleId: options.article_id });
    this.loadCategories();
    this.loadArticle(options.article_id);
  },

  loadCategories() {
    wx.showLoading({ title: '加载中' });

    api.category.getAll().then(res => {
      wx.hideLoading();
      if (res.success) {
        const categories = [{ id: '', name: '请选择分类' }, ...res.data];
        const setData = { categories: categories };

        if (this._pendingCategoryId) {
          const categoryId = this._pendingCategoryId;
          const index = categories.findIndex(c => c.id === categoryId);
          if (index > 0) {
            setData.categoryIndex = index;
          }
          this._pendingCategoryId = null;
        }

        this.setData(setData);
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('加载分类失败:', err);
    });
  },

  loadArticle(articleId) {
    const that = this;
    wx.showLoading({ title: '加载中' });

    wx.request({
      url: `${api.baseUrl}/articles/${articleId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${wx.getStorageSync('token')}`
      },
      success(res) {
        wx.hideLoading();
        if (res.data.success) {
          const article = res.data.data;
          that.setData({
            title: article.title || '',
            content: article.content || '',
            abstract: article.abstract || '',
            source: article.source || '',
            coverUrl: article.cover_url || '',
            coverFile: null
          });

          // 匹配分类：如果 categories 已加载则立即匹配，否则等 loadCategories 回调中匹配
          const categoryId = article.category_id;
          if (that.data.categories.length > 0) {
            const index = that.data.categories.findIndex(c => c.id === categoryId);
            if (index > 0) {
              that.setData({ categoryIndex: index });
            }
          } else {
            that._pendingCategoryId = categoryId;
          }
        } else {
          wx.showToast({
            title: res.data.message || '加载文章失败',
            icon: 'none'
          });
        }
      },
      fail(err) {
        wx.hideLoading();
        console.error('加载文章失败:', err);
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onAbstractInput(e) {
    this.setData({ abstract: e.detail.value });
  },

  onSourceInput(e) {
    this.setData({ source: e.detail.value });
  },

  onCategoryChange(e) {
    this.setData({ categoryIndex: e.detail.value });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          coverUrl: tempFilePath,
          coverFile: tempFilePath
        });
      }
    });
  },

  removeCover() {
    this.setData({ coverUrl: '', coverFile: null });
  },

  uploadCoverImage() {
    if (!this.data.coverFile) {
      return Promise.resolve('');
    }
    return api.upload.image(this.data.coverFile)
      .then(res => {
        if (res.success) return res.data.url;
        else throw new Error(res.message || '上传图片失败');
      });
  },

  publishArticle() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (this.data.categoryIndex === 0 && this.data.categories.length > 0) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '更新中' });

    this.uploadCoverImage()
      .then(coverUrl => {
        const articleData = {
          title: this.data.title,
          category_id: this.data.categories[this.data.categoryIndex].id,
          content: this.data.content,
          abstract: this.data.abstract || this.data.content.substring(0, 100),
          source: this.data.source || '简讯速递',
          cover_url: coverUrl
        };

        wx.showLoading({ title: '提交中...' });

        wx.request({
          url: `${api.baseUrl}/articles/${this.data.articleId}`,
          method: 'PUT',
          header: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          data: articleData,
          success: (res) => {
            wx.hideLoading();

            if (res.statusCode === 200 && res.data.success) {
              wx.showToast({
                title: '更新成功',
                icon: 'success',
                mask: true,
                duration: 1500
              });
              setTimeout(() => {
                wx.navigateBack({ delta: 1 });
              }, 1500);
            } else {
              this.setData({ isSubmitting: false });
              wx.showToast({
                title: res.data.message || '更新失败',
                icon: 'none'
              });
            }
          },
          fail: (err) => {
            wx.hideLoading();
            this.setData({ isSubmitting: false });
            console.error('更新失败:', err);
            wx.showToast({ title: '网络错误，请重试', icon: 'none' });
          }
        });
      })
      .catch(err => {
        wx.hideLoading();
        this.setData({ isSubmitting: false });
        console.error('图片上传失败:', err);
        wx.showToast({
          title: '图片上传失败: ' + (err.message || '未知错误'),
          icon: 'none'
        });
      });
  }
});
