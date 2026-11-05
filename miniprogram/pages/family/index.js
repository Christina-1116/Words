const L = require('../../utils/core/lexicon.js');
const P = require('../../utils/core/planner.js');
const R = require('../../utils/core/render.js');
const ai = require('../../utils/ai-client.js');
const { pinyin } = require('../../utils/pinyin-pro.js');

const pinyinFn = t => pinyin(t);
const ASPECT = { '3:4': '3 / 4', '1:1': '1 / 1', '16:9': '16 / 9' };

Page({
  data: {
    chars: L.chars, ratios: ['3:4', '1:1', '16:9'], ratio: '3:4', aspect: '3 / 4', theme: 'persimmon', inputChar: '明', qcBad: 0,
    themes: ['persimmon', 'paper', 'mist', 'night'].map(k => Object.assign({ key: k }, R.THEMES[k])),
    panes: [{ key: 'words', name: '词组' }, { key: 'prompt', name: '提示词' }, { key: 'qc', name: '质检返工' }], pane: 'words',
    catZh: P.CAT_ZH, checklist: P.CHECKLIST, fixes: P.FIXES, qc: {},
    data: L.expand('明'), src: '内置词库', lang: 'en', textless: false, prompt: '', auto: [], loading: false
  },
  onShow() {
    if (this.getTabBar) this.getTabBar().setData({ selected: 2 });
    const c = getApp().familyChar; getApp().familyChar = '';
    if (c && c !== this.data.data.char) { this.setData({ inputChar: c }); this.generate(); }
  },
  onReady() {
    wx.createSelectorQuery().select('#poster').fields({ node: true, size: true }).exec(res => {
      this.canvas = res[0].node; this.draw();
    });
  },
  draw() {
    if (!this.canvas) return;
    const d = this.data.data, sz = P.SIZES[this.data.ratio];
    this.canvas.width = sz[0]; this.canvas.height = sz[1];
    R.draw(this.canvas.getContext('2d'), d, { width: sz[0], height: sz[1], theme: this.data.theme, brand: '识字工坊 · 每日一字', fonts: { zh: '"Ma Shan Zheng", "Kaiti SC", "STKaiti", "KaiTi", serif', latin: '"Noto Sans", "Helvetica Neue", sans-serif' } });
    const auto = P.autoCheck(d, pinyinFn);
    this.setData({
      prompt: P.imagePrompt(d, { ratio: this.data.ratio, theme: this.data.theme, lang: this.data.lang, textless: this.data.textless }),
      auto, qcBad: auto.filter(x => x.level !== 'ok').length
    });
  },
  onInput(e) { this.setData({ inputChar: e.detail.value }); },
  pick(e) { this.setData({ inputChar: e.currentTarget.dataset.c }); this.generate(); },
  generate() {
    const c = Array.from(this.data.inputChar || '')[0];
    if (!c) return;
    const d = L.expand(c);
    if (d) { this.setData({ data: d, src: '内置词库', qc: {} }, () => this.draw()); return; }
    if (!ai.available()) { wx.showModal({ title: '需要大模型', content: '内置词库没有「' + c + '」。去「模型设置」接入后可策划任意汉字。', confirmText: '去设置', success: r => r.confirm && this.goSettings() }); return; }
    this.setData({ loading: true });
    ai.call(P.planMessages(c)).then(t => {
      const d2 = P.normalize(P.extractJSON(t), c); if (!d2.pinyin) d2.pinyin = pinyinFn(c);
      this.setData({ data: d2, src: 'AI 策划', qc: {} }, () => this.draw());
    }).catch(e => wx.showToast({ title: '策划失败：' + e.message, icon: 'none' })).then(() => this.setData({ loading: false }));
  },
  setRatio(e) { const v = e.currentTarget.dataset.v; this.setData({ ratio: v, aspect: ASPECT[v] }, () => this.draw()); },
  setTheme(e) { this.setData({ theme: e.currentTarget.dataset.v }, () => this.draw()); },
  openQC() { this.setData({ pane: 'qc' }); },
  setPane(e) { this.setData({ pane: e.currentTarget.dataset.v }); },
  setLang(e) { this.setData({ lang: e.currentTarget.dataset.v }, () => this.draw()); },
  setTextless(e) { this.setData({ textless: e.currentTarget.dataset.v === '1' }, () => this.draw()); },
  mark(e) { const { id, v } = e.currentTarget.dataset; this.setData({ ['qc.' + id]: v }); },
  copyPrompt() { wx.setClipboardData({ data: this.data.prompt }); },
  copyFix(e) {
    const f = e.currentTarget.dataset.fix, d = this.data.data;
    const text = f === 'inpaint-center' ? P.inpaintPrompt(d, -1)
      : f === 'textless' ? P.imagePrompt(d, { ratio: this.data.ratio, theme: this.data.theme, lang: this.data.lang, textless: true })
      : f === 'inpaint-card' ? d.words.map((w, i) => w.word + '：' + P.inpaintPrompt(d, i)).join('\n')
      : this.data.prompt;
    wx.setClipboardData({ data: text });
  },
  save() {
    wx.canvasToTempFilePath({
      canvas: this.canvas, fileType: 'png',
      success: r => wx.saveImageToPhotosAlbum({ filePath: r.tempFilePath, success: () => wx.showToast({ title: '已保存' }), fail: () => wx.previewImage({ urls: [r.tempFilePath] }) })
    });
  },
  goSettings() { wx.navigateTo({ url: '/pages/settings/index' }); }
});
