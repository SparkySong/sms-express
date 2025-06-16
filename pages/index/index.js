// 引入API
const api = require('../../utils/api');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        currentCategory: '推荐',
        categoryId: 0, // 当前选中的分类ID
        categories: [], // 存储所有分类
        categoryMap: {}, // 分类名称到ID的映射
        headlineNews: [],
        newsList: [],
        page: 1,
        limit: 10,
        hasMoreData: true
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        // 加载热门分类
        this.loadCategories();
        // 加载头条新闻
        this.loadHeadlines();
        // 加载推荐新闻
        this.loadNewsData(true);
    },

    /**
     * 加载分类数据
     */
    loadCategories: function () {
        const that = this;

        api.category.getHot().then(res => {
            if (res.success) {
                // 获取数据库分类
                let categories = res.data;
                const categoryMap = {};

                // 过滤掉数据库中可能存在的"推荐"和"热点"分类
                categories = categories.filter(item => item.name !== '推荐' && item.name !== '热点');

                // 在数组开头添加固定的"推荐"和"热点"分类
                categories = [{
                        id: 0,
                        name: '推荐'
                    }, // 推荐使用ID 0
                    {   
                        id: -1,
                        name: '热点'
                    }, // 热点使用ID -1，表示是特殊分类
                    ...categories
                ];

                // 构建分类名称到ID的映射
                categories.forEach(item => {
                    categoryMap[item.name] = item.id;
                });

                that.setData({
                    categories: categories,
                    categoryMap: categoryMap
                });
            } else {
                wx.showToast({
                    title: '获取分类失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            console.error('加载分类失败:', err);
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            });
        });
    },

    /**
     * 加载头条新闻
     */
    loadHeadlines: function () {
        const that = this;

        api.article.getHeadlines(5).then(res => {
            if (res.success) {
                // 格式化头条数据
                const headlines = res.data.map(item => {
                    return {
                        id: item.id,
                        title: item.title,
                        desc: item.abstract || '',
                        imageUrl: item.cover_url || 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png'
                    };
                });

                that.setData({
                    headlineNews: headlines
                });
            } else {
                wx.showToast({
                    title: '获取头条失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            console.error('加载头条失败:', err);
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            });
        });
    },

    /**
     * 加载新闻列表数据
     * @param {boolean} refresh 是否刷新数据
     */
    loadNewsData: function (refresh = false) {
        const that = this;
        const {
            page,
            limit,
            categoryMap,
            currentCategory
        } = that.data;

        // 如果是刷新，重置页码
        if (refresh) {
            that.setData({
                page: 1,
                hasMoreData: true
            });
        }

        // 如果没有更多数据，不再请求
        if (!that.data.hasMoreData && !refresh) {
            return;
        }

        wx.showLoading({
            title: '加载中',
        });

        // 构建请求参数
        let requestData = {
            page: refresh ? 1 : that.data.page,
            limit: limit
        };

        // 根据当前分类进行不同处理
        if (currentCategory === '推荐') {
            // 推荐分类不需要特殊处理，使用默认接口
            requestData.sort = 'publish_time';
            requestData.order = 'desc';
        } else if (currentCategory === '热点') {
            // 热点分类，按照阅读量排序
            requestData.sort = 'view_count';
            requestData.order = 'desc';
        } else {
            // 其他分类，按照分类ID筛选
            const categoryId = categoryMap[currentCategory];
            if (categoryId > 0) {
                requestData.category_id = categoryId;
            }
            requestData.sort = 'publish_time';
            requestData.order = 'desc';
        }

        api.article.getList(requestData).then(res => {
            wx.hideLoading();

            if (res.success) {
                const articleData = res.data;

                // 格式化文章数据
                const newsList = articleData.data.map(item => {
                    return {
                        id: item.id,
                        title: item.title,
                        source: item.source || '简讯速递',
                        time: that.formatTime(item.publish_time),
                        reads: that.formatNumber(item.view_count),
                        likes: that.formatNumber(item.like_count),
                        imageUrl: item.cover_url || 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png'
                    };
                });

                if (refresh) {
                    // 刷新数据
                    that.setData({
                        newsList: newsList,
                        page: 2
                    });
                } else {
                    // 追加数据
                    that.setData({
                        newsList: [...that.data.newsList, ...newsList],
                        page: that.data.page + 1
                    });
                }

                // 判断是否还有更多数据
                that.setData({
                    hasMoreData: articleData.page < articleData.totalPages
                });

                if (newsList.length === 0) {
                    wx.showToast({
                        title: '暂无相关文章',
                        icon: 'none'
                    });
                }
            } else {
                wx.showToast({
                    title: '获取新闻失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            wx.hideLoading();
            console.error('加载新闻失败:', err);
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            });
        });
    },

    /**
     * 格式化时间为相对时间
     */
    formatTime: function (dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (60 * 1000));

        if (diffMinutes < 60) {
            return `${diffMinutes}分钟前`;
        }

        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) {
            return `${diffHours}小时前`;
        }

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 30) {
            return `${diffDays}天前`;
        }

        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
    },

    /**
     * 格式化数字（超过10000显示为x.x万）
     */
    formatNumber: function (num) {
        if (!num) return '0';

        num = parseInt(num);
        if (num < 10000) {
            return num.toString();
        }

        return (num / 10000).toFixed(1) + '万';
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        // 检查是否已经加载过数据
        if (this.data.newsList.length === 0) {
            // 如果没有数据，重新加载
            this.loadNewsData(true);
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {
        // 刷新数据
        this.loadHeadlines();
        this.loadNewsData(true);

        setTimeout(() => {
            wx.showToast({
                title: '刷新成功',
                icon: 'success'
            });
            wx.stopPullDownRefresh();
        }, 1000);
    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {
        if (this.data.hasMoreData) {
            this.loadNewsData();
        } else {
            wx.showToast({
                title: '没有更多数据了',
                icon: 'none'
            });
        }
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
        return {
            title: '简讯速递 - 您身边的新闻资讯平台',
            path: '/pages/index/index'
        };
    },

    // Tab切换
    onTabChange: function (event) {
        const category = event.detail.name;

        // 如果当前已经是该分类，则不重复加载
        if (this.data.currentCategory === category) {
            return;
        }

        this.setData({
            currentCategory: category
        });

        // 加载对应分类的新闻，强制刷新数据
        this.loadNewsData(true);

        wx.showToast({
            title: '已切换到' + category,
            icon: 'none',
            duration: 1000
        });
    },

    // 原分类切换方法，保留兼容性
    switchCategory: function (e) {
        const category = e.currentTarget.dataset.category;

        // 如果当前已经是该分类，则不重复加载
        if (this.data.currentCategory === category) {
            return;
        }

        this.setData({
            currentCategory: category
        });

        // 加载对应分类的新闻，强制刷新数据
        this.loadNewsData(true);

        wx.showToast({
            title: '已切换到' + category,
            icon: 'none',
            duration: 1000
        });
    },

    // 查看新闻详情
    viewNews: function (e) {
        const newsId = e.currentTarget.dataset.id;
        // 跳转到新闻详情页
        wx.navigateTo({
            url: `/pages/news/detail/detail?id=${newsId}`
        });
    },

    // 点赞功能
    likeNews: function (e) {
        const that = this;
        const newsId = e.currentTarget.dataset.id;

        // 判断是否已登录
        const token = wx.getStorageSync('token');
        if (!token) {
            wx.showModal({
                title: '提示',
                content: '请先登录后再点赞',
                success(res) {
                    if (res.confirm) {
                        wx.navigateTo({
                            url: '/pages/login/login'
                        });
                    }
                }
            });
            return;
        }

        // 调用点赞API
        api.article.like(newsId).then(res => {
            if (res.success) {
                wx.showToast({
                    title: '点赞成功',
                    icon: 'success'
                });

                // 更新点赞数
                const newsList = that.data.newsList;
                for (let i = 0; i < newsList.length; i++) {
                    if (newsList[i].id === newsId) {
                        newsList[i].likes = that.formatNumber(res.data.likes);
                        that.setData({
                            newsList: newsList
                        });
                        break;
                    }
                }
            } else {
                wx.showToast({
                    title: '点赞失败',
                    icon: 'none'
                });
            }
        }).catch(err => {
            console.error('点赞失败:', err);
            wx.showToast({
                title: '网络错误，请重试',
                icon: 'none'
            });
        });
    },

    // 分享功能
    shareNews: function (e) {
        const newsId = e.currentTarget.dataset.id;
        // 处理分享逻辑
        wx.showModal({
            title: '分享',
            content: '是否分享此新闻？',
            success(res) {
                if (res.confirm) {
                    wx.showToast({
                        title: '分享成功',
                        icon: 'success'
                    });
                }
            }
        });
        return {
            title: '为您推荐一篇精彩文章',
            path: `/pages/news/detail/detail?id=${newsId}`,
            imageUrl: '', // 可以设置分享图片
        };
    },
})