DROP DATABASE IF EXISTS news_platform;
CREATE DATABASE news_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE news_platform;

-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    openid VARCHAR(100) UNIQUE COMMENT '微信用户唯一标识',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password VARCHAR(100) COMMENT '密码',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar_url VARCHAR(255) COMMENT '头像URL',
    gender TINYINT DEFAULT 0 COMMENT '性别：0未知，1男，2女',
    phone VARCHAR(20) COMMENT '手机号',
    register_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    last_login_time DATETIME COMMENT '最后登录时间',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用，1正常'
) COMMENT '用户表';

-- 分类表
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL COMMENT '分类名称',
    description VARCHAR(255) COMMENT '分类描述',
    icon VARCHAR(100) COMMENT '分类图标',
    bg_color VARCHAR(20) COMMENT '背景颜色',
    color_start VARCHAR(20) COMMENT '渐变开始颜色',
    color_end VARCHAR(20) COMMENT '渐变结束颜色',
    text_color VARCHAR(20) COMMENT '文本颜色',
    sort_order INT DEFAULT 0 COMMENT '排序值',
    is_hot TINYINT DEFAULT 0 COMMENT '是否热门：0否，1是'
) COMMENT '分类表';

-- 文章表
CREATE TABLE articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '文章标题',
    abstract VARCHAR(500) COMMENT '文章摘要',
    content TEXT COMMENT '文章内容',
    cover_url VARCHAR(255) COMMENT '封面图URL',
    category_id INT NOT NULL COMMENT '分类ID',
    source VARCHAR(50) COMMENT '文章来源',
    author VARCHAR(50) COMMENT '作者',
    publish_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    view_count INT DEFAULT 0 COMMENT '浏览量',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    comment_count INT DEFAULT 0 COMMENT '评论数',
    is_top TINYINT DEFAULT 0 COMMENT '是否置顶：0否，1是',
    status TINYINT DEFAULT 1 COMMENT '状态：0删除，1正常',
    FOREIGN KEY (category_id) REFERENCES categories(id)
) COMMENT '文章表';

-- 文章图片表
CREATE TABLE article_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT NOT NULL COMMENT '文章ID',
    image_url VARCHAR(255) NOT NULL COMMENT '图片URL',
    sort_order INT DEFAULT 0 COMMENT '排序值',
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) COMMENT '文章图片表';

-- 收藏表
CREATE TABLE favorites (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    article_id INT NOT NULL COMMENT '文章ID',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    UNIQUE KEY (user_id, article_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) COMMENT '收藏表';

-- 浏览历史表
CREATE TABLE read_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    article_id INT NOT NULL COMMENT '文章ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '浏览时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    INDEX idx_user_time (user_id, create_time DESC) COMMENT '用于快速查询用户历史'
) COMMENT '阅读历史表';

-- 评论表
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '评论用户ID',
    article_id INT NOT NULL COMMENT '文章ID',
    content TEXT NOT NULL COMMENT '评论内容',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    parent_id INT DEFAULT NULL COMMENT '父评论ID，用于回复',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
    status TINYINT DEFAULT 1 COMMENT '状态：0隐藏，1正常',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
) COMMENT '评论表';

-- 评论点赞表
CREATE TABLE comment_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    comment_id INT NOT NULL COMMENT '评论ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
    UNIQUE KEY (user_id, comment_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) COMMENT '评论点赞表';

-- 通知表
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT COMMENT '用户ID，NULL表示全局通知',
    title VARCHAR(100) NOT NULL COMMENT '通知标题',
    content TEXT NOT NULL COMMENT '通知内容',
    type TINYINT NOT NULL COMMENT '类型：1系统通知，2评论通知，3点赞通知',
    is_read TINYINT DEFAULT 0 COMMENT '是否已读：0未读，1已读',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT '通知表';

-- 插入测试数据

