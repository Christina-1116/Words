const S = require('../../utils/core/srs.js');
const store = require('../../utils/store.js');
const study = require('../../utils/study.js');
const speak = require('../../utils/tts.js');
const DAY = 864e5, W = ['日', '一', '二', '三', '四', '五', '六'];

Page({
  data: { st: {}, deck: [], state: 'done', card: null, opts: [], marks: {}, nextLabel: '', beads: [], days: [], showList: false },
  onShow() {
    if (this.getTabBar) this.getTabBar().setData({ selected: 3 });
    const deck = store.get('deck', []);
    this.session = { total: S.due(deck).length, results: [] }; // 本轮进度珠
    this.refresh();
  },
  refresh() {
    const deck = store.get('deck', []), due = S.due(deck), st = S.stats(deck);
    const list = deck.slice().sort((a, b) => a.due - b.due).map(c => Object.assign({}, c, { next: S.nextLabel(c) }));
    // 未来 7 天每天到期几个
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, i) => {
      const t0 = start.getTime() + i * DAY, t1 = t0 + DAY, d = new Date(t0);
      const n = deck.filter(c => (i === 0 ? c.due < t1 : c.due >= t0 && c.due < t1)).length;
      return { d: d.getDate(), w: i === 0 ? '今天' : '周' + W[d.getDay()], n, cls: i === 0 ? 't' : n ? 'h' : '' };
    });
    const ss = this.session, beads = Array.from({ length: Math.min(12, Math.max(ss.total, ss.results.length)) }, (_, i) => ss.results[i] || (i === ss.results.length ? 'n' : ''));
    const base = { st, deck: list, marks: {}, days, beads };
    if (deck.length < 2) return this.setData(Object.assign(base, { state: 'few' }));
    if (!due.length) return this.setData(Object.assign(base, { state: 'done', nextLabel: list[0] ? list[0].next : '' }));
    const card = due[0], opts = S.distractors(deck, card, 3).concat([card]).sort(() => Math.random() - 0.5);
    this.mistakes = 0; this.answered = false;
    this.setData(Object.assign(base, { state: 'quiz', card, opts }));
  },
  hear() { speak(this.data.card.zh, 'zh'); },
  answer(e) {
    if (this.answered) return;
    const id = e.currentTarget.dataset.id, card = this.data.card;
    if (id !== card.id) { this.mistakes++; this.setData({ ['marks.' + id]: 'no' }); return; }
    this.answered = true; this.setData({ ['marks.' + id]: 'ok' }); speak(card.zh, 'zh');
    const deck = store.get('deck', []);
    deck.forEach(c => { if (c.id === card.id) S.grade(c, this.mistakes ? 'again' : 'good'); });
    store.set('deck', deck); study.mark(1);
    this.session.results.push(this.mistakes ? 'x' : 'f');
    setTimeout(() => this.refresh(), 1100);
  },
  toggleList() { this.setData({ showList: !this.data.showList }); },
  learn(e) { wx.navigateTo({ url: '/pages/learn/index?zh=' + encodeURIComponent(e.currentTarget.dataset.zh) }); },
  goSnap() { wx.switchTab({ url: '/pages/snap/index' }); }
});
