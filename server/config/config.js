require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'news-platform-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  
  // 分页配置
  pagination: {
    defaultLimit: 10,
    maxLimit: 50
  },
  
  // 微信小程序配置
  wechat: {
    appId: process.env.WECHAT_APPID || 'wxfc125c7e60599fc1',
    appSecret: process.env.WECHAT_SECRET || '4dc426481179aaf92715cf1608f2500f'
  },
  
  // 阿里云OSS配置
  oss: {
    region: process.env.OSS_REGION || 'oss-cn-chengdu',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || 'LTAI5t8tFKeqBEWDoCaVpPsP',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || 'YniGPjILmFo3KmMUkyBNa61BOwQNkX',
    bucket: process.env.OSS_BUCKET || 'toursmi',
    directory: process.env.OSS_DIRECTORY || 'user-avatars',
    endpoint: process.env.OSS_ENDPOINT || 'oss-cn-chengdu.aliyuncs.com',
    cdnDomain: process.env.OSS_CDN_DOMAIN || 'toursmi.oss-cn-chengdu.aliyuncs.com'
  }
}; 