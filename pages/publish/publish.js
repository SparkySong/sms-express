// pages/publish/publish.js
// 引入API
const api = require('../../utils/api');

Page({

  /**
   * 页面的初始数据
   */
  data: {
        // 表单数据
        title: '',
        content: '',
        abstract: '',
        source: '',
        coverUrl: '',
        coverFile: null,
        categories: [],
        categoryIndex: 0,

        // 状态
        isSubmitting: false,
        isLoggedIn: false,
        isDraft: false,
        draftId: '',
        isEditing: false,   // 是否为编辑模式
        articleId: null      // 编辑的文章ID
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
        // 检查用户是否登录
        this.checkLoginStatus();

        // 加载分类数据
        this.loadCategories();

        // 如果有草稿ID参数，加载草稿
        if (options.draft_id) {
            this.loadDraft(options.draft_id);
        }

        // 如果有article_id参数，进入编辑模式
        if (options.article_id) {
            this.loadArticleForEdit(options.article_id);
        }
    },

    /**
     * 检查用户是否已登录
     */
    checkLoginStatus() {
        const token = wx.getStorageSync('token');
        const userInfo = wx.getStorageSync('userInfo');

        if (token && userInfo && userInfo.isLogin) {
            this.setData({
                isLoggedIn: true
            });
        } else {
            this.setData({
                isLoggedIn: false
            });
            // 提示用户需要登录
            wx.showModal({
                title: '需要登录',
                content: '发布文章需要先登录账号',
                confirmText: '去登录',
                success: (res) => {
                    if (res.confirm) {
                        wx.navigateTo({
                            url: '/pages/login/login?redirect=/pages/publish/publish'
                        });
                    } else {
                        wx.switchTab({
                            url: '/pages/index/index'
                        });
                    }
                }
            });
        }
    },

    /**
     * 加载分类数据
     */
    loadCategories() {
        wx.showLoading({
            title: '加载中'
        });

        api.category.getAll().then(res => {
            wx.hideLoading();
            if (res.success) {
                const categories = [{ id: '', name: '请选择分类' }, ...res.data];
                const setData = { categories: categories };

                // 如果在编辑模式且有待匹配的分类ID
                if (this._pendingCategoryId) {
                    const categoryId = this._pendingCategoryId;
                    const index = categories.findIndex(c => c.id === categoryId);
                    if (index > 0) {
                        setData.categoryIndex = index;
                    }
                    this._pendingCategoryId = null;
                }

                this.setData(setData);
            } else {
                wx.showToast({
                    title: '获取分类失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            wx.hideLoading();
            console.error('加载分类失败:', err);
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            });
        });
    },

    /**
     * 加载草稿数据
     */
    loadDraft(draftId) {
        // TODO: 实现草稿加载逻辑
        this.setData({
            isDraft: true,
            draftId: draftId
        });
    },

    /**
     * 加载文章数据用于编辑
     */
    loadArticleForEdit(articleId) {
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
                        isEditing: true,
                        articleId: articleId,
                        title: article.title || '',
                        content: article.content || '',
                        abstract: article.abstract || '',
                        source: article.source || '',
                        coverUrl: article.cover_url || '',
                        coverFile: null,
                        categoryId: article.category_id || 0
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

                    wx.setNavigationBarTitle({ title: '编辑文章' });
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
                wx.showToast({ title: '网络错误，请重试', icon: 'none' });
            }
        });
    },

    /**
     * 标题输入事件
     */
    onTitleInput(e) {
        this.setData({
            title: e.detail.value
        });
  },

  /**
     * 内容输入事件
     */
    onContentInput(e) {
        this.setData({
            content: e.detail.value
        });
    },

    /**
     * 摘要输入事件
     */
    onAbstractInput(e) {
        this.setData({
            abstract: e.detail.value
        });
  },

  /**
     * 来源输入事件
     */
    onSourceInput(e) {
        this.setData({
            source: e.detail.value
        });
    },

    /**
     * 分类选择事件
     */
    onCategoryChange(e) {
        this.setData({
            categoryIndex: e.detail.value
        });
  },

  /**
     * 选择图片
     */
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

    /**
     * 移除已选择的封面
     */
    removeCover() {
        this.setData({
            coverUrl: '',
            coverFile: null
        });
  },

  /**
     * 上传封面图片
     * @returns {Promise} 上传结果Promise
     */
    uploadCoverImage() {
        if (!this.data.coverFile) {
            return Promise.resolve('');
        }

        return api.upload.image(this.data.coverFile)
            .then(res => {
                if (res.success) {
                    return res.data.url;
                } else {
                    throw new Error(res.message || '上传图片失败');
                }
            });
  },

  /**
     * 验证表单
     */
    validateForm() {
        if (!this.data.title.trim()) {
            wx.showToast({
                title: '请输入新闻标题',
                icon: 'none'
            });
            return false;
        }

        if (this.data.categoryIndex === 0 && this.data.categories.length > 0) {
            wx.showToast({
                title: '请选择新闻分类',
                icon: 'none'
            });
            return false;
        }

        if (!this.data.content.trim()) {
            wx.showToast({
                title: '请输入新闻内容',
                icon: 'none'
            });
            return false;
        }

        return true;
  },

  /**
     * 重置表单
     */
    resetForm() {
        this.setData({
            title: '',
            content: '',
            abstract: '',
            source: '',
            coverUrl: '',
            coverFile: null,
            categoryIndex: 0,
            isDraft: false,
            draftId: ''
        });
    },

    /**
     * 保存为草稿
     */
    saveAsDraft() {
        // TODO: 实现草稿保存逻辑
        wx.showToast({
            title: '保存草稿成功',
            icon: 'success'
        });
  },

  /**
     * 发布文章
     */
    publishArticle() {
        if (!this.data.isLoggedIn) {
            this.checkLoginStatus();
            return;
        }

        if (!this.validateForm()) {
            return;
        }

        this.setData({
            isSubmitting: true
        });
        wx.showLoading({
            title: '发布中'
        });

        // 先上传图片，再提交文章
        this.uploadCoverImage()
            .then(coverUrl => {
                // 构建文章数据
                const articleData = {
                    title: this.data.title,
                    category_id: this.data.categories[this.data.categoryIndex].id,
                    content: this.data.content,
                    abstract: this.data.abstract || this.data.content.substring(0, 100),
                    source: this.data.source || '简讯速递',
                    cover_url: coverUrl
                };

                wx.showLoading({
                    title: '提交中...'
                });

                // 根据是否为编辑模式选择不同的请求
                const isEditing = this.data.isEditing;
                const articleId = this.data.articleId;
                const url = isEditing ? `${api.baseUrl}/articles/${articleId}` : `${api.baseUrl}/articles`;
                const method = isEditing ? 'PUT' : 'POST';

                wx.request({
                    url: url,
                    method: method,
                    header: {
                        'content-type': 'application/json',
                        'Authorization': `Bearer ${wx.getStorageSync('token')}`
                    },
                    data: articleData,
                    success: (res) => {
                        wx.hideLoading();

                        if (res.statusCode === 200 || res.statusCode === 201) {
                            const responseData = res.data;

                            if (responseData.success || responseData.code === 201 || responseData.code === 200) {
                                const targetId = isEditing ? articleId : responseData.data?.id;

                                if (!targetId) {
                                    console.error('操作成功但无法获取ID:', responseData);
                                    wx.showToast({
                                        title: '操作成功但获取ID失败',
                                        icon: 'none'
                                    });
                                    return;
                                }

                                // 重置表单
                                this.resetForm();

                                wx.showToast({
                                    title: isEditing ? '更新成功' : '发布成功',
                                    icon: 'success',
                                    mask: true,
                                    duration: 1500
                                });
                                wx.redirectTo({
                                    url: `/pages/news/detail/detail?id=${targetId}`,
                                    fail: (err) => {
                                        console.error('跳转失败:', err);
                                        wx.switchTab({
                                            url: '/pages/index/index'
                                        });
                                    }
                                });

                            } else {
                                this.setData({
                                    isSubmitting: false
                                });
                                wx.showToast({
                                    title: responseData.message || (isEditing ? '更新失败' : '发布失败'),
                                    icon: 'none'
                                });
                            }
                        } else {
                            this.setData({
                                isSubmitting: false
                            });
                            wx.showToast({
                                title: (isEditing ? '更新失败' : '发布失败') + '，HTTP错误: ' + res.statusCode,
                                icon: 'none'
                            });
                        }
                    },
                    fail: (err) => {
                        wx.hideLoading();
                        this.setData({
                            isSubmitting: false
                        });
                        console.error('请求发送失败:', err);
                        wx.showToast({
                            title: '网络错误，请检查网络连接',
                            icon: 'none'
                        });
                    }
                });
            })
            .catch(err => {
                wx.hideLoading();
                this.setData({
                    isSubmitting: false
                });
                console.error('图片上传失败:', err);
                wx.showToast({
                    title: '图片上传失败: ' + (err.message || '未知错误'),
                    icon: 'none'
                });
            });
    }
})