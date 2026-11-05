const L = require('../../utils/core/lexicon.js');
const P = require('../../utils/core/planner.js');
const AI = require('../../utils/core/ai.js');
const S = require('../../utils/core/srs.js');
const Demo = require('../../utils/core/demo.js');
const St = require('../../utils/core/story.js');
const ai = require('../../utils/ai-client.js');
const store = require('../../utils/store.js');
const speak = require('../../utils/tts.js');
const { StrokeAnimator } = require('../../utils/stroke.js');
const { pinyin } = require('../../utils/pinyin-pro.js');
const fs = wx.getFileSystemManager();

Page({
  data: { photo: '', aspect: '4 / 3', objects: [], sel: -1, cur: null, curChars: [], scanning: false, status: '', aiOk: false, manual: '', writing: false, story: null, storyLoading: false, showEn: false, reading: -1 },
  onShow() { const set = () => this.setData({ aiOk: ai.can('vision') }); set(); (getApp().ready || Promise.resolve()).then(set); },
  onReady() {
    wx.createSelectorQuery().select('#work').fields({ node: true }).exec(r => { this.work = r[0].node; });
  },

  choose() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['camera', 'album'], sizeType: ['compressed'],
      success: r => {
        const f = r.tempFiles[0];
        wx.compressImage({ src: f.tempFilePath, quality: 80, compressedWidth: 1280,
          success: c => this.usePhoto(c.tempFilePath), fail: () => this.usePhoto(f.tempFilePath) });
      }
    });
  },
  usePhoto(path) {
    wx.getImageInfo({ src: path, success: info => {
      this.scene = '';
      this.resetStory(); this.setData({ photo: path, aspect: info.width + ' / ' + info.height, objects: [], sel: -1, cur: null });
      if (!ai.can('vision')) { this.setData({ status: '还没有配置看图模型（DeepSeek 不能看图）：点照片上的东西，再输入词语手动标注，标完照样生成小故事。' }); return; }
      const base64 = fs.readFileSync(path, 'base64');
      this.setData({ scanning: true, status: '正在识别…' });
      const t0 = Date.now();
      ai.call(AI.visionMessages({ max: 8 }), { mediaType: 'image/jpeg', base64 }).then(t => {
        const r = AI.normalizeVision(P.extractJSON(t));
        r.objects.forEach(o => { if (!o.pinyin) o.pinyin = pinyin(o.zh); });
        this.scene = r.scene;
        this.setData({ objects: r.objects, status: (r.scene ? r.scene + '：' : '') + '找到 ' + r.objects.length + ' 样东西，用时 ' + ((Date.now() - t0) / 1000).toFixed(1) + ' 秒' }, () => this.makeStory());
      }).catch(e => this.setData({ status: '识别失败：' + e.message })).then(() => this.setData({ scanning: false }));
    } });
  },
  demo() {
    const c = this.work; c.width = Demo.W; c.height = Demo.H;
    Demo.draw(c.getContext('2d'));
    wx.canvasToTempFilePath({ canvas: c, fileType: 'jpg', quality: 0.9, success: r => {
      this.scene = Demo.scene;
      this.resetStory();
      this.setData({ photo: r.tempFilePath, aspect: '4 / 3', objects: [], sel: -1, cur: null, scanning: true, status: '正在识别…' });
      setTimeout(() => {
        const objs = Demo.objects(L);
        this.setData({ scanning: false, objects: objs, status: '冰箱里：找到 ' + objs.length + ' 样东西（示例数据）' }, () => this.makeStory());
      }, 1200);
    } });
  },

  // 手动标注
  tapPhoto(e) {
    if (this.data.aiOk) return;
    wx.createSelectorQuery().select('.photo').boundingClientRect(rect => {
      const x = (e.detail.x - rect.left) / rect.width * 1000, y = (e.detail.y - rect.top) / rect.height * 1000;
      this.pending = [x - 90, y - 90, x + 90, y + 90].map(v => Math.max(0, Math.min(1000, v)));
      this.setData({ status: '位置已记下，输入这个东西叫什么' });
    }).exec();
  },
  onManual(e) { this.setData({ manual: e.detail.value }); },
  addManual() {
    const zh = this.data.manual.trim(); if (!zh) return;
    const t = L.thing(zh) || {};
    const o = { id: 'm' + Date.now(), zh, pinyin: t.pinyin || pinyin(zh), en: t.en || '', emoji: t.emoji || '', sentence: t.sentence || '', sentence_en: '', box: this.pending || [400, 400, 600, 600] };
    this.pending = null;
    this.setData({ objects: this.data.objects.concat([o]), manual: '' }, () => { this.select({ currentTarget: { dataset: { i: this.data.objects.length - 1 } } }); this.makeStory(); });
  },

  select(e) {
    const i = +e.currentTarget.dataset.i, o = this.data.objects[i];
    const chars = Array.from(o.zh);
    this.setData({ sel: i, cur: o, curChars: chars, writing: false }, () => {
      this.addToDeck(o);
      speak(o.zh, 'zh');
      const q = wx.createSelectorQuery();
      chars.forEach((_, k) => q.select('#w' + k).fields({ node: true, size: true }));
      q.exec(res => {
        const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 2;
        this.anims = res.map((r, k) => {
          r.node.width = r.width * dpr; r.node.height = r.height * dpr;
          const a = new StrokeAnimator(r.node, r.width, { ink: '#1D2622', outline: '#E4E7E2', active: '#B5432F' });
          a.setChar(chars[k]); return a;
        });
      });
    });
  },
  animate() {
    this.setData({ writing: false });
    let k = 0; const run = () => { const a = this.anims && this.anims[k]; if (!a) return; a.animate(() => { k++; setTimeout(run, 250); }); }; run();
  },
  practice() { this.setData({ writing: true }); (this.anims || []).forEach(a => a.outlineOnly()); },
  ts(e) { if (!this.data.writing) return; const t = e.touches[0]; this.last = { i: e.currentTarget.dataset.i, x: t.x, y: t.y }; },
  tm(e) {
    if (!this.data.writing || !this.last) return;
    const a = this.anims[this.last.i], t = e.touches[0], ctx = a.ctx, dpr = a.canvas.width / a.size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = '#2E6A58'; ctx.lineWidth = a.size * 0.07; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(this.last.x, this.last.y); ctx.lineTo(t.x, t.y); ctx.stroke();
    this.last.x = t.x; this.last.y = t.y;
  },

  sayZh() { const o = this.data.cur; speak(o.zh + '。' + (o.sentence || ''), 'zh'); },
  sayEn() { speak(this.data.cur.en, 'en'); },

  crop(o) {
    return new Promise(resolve => {
      const c = wx.createOffscreenCanvas({ type: '2d', width: 200, height: 200 }), g = c.getContext('2d'), img = c.createImage();
      img.onload = () => {
        const W = img.width, H = img.height, b = o.box;
        const x = b[0] / 1000 * W, y = b[1] / 1000 * H, w = (b[2] - b[0]) / 1000 * W, h = (b[3] - b[1]) / 1000 * H, side = Math.max(w, h) * 1.15;
        g.fillStyle = '#fff'; g.fillRect(0, 0, 200, 200);
        g.drawImage(img, x + w / 2 - side / 2, y + h / 2 - side / 2, side, side, 0, 0, 200, 200);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve('');
      img.src = this.data.photo;
    });
  },
  addToDeck(o) {
    return this.crop(o).then(thumb => {
      const deck = store.get('deck', []);
      S.add(deck, { zh: o.zh, pinyin: o.pinyin, en: o.en, emoji: o.emoji, sentence: o.sentence, sentence_en: o.sentence_en, thumb, scene: this.scene });
      store.set('deck', deck);
    });
  },
  addAll() {
    this.data.objects.reduce((p, o) => p.then(() => this.addToDeck(o)), Promise.resolve())
      .then(() => wx.showToast({ title: '已加入 ' + this.data.objects.length + ' 个词' }));
  },
  // ---------- 拍照小故事：识别完自动生成 ----------
  resetStory() { this.storyRun = (this.storyRun || 0) + 1; speak.stop(); this.story = null; this.setData({ story: null, storyLoading: false, reading: -1 }); },
  makeStory(again) {
    const objs = this.data.objects; if (!objs.length) return;
    if (again) this.storySeed = (this.storySeed || 0) + 1;
    const run = this.storyRun = (this.storyRun || 0) + 1;
    const show = st => { if (run === this.storyRun) this.showStory(St.ensureWords(st)); };
    const fallback = () => show(St.offline(objs, this.scene, this.storySeed || 0));
    if (!ai.available()) return fallback();
    this.setData({ storyLoading: true, story: null });
    const m = St.storyMessages(objs, this.scene);
    ai.call(m).then(t => { const st = St.normalize(P.extractJSON(t), m.words); if (!st.lines.length) throw new Error('empty'); show(st); })
      .catch(fallback).then(() => this.setData({ storyLoading: false }));
  },
  showStory(st) {
    st.view = st.lines.map(l => ({
      en: l.en,
      segs: St.segments(l.zh, st.words).map(g => g.w === undefined ? { t: g.t } : { t: g.t, w: g.w, py: st.words[g.w].pinyin, emoji: st.words[g.w].emoji || '' })
    }));
    this.story = st;
    this.setData({ story: st, reading: -1 });
  },
  readStory(e) {
    const st = this.story; if (!st) return;
    const en = e.currentTarget.dataset.lang === 'en';
    if (en) this.setData({ showEn: true });
    let i = 0;
    const next = () => {
      if (i >= st.lines.length) { this.setData({ reading: -1 }); return; }
      this.setData({ reading: i });
      const l = st.lines[i++];
      speak(en ? l.en : l.zh, en ? 'en' : 'zh', () => setTimeout(next, 250));
    };
    next();
  },
  toggleEn() { this.setData({ showEn: !this.data.showEn }); },
  newStory() { this.makeStory(true); },
  tapStoryWord(e) {
    const zh = e.currentTarget.dataset.zh, i = this.data.objects.findIndex(o => o.zh === zh);
    if (i >= 0) this.select({ currentTarget: { dataset: { i } } });
  },
  onHide() { (this.anims || []).forEach(a => a.stop()); speak.stop(); }
});
