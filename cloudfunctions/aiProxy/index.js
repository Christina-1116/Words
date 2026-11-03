// 云函数：代理大模型请求，Key 只放在云函数环境变量里（AI_KEY / AI_BASE / AI_MODEL / AI_PROVIDER）。
// 小程序端传 { system, user, image?: {mediaType, base64} }，这里复用 core/ai.js 的请求构造。
const https = require('https');
const AI = require('./ai.js'); // 部署前把 core/ai.js 复制到本目录（scripts/sync.js 会做）

function post(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({ hostname: u.hostname, path: u.pathname + u.search, method: 'POST', headers }, res => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('上游返回非 JSON：' + res.statusCode)); } });
    });
    req.on('error', reject); req.setTimeout(60000, () => req.destroy(new Error('上游超时')));
    req.end(JSON.stringify(body));
  });
}

exports.main = async (event) => {
  const cfg = {
    provider: process.env.AI_PROVIDER || 'openai',
    base: process.env.AI_BASE || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: process.env.AI_MODEL || 'qwen-vl-max',
    key: process.env.AI_KEY
  };
  if (!cfg.key) return { error: '云函数未配置 AI_KEY' };
  const r = AI.buildRequest(cfg, event.system, event.user, event.image);
  delete r.headers['anthropic-dangerous-direct-browser-access'];
  try { return { text: AI.parseResponse(cfg, await post(r.url, r.headers, r.body)) }; }
  catch (e) { return { error: e.message }; }
};
