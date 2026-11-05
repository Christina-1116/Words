const L = require('../../utils/core/lexicon.js');
const St = require('../../utils/core/story.js');
const session = require('../../utils/session.js');
const deck = require('../../utils/deck.js');
const store = require('../../utils/store.js');
const speak = require('../../utils/tts.js');
const { StrokeAnimator } = require('../../utils/stroke.js');
const { pinyin } = require('../../utils/pinyin-pro.js');

Page({
  data: { w: {}, chars: [], cur: 0, step: 0, total: 0, writing: false, inDeck: false, sentSegs: [], tip: '' },

  onLoad(q) {
    const zh = decodeURIComponent(q.zh || '');
    // 词的来源：本次拍照 → 复习牌组 → 内置物品词典
    const card = store.get('deck', []).find(c => c.id === zh);
    const t = L.thing(zh) || {};
    const w = session.find(zh) || card || { zh, pinyin: t.pinyin || pinyin(zh), en: t.en || '', emoji: t.emoji || '', sentence: t.sentence || '' };
    const chars = Array.from(w.zh);
    this.setData({ w, chars, sentSegs: w.sentence ? St.segments(w.sentence, [{ zh: w.zh }]).map(g => ({ t: g.t, w: g.w !== undefined })) : [] });
    if (!card) deck.add(w, session.get().photo, session.get().scene).then(() => this.setData({ inDeck: true }));
    else this.setData({ inDeck: true });
  },
  onReady() {
    const q = wx.createSelectorQuery();
    this.data.chars.forEach((_, k) => q.select('#w' + k).fields({ node: true, size: true }));
    q.exec(res => {
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio;
      this.anims = res.map((r, k) => {
        r.node.width = r.width * dpr; r.node.height = r.height * dpr;
        const a = new StrokeAnimator(r.node, r.width, { ink: '#2B2420', outline: '#E8DECD', active: '#E8743B' });
        a.ready = a.setChar(this.data.chars[k]); return a;
      });
      Promise.all(this.anims.map(a => a.ready)).then(() => { this.setTip(0); this.say(); this.animateFrom(0); });
    });
  },
  onUnload() { (this.anims || []).forEach(a => a.stop()); speak.stop(); },

  setTip(k) {
    const ch = this.data.chars[k], a = this.anims && this.anims[k], n = a && a.strokes;
    const fam = L.expand(ch);
    const tip = fam ? '「' + ch + '」还能组成 ' + fam.words.slice(0, 3).map(x => x.word).join('、') + '……点我看「' + ch + '」字家族！'
      : n ? '「' + ch + '」一共 ' + n + ' 笔，跟着橙色的笔画写一写～' : '跟着读一读，再写一写～';
    this.setData({ cur: k, total: n || 0, step: 0, tip });
  },
  // 依次播放每个字的笔顺；只看一个字时传 only
  animateFrom(k, only) {
    const a = this.anims && this.anims[k]; if (!a) return;
    this.setData({ writing: false }); this.setTip(k);
    a.animate(() => { if (!only && k + 1 < this.anims.length) setTimeout(() => this.animateFrom(k + 1), 300); },
      (i, n) => this.setData({ step: i + 1, total: n }));
  },
  animate() { this.animateFrom(0); },
  pickChar(e) { if (this.data.writing) return; this.animateFrom(+e.currentTarget.dataset.i, true); },

  practice() { this.setData({ writing: true, step: 0 }); (this.anims || []).forEach(a => { a.stop(); a.outlineOnly(); }); },
  ts(e) { if (!this.data.writing) return; const t = e.touches[0]; this.last = { i: +e.currentTarget.dataset.i, x: t.x, y: t.y }; },
  tm(e) {
    if (!this.data.writing || !this.last) return;
    const a = this.anims[this.last.i], t = e.touches[0], ctx = a.ctx, dpr = a.canvas.width / a.size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = '#2B2420'; ctx.lineWidth = a.size * 0.075; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(this.last.x, this.last.y); ctx.lineTo(t.x, t.y); ctx.stroke();
    this.last.x = t.x; this.last.y = t.y;
  },

  say() { speak(this.data.w.zh, 'zh'); },
  sayEn() { if (this.data.w.en) speak(this.data.w.en, 'en'); },
  saySentence() { speak(this.data.w.sentence, 'zh'); },
  openFamily() {
    const ch = this.data.chars[this.data.cur];
    if (!L.expand(ch)) return;
    getApp().familyChar = ch; wx.switchTab({ url: '/pages/family/index' });
  }
});
