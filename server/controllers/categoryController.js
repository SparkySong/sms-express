const CategoryModel = require('../models/categoryModel');
const ArticleModel = require('../models/articleModel');
const response = require('../utils/response');
const logger = require('../utils/logger');

/**
 * 分类控制器
 */
class CategoryController {
  /**
   * 获取所有分类
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getAllCategories(req, res) {
    try {
      const categories = await CategoryModel.getAllCategories();
      return response.success(res, categories);
    } catch (error) {
      logger.error(`获取分类列表失败: ${error.message}`);
      return response.error(res, 500, '获取分类列表失败');
    }
  }

  /**
   * 获取热门分类
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getHotCategories(req, res) {
    try {
      const categories = await CategoryModel.getHotCategories();
      return response.success(res, categories);
    } catch (error) {
      logger.error(`获取热门分类失败: ${error.message}`);
      return response.error(res, 500, '获取热门分类失败');
    }
  }

  /**
   * 获取分类详情
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getCategoryDetail(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return response.validationError(res, null, '无效的分类ID');
      }
      
      const category = await CategoryModel.getCategoryById(parseInt(id));
      
      if (!category) {
        return response.notFound(res, '分类不存在');
      }
      
      return response.success(res, category);
    } catch (error) {
      logger.error(`获取分类详情失败: ${error.message}`);
      return response.error(res, 500, '获取分类详情失败');
    }
  }

  /**
   * 获取分类下的文章列表
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getCategoryArticles(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, pageSize = 10, sortBy = 'publish_time', order = 'desc', keyword } = req.query;
      
      // 添加日志记录请求参数
      logger.info(`获取分类文章请求参数: categoryId=${id}, page=${page}, pageSize=${pageSize}, sortBy=${sortBy}, order=${order}, keyword=${keyword || '无'}`);
      
      if (!id || isNaN(parseInt(id))) {
        return response.validationError(res, null, '无效的分类ID');
      }
      
      // 检查分类是否存在
      const category = await CategoryModel.getCategoryById(parseInt(id));
      
      if (!category) {
        return response.notFound(res, '分类不存在');
      }
      
      // 获取分类下的文章
      const result = await ArticleModel.getArticlesByCategory(
        parseInt(id),
        {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          sortBy,
          order,
          keyword  // 传递关键词参数
        }
      );
      
      // 记录返回的文章数量
      logger.info(`分类(${id})文章查询结果: 总数=${result.total}, 返回=${result.articles.length}, 关键词=${keyword || '无'}`);
      
      return response.success(res, {
        articles: result.articles,
        total: result.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        category
      });
    } catch (error) {
      logger.error(`获取分类文章失败: ${error.message}`);
      return response.error(res, 500, '获取分类文章失败');
    }
  }

  /**
   * 创建分类（管理员功能）
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async createCategory(req, res) {
    try {
      const { 
        name, icon, bg_color, color_start, color_end,
        sort_order = 0, is_hot = 0
      } = req.body;
      
      // 参数验证
      if (!name) {
        return response.validationError(res, null, '分类名称不能为空');
      }
      
      // 构建分类数据
      const categoryData = {
        name,
        icon,
        bg_color,
        color_start,
        color_end,
        sort_order: parseInt(sort_order),
        is_hot: is_hot ? 1 : 0
      };
      
      // 创建分类
      const category = await CategoryModel.createCategory(categoryData);
      
      return response.created(res, category, '分类创建成功');
    } catch (error) {
      logger.error(`创建分类失败: ${error.message}`);
      return response.error(res, 500, '创建分类失败');
    }
  }

  /**
   * 更新分类（管理员功能）
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, icon, bg_color, color_start, 
        color_end, sort_order, is_hot
      } = req.body;
      
      if (!id || isNaN(parseInt(id))) {
        return response.validationError(res, null, '无效的分类ID');
      }
      
      // 检查分类是否存在
      const exists = await CategoryModel.getCategoryById(parseInt(id));
      if (!exists) {
        return response.notFound(res, '分类不存在');
      }
      
      // 构建更新数据
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (icon !== undefined) updateData.icon = icon;
      if (bg_color !== undefined) updateData.bg_color = bg_color;
      if (color_start !== undefined) updateData.color_start = color_start;
      if (color_end !== undefined) updateData.color_end = color_end;
      if (sort_order !== undefined) updateData.sort_order = parseInt(sort_order);
      if (is_hot !== undefined) updateData.is_hot = is_hot ? 1 : 0;
      
      // 没有要更新的字段
      if (Object.keys(updateData).length === 0) {
        return response.validationError(res, null, '没有提供需要更新的字段');
      }
      
      // 更新分类
      const category = await CategoryModel.updateCategory(parseInt(id), updateData);
      
      return response.success(res, category, '分类更新成功');
    } catch (error) {
      logger.error(`更新分类失败: ${error.message}`);
      return response.error(res, 500, '更新分类失败');
    }
  }

  /**
   * 删除分类（管理员功能）
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return response.validationError(res, null, '无效的分类ID');
      }
      
      // 删除分类
      try {
        await CategoryModel.deleteCategory(parseInt(id));
        return response.success(res, null, '分类删除成功');
      } catch (err) {
        if (err.message.includes('无法删除已被文章使用的分类')) {
          return response.validationError(res, null, '该分类已被文章使用，无法删除');
        }
        throw err;
      }
    } catch (error) {
      logger.error(`删除分类失败: ${error.message}`);
      return response.error(res, 500, '删除分类失败');
    }
  }
}

module.exports = new CategoryController();