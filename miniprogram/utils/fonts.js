// 可选：加载效果图里的字体（ZCOOL KuaiLe 标题 / Ma Shan Zheng 毛笔字）。
// 微信里要用自己 CDN 上的字体文件（需配置 downloadFile 合法域名）；不配置时自动用系统的圆体 / 楷体。
const FONTS = {
  // 'ZCOOL KuaiLe': 'https://你的CDN/fonts/ZCOOLKuaiLe-Regular.ttf',
  // 'Ma Shan Zheng': 'https://你的CDN/fonts/MaShanZheng-Regular.ttf'
};
module.exports = function loadFonts() {
  Object.keys(FONTS).forEach(family => wx.loadFontFace({ global: true, family, source: 'url("' + FONTS[family] + '")', scopes: ['webview', 'native'] }));
};