-- 插入用户数据
INSERT INTO users (openid, username, password, nickname, avatar_url, gender, phone, register_time, last_login_time, status) VALUES
('openid_001', 'user1', 'password123', '张三', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1, '13800138001', '2023-01-01 10:00:00', '2023-06-01 15:30:00', 1),
('openid_002', 'user2', 'password123', '李四', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1, '13800138002', '2023-01-02 11:00:00', '2023-06-02 14:20:00', 1),
('openid_003', 'user3', 'password123', '王五', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1, '13800138003', '2023-01-03 09:30:00', '2023-06-03 16:45:00', 1),
('openid_004', 'user4', 'password123', '赵六', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 2, '13800138004', '2023-01-04 14:00:00', '2023-06-04 10:10:00', 1),
('openid_005', 'user5', 'password123', '钱七', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 2, '13800138005', '2023-01-05 16:20:00', '2023-06-05 09:05:00', 1);

-- 插入分类数据
INSERT INTO categories (name, description, icon, bg_color, color_start, color_end, text_color, sort_order, is_hot) VALUES
('科技', '科技资讯', 'laptop-o', '#e6f7ff', '#1890ff', '#40a9ff', '#ffffff', 1, 0),
('体育', '体育新闻', 'medal-o', '#e6fffb', '#13c2c2', '#36cfc9', '#ffffff', 2, 1),
('娱乐', '娱乐资讯', 'video-o', '#fff0f6', '#eb2f96', '#f759ab', '#ffffff', 3, 1),
('财经', '财经新闻', 'balance-o', '#f9f0ff', '#722ed1', '#9254de', '#ffffff', 4, 0),
('健康', '健康资讯', 'like-o', '#f6ffed', '#52c41a', '#73d13d', '#ffffff', 5, 0),
('教育', '教育信息', 'bookmark-o', '#f0f5ff', '#597ef7', '#2f54eb', '#ffffff', 6, 1),
('旅游', '旅游攻略', 'location-o', '#e6fffb', '#36cfc9', '#13c2c2', '#ffffff', 7, 1),
('美食', '美食推荐', 'shop-o', '#fff2e8', '#fa8c16', '#fa541c', '#ffffff', 8, 1),
('汽车', '汽车资讯', 'logistics', '#fcffe6', '#a0d911', '#7cb305', '#ffffff', 9, 0),
('时尚', '时尚潮流', 'gift-o', '#fff0f6', '#eb2f96', '#c41d7f', '#ffffff', 10, 1);

