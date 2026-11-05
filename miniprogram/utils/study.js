// 学习记录：打卡天数、本周、今日一字
const store = require('./store.js');
const L = require('./core/lexicon.js');
const pad = n => (n < 10 ? '0' : '') + n;
const dayKey = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

function mark(nWords) {
  const days = store.get('days', {}), k = dayKey(new Date());
  days[k] = (days[k] || 0) + (nWords || 1); store.set('days', days);
}
function streak() {
  const days = store.get('days', {}); let n = 0; const d = new Date();
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1); // 今天还没学，不算断
  while (days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function week() {
  const days = store.get('days', {}), now = new Date(), mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const names = ['一', '二', '三', '四', '五', '六', '日']; let total = 0;
  const list = names.map((name, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); const c = days[dayKey(d)] || 0; total += c; return { name, done: c > 0, today: dayKey(d) === dayKey(now) }; });
  return { list, total };
}
// 今日一字：按日期轮换内置词库
function todayChar() {
  const d = new Date(), i = (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % L.chars.length;
  return L.expand(L.chars[i]);
}
module.exports = { mark, streak, week, todayChar, dayKey };
