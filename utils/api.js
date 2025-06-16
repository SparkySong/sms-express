/**
 * API接口统一管理文件
 */

// 引入请求模块
const request = require('./request');

// 基础URL配置 - 可以在一处修改所有接口地址
const BASE_URL = {
  dev: 'http://127.0.0.1:3000/api/v1' // 开发环境
};

// 当前环境配置 - 修改此处可以切换环境
const ENV = 'dev';
const API_BASE_URL = BASE_URL[ENV];

/**
 * API命名空间：按功能模块划分所有接口
 */
const API = {
  /**
   * 文章相关接口
   */
  article: {
    // 获取文章列表
    getList: (params) => {
      return request.get('/articles', params);
    },
    
    // 获取文章详情
    getDetail: (id) => {
      return request.get(`/articles/${id}`);
    },
    
    // 发布文章
    publish: (data) => {
      return request.post('/articles', data);
    },
    
    // 编辑文章
    update: (id, data) => {
      return request.put(`/articles/${id}`, data);
    },
    
    // 删除文章
    delete: (id) => {
      return request.delete(`/articles/${id}`);
    },
    
    // 获取头条文章
    getHeadlines: (limit = 5) => {
      return request.get('/articles/headlines', { limit });
    },
    
    // 获取热门文章
    getHot: (params) => {
      return request.get('/articles/hot', params);
    },
    
    // 获取推荐文章
    getRecommend: (params) => {
      return request.get('/articles/recommend', params);
    },
    
    // 获取相关文章
    getRelated: (articleId, params) => {
      return request.get(`/articles/${articleId}/related`, params);
    },
    
    // 获取随机文章
    getRandom: (params) => {
      return request.get('/articles/random', params);
    },
    
    // 文章点赞
    like: (id) => {
      return request.post(`/articles/${id}/like`);
    },
    
    // 取消点赞
    unlike: (id) => {
      return request.delete(`/articles/${id}/like`);
    },
    
    // 检查是否点赞
    checkLike: (id) => {
      return request.get(`/articles/${id}/like/check`);
    },
    
    // 获取分类文章计数
    getCategoriesCount: () => {
      return request.get('/articles/categories/count');
    }
  },
  
  /**
   * 分类相关接口
   */
  category: {
    // 获取所有分类
    getAll: () => {
      return request.get('/categories');
    },
    
    // 获取热门分类
    getHot: () => {
      return request.get('/categories/hot');
    },
    
    // 获取分类详情
    getDetail: (id) => {
      return request.get(`/categories/${id}`);
    },
    
    // 获取分类下的文章
    getArticles: (categoryId, params) => {
      return request.get(`/categories/${categoryId}/articles`, params);
    }
  },
  
  /**
   * 用户相关接口
   */
  user: {
    // 用户登录
    login: (data) => {
      return request.post('/users/login', data);
    },
    
    // 用户注册
    register: (data) => {
      return request.post('/users/register', data);
    },
    
    // 获取用户信息
    getInfo: () => {
      return request.get('/users/info');
    },
    
    // 更新用户信息
    updateInfo: (data) => {
      return request.put('/users/info', data);
    },
    
    // 更新头像
    updateAvatar: (filePath) => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: `${API_BASE_URL}/users/avatar`,
          filePath: filePath,
          name: 'file',
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              resolve(data);
            } catch (e) {
              reject(new Error('解析响应数据失败'));
            }
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    }
  },
  
  /**
   * 评论相关接口
   */
  comment: {
    // 获取文章评论
    getList: (articleId, params) => {
      return request.get(`/articles/${articleId}/comments`, params);
    },
    
    // 发表评论
    post: (articleId, data) => {
      return request.post(`/articles/${articleId}/comments`, data);
    },
    
    // 删除评论
    delete: (commentId) => {
      return request.delete(`/comments/${commentId}`);
    },
    
    // 点赞评论
    like: (commentId) => {
      return request.post(`/comments/${commentId}/like`);
    }
  },
  
  /**
   * 收藏相关接口
   */
  favorite: {
    // 获取收藏列表
    getList: (params) => {
      return request.get('/favorites', params);
    },
    
    // 添加收藏
    add: (articleId) => {
      return request.post(`/favorites/${articleId}`);
    },
    
    // 取消收藏
    cancel: (articleId) => {
      return request.delete(`/favorites/${articleId}`);
    },
    
    // 检查是否收藏
    check: (articleId) => {
      return request.get(`/favorites/check/${articleId}`);
    }
  },
  
  /**
   * 历史记录相关接口
   */
  history: {
    // 获取浏览历史
    getList: (params) => {
      return request.get('/histories', params);
    },
    
    // 清空浏览历史
    clear: () => {
      return request.delete('/histories');
    }
  },
  
  /**
   * 通知相关接口
   */
  notification: {
    // 获取通知列表
    getList: (params) => {
      return request.get('/notifications', params);
    },
    
    // 将通知标记为已读
    markAsRead: (id) => {
      return request.put(`/notifications/${id}/read`);
    },
    
    // 清空所有通知
    clear: () => {
      return request.delete('/notifications');
    },
    
    // 获取未读通知数量
    getUnreadCount: () => {
      return request.get('/notifications/unread/count');
    }
  },
  
  /**
   * 文件上传接口
   */
  upload: {
    // 上传图片
    image: (filePath) => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url: `${API_BASE_URL}/upload/image`,
          filePath: filePath,
          name: 'file', // 重要：文件字段名为file
          header: {
            'Authorization': `Bearer ${wx.getStorageSync('token')}`
          },
          success: (res) => {
            try {
              const data = JSON.parse(res.data);
              if (data.success) {
                resolve(data);
              } else {
                reject(new Error(data.message || '上传图片失败'));
              }
            } catch (e) {
              reject(new Error('解析响应数据失败'));
            }
          },
          fail: (err) => {
            reject(new Error('网络错误，上传失败'));
          }
        });
      });
    }
  },
  
  /**
   * 系统配置接口
   */
  system: {
    // 获取系统配置
    getConfig: () => {
      return request.get('/system/config');
    }
  }
};

// 导出API接口
module.exports = {
  baseUrl: API_BASE_URL,
  ...API
}; 