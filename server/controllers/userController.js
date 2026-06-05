const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const config = require('../config/config');
const response = require('../utils/response');
const logger = require('../utils/logger');
const fetch = require('node-fetch');
const { pool } = require('../config/db');


/**
 * 用户控制器
 */
class UserController {
  /**
   * 用户注册
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async register(req, res) {
    try {
      const { username, password, nickname } = req.body;

      // 参数验证
      if (!username || !password) {
        return response.validationError(res, null, '用户名和密码不能为空');
      }

      // 检查用户名是否已存在
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser) {
        return response.validationError(res, null, '用户名已存在');
      }

      // 创建用户
      const userData = {
        username,
        password,
        nickname: nickname || username,
        status: 1
      };

      const user = await UserModel.create(userData);

      // 返回成功响应，但不包含密码
      return response.created(res, {
        id: user.id,
        username: user.username,
        nickname: user.nickname
      }, '注册成功');
    } catch (error) {
      logger.error(`用户注册失败: ${error.message}`);
      return response.error(res, 500, '注册失败，请重试');
    }
  }

  /**
   * 用户登录
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // 参数验证
      if (!username || !password) {
        return response.validationError(res, null, '用户名和密码不能为空');
      }

      // 查找用户
      const user = await UserModel.findByUsername(username, true);
      if (!user) {
        return response.unauthorized(res, '用户名或密码错误');
      }

      // 验证密码
      const isMatch = await UserModel.verifyPassword(password, user.password);
      if (!isMatch) {
        return response.unauthorized(res, '用户名或密码错误');
      }

      // 验证账号状态
      if (user.status !== 1) {
        return response.forbidden(res, '账号已被禁用');
      }

      // 更新最后登录时间
      await UserModel.updateLastLoginTime(user.id);

      // 生成JWT令牌
      const token = jwt.sign(
        { id: user.id },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // 返回成功响应
      return response.success(res, {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          role: user.role || 'user'
        }
      }, '登录成功');
    } catch (error) {
      logger.error(`用户登录失败: ${error.message}`);
      return response.error(res, 500, '登录失败，请重试');
    }
  }

  /**
   * 微信登录
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async wechatLogin(req, res) {
    try {
      const { code, nickname, avatar_url, gender } = req.body;

      if (!code) {
        return response.validationError(res, null, '微信登录code不能为空');
      }

      // 获取微信小程序配置
      const appId = config.wechat.appId;
      const appSecret = config.wechat.appSecret;

      // 请求微信API获取openid
      let openid = '';
      try {
        // 微信小程序登录凭证校验接口
        const wxApiUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

        // 发起HTTP请求获取微信openid
        const wxResponse = await fetch(wxApiUrl);
        const wxResult = await wxResponse.json();

        if (wxResult.errcode) {
          logger.error(`请求微信API失败: ${JSON.stringify(wxResult)}`);
          return response.error(res, 500, '微信登录验证失败');
        }

        openid = wxResult.openid;
      } catch (wxError) {
        logger.error(`请求微信API异常: ${wxError.message}`);
        return response.error(res, 500, '微信登录验证异常');
      }

      if (!openid) {
        return response.error(res, 500, '获取微信用户标识失败');
      }

      // 查找用户
      let user = await UserModel.findByOpenId(openid);

      // 如果用户不存在，则创建
      if (!user) {
        // 使用随机用户名前缀，避免冲突
        const randomPrefix = Math.random().toString(36).substring(2, 6);
        const username = `wx_${randomPrefix}_${Date.now()}`;

        user = await UserModel.create({
          openid,
          username,
          nickname: nickname || username,
          avatar_url,
          gender,
          status: 1
        });
      } else {
        // 更新用户信息
        if (nickname || avatar_url) {
          const updateData = {};
          if (nickname) updateData.nickname = nickname;
          if (avatar_url) updateData.avatar_url = avatar_url;
          if (gender !== undefined) updateData.gender = gender;

          await UserModel.update(user.id, updateData);
        }

        // 更新最后登录时间
        await UserModel.updateLastLoginTime(user.id);
      }

      // 生成JWT令牌
      const token = jwt.sign(
        { id: user.id },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // 返回成功响应
      return response.success(res, {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          role: user.role || 'user'
        }
      }, '登录成功');
    } catch (error) {
      logger.error(`微信登录失败: ${error.message}`);
      return response.error(res, 500, '登录失败，请重试');
    }
  }

  /**
   * 获取当前用户信息
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getCurrentUser(req, res) {
    try {
      const userId = req.user.id;

      const user = await UserModel.findById(userId);
      if (!user) {
        return response.notFound(res, '用户不存在');
      }

      return response.success(res, {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        gender: user.gender,
        phone: user.phone,
        register_time: user.register_time,
        last_login_time: user.last_login_time
      });
    } catch (error) {
      logger.error(`获取用户信息失败: ${error.message}`);
      return response.error(res, 500, '获取用户信息失败');
    }
  }

  /**
   * 更新用户信息
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async updateUserInfo(req, res) {
    try {
      const userId = req.user.id;
      const { nickname, avatar_url, gender, phone } = req.body;

      // 构建更新数据
      const updateData = {};
      if (nickname !== undefined) updateData.nickname = nickname;
      if (avatar_url !== undefined) updateData.avatar_url = avatar_url;
      if (gender !== undefined) updateData.gender = gender;
      if (phone !== undefined) updateData.phone = phone;

      // 如果没有要更新的字段
      if (Object.keys(updateData).length === 0) {
        return response.validationError(res, null, '没有提供需要更新的字段');
      }

      // 更新用户信息
      const updatedUser = await UserModel.update(userId, updateData);

      return response.success(res, {
        id: updatedUser.id,
        username: updatedUser.username,
        nickname: updatedUser.nickname,
        avatar_url: updatedUser.avatar_url,
        gender: updatedUser.gender,
        phone: updatedUser.phone
      }, '更新成功');
    } catch (error) {
      logger.error(`更新用户信息失败: ${error.message}`);
      return response.error(res, 500, '更新用户信息失败');
    }
  }

  /**
   * 修改密码
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { oldPassword, newPassword } = req.body;

      // 参数验证
      if (!oldPassword || !newPassword) {
        return response.validationError(res, null, '原密码和新密码不能为空');
      }

      // 获取用户信息
      const user = await UserModel.findById(userId, true);
      if (!user) {
        return response.notFound(res, '用户不存在');
      }

      // 验证原密码
      const isMatch = await UserModel.verifyPassword(oldPassword, user.password);
      if (!isMatch) {
        return response.validationError(res, null, '原密码错误');
      }

      // 更新密码
      await UserModel.update(userId, { password: newPassword });

      return response.success(res, null, '密码修改成功');
    } catch (error) {
      logger.error(`修改密码失败: ${error.message}`);
      return response.error(res, 500, '修改密码失败');
    }
  }

  /**
   * 获取用户统计信息
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async getUserStats(req, res) {
    try {
      const userId = req.user.id;

      // 获取阅读历史数量
      const [historyResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM read_history WHERE user_id = ?',
        [userId]
      );
      const historyCount = historyResult[0].count;

      // 获取收藏数量
      const [favoriteResult] = await pool.execute(
        'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
        [userId]
      );
      const favoriteCount = favoriteResult[0].count;

      return response.success(res, {
        readCount: historyCount,
        favoriteCount: favoriteCount,
        historyCount: historyCount
      });
    } catch (error) {
      logger.error(`获取用户统计信息失败: ${error.message}`);
      return response.error(res, 500, '获取用户统计信息失败');
    }
  }

  /**
   * 上传头像
   * @param {Request} req - 请求对象
   * @param {Response} res - 响应对象
   */
  async uploadAvatar(req, res) {
    const userId = req.user.id;

    try {
      // 检查是否有文件上传
      if (!req.file) {
        return response.validationError(res, null, '请选择要上传的文件');
      }

      const file = req.file;
      const fileName = file.filename;

      // 本地存储模式：直接使用上传后的文件名生成URL
      const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;

      // 更新用户头像
      await UserModel.update(userId, { avatar_url: avatarUrl });

      logger.info(`头像上传成功: ${avatarUrl}`);

      // 返回成功响应
      return response.success(res, { avatar_url: avatarUrl }, '头像上传成功');
    } catch (error) {
      logger.error(`头像上传失败: ${error.message}`);
      return response.error(res, 500, '头像上传失败，请重试');
    }
  }
}

module.exports = new UserController();