-- 插入文章数据
INSERT INTO articles (title, abstract, content, cover_url, category_id, source, author, publish_time, view_count, like_count, comment_count, is_top, status) VALUES
('人工智能革命：ChatGPT如何改变世界', 'ChatGPT的出现标志着AI新时代的开始，本文探讨了这项技术的影响和未来发展方向。', '人工智能技术的飞速发展正在深刻改变我们的生活方式和工作方式。ChatGPT作为一种基于深度学习的大型语言模型，展示了AI在自然语言处理方面的巨大潜力。它不仅能够回答问题、创作内容，还能协助编程和提供各种信息服务。\n\n随着技术的不断进步，未来的AI将更加智能和自然，可能在教育、医疗、金融等众多领域发挥关键作用。本文详细分析了ChatGPT的工作原理、应用场景以及对社会的潜在影响。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 3, '科技前沿', '李明', '2023-05-01 08:00:00', 1500, 320, 45, 1, 1),

('2023年世界杯：谁将成为新的冠军？', '本届世界杯赛事激烈，多支强队展现出色表现，冠军归属仍悬而未决。', '2023年世界杯已经进入白热化阶段，各支球队的表现令人惊叹。卫冕冠军法国队依然保持着强劲的竞争力，而巴西队、德国队和西班牙队也不甘示弱，展现出非凡的技术和团队协作能力。\n\n值得注意的是，一些新兴强队如摩洛哥队和克罗地亚队也在比赛中有出色表现，给传统强队带来了不小的压力。本文深入分析了各支队伍的技战术特点、主要球员状态以及夺冠几率。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 4, '体育世界', '王强', '2023-05-02 09:15:00', 2300, 560, 78, 1, 1),

('全球经济复苏：机遇与挑战并存', '后疫情时代全球经济呈现复苏态势，但仍面临诸多不确定因素和挑战。', '随着全球疫情形势趋于稳定，世界经济开始呈现复苏态势。各国政府推出的刺激政策初显成效，消费市场逐渐恢复活力，国际贸易量也在稳步增长。\n\n然而，复苏进程中依然面临诸多挑战：通货膨胀压力上升、供应链中断问题仍未完全解决、地缘政治因素带来的不确定性等。本文通过数据分析，详细阐述了当前全球经济形势，并对未来发展趋势进行了预测。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 6, '财经观察', '张经理', '2023-05-03 10:30:00', 1800, 290, 32, 0, 1),

('健康生活方式：如何科学饮食与运动', '科学的饮食和运动习惯是保持健康的关键，本文提供了实用指南。', '在现代生活中，保持健康的生活方式变得越来越重要。科学的饮食结构应包括适量的蛋白质、碳水化合物、脂肪、维生素和矿物质，保持饮食多样化和均衡是关键。\n\n同时，定期的体育锻炼对身心健康至关重要。本文详细介绍了不同类型的运动方式及其益处，提供了适合不同年龄段和健康状况人群的运动建议，并分享了一些简单实用的健康食谱。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 7, '健康生活', '林医生', '2023-05-04 14:20:00', 1200, 350, 55, 0, 1),

('电影《流浪地球2》：中国科幻电影的新高度', '《流浪地球2》不仅在视觉效果上令人震撼，剧情设计和人物塑造也达到了新的高度。', '《流浪地球2》作为中国科幻电影的又一力作，不仅在特效和场景设计上达到了国际水准，更在故事深度和人物塑造方面有了长足进步。影片继续探讨人类命运共同体的主题，展现了面对危机时人类的团结与勇气。\n\n导演郭帆在保留前作风格的基础上，加入了更多情感元素和哲学思考，使影片在视觉震撼之外也具有了更深层次的内涵。主演吴京、刘德华等人的表演也获得了观众和影评人的一致好评。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 5, '娱乐周刊', '赵影评', '2023-05-05 16:45:00', 3000, 780, 120, 1, 1);

-- 插入文章图片数据
INSERT INTO article_images (article_id, image_url, sort_order) VALUES
(1, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(1, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 2),
(2, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(2, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 2),
(3, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(4, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(5, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(5, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 2);

-- 插入收藏数据
INSERT INTO favorites (user_id, article_id, create_time) VALUES
(1, 5, '2023-05-10 09:10:00'),
(1, 2, '2023-05-11 14:20:00'),
(2, 1, '2023-05-12 16:30:00'),
(2, 5, '2023-05-13 10:40:00'),
(3, 3, '2023-05-14 08:50:00'),
(4, 4, '2023-05-15 13:15:00'),
(5, 5, '2023-05-16 19:25:00');

-- 插入浏览历史数据
INSERT INTO read_history (user_id, article_id, create_time) VALUES
(1, 1, '2023-05-10 08:00:00'),
(1, 2, '2023-05-10 09:15:00'),
(1, 5, '2023-05-10 14:30:00'),
(2, 1, '2023-05-11 10:45:00'),
(2, 3, '2023-05-11 16:20:00'),
(3, 2, '2023-05-12 11:10:00'),
(3, 4, '2023-05-12 18:05:00'),
(4, 5, '2023-05-13 09:30:00'),
(5, 1, '2023-05-14 12:40:00'),
(5, 3, '2023-05-14 17:15:00');

-- 插入评论数据
INSERT INTO comments (user_id, article_id, content, like_count, parent_id, create_time, status) VALUES
(1, 5, '这部电影确实很棒，特效太震撼了！', 12, NULL, '2023-05-10 18:20:00', 1),
(2, 5, '同意楼上的观点，剧情也很感人', 8, 1, '2023-05-10 19:30:00', 1),
(3, 5, '我觉得比第一部更有深度', 6, NULL, '2023-05-11 12:15:00', 1),
(4, 1, 'ChatGPT确实改变了很多行业的工作方式', 9, NULL, '2023-05-11 14:40:00', 1),
(5, 1, '文章分析很到位，期待后续发展', 5, 4, '2023-05-11 16:50:00', 1),
(2, 2, '今年的世界杯比赛确实很精彩', 7, NULL, '2023-05-12 09:25:00', 1),
(3, 3, '经济复苏还需要更多的时间和政策支持', 4, NULL, '2023-05-12 13:10:00', 1),
(1, 4, '健康生活很重要，文章给了很多实用建议', 10, NULL, '2023-05-13 10:30:00', 1);

-- 插入评论点赞数据
INSERT INTO comment_likes (user_id, comment_id, create_time) VALUES
(2, 1, '2023-05-10 20:10:00'),
(3, 1, '2023-05-10 21:20:00'),
(4, 1, '2023-05-10 22:30:00'),
(5, 1, '2023-05-11 08:15:00'),
(1, 4, '2023-05-11 15:45:00'),
(3, 4, '2023-05-11 17:30:00'),
(4, 6, '2023-05-12 10:40:00'),
(5, 8, '2023-05-13 11:55:00');

-- 插入通知数据
INSERT INTO notifications (user_id, title, content, type, is_read, create_time) VALUES
(NULL, '系统维护通知', '系统将于2023年6月1日凌晨2点至4点进行例行维护，期间可能无法正常访问，敬请谅解。', 1, 0, '2023-05-25 10:00:00'),
(1, '您的文章收到了新评论', '您的文章《健康生活方式：如何科学饮食与运动》收到了新评论，点击查看详情。', 2, 0, '2023-05-13 10:35:00'),
(2, '您的评论收到了点赞', '您对文章《电影《流浪地球2》：中国科幻电影的新高度》的评论收到了点赞，点击查看详情。', 3, 1, '2023-05-10 20:15:00'),
(3, '您的文章被收藏', '您的文章《全球经济复苏：机遇与挑战并存》被用户收藏，点击查看详情。', 3, 0, '2023-05-14 09:00:00'),
(4, '温馨提示', '感谢您持续关注我们的平台，您已连续登录7天，积分+50！', 1, 1, '2023-05-20 08:30:00');

-- 插入更多用户数据
INSERT INTO users (openid, username, password, nickname, avatar_url, gender, phone, register_time, last_login_time, status) VALUES
('openid_006', 'user6', 'password123', '孙八', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1, '13800138006', '2023-02-01 08:30:00', '2023-06-10 10:20:00', 1),
('openid_007', 'user7', 'password123', '周九', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 2, '13800138007', '2023-02-05 14:45:00', '2023-06-12 16:35:00', 1),
('openid_008', 'user8', 'password123', '吴十', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1, '13800138008', '2023-02-10 11:15:00', '2023-06-15 09:40:00', 1),
('openid_009', 'user9', 'password123', '郑十一', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 2, '13800138009', '2023-02-15 16:25:00', '2023-06-18 14:50:00', 1),
('openid_010', 'user10', 'password123', '王十二', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1, '13800138010', '2023-02-20 13:10:00', '2023-06-20 11:05:00', 1);

-- 插入更多文章数据
INSERT INTO articles (title, abstract, content, cover_url, category_id, source, author, publish_time, view_count, like_count, comment_count, is_top, status) VALUES
('2023年教育改革：新政策将如何影响学生发展', '教育部近日发布新政策，旨在减轻学生负担，促进素质教育发展，本文详细解读政策内容及影响。', '近期，教育部发布了一系列教育改革新政策，引起了社会广泛关注。这些政策主要针对减轻学生过重学业负担、促进素质教育发展、优化教育资源分配等方面。\n\n新政策强调了"五育并举"的教育理念，要求学校加强体育、美育、劳动教育的比重，同时减少机械性作业和题海战术。此外，政策还提出了加强师资培训、提高教师待遇、推动教育公平等多项措施。\n\n专家分析认为，这些改革将有助于改变当前应试教育过重的现状，为学生的全面发展创造更好的环境。但也有观点指出，改革过程中可能面临执行难度大、评价体系不完善等挑战。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 6, '教育观察', '陈教授', '2023-05-06 08:30:00', 1350, 280, 38, 0, 1),

('云南丽江：一场视觉与心灵的旅程', '丽江古城的历史风貌与周边自然景观的完美结合，为游客提供了独特的旅行体验。', '丽江，这座位于云南西北部的古城，拥有800多年历史，是中国保存最完好的古城之一。漫步在丽江古城的青石板路上，两旁是具有纳西族特色的建筑，清澈的溪水穿城而过，构成了"家家流水，户户花开"的美丽景象。\n\n除了古城风貌，丽江周边的自然景观同样令人惊叹。玉龙雪山巍峨壮丽，蓝月谷的湖水如蓝宝石般晶莹剔透，虎跳峡的奔腾江水展示了大自然的磅礴气势。\n\n丽江不仅有美景，还有丰富的纳西文化。东巴文化作为中国唯一现存的象形文字，承载着纳西族的历史与智慧。古城中的纳西古乐、民族舞蹈、传统手工艺等文化活动，让游客在领略自然美景的同时，也能感受到深厚的文化底蕴。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 7, '旅行者', '李旅行', '2023-05-07 09:45:00', 2100, 510, 62, 1, 1),

('米其林三星主厨的家常菜：简单食材的奇妙变化', '世界顶级主厨分享如何用普通食材做出星级美食，改变你的家庭餐桌。', '在大多数人的印象中，米其林星级主厨的料理总是与昂贵食材、复杂工艺和精致摆盘联系在一起。然而，法国米其林三星主厨保罗·杜卡斯在他的新书中分享了一系列用普通食材制作的家常料理，证明真正的美食不一定复杂。\n\n杜卡斯认为，做好一道菜的关键在于尊重食材本身的风味，以及对烹饪基本功的掌握。书中详细介绍了如何选择和保存食材，以及一些能够提升家常菜品质的简单技巧。例如，他推荐使用低温慢煮的方式处理肉类，这样可以最大程度保留肉的鲜嫩和风味。\n\n这些方法不需要昂贵的厨房设备或难以获得的食材，普通家庭完全可以尝试。本文精选了书中几道代表性的料理，并附有详细的步骤说明和厨房小技巧。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 8, '美食家', '王厨师', '2023-05-08 11:20:00', 1850, 430, 58, 0, 1),

('新能源汽车市场分析：2023年趋势与挑战', '随着政策支持和技术进步，新能源汽车市场快速发展，同时也面临着一些新的挑战。', '2023年，全球新能源汽车市场继续保持强劲增长态势。在中国，新能源汽车的销量已连续多月刷新纪录，多家自主品牌的销量和市场份额均有显著提升。国际市场上，特斯拉、大众、丰田等传统汽车巨头也在加速电动化转型。\n\n技术方面，电池能量密度持续提升，快充技术不断突破，自动驾驶辅助系统日益完善，这些都推动了新能源汽车的普及。同时，各国政府推出的补贴政策和碳排放限制也为市场发展提供了有力支持。\n\n然而，行业发展仍面临诸多挑战：充电基础设施建设滞后、电池回收问题、芯片短缺等。此外，随着市场竞争加剧，一些实力较弱的企业面临淘汰风险。本文对当前市场状况进行了全面分析，并对未来发展趋势做出了预测。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 9, '汽车世界', '张汽车', '2023-05-09 13:40:00', 1600, 320, 42, 0, 1),

('2023秋冬时装周：复古元素回潮引领潮流', '国际四大时装周展示了2023秋冬季流行趋势，复古元素结合现代设计成为主旋律。', '2023年秋冬时装周在纽约、伦敦、米兰和巴黎相继举行，各大设计师品牌展示了他们对下一季流行趋势的解读。本季度最明显的特点是复古元素的回归，70年代和90年代的风格在多个系列中得到重新诠释。\n\n在色彩方面，深沉的酒红色、墨绿色以及柔和的驼色成为主导，反映了秋冬季节的自然变化。材质上，粗呢、灯芯绒和天鹅绒等传统冬季面料重新受到青睐，但与现代科技面料的混搭为它们注入了新的活力。\n\n值得注意的是，可持续时尚理念在本季度得到了更多关注。多个品牌使用了再生材料和环保生产工艺，体现了时尚产业对环境责任的重视。此外，融合多元文化元素的设计也成为一大亮点，展现了全球化视野下的时尚创新。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 10, '时尚圈', '刘潮流', '2023-05-10 15:15:00', 2200, 650, 85, 1, 1),

('量子计算：下一代信息技术革命已经开始', '量子计算技术的突破可能彻底改变信息处理方式，各国竞相投入研发。', '量子计算被誉为继电子计算机之后的下一代信息技术革命，其利用量子力学原理进行信息处理的方式有望解决传统计算机难以应对的复杂问题。近期，多个研究团队在量子比特的稳定性和错误纠正方面取得了重要突破，使实用化的量子计算机距离我们更近了一步。\n\n目前，谷歌、IBM、微软等科技巨头以及多个国家的研究机构都在积极投入量子计算研发。中国在超导量子计算和量子通信领域也取得了举世瞩目的成就。\n\n量子计算一旦实现规模化应用，将对密码学、药物研发、材料科学、人工智能等领域产生深远影响。例如，它可以模拟复杂分子结构，加速新药研发；优化资源调度，提高生产效率；破解现有密码系统，推动信息安全领域变革。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1, '科技前沿', '黄博士', '2023-05-11 10:25:00', 1750, 380, 48, 1, 1),

('NBA季后赛：黑马球队崛起改写夺冠格局', '本赛季NBA季后赛出现多个黑马球队，传统强队遭遇挑战，冠军争夺更加激烈。', 'NBA 2022-2023赛季季后赛正在如火如荼进行中，与往年相比，本赛季的竞争格局发生了显著变化。一些黑马球队的崛起打破了传统强队的垄断局面，让季后赛充满了更多悬念和可能性。\n\n萨克拉门托国王时隔16年重返季后赛，年轻的纽约尼克斯展现出强大的团队凝聚力，这些球队凭借新锐教练的战术创新和年轻球员的迅速成长，在季后赛中取得了令人瞩目的成绩。\n\n同时，一些老牌强队面临着新的挑战。卫冕冠军金州勇士队人员老化问题日益凸显，洛杉矶湖人队虽有詹姆斯和戴维斯坐镇，但整体配置仍存在明显短板。\n\n分析人士认为，NBA正在进入一个更加均衡的竞争时代，这将为球迷带来更多精彩的比赛和难以预测的结果。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 2, '体育世界', '赵球迷', '2023-05-12 18:30:00', 2800, 720, 98, 1, 1),

('音乐剧《汉密尔顿》全球巡演启动：历史与音乐的完美融合', '创下百老汇票房纪录的音乐剧《汉密尔顿》开启全球巡演，中国观众将首次有机会现场观看这部作品。', '荣获托尼奖11项大奖的音乐剧《汉密尔顿》宣布启动全球巡演计划，这部改编自美国开国元勋亚历山大·汉密尔顿生平的作品，以其创新的音乐风格和讲述方式，重新诠释了美国历史。\n\n《汉密尔顿》的独特之处在于将嘻哈、R&B、爵士等现代音乐元素与传统百老汇风格相结合，并由多元种族演员扮演历史人物，打破了观众对历史剧的固有印象。剧作家林-曼努尔·米兰达不仅创作了引人入胜的故事和音乐，还在剧中饰演了主角汉密尔顿。\n\n据悉，此次全球巡演将包括亚洲站，中国观众将首次有机会在国内剧院欣赏到这部被誉为"改变百老汇面貌"的作品。演出团队表示，他们会在保留原作精髓的同时，为不同文化背景的观众提供字幕等辅助手段，确保所有观众都能领略这部作品的魅力。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 3, '娱乐周刊', '陈记者', '2023-05-13 19:50:00', 1900, 520, 75, 0, 1),

('全球央行加息周期或将结束：经济增长与通胀的新平衡', '多国央行释放政策转向信号，市场预期利率见顶，经济软着陆可能性增加。', '随着通货膨胀压力逐渐缓解，全球主要央行的加息周期似乎正接近尾声。美联储主席在最近的讲话中暗示，可能会在未来几个月暂停加息，评估已实施政策的效果。欧洲央行和英国央行也释放了类似信号。\n\n数据显示，美国和欧洲的核心通胀率已开始下降，能源和食品价格趋于稳定。同时，就业市场虽然依然强劲，但增长速度已有所放缓，显示紧缩政策正在发挥作用。\n\n对于投资者而言，政策转向预期已开始影响资产配置决策。债券市场出现回暖迹象，而股市也从去年的低迷中逐渐恢复。分析师认为，如果央行能够成功实现经济软着陆，即在不引发严重衰退的情况下控制通胀，将为全球经济创造更有利的环境。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 4, '财经观察', '吴分析师', '2023-05-14 08:40:00', 1500, 270, 35, 0, 1),

('健康饮食新趋势：植物性饮食的兴起与科学依据', '越来越多的研究支持适度增加植物性食物摄入的健康益处，全球植物性食品市场快速增长。', '近年来，植物性饮食逐渐从小众饮食方式发展成为全球性健康趋势。与完全素食不同，植物性饮食倡导增加水果、蔬菜、全谷物、豆类和坚果等植物食材的比例，同时适度减少动物性食品的摄入，属于一种相对灵活的饮食模式。\n\n多项大型研究表明，遵循植物性饮食的人群患心血管疾病、2型糖尿病和某些癌症的风险明显降低。哈佛大学的一项长期追踪研究显示，每天增加一份蔬果摄入，死亡风险可降低5%。此外，植物性饮食还与健康体重维持和肠道菌群改善有关。\n\n随着消费者健康意识增强和环保理念普及，全球植物性食品市场正以每年约10%的速度增长。食品企业纷纷推出植物蛋白肉、植物奶等替代产品，餐厅也开始提供更多植物性选项。专家建议，即使不完全改变饮食习惯，适度增加植物性食物的比例也能带来健康益处。', 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 5, '健康生活', '周营养师', '2023-05-15 12:10:00', 1650, 390, 60, 0, 1);

-- 插入更多文章图片
INSERT INTO article_images (article_id, image_url, sort_order) VALUES
(6, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(6, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 2),
(7, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(7, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 2),
(7, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 3),
(8, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(9, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(9, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 2),
(10, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(11, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(12, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(13, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(14, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1),
(15, 'https://toursmi.oss-cn-chengdu.aliyuncs.com/test.png', 1);

-- 插入更多收藏数据
INSERT INTO favorites (user_id, article_id, create_time) VALUES
(6, 6, '2023-05-17 10:15:00'),
(6, 8, '2023-05-17 11:25:00'),
(7, 7, '2023-05-18 14:35:00'),
(7, 10, '2023-05-18 15:45:00'),
(8, 9, '2023-05-19 09:20:00'),
(8, 11, '2023-05-19 10:30:00'),
(9, 12, '2023-05-20 16:40:00'),
(9, 13, '2023-05-20 17:50:00'),
(10, 14, '2023-05-21 13:05:00'),
(10, 15, '2023-05-21 14:15:00');

-- 插入更多浏览历史
INSERT INTO read_history (user_id, article_id, create_time) VALUES
(6, 6, '2023-05-17 08:30:00'),
(6, 7, '2023-05-17 09:45:00'),
(6, 8, '2023-05-17 10:20:00'),
(7, 9, '2023-05-18 11:10:00'),
(7, 10, '2023-05-18 12:25:00'),
(7, 11, '2023-05-18 13:40:00'),
(8, 12, '2023-05-19 14:55:00'),
(8, 13, '2023-05-19 16:05:00'),
(9, 14, '2023-05-20 09:15:00'),
(9, 15, '2023-05-20 10:30:00'),
(10, 6, '2023-05-21 11:50:00'),
(10, 8, '2023-05-21 13:20:00'),
(10, 10, '2023-05-21 15:35:00');

-- 插入更多评论数据
INSERT INTO comments (user_id, article_id, content, like_count, parent_id, create_time, status) VALUES
(6, 6, '教育改革非常必要，希望能真正减轻学生负担', 15, NULL, '2023-05-15 09:30:00', 1),
(7, 6, '同意楼上观点，但执行起来可能有难度', 8, 9, '2023-05-15 10:40:00', 1),
(8, 7, '丽江真的很美，去年去过一次，非常推荐', 12, NULL, '2023-05-16 11:25:00', 1),
(9, 8, '试了文中提到的几道菜，效果很不错', 9, NULL, '2023-05-17 13:50:00', 1),
(10, 8, '能分享一下具体的步骤吗？', 5, 12, '2023-05-17 14:30:00', 1),
(6, 9, '新能源汽车确实是未来趋势，但充电设施还需要完善', 11, NULL, '2023-05-18 16:20:00', 1),
(7, 10, '这季的服装设计很有新意，特别喜欢那些复古元素', 14, NULL, '2023-05-19 18:45:00', 1),
(8, 11, '量子计算太复杂了，但文章解释得很清楚', 7, NULL, '2023-05-20 10:15:00', 1),
(9, 12, '今年NBA季后赛确实精彩，很多黑马表现出色', 18, NULL, '2023-05-21 12:40:00', 1),
(10, 13, '很期待《汉密尔顿》来中国演出，一定要去看', 13, NULL, '2023-05-22 15:30:00', 1);

-- 插入更多评论点赞
INSERT INTO comment_likes (user_id, comment_id, create_time) VALUES
(7, 9, '2023-05-15 11:20:00'),
(8, 9, '2023-05-15 12:30:00'),
(9, 10, '2023-05-16 13:40:00'),
(10, 11, '2023-05-17 14:50:00'),
(6, 12, '2023-05-18 15:55:00'),
(7, 13, '2023-05-19 16:25:00'),
(8, 14, '2023-05-20 17:35:00'),
(9, 15, '2023-05-21 18:45:00'),
(10, 16, '2023-05-22 19:55:00'),
(6, 17, '2023-05-23 09:10:00');

-- 插入更多通知
INSERT INTO notifications (user_id, title, content, type, is_read, create_time) VALUES
(6, '您的评论收到了回复', '您对文章《2023年教育改革：新政策将如何影响学生发展》的评论收到了回复，点击查看。', 2, 0, '2023-05-15 10:45:00'),
(8, '您的评论很受欢迎', '您对文章《丽江：一场视觉与心灵的旅程》的评论获得了10个以上的点赞，继续加油！', 3, 1, '2023-05-16 13:00:00'),
(NULL, '端午节活动预告', '端午佳节即将到来，平台将举办"我的端午记忆"主题征文活动，欢迎广大用户参与。', 1, 0, '2023-05-20 11:30:00'),
(9, '您有一周未登录了', '亲爱的用户，您已有一周未登录平台，错过了许多精彩内容，点击查看。', 1, 0, '2023-05-25 16:45:00'),
(10, '您关注的作者发布了新文章', '您关注的作者"李旅行"发布了新文章《徒步川藏线：最美的风景在路上》，点击查看。', 1, 1, '2023-05-28 09:20:00');

