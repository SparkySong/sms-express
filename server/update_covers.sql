-- ============================================
-- 更新文章封面图为本地已上传的真实图片
-- 执行方式：mysql -u root -p news_platform < server/update_covers.sql
-- ============================================

-- 查看当前文章ID和标题（先执行这条看看有哪些文章）
-- SELECT id, title, cover_url FROM articles;

-- 根据实际文章ID更新封面图（请根据你的实际数据调整ID）
UPDATE articles SET cover_url = 'http://127.0.0.1:3000/uploads/1780545625608-404665501.jpg' WHERE id = 1;
UPDATE articles SET cover_url = 'http://127.0.0.1:3000/uploads/1780561634313-641313292.jpg' WHERE id = 2;
UPDATE articles SET cover_url = 'http://127.0.0.1:3000/uploads/1780561644847-288142131.jpg' WHERE id = 3;
UPDATE articles SET cover_url = 'http://127.0.0.1:3000/uploads/1780561666910-124218338.jpg' WHERE id = 4;
UPDATE articles SET cover_url = 'http://127.0.0.1:3000/uploads/1780562564727-768046209.jpg' WHERE id = 5;
UPDATE articles SET cover_url = 'http://127.0.0.1:3000/uploads/1780562837695-133150932.jpg' WHERE id = 6;
UPDATE articles SET cover_url = 'http://127.0.0.1:3000/uploads/1780545625608-404665501.jpg' WHERE id = 7;
UPDATE articles SET cover_url = 'http://127.0.0.1:3000/uploads/1780561634313-641313292.jpg' WHERE id = 8;
UPDATE articles SET cover_url = 'http://127.0.0.1:3000/uploads/1780561644847-288142131.jpg' WHERE id = 9;
UPDATE articles SET cover_url = 'http://127.0.0.1:3000/uploads/1780561666910-124218338.jpg' WHERE id = 10;
UPDATE articles SET cover_url = 'http://127.0.0.1:3000/uploads/1780562564727-768046209.jpg' WHERE id = 11;

-- 验证更新结果
-- SELECT id, title, cover_url FROM articles;
