// 复制为 secrets.js 并填入 Key（secrets.js 已在 .gitignore 中，不会提交）。
// 也可以不用这个文件，直接在云开发控制台 → 云函数 aiProxy → 环境变量 里配置同名变量（优先级更高）。
module.exports = {
  TEXT_KEY: 'sk-你的DeepSeekKey',          // 字族策划、小故事
  // TEXT_BASE: 'https://api.deepseek.com/v1', TEXT_MODEL: 'deepseek-chat',
  VISION_KEY: '',                           // 拍照识字：填通义千问 DashScope Key 后自动启用
  // VISION_BASE: 'https://dashscope.aliyuncs.com/compatible-mode/v1', VISION_MODEL: 'qwen-vl-max'
};
