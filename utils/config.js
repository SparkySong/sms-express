/**
 * 服务器地址统一配置（全项目唯一入口，改地址只改这一个文件）
 *
 * 为什么需要两个地址？
 * - 开发者工具模拟器跑在你电脑上，127.0.0.1 就是电脑自己，可以直接访问
 * - 手机真机预览时，127.0.0.1 指的是「手机自己」（上面没有后端），必须用电脑的局域网 IP
 *
 * 换了 Wi-Fi / 电脑 IP 变了怎么办？
 * - 电脑上打开命令行（Win+R 输入 cmd），运行 ipconfig
 * - 找到「IPv4 地址」（形如 192.168.x.x，注意别用 172.31.x.x 开头的，那是虚拟网卡）
 * - 把下面的 PHONE_BASE_URL 换成新 IP 即可
 *
 * 真机预览前提：
 * - 手机和电脑必须连同一个 Wi-Fi
 * - 首次用手机访问时 Windows 防火墙可能弹窗，要点「允许」
 * - 开发者工具「详情 → 本地设置 → 不校验合法域名」保持勾选
 */
const DEVTOOLS_BASE_URL = 'http://127.0.0.1:3000/api/v1';
const PHONE_BASE_URL = 'http://192.168.202.18:3000/api/v1';

// 自动判断运行环境：模拟器用本机地址，真机用电脑局域网地址
function resolveBaseUrl() {
  try {
    const systemInfo = wx.getSystemInfoSync();
    return systemInfo.platform === 'devtools' ? DEVTOOLS_BASE_URL : PHONE_BASE_URL;
  } catch (e) {
    return DEVTOOLS_BASE_URL;
  }
}

const BASE_URL = resolveBaseUrl();

// 图片服务器根地址（去掉接口前缀 /api/v1），用于补全图片地址
const HOST_URL = BASE_URL.replace('/api/v1', '');

/**
 * 修复数据库里的旧图片地址
 * 早期数据的封面/头像地址写死了 http://127.0.0.1:3000/...，
 * 真机上无法访问，这里统一替换成当前环境能访问的主机。
 * 外链地址（如 OSS）原样返回，不做处理。
 */
function fixImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return url;
  }
  return url.replace(/^http:\/\/127\.0\.0\.1:3000/, HOST_URL);
}

module.exports = {
  BASE_URL,
  HOST_URL,
  fixImageUrl
};
