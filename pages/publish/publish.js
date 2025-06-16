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
        draftId: ''
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
                this.setData({
                    categories: res.data
                });
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

        // 构建文章数据对象
        let articleData = null;

        // 先上传图片，再提交文章
        this.uploadCoverImage()
            .then(coverUrl => {
                // 构建文章数据
                articleData = {
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

                // 直接调用API并处理响应
                wx.request({
                    url: `${api.baseUrl}/articles`,
                    method: 'POST',
                    header: {
                        'content-type': 'application/json',
                        'Authorization': `Bearer ${wx.getStorageSync('token')}`
                    },
                    data: articleData,
                    success: (res) => {
                        wx.hideLoading();

                        // 检查后端返回的状态码
                        if (res.statusCode === 200 || res.statusCode === 201) {
                            const responseData = res.data;

                            if (responseData.success || responseData.code === 201 || responseData.code === 200) {
                                // 获取文章ID
                                const articleId = responseData.data?.id;

                                if (!articleId) {
                                    console.error('创建成功但无法获取ID:', responseData);
                                    wx.showToast({
                                        title: '文章创建成功但获取ID失败',
                                        icon: 'none'
                                    });
                                    return;
                                }


                                // 重置表单
                                this.resetForm();

                                // 显示成功提示
                                wx.showToast({
                                    title: '发布成功',
                                    icon: 'success',
                                    mask: true,
                                    duration: 1500
                                });
                                wx.redirectTo({
                                    url: `/pages/news/detail/detail?id=${articleId}`,
                                    fail: (err) => {
                                        console.error('跳转失败:', err);
                                        // 如果跳转失败，回到首页
                                        wx.switchTab({
                                            url: '/pages/index/index'
                                        });
                                    }
                                });

                            } else {
                                // 业务逻辑错误
                                this.setData({
                                    isSubmitting: false
                                });
                                wx.showToast({
                                    title: responseData.message || '发布失败',
                                    icon: 'none'
                                });
                            }
                        } else {
                            // HTTP错误
                            this.setData({
                                isSubmitting: false
                            });
                            wx.showToast({
                                title: '发布失败，HTTP错误: ' + res.statusCode,
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
                // 处理图片上传错误
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