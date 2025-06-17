# 简讯速递微信小程序

![license](https://img.shields.io/badge/license-MIT-blue.svg)
![wechat](https://img.shields.io/badge/微信小程序-开发中-brightgreen.svg)
![vant](https://img.shields.io/badge/@vant/weapp-1.11.7-orange.svg)
![nodejs](https://img.shields.io/badge/Node.js-v16+-green.svg)

## 📱 项目简介

简讯速递是一款专注于提供高效、便捷的新闻资讯服务的微信小程序。本项目采用前后端分离架构，为用户打造沉浸式的资讯阅读体验，支持多种个性化定制功能。

## ✨ 核心功能

- **资讯浏览**：多维度新闻分类与推荐
- **用户系统**：完整的注册、登录、个人信息管理
- **内容互动**：点赞、收藏、评论、分享
- **搜索功能**：支持全文检索与智能推荐
- **阅读历史**：自动记录与同步用户阅读轨迹
- **消息通知**：实时推送与提醒系统
- **设置中心**：个性化配置与隐私管理

## 🛠️ 技术架构

### 前端技术栈
- **微信小程序原生框架**：WXML、WXSS、JavaScript
- **UI组件库**：Vant Weapp v1.11.7
- **状态管理**：全局数据与页面间通信
- **网络请求**：Promise封装的wx.request
- **数据缓存**：微信存储API与策略性缓存

### 后端技术栈
- **运行环境**：Node.js
- **Web框架**：Express.js
- **数据库**：MySQL
- **身份验证**：JWT (JSON Web Token)
- **文件存储**：阿里云OSS
- **日志管理**：Winston

## 📂 项目结构

```
├── pages/                  # 小程序页面
│   ├── index/             # 首页模块
│   ├── news/              # 新闻详情
│   ├── category/          # 分类页面
│   ├── search/            # 搜索功能
│   ├── profile/           # 个人中心
│   ├── login/             # 登录页面
│   ├── register/          # 注册页面
│   ├── publish/           # 内容发布
│   ├── history/           # 阅读历史
│   ├── favorite/          # 收藏列表
│   └── settings/          # 设置中心
│
├── utils/                  # 工具函数
│   ├── auth.js            # 认证相关
│   ├── request.js         # 网络请求
│   └── util.js            # 通用工具
│
├── server/                 # 后端服务
│   ├── controllers/       # 控制器
│   ├── models/            # 数据模型
│   ├── routes/            # API路由
│   ├── middleware/        # 中间件
│   ├── config/            # 配置文件
│   ├── utils/             # 工具函数
│   └── server.js          # 入口文件
│
├── static/                 # 静态资源
│   ├── images/            # 图片资源
│   └── icons/             # 图标资源
│
├── app.js                  # 小程序入口文件
├── app.json                # 全局配置
└── app.wxss                # 全局样式
```

## ⚙️ 环境要求

- **微信开发者工具**：最新版本
- **Node.js**：v16.0.0及以上
- **MySQL**：v5.7及以上
- **NPM**：v8.0.0及以上

## 🚀 快速开始

### 小程序端配置

1. 克隆代码仓库
```bash
git clone [仓库地址]
cd [项目文件夹]
```

2. 安装依赖
```bash
npm install
```

3. 使用微信开发者工具导入项目
   - AppID: wxfc125c7e60599fc1
   - 项目路径: 选择clone下来的项目根目录

### 后端服务配置

1. 进入server目录
```bash
cd server
```

2. 安装依赖
```bash
npm install
```

3. 导入数据库
```bash
# 使用MySQL客户端导入
mysql -u username -p database_name < news_platform.sql
```

4. 启动服务
```bash
npm run dev
```

## 📝 API文档

后端API采用RESTful规范设计，主要包括以下模块：

- 用户认证: `/api/v1/auth`
- 新闻内容: `/api/v1/news`
- 用户互动: `/api/v1/interaction`
- 系统管理: `/api/v1/system`

详细API文档请参考服务端`/server/README.md`文件。

## 🔐 安全特性

- JWT认证保障用户数据安全
- 密码加密存储
- 请求数据验证
- 防SQL注入措施
- 文件上传安全控制

## 📱 小程序特色

- **分包加载**：优化小程序启动速度
- **响应式设计**：适配不同尺寸的设备
- **骨架屏**：优化加载体验
- **下拉刷新与上拉加载**：流畅的列表交互
- **图片懒加载**：优化性能与流量

## 🛠️ 开发与调试

1. 小程序端开发
   - 使用微信开发者工具进行实时预览和调试
   - 真机调试验证功能完整性

2. 后端API调试
   - 开发环境默认监听`http://localhost:3000`
   - 使用Postman或其他API测试工具进行接口测试

## 📈 性能优化

- 图片资源CDN分发
- 合理的缓存策略
- 请求数据最小化
- 分包加载与预加载
- 长列表渲染优化

## 📄 开源许可

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 👨‍💻 开发团队

- 钟华 (2022114057) - 计科班

## 🔮 未来计划

- [ ] 接入微信云开发
- [ ] 实现更丰富的内容推荐算法
- [ ] 优化移动端性能
- [ ] 增强数据分析能力
- [ ] 完善用户反馈系统 