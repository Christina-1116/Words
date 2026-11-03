/**
 * 大模型请求构造 / 解析（与传输无关：Web 用 fetch，小程序用 wx.request）。
 * provider:
 *   'anthropic' —— Claude Messages API（浏览器直连需 anthropic-dangerous-direct-browser-access 头）
 *   'openai'    —— OpenAI 兼容接口：通义千问 DashScope、豆包方舟、DeepSeek、OpenAI 等
 * 生产环境请把 Key 放到自己的后端 / 云函数，前端只调代理。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HZAI = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var PRESETS = {
    claude:  { provider: 'anthropic', base: 'https://api.anthropic.com', model: 'claude-opus-5-5', vision: true, label: 'Claude' },
    qwen:    { provider: 'openai', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-vl-max', vision: true, label: '通义千问 VL' },
    doubao:  { provider: 'openai', base: 'https://ark.cn-beijing.volces.com/api/v3', model: '', vision: true, label: '豆包（填接入点 ID）' },
    deepseek:{ provider: 'openai', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat', vision: false, label: 'DeepSeek（仅文字）' },
    custom:  { provider: 'openai', base: '', model: '', vision: true, label: '自定义 / 自建代理' }
  };

  /** image: { mediaType:'image/jpeg', base64:'...' } 可选 */
  function buildRequest(cfg, system, user, image) {
    var base = String(cfg.base || '').replace(/\/+$/, '');
    if (cfg.provider === 'anthropic') {
      var content = [];
      if (image) content.push({ type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.base64 } });
      content.push({ type: 'text', text: user });
      return {
        url: base + '/v1/messages',
        headers: {
          'content-type': 'application/json',
          'x-api-key': cfg.key,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'server-side-fallback-2026-07-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: {
          model: cfg.model || 'claude-opus-5-5', max_tokens: 4000, system: system,
          output_config: { effort: 'low' }, fallbacks: 'default',
          messages: [{ role: 'user', content: content }]
        }
      };
    }
    var parts = image
      ? [{ type: 'image_url', image_url: { url: 'data:' + image.mediaType + ';base64,' + image.base64 } }, { type: 'text', text: user }]
      : user;
    return {
      url: base + '/chat/completions',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + cfg.key },
      body: { model: cfg.model, temperature: 0.3, messages: [{ role: 'system', content: system }, { role: 'user', content: parts }] }
    };
  }

  function parseResponse(cfg, json) {
    if (json && json.error) throw new Error(json.error.message || JSON.stringify(json.error));
    if (cfg.provider === 'anthropic') {
      if (json.stop_reason === 'refusal') throw new Error('模型拒绝了这次请求，请换一张照片或换个字再试');
      return (json.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
    }
    var c = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
    return Array.isArray(c) ? c.map(function (p) { return p.text || ''; }).join('') : (c || '');
  }

  /* ---------- 拍照识字 ---------- */
  function visionMessages(opts) {
    opts = opts || {};
    var max = opts.max || 8;
    return {
      system: '你是儿童识字老师兼视觉识别助手。只输出 JSON，不要解释。',
      user: [
        '看这张家里拍的照片，找出孩子能学的具体物品（最多 ' + max + ' 个，优先清晰、常见、可数的东西；不要人脸、不要品牌名、不要抽象概念）。',
        '每个物品给出：',
        '- zh：最常用的中文名（2~3 字优先，如「苹果」「酸奶」）',
        '- pinyin：带声调、按音节空格分隔',
        '- en：英文小写名词',
        '- emoji：1 个',
        '- box：物品在图中的位置 [x1,y1,x2,y2]，以图片宽高归一化到 0~1000 的整数',
        '- sentence：一句 4~10 岁孩子能读懂的中文短句（≤12 字，含这个词）',
        '- sentence_en：这句话的英文',
        '再给出 scene：这是哪里（如「冰箱里」「书桌上」）。',
        '格式：{"scene":"","objects":[{"zh":"","pinyin":"","en":"","emoji":"","box":[0,0,0,0],"sentence":"","sentence_en":""}]}'
      ].join('\n')
    };
  }

  function normalizeVision(raw) {
    var objs = (raw.objects || []).map(function (o, i) {
      var b = (o.box || o.bbox || [0, 0, 0, 0]).map(Number);
      var mx = Math.max.apply(null, b);
      if (mx > 0 && mx <= 1.0001) b = b.map(function (v) { return v * 1000; }); // 0~1 → 0~1000
      return {
        id: 'o' + i, zh: String(o.zh || '').trim(), pinyin: String(o.pinyin || '').trim(), en: String(o.en || '').trim(),
        emoji: o.emoji || '', sentence: o.sentence || '', sentence_en: o.sentence_en || '',
        box: [Math.min(b[0], b[2]), Math.min(b[1], b[3]), Math.max(b[0], b[2]), Math.max(b[1], b[3])].map(function (v) { return Math.max(0, Math.min(1000, v)); })
      };
    }).filter(function (o) { return o.zh; });
    return { scene: raw.scene || '', objects: objs };
  }

  return { PRESETS: PRESETS, buildRequest: buildRequest, parseResponse: parseResponse, visionMessages: visionMessages, normalizeVision: normalizeVision };
});
