const ArticleModel = require('../models/articleModel');
const FavoriteModel = require('../models/favoriteModel');
const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 文章控制器
 */
class ArticleController {
  /**
   * 获取文章列表
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getArticles(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category_id, 
        keyword,
        sort = 'publish_time',
        order = 'desc'
      } = req.query;

      // 转换查询参数
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        categoryId: category_id ? parseInt(category_id) : undefined,
        keyword,
        sort,
        order
      };

      const result = await ArticleModel.getArticles(options);

      return response.success(res, result);
    } catch (error) {
      logger.error(`获取文章列表失败: ${error.message}`);
      return response.error(res, 500, '获取文章列表失败');
    }
  }

  /**
   * 获取文章详情
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getArticleDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id || isNaN(parseInt(id))) {
        return response.validationError(res, null, '无效的文章ID');
      }

      // 获取文章详情
      const article = await ArticleModel.getArticleById(parseInt(id));
      if (!article) {
        return response.notFound(res, '文章不存在或已删除');
      }

      // 如果用户已登录，检查是否已收藏
      if (userId) {
        article.is_favorite = await FavoriteModel.checkFavorite(userId, parseInt(id));
      }

      return response.success(res, article);
    } catch (error) {
      logger.error(`获取文章详情失败: ${error.message}`);
      return response.error(res, 500, '获取文章详情失败');
    }
  }

  /**
   * 获取头条文章
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getHeadlines(req, res) {
    try {
      const { limit = 5 } = req.query;
      
      const headlines = await ArticleModel.getHeadlineArticles(parseInt(limit));
      
      return response.success(res, headlines);
    } catch (error) {
      logger.error(`获取头条文章失败: ${error.message}`);
      return response.error(res, 500, '获取头条文章失败');
    }
  }

  /**
   * 获取热门文章
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getHotArticles(req, res) {
    try {
      const { category_id, limit = 10 } = req.query;
      
      if (!category_id || isNaN(parseInt(category_id))) {
        return response.validationError(res, null, '分类ID不能为空');
      }
      
      const articles = await ArticleModel.getHotArticlesByCategory(
        parseInt(category_id),
        parseInt(limit)
      );
      
      return response.success(res, articles);
    } catch (error) {
      logger.error(`获取热门文章失败: ${error.message}`);
      return response.error(res, 500, '获取热门文章失败');
    }
  }

  /**
   * 创建文章（管理员功能）
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async createArticle(req, res) {
    try {
      const { 
        title, abstract, content, cover_url, category_id,
        source, author, is_top = 0, images = []
      } = req.body;

      // 参数验证
      if (!title || !content || !category_id) {
        return response.validationError(res, null, '标题、内容和分类不能为空');
      }

      // 构建文章数据，自动记录发布者 user_id
      const articleData = {
        title,
        abstract: abstract || title.substring(0, 100),
        content,
        cover_url,
        category_id,
        source: source || '简讯速递',
        author: author || req.user.username,
        user_id: req.user.id,
        is_top: is_top ? 1 : 0,
        images
      };

      // 创建文章
      const article = await ArticleModel.createArticle(articleData);

      return response.created(res, article, '文章创建成功');
    } catch (error) {
      logger.error(`创建文章失败: ${error.message}`);
      return response.error(res, 500, '创建文章失败');
    }
  }

  /**
   * 更新文章（管理员功能）
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async updateArticle(req, res) {
    try {
      const { id } = req.params;
      const { 
        title, abstract, content, cover_url, category_id,
        source, author, is_top, images
      } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return response.validationError(res, null, '无效的文章ID');
      }

      // 检查文章是否存在
      const article = await ArticleModel.getArticleById(parseInt(id), false);
      if (!article) {
        return response.notFound(res, '文章不存在或已删除');
      }

      // 权限检查：只有文章作者或管理员才能编辑
      if (article.user_id !== req.user.id && req.user.role !== 'admin') {
        return response.forbidden(res, '无权编辑此文章');
      }

      // 构建更新数据
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (abstract !== undefined) updateData.abstract = abstract;
      if (content !== undefined) updateData.content = content;
      if (cover_url !== undefined) updateData.cover_url = cover_url;
      if (category_id !== undefined) updateData.category_id = category_id;
      if (source !== undefined) updateData.source = source;
      if (author !== undefined) updateData.author = author;
      if (is_top !== undefined) updateData.is_top = is_top ? 1 : 0;
      if (images !== undefined) updateData.images = images;

      // 没有要更新的字段
      if (Object.keys(updateData).length === 0) {
        return response.validationError(res, null, '没有提供需要更新的字段');
      }

      // 更新文章
      const updatedArticle = await ArticleModel.updateArticle(parseInt(id), updateData);

      return response.success(res, updatedArticle, '文章更新成功');
    } catch (error) {
      logger.error(`更新文章失败: ${error.message}`);
      return response.error(res, 500, '更新文章失败');
    }
  }

  /**
   * 删除文章（作者或管理员可删除）
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async deleteArticle(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return response.validationError(res, null, '无效的文章ID');
      }

      // 检查文章是否存在
      const article = await ArticleModel.getArticleById(parseInt(id), false);
      if (!article) {
        return response.notFound(res, '文章不存在或已删除');
      }

      // 权限检查：只有文章作者或管理员才能删除
      if (article.user_id !== req.user.id && req.user.role !== 'admin') {
        return response.forbidden(res, '无权删除此文章');
      }

      // 删除文章（实际上是将状态设为不可见）
      const result = await ArticleModel.deleteArticle(parseInt(id));

      if (!result) {
        return response.error(res, 500, '删除文章失败');
      }

      return response.success(res, null, '文章删除成功');
    } catch (error) {
      logger.error(`删除文章失败: ${error.message}`);
      return response.error(res, 500, '删除文章失败');
    }
  }

  /**
   * 点赞文章
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async likeArticle(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!id || isNaN(parseInt(id))) {
        return response.validationError(res, null, '无效的文章ID');
      }

      // 检查文章是否存在
      const article = await ArticleModel.getArticleById(parseInt(id), false);
      if (!article) {
        return response.notFound(res, '文章不存在或已删除');
      }

      // 点赞或取消点赞
      const isLiked = await ArticleModel.likeArticle(userId, parseInt(id));
      
      // 获取最新的点赞数
      const updatedArticle = await ArticleModel.getArticleById(parseInt(id), false);

      return response.success(
        res, 
        { 
          likes: updatedArticle.like_count,
          is_liked: isLiked
        }, 
        isLiked ? '点赞成功' : '取消点赞成功'
      );
    } catch (error) {
      logger.error(`点赞文章失败: ${error.message}`);
      return response.error(res, 500, '点赞操作失败');
    }
  }

  /**
   * 检查用户是否已点赞文章
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async checkLikeStatus(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!id || isNaN(parseInt(id))) {
        return response.validationError(res, null, '无效的文章ID');
      }

      // 检查文章是否存在
      const article = await ArticleModel.getArticleById(parseInt(id), false);
      if (!article) {
        return response.notFound(res, '文章不存在或已删除');
      }

      // 检查用户是否已点赞
      const isLiked = await ArticleModel.checkLikeStatus(userId, parseInt(id));

      return response.success(res, { is_liked: isLiked });
    } catch (error) {
      logger.error(`检查点赞状态失败: ${error.message}`);
      return response.error(res, 500, '检查点赞状态失败');
    }
  }

  /**
   * 获取随机文章
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getRandomArticles(req, res) {
    try {
      const { limit = 5, exclude_id, exclude_ids } = req.query;
      
      const options = {
        limit: parseInt(limit),
        excludeId: exclude_id,
        excludeIds: exclude_ids
      };
      
      const articles = await ArticleModel.getRandomArticles(options);
      
      return response.success(res, articles);
    } catch (error) {
      logger.error(`获取随机文章失败: ${error.message}`);
      return response.error(res, 500, '获取随机文章失败');
    }
  }

  /**
   * 获取所有分类的文章数量
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getCategoriesCount(req, res) {
    try {
      const categoryCounts = await ArticleModel.getCategoriesArticleCount();
      
      return response.success(res, categoryCounts);
    } catch (error) {
      logger.error(`获取分类文章数量失败: ${error.message}`);
      return response.error(res, 500, '获取分类文章数量失败');
    }
  }
}

module.exports = new ArticleController();