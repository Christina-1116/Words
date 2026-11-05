// 云函数 aiProxy：代理大模型请求，Key 只放在服务端，不进小程序包。
// 文字任务（字族策划、小故事）→ TEXT 模型（默认 DeepSeek）
// 看图任务（拍照识字）        → VISION 模型（需支持图片，推荐通义千问 VL）；未配置时返回 NO_VISION，前端改为手动标注
// 配置优先级：云函数环境变量 > secrets.js（不进 git）
const https = require('https');
const AI = require('./ai.js'); // scripts/sync.js 会从 core/ai.js 复制过来
let secrets = {};
try { secrets = require('./secrets.js'); } catch (e) {}

const env = (k, d) => process.env[k] || secrets[k] || d;
function cfg(kind) {
  if (kind === 'vision') return {
    provider: env('VISION_PROVIDER', 'openai'), base: env('VISION_BASE', 'https://dashscope.aliyuncs.com/compatible-mode/v1'),
    model: env('VISION_MODEL', 'qwen-vl-max'), key: env('VISION_KEY', '')
  };
  return {
    provider: env('TEXT_PROVIDER', 'openai'), base: env('TEXT_BASE', 'https://api.deepseek.com/v1'),
    model: env('TEXT_MODEL', 'deepseek-chat'), key: env('TEXT_KEY', '')
  };
}

function post(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url), data = JSON.stringify(body);
    headers['content-length'] = Buffer.byteLength(data);
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'POST', headers }, res => {
      let buf = ''; res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch (e) { reject(new Error('模型服务返回异常（HTTP ' + res.statusCode + '）')); } });
    });
    req.on('error', reject); req.setTimeout(55000, () => req.destroy(new Error('模型服务超时')));
    req.end(data);
  });
}

exports.main = async (event) => {
  const text = cfg('text'), vision = cfg('vision');
  if (event.action === 'status') return { text: !!text.key, vision: !!vision.key, textModel: text.model, visionModel: vision.key ? vision.model : '' };
  const kind = event.image ? 'vision' : 'text', c = kind === 'vision' ? vision : text;
  if (!c.key) return { error: kind === 'vision' ? 'NO_VISION' : 'NO_TEXT_KEY' };
  const r = AI.buildRequest(c, event.system, event.user, event.image);
  delete r.headers['anthropic-dangerous-direct-browser-access'];
  if (c.provider === 'openai' && /deepseek/.test(c.base)) r.body.response_format = { type: 'json_object' }; // 我们的提示词都要求输出 JSON
  try { return { text: AI.parseResponse(c, await post(r.url, r.headers, r.body)) }; }
  catch (e) { return { error: e.message }; }
};
