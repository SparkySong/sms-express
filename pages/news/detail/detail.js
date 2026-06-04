// pages/news/detail/detail.js
const historyService = require('../../../utils/historyService');
const { get, post, del } = require('../../../utils/request');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    news: {
      id: 0,
      title: '',
      source: '',
      sourceAvatar: '',
      publishTime: '',
      category: '',
      categoryId: 0,
      coverImage: '',
      content: '',
      sourceLink: '',
      likes: 0,
      comments: 0,
      tags: []
    },
    relatedNews: [],
    isLiked: false,
    isFavorite: false,
    newsId: 0,
    loading: true,
    showShare: false,
    showCommentsPopup: false,
    comments: [],
    commentContent: '',
    replyTo: '',
    replyCommentId: null,
    baseUrl: 'http://127.0.0.1:3000/api/v1',
    canEdit: false, // 是否有编辑/删除权限
    isDeleted: false // 文章是否已被删除，避免卸载时保存已删文章的历史记录
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.id) {
      this.setData({
        newsId: options.id
      });
      this.loadNewsDetail(options.id);
    }
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
    // 获取用户交互状态
    this.checkUserInteraction();
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
    // 保存阅读记录
    this.saveReadHistory();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    // 重新加载内容
    this.loadNewsDetail(this.data.newsId);
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // 加载更多相关推荐
    this.loadMoreRelated();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    const news = this.data.news;
    return {
      title: news.title,
      path: `/pages/news/detail/detail?id=${news.id}`,
      imageUrl: news.coverImage
    };
  },

  /**
   * 检查当前用户是否有编辑/删除权限（文章作者或管理员）
   */
  checkEditPermission: function (articleUserId) {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) return false;
    if (userInfo.role === 'admin') return true;
    return articleUserId && String(articleUserId) === String(userInfo.id);
  },

  /**
   * 编辑文章 - 跳转到独立的编辑页面
   */
  editArticle: function () {
    const news = this.data.news;
    wx.navigateTo({
      url: `/pages/edit-article/edit-article?article_id=${news.id}`
    });
  },

  /**
   * 删除文章
   */
  deleteArticle: function () {
    const that = this;
    const newsId = that.data.newsId;

    wx.showModal({
      title: '确认删除',
      content: '删除后文章将不可恢复，确定要删除吗？',
      confirmColor: '#ee0a24',
      success(res) {
        if (res.confirm) {
          that.doDeleteArticle(newsId);
        }
      }
    });
  },

  /**
   * 执行删除文章请求
   */
  doDeleteArticle: function (newsId) {
    const that = this;
    const token = wx.getStorageSync('token');

    wx.showLoading({ title: '删除中' });

    wx.request({
      url: `${that.data.baseUrl}/articles/${newsId}`,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success(res) {
        wx.hideLoading();
        if (res.data.success) {
          that.setData({ isDeleted: true }); // 标记已删除
          // 通知上一页需要刷新
          const pages = getCurrentPages();
          if (pages.length > 1) {
            pages[pages.length - 2].setData({ needRefresh: true });
          }
          wx.showToast({ title: '删除成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack({ delta: 1 });
          }, 1500);
        } else {
          wx.showToast({
            title: res.data.message || '删除失败',
            icon: 'none'
          });
        }
      },
      fail(err) {
        wx.hideLoading();
        console.error('删除文章失败:', err);
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  /**
   * 加载新闻详情
   */
  loadNewsDetail: function (newsId) {
    this.setData({
      loading: true
    });

    wx.showLoading({
      title: '加载中',
    });

    // 获取token（可能为空）
    const token = wx.getStorageSync('token');
      
    // 构建请求头
    const header = {};
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    const that = this;
    
    // 调用后端API获取文章详情
    wx.request({
      url: `${that.data.baseUrl}/articles/${newsId}`,
      method: 'GET',
      header: header,
      success: function(res) {
        wx.hideLoading();
        
        if (res.data.success) {
          const articleData = res.data.data;
          
          // 提取文章标签
          let tags = [];
          if (articleData.content) {
            // 从内容中提取常见关键词作为标签
            // 这里简化处理，实际项目中可能需要更复杂的算法或后端提供
            const content = articleData.content;
            const keywords = content.match(/[a-zA-Z\u4e00-\u9fa5]{2,8}/g) || [];
            const keywordCount = {};
            
            keywords.forEach(word => {
              if (word.length >= 2 && word.length <= 8) {
                keywordCount[word] = (keywordCount[word] || 0) + 1;
              }
            });
            
            // 按出现频率排序
            const sortedKeywords = Object.keys(keywordCount).sort((a, b) => keywordCount[b] - keywordCount[a]);
            tags = sortedKeywords.slice(0, 3); // 取前3个作为标签
          }
          
          // 格式化文章数据
          const news = {
            id: articleData.id,
            title: articleData.title,
            source: articleData.source || '简讯速递',
            sourceAvatar: 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png',
            publishTime: that.formatDate(articleData.publish_time),
            category: articleData.category_name || '',
            categoryId: articleData.category_id || 0,
            userId: articleData.user_id || null,
            coverImage: articleData.cover_url || 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png',
            content: articleData.content || '',
            sourceLink: '',
            likes: articleData.like_count || 0,
            comments: articleData.comment_count || 0,
            tags: tags
          };
          
          // 获取用户是否已收藏该文章
          const isFavorite = articleData.is_favorite || false;
          
          // 检查当前用户是否有编辑/删除权限（传articleUserId，因为此时data.news还没setData）
          const canEdit = that.checkEditPermission(articleData.user_id);
          
          that.setData({
            news: news,
            isFavorite: isFavorite,
            canEdit: canEdit,
            loading: false
          });
          
          // 加载相关推荐
          that.loadRelatedNews(articleData.category_id);
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '获取文章失败',
            icon: 'none'
          });
        }
      },
      fail: function(err) {
        wx.hideLoading();
        console.error('加载文章详情失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 加载相关推荐新闻
   */
  loadRelatedNews: function(categoryId) {
    const that = this;
    const newsId = that.data.newsId;
    
    wx.request({
      url: `${that.data.baseUrl}/articles/random`,
      method: 'GET',
      data: {
        exclude_id: newsId,
        limit: 5
      },
      success: function(res) {
        if (res.data.success) {
          const articles = res.data.data;
          
          // 格式化相关文章
          const relatedNews = articles.map(item => {
            return {
              id: item.id,
              title: item.title,
              source: item.source || '简讯速递',
              publishTime: that.formatDate(item.publish_time),
              image: item.cover_url || 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png'
            };
          });
          
          that.setData({
            relatedNews: relatedNews
          });
        }
      },
      fail: function(err) {
        console.error('加载相关文章失败:', err);
      }
    });
  },
  
  /**
   * 格式化日期
   */
  formatDate: function(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // 如果是今天，只显示时间
    if (now.toDateString() === date.toDateString()) {
      return `今天 ${hours}:${minutes}`;
      }

    // 如果是昨天
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (yesterday.toDateString() === date.toDateString()) {
      return `昨天 ${hours}:${minutes}`;
    }
    
    // 如果是今年，不显示年份
    if (now.getFullYear() === year) {
      return `${month}月${day}日 ${hours}:${minutes}`;
    }
    
    // 非今年，显示完整日期
    return `${year}/${month}/${day} ${hours}:${minutes}`;
  },

  /**
   * 检查点赞和收藏状态
   */
  checkUserInteraction: function () {
    const that = this;
    const newsId = that.data.newsId;
    
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      // 用户未登录，两个状态都设置为false
      that.setData({
        isLiked: false,
        isFavorite: false
      });
      return;
    }
    
    // 检查用户是否收藏该文章
    wx.request({
      url: `${that.data.baseUrl}/favorites/check/${newsId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success(res) {
        if (res.data.success) {
          const isFavorite = res.data.data.is_favorite;
          that.setData({
            isFavorite: isFavorite
          });
        }
      },
      fail(err) {
        console.error('检查收藏状态失败:', err);
        that.setData({
          isFavorite: false
        });
      }
    });
    
    // 检查用户是否点赞该文章
    wx.request({
      url: `${that.data.baseUrl}/articles/${newsId}/like/check`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${token}`
      },
      success(res) {
        if (res.data.success) {
          const isLiked = res.data.data.is_liked;
          that.setData({
            isLiked: isLiked
          });
        }
      },
      fail(err) {
        console.error('检查点赞状态失败:', err);
        that.setData({
          isLiked: false
        });
      }
    });
  },

  /**
   * 保存阅读历史
   */
  saveReadHistory: function() {
    const newsId = this.data.newsId;
    // 文章已删除则跳过保存
    if (!newsId || this.data.isDeleted) return;
    
    // 尝试调用API保存历史记录
    const token = wx.getStorageSync('token');
    if (token) {
      // 用户已登录，调用API保存
      historyService.addHistory(newsId)
        .then(result => {
          console.log('阅读历史保存成功', result);
        })
        .catch(err => {
          console.error('保存阅读历史到服务器失败:', err);
        });
    }
  },
  
  /**
   * 点赞功能
   */
  toggleLike: function () {
    const that = this;
    const newsId = that.data.newsId;
    const isLiked = that.data.isLiked; // 获取当前点赞状态
    
    // 检查登录状态
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
    
    // 根据当前状态决定是点赞还是取消点赞
    const method = isLiked ? 'DELETE' : 'POST';
    const url = `${that.data.baseUrl}/articles/${newsId}/like`;
    
    wx.request({
      url: url,
      method: method,
      header: {
        'Authorization': `Bearer ${token}`
      },
      success(res) {
        if (res.data.success) {
          // 切换点赞状态
          const newLikeState = !isLiked;
          const likes = res.data.data.likes;
          
          that.setData({
            isLiked: newLikeState,
            'news.likes': likes
          });
          
          wx.showToast({
            title: newLikeState ? '点赞成功' : '取消点赞',
            icon: 'success'
          });
        } else {
          wx.showToast({
            title: isLiked ? '取消点赞失败' : '点赞失败',
            icon: 'none'
          });
        }
      },
      fail(err) {
        console.error('点赞操作失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 收藏功能
   */
  toggleFavorite: function () {
    const that = this;
    const newsId = that.data.newsId;
    const isFavorite = that.data.isFavorite;
    
    // 检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再收藏',
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
    
    // 根据当前收藏状态决定是添加还是删除收藏
    if (!isFavorite) {
      // 添加收藏
      wx.request({
        url: `${that.data.baseUrl}/favorites`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          article_id: newsId
        },
        success(res) {
          if (res.data.success) {
            that.setData({
              isFavorite: true
            });
            
            wx.showToast({
              title: '收藏成功',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: res.data.message || '收藏失败',
              icon: 'none'
            });
          }
        },
        fail(err) {
          console.error('收藏失败:', err);
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          });
        }
      });
    } else {
      // 取消收藏
      wx.request({
        url: `${that.data.baseUrl}/favorites/${newsId}`,
        method: 'DELETE',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success(res) {
          if (res.data.success) {
            that.setData({
              isFavorite: false
            });
            
            wx.showToast({
              title: '已取消收藏',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '取消收藏失败',
              icon: 'none'
            });
          }
        },
        fail(err) {
          console.error('取消收藏失败:', err);
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          });
        }
      });
    }
  },

  /**
   * 打开原文链接
   */
  openSourceLink: function () {
    const url = this.data.news.sourceLink;
    if (!url) return;
    
    wx.showModal({
      title: '打开外部链接',
      content: '即将打开外部网页，是否继续？',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: url,
            success: () => {
              wx.showToast({
                title: '链接已复制',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  /**
   * 点击标签
   */
  onTagTap: function (e) {
    const tag = e.currentTarget.dataset.tag;
    wx.showToast({
      title: '标签: ' + tag,
      icon: 'none'
    });
  },

  /**
   * 查看评论
   */
  showComments: function () {
    // 加载评论数据
    this.loadComments();
    
    this.setData({
      showCommentsPopup: true,
      commentContent: '',
      replyTo: '',
      replyCommentId: null
    });
  },

  /**
   * 查看相关推荐
   */
  viewRelatedNews: function (e) {
    const newsId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/news/detail/detail?id=${newsId}`
    });
  },
  
  /**
   * 刷新当前页面
   */
  refreshPage: function () {
    this.loadNewsDetail(this.data.newsId);
  },

  // 显示分享选项面板
  showShareOptions() {
    this.setData({ showShare: true });
  },

  // 关闭分享面板
  onShareClose() {
    this.setData({ showShare: false });
  },

  // 分享到微信
  shareToWechat() {
    // 微信分享通过开放能力处理，触发隐藏的分享按钮
    const button = wx.createSelectorQuery().select('.share-button-hidden');
    button.fields({
      size: true,
      dataset: true,
      properties: ['scrollX', 'scrollY'],
      computedStyle: ['margin', 'backgroundColor'],
      context: true,
    }, function (res) {
      res.node.dispatchEvent('tap');
    }).exec();
    
    // 关闭分享面板
    this.onShareClose();
  },
  
  // 分享到朋友圈
  shareToMoments() {
    wx.showToast({
      title: '分享到朋友圈',
      icon: 'success'
    });
    this.onShareClose();
  },
  
  // 复制链接
  copyLink() {
    wx.setClipboardData({
      data: `简讯速递: ${this.data.news.title}`,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      }
    });
    this.onShareClose();
  },
  
  // 收藏
  shareToFavorite() {
    this.toggleFavorite();
    this.onShareClose();
  },

  // 关闭评论面板
  onCommentsClose() {
    this.setData({
      showCommentsPopup: false,
      commentContent: '',
      replyTo: '',
      replyCommentId: null
    });
  },

  /**
   * 加载评论列表
   */
  loadComments: function () {
    const that = this;
    const newsId = that.data.newsId;
    
    wx.showLoading({
      title: '加载评论中',
    });
    
    // 调用后端API获取评论列表
    get(`/articles/${newsId}/comments`)
      .then(res => {
        wx.hideLoading();
        
        if (res.success) {
          const commentData = res.data || [];
          
          // 更新本地评论数据和文章评论数
          that.setData({
            comments: commentData,
            'news.comments': commentData.length
          });
        } else {
          wx.showToast({
            title: '获取评论失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('加载评论失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 评论输入改变
   */
  onCommentInput: function (e) {
    this.setData({
      commentContent: e.detail.value
    });
  },

  /**
   * 提交评论
   */
  submitComment: function () {
    const that = this;
    const content = that.data.commentContent.trim();
    const newsId = that.data.newsId;
    const replyCommentId = that.data.replyCommentId;
    
    if (!content) {
      wx.showToast({
        title: '评论内容不能为空',
        icon: 'none'
      });
      return;
    }
    
    // 检查用户是否已登录
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!token || !userInfo) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再评论',
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
    
    wx.showLoading({
      title: '提交中',
    });
    
    // 构建请求数据
    const commentData = {
      article_id: newsId,
      content: content
    };
    
    // 如果是回复评论
    if (replyCommentId) {
      commentData.parent_id = replyCommentId;
    }
    
    // 调用后端API提交评论
    post('/comments', commentData)
      .then(res => {
        wx.hideLoading();
        
        if (res.success) {
          wx.showToast({
            title: '评论成功',
            icon: 'success'
          });
          
          // 清空评论内容
          that.setData({
            commentContent: '',
            replyTo: '',
            replyCommentId: null
          });
          
          // 重新加载评论
          that.loadComments();
        } else {
          wx.showToast({
            title: res.message || '评论失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('提交评论失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 回复评论
   */
  replyComment: function (e) {
    const commentId = e.currentTarget.dataset.id;
    const username = e.currentTarget.dataset.name;
    
    this.setData({
      replyTo: username,
      replyCommentId: commentId
    });
  },

  /**
   * 点赞评论
   */
  likeComment: function (e) {
    const that = this;
    const commentId = e.currentTarget.dataset.id;
    
    // 检查用户是否已登录
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
    
    // 调用后端API点赞评论
    post(`/comments/${commentId}/like`)
      .then(res => {
        if (res.success) {
          // 更新本地点赞状态
          const comments = that.data.comments;
          for (let i = 0; i < comments.length; i++) {
            if (comments[i].id === commentId) {
              const isLiked = !comments[i].is_liked;
              comments[i].is_liked = res.data.is_liked;
              comments[i].like_count = res.data.like_count;
              
              that.setData({
                comments: comments
              });
              break;
            }
          }
        } else {
          wx.showToast({
            title: res.message || '点赞失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('评论点赞失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 点赞回复
   */
  likeReply: function (e) {
    const that = this;
    const replyId = e.currentTarget.dataset.id;
    const commentId = e.currentTarget.dataset.commentId;
    
    // 检查用户是否已登录
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
    
    // 调用后端API点赞回复
    post(`/comments/${replyId}/like`)
      .then(res => {
        if (res.success) {
          // 更新本地点赞状态
          const comments = that.data.comments;
          for (let i = 0; i < comments.length; i++) {
            if (comments[i].id === commentId) {
              const replies = comments[i].replies;
              for (let j = 0; j < replies.length; j++) {
                if (replies[j].id === replyId) {
                  replies[j].is_liked = res.data.is_liked;
                  replies[j].like_count = res.data.like_count;
                  
                  that.setData({
                    [`comments[${i}].replies`]: replies
                  });
                  break;
                }
              }
              break;
            }
          }
        } else {
          wx.showToast({
            title: res.message || '点赞失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('回复点赞失败:', err);
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 格式化评论时间
   */
  formatCommentTime: function (dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    
    if (diffMinutes < 1) {
      return '刚刚';
    }
    
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
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
  },

  /**
   * 加载更多相关推荐新闻
   */
  loadMoreRelated: function() {
    const that = this;
    const newsId = that.data.newsId;
    
    // 如果当前已有相关推荐，排除这些ID
    const existingIds = that.data.relatedNews.map(item => item.id).join(',');
    const excludeIds = existingIds ? `${newsId},${existingIds}` : newsId;
    
    wx.request({
      url: `${that.data.baseUrl}/articles/random`,
      method: 'GET',
      data: {
        exclude_ids: excludeIds,
        limit: 5
      },
      success: function(res) {
        if (res.data.success) {
          const articles = res.data.data;
          
          // 格式化相关文章
          const moreRelatedNews = articles.map(item => {
            return {
              id: item.id,
              title: item.title,
              source: item.source || '简讯速递',
              publishTime: that.formatDate(item.publish_time),
              image: item.cover_url || 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png'
            };
          });
          
          // 合并现有和新加载的推荐文章
          that.setData({
            relatedNews: [...that.data.relatedNews, ...moreRelatedNews]
          });
        }
      },
      fail: function(err) {
        console.error('加载更多相关文章失败:', err);
        wx.showToast({
          title: '加载更多失败',
          icon: 'none'
        });
      }
    });
  },
})