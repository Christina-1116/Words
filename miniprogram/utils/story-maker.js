// 拍照小故事：有文字模型（DeepSeek）就现编，否则用离线模板；结果整理成页面要用的结构
const St = require('./core/story.js');
const P = require('./core/planner.js');
const ai = require('./ai-client.js');

function view(st) {
  st.view = st.lines.map(l => ({
    en: l.en,
    segs: St.segments(l.zh, st.words).map(g => (g.w === undefined ? { t: g.t } : { t: g.t, w: g.w, py: st.words[g.w].pinyin, emoji: st.words[g.w].emoji || '' }))
  }));
  return st;
}

function make(objects, scene, seed) {
  const offline = () => view(St.ensureWords(St.offline(objects, scene, seed || 0)));
  if (!objects.length) return Promise.reject(new Error('没有词'));
  if (!ai.available()) return Promise.resolve(offline());
  const m = St.storyMessages(objects, scene);
  return ai.call(m).then(t => {
    const st = St.normalize(P.extractJSON(t), m.words);
    if (!st.lines.length) throw new Error('empty');
    return view(St.ensureWords(st));
  }).catch(offline);
}
module.exports = { make };
