const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyAdmin } = require('../middleware/auth');

/**
 * 分类路由
 */

// 获取所有分类
router.get('/', categoryController.getAllCategories);

// 获取热门分类
router.get('/hot', categoryController.getHotCategories);

// 获取分类详情
router.get('/:id', categoryController.getCategoryDetail);

// 获取分类下的文章
router.get('/:id/articles', categoryController.getCategoryArticles);

// 以下需要管理员权限
// 创建分类
router.post('/', verifyAdmin, categoryController.createCategory);

// 更新分类
router.put('/:id', verifyAdmin, categoryController.updateCategory);

// 删除分类
router.delete('/:id', verifyAdmin, categoryController.deleteCategory);

module.exports = router;