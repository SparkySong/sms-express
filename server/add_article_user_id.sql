-- 给 articles 表添加 user_id 字段，用于追踪文章作者
-- 普通用户只能编辑/删除自己的文章，管理员可以编辑/删除所有文章

ALTER TABLE articles ADD COLUMN user_id INT COMMENT '作者用户ID' AFTER author;

-- 添加外键约束
ALTER TABLE articles ADD CONSTRAINT fk_articles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 添加索引，方便按用户查询文章
ALTER TABLE articles ADD INDEX idx_user_id (user_id);
