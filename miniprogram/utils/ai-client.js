// 大模型调用：云函数代理（推荐，Key 不进小程序包）或直连（需在后台配置 request 合法域名）。
const AI = require('./core/ai.js');
const store = require('./store.js');

function settings() {
  return store.get('settings', { mode: 'cloud', preset: 'qwen', provider: 'openai', base: AI.PRESETS.qwen.base, model: AI.PRESETS.qwen.model, key: '' });
}

function call(msgs, image) {
  const s = settings();
  if (s.mode === 'cloud') {
    return wx.cloud.callFunction({ name: 'aiProxy', data: { system: msgs.system, user: msgs.user, image } })
      .then(r => { if (r.result.error) throw new Error(r.result.error); return r.result.text; });
  }
  if (!s.key) return Promise.reject(new Error('NO_KEY'));
  const req = AI.buildRequest(s, msgs.system, msgs.user, image);
  delete req.headers['anthropic-dangerous-direct-browser-access'];
  return new Promise((resolve, reject) => {
    wx.request({
      url: req.url, method: 'POST', header: req.headers, data: req.body, timeout: 60000,
      success: res => { try { resolve(AI.parseResponse(s, res.data)); } catch (e) { reject(e); } },
      fail: e => reject(new Error(e.errMsg || '网络错误'))
    });
  });
}

function available() { const s = settings(); return s.mode === 'cloud' || !!s.key; }

module.exports = { call, settings, available };
