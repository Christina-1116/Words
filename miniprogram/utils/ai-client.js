// 大模型调用：默认走云函数 aiProxy（Key 在服务端）；「直连」只用于开发调试。
const AI = require('./core/ai.js');
const store = require('./store.js');

const DEFAULT = { mode: 'cloud', preset: 'deepseek', provider: 'openai', base: AI.PRESETS.deepseek.base, model: AI.PRESETS.deepseek.model, key: '' };
let status = null; // 云函数能力：{ text, vision }

function settings() { return Object.assign({}, DEFAULT, store.get('settings', {})); }

function cloud(data) {
  return wx.cloud.callFunction({ name: 'aiProxy', data }).then(r => r.result || {});
}

/** 查询能力（启动时调用一次）：文字模型 / 看图模型是否可用 */
function refresh() {
  const s = settings();
  if (s.mode !== 'cloud') { status = { text: !!s.key, vision: !!s.key && !!(AI.PRESETS[s.preset] || {}).vision }; return Promise.resolve(status); }
  return cloud({ action: 'status' }).then(r => (status = r), () => (status = { text: false, vision: false }));
}
const can = kind => !!(status && status[kind]);

function call(msgs, image) {
  const s = settings();
  if (s.mode === 'cloud') {
    return cloud({ system: msgs.system, user: msgs.user, image }).then(r => {
      if (r.error === 'NO_VISION') throw new Error('还没有配置看图模型');
      if (r.error) throw new Error(r.error);
      return r.text;
    });
  }
  if (!s.key) return Promise.reject(new Error('NO_KEY'));
  if (image && !(AI.PRESETS[s.preset] || {}).vision) return Promise.reject(new Error('当前模型不支持看图'));
  const req = AI.buildRequest(s, msgs.system, msgs.user, image);
  delete req.headers['anthropic-dangerous-direct-browser-access'];
  if (/deepseek/.test(s.base)) req.body.response_format = { type: 'json_object' };
  return new Promise((resolve, reject) => {
    wx.request({
      url: req.url, method: 'POST', header: req.headers, data: req.body, timeout: 60000,
      success: res => { try { resolve(AI.parseResponse(s, res.data)); } catch (e) { reject(e); } },
      fail: e => reject(new Error(e.errMsg || '网络错误'))
    });
  });
}

module.exports = { call, settings, refresh, can, available: () => can('text') };
