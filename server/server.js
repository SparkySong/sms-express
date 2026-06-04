const express = require('express');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./utils/db');
const config = require('./config/config');
const routes = require('./routes');
const logger = require('./utils/logger');

// 创建Express应用
const app = express();

// 配置中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 用于访问上传的图片
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 请求日志中间件
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// 注册路由
app.use(routes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 404,
    message: '请求的资源不存在'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error(`服务器错误: ${err.message}`);
  logger.error(err.stack);

  res.status(500).json({
    success: false,
    code: 500,
    message: '服务器内部错误'
  });
});

// 启动服务器
const PORT = config.server.port;

// 先测试数据库连接
testConnection()
  .then((connected) => {
    if (!connected) {
      logger.error('无法连接到数据库，服务器启动失败');
      process.exit(1);
    }

    // 启动服务器
    app.listen(PORT, () => {
      logger.info(`服务器运行在 http://localhost:${PORT}`);
      logger.info(`环境: ${config.server.env}`);
    });
  })
  .catch((err) => {
    logger.error(`数据库连接测试失败: ${err.message}`);
    process.exit(1);
  });

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error(`未捕获的异常: ${err.message}`);
  logger.error(err.stack);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
});