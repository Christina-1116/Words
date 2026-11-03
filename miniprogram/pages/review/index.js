const S = require('../../utils/core/srs.js');
const store = require('../../utils/store.js');
const speak = require('../../utils/tts.js');

Page({
  data: { st: {}, deck: [], state: 'done', card: null, opts: [], marks: {}, nextLabel: '' },
  onShow() { this.refresh(); },
  refresh() {
    const deck = store.get('deck', []), due = S.due(deck), st = S.stats(deck);
    const list = deck.slice().sort((a, b) => a.due - b.due).map(c => Object.assign({}, c, { next: S.nextLabel(c) }));
    const base = { st, deck: list, marks: {} };
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
    if (id !== card.id) { this.mistakes++; this.setData({ ['marks.' + id]: 'wrong' }); return; }
    this.answered = true; this.setData({ ['marks.' + id]: 'right' }); speak(card.zh, 'zh');
    const deck = store.get('deck', []);
    deck.forEach(c => { if (c.id === card.id) S.grade(c, this.mistakes ? 'again' : 'good'); });
    store.set('deck', deck);
    setTimeout(() => this.refresh(), 1100);
  },
  goSnap() { wx.switchTab({ url: '/pages/snap/index' }); }
});
