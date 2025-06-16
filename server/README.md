# 简讯速递新闻平台后端API

这是一个基于Node.js和MySQL的新闻平台后端API服务，为微信小程序"简讯速递"提供数据支持。

## 项目结构

```
server/
├── config/             # 配置文件
│   ├── config.js       # 应用配置
│   └── db.js           # 数据库配置
├── controllers/        # 控制器
│   ├── userController.js
│   ├── articleController.js
│   ├── categoryController.js
│   └── favoriteController.js
├── middleware/         # 中间件
│   └── auth.js         # 认证中间件
├── models/             # 数据模型
│   ├── userModel.js
│   ├── articleModel.js
│   ├── categoryModel.js
│   └── favoriteModel.js
├── routes/             # 路由
│   ├── index.js        # 主路由
│   ├── userRoutes.js
│   ├── articleRoutes.js
│   ├── categoryRoutes.js
│   └── favoriteRoutes.js
├── utils/              # 工具类
│   ├── logger.js       # 日志工具
│   └── response.js     # 响应格式化工具
├── logs/               # 日志文件夹(自动创建)
├── news_platform.sql   # 数据库结构和初始数据
├── .env                # 环境变量配置(需自行创建)
├── package.json        # 项目依赖
├── server.js           # 应用入口
└── README.md           # 项目说明
```

## 功能特性

- 用户管理：注册、登录、微信登录、个人信息管理
- 文章管理：文章列表、详情、搜索、分类筛选
- 分类管理：分类列表、热门分类
- 收藏管理：添加收藏、取消收藏、收藏列表

## 技术栈

- Node.js
- Express
- MySQL
- JWT认证
- Winston日志

## 安装和使用

### 前置条件

- Node.js (v14+)
- MySQL (v5.7+)

### 安装步骤

1. 克隆项目

```bash
git clone <项目地址>
cd 新闻平台/server
```

2. 安装依赖

```bash
npm install
```

3. 创建数据库

```bash
mysql -u root -p < news_platform.sql
```

4. 创建环境变量文件

创建`.env`文件，内容如下：

```
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=news_platform

# JWT配置
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

5. 启动服务

```bash
npm start
```

开发模式：

```bash
npm run dev
```

## API文档

### 基础URL

```
http://localhost:3000/api/v1
```

### 用户相关

- `POST /users/register` - 用户注册
- `POST /users/login` - 用户登录
- `POST /users/wechat-login` - 微信登录
- `GET /users/profile` - 获取用户信息
- `PUT /users/profile` - 更新用户信息
- `PUT /users/change-password` - 修改密码

### 文章相关

- `GET /articles` - 获取文章列表
- `GET /articles/headlines` - 获取头条文章
- `GET /articles/hot` - 获取热门文章
- `GET /articles/:id` - 获取文章详情
- `POST /articles/:id/like` - 点赞文章

### 分类相关

- `GET /categories` - 获取所有分类
- `GET /categories/hot` - 获取热门分类
- `GET /categories/:id` - 获取分类详情

### 收藏相关

- `GET /favorites` - 获取收藏列表
- `POST /favorites` - 添加收藏
- `DELETE /favorites/:article_id` - 取消收藏
- `DELETE /favorites` - 清空收藏
- `GET /favorites/check/:article_id` - 检查是否已收藏

## 开发者

- 简讯速递团队

## 许可证

MIT