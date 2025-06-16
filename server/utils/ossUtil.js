const OSS = require('ali-oss');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const logger = require('./logger');

/**
 * 阿里云OSS工具类
 */
class OssUtil {
  constructor() {
    this.client = new OSS({
      region: config.oss.region,
      accessKeyId: config.oss.accessKeyId,
      accessKeySecret: config.oss.accessKeySecret,
      bucket: config.oss.bucket,
      endpoint: config.oss.endpoint,
      secure: true // 使用HTTPS
    });
  }

  /**
   * 上传文件到OSS
   * @param {string} localFilePath - 本地文件路径
   * @param {string} fileName - 文件名，不包含路径
   * @returns {Promise<string>} 上传后的文件URL
   */
  async uploadFile(localFilePath, fileName) {
    try {
      // 确保文件存在
      if (!fs.existsSync(localFilePath)) {
        throw new Error(`文件不存在: ${localFilePath}`);
      }

      // 生成唯一的OSS文件名，使用时间戳+原始文件名
      const timestamp = Date.now();
      const fileExt = path.extname(fileName);
      const ossFileName = `${config.oss.directory}/${timestamp}_${fileName}`;

      // 上传文件到OSS
      const result = await this.client.put(ossFileName, localFilePath);
      
      if (result && result.url) {
        // 替换为CDN域名
        if (config.oss.cdnDomain) {
          const url = result.url.replace(
            /https?:\/\/[^\/]+/,
            `https://${config.oss.cdnDomain}`
          );
          return url;
        }
        return result.url;
      }

      throw new Error('上传文件返回的URL为空');
    } catch (error) {
      logger.error(`OSS上传文件失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 删除OSS上的文件
   * @param {string} fileUrl - 文件完整URL
   * @returns {Promise<boolean>} 删除是否成功
   */
  async deleteFile(fileUrl) {
    try {
      if (!fileUrl) return false;

      // 从URL提取OSS对象名
      let ossObjectName = fileUrl;
      if (fileUrl.includes('://')) {
        ossObjectName = fileUrl.split('/').slice(3).join('/');
      }

      // 删除文件
      await this.client.delete(ossObjectName);
      return true;
    } catch (error) {
      logger.error(`OSS删除文件失败: ${fileUrl}, ${error.message}`);
      return false;
    }
  }

  /**
   * 生成签名URL，可用于临时访问私有文件
   * @param {string} objectName - OSS对象名称
   * @param {number} expireSeconds - URL过期时间(秒)
   * @returns {Promise<string>} 签名URL
   */
  async generateSignedUrl(objectName, expireSeconds = 3600) {
    try {
      const url = await this.client.signatureUrl(objectName, {
        expires: expireSeconds
      });
      return url;
    } catch (error) {
      logger.error(`生成签名URL失败: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new OssUtil(); 