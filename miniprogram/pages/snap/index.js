const L = require('../../utils/core/lexicon.js');
const P = require('../../utils/core/planner.js');
const AI = require('../../utils/core/ai.js');
const Demo = require('../../utils/core/demo.js');
const ai = require('../../utils/ai-client.js');
const session = require('../../utils/session.js');
const deck = require('../../utils/deck.js');
const storyMaker = require('../../utils/story-maker.js');
const { pinyin } = require('../../utils/pinyin-pro.js');
const fs = wx.getFileSystemManager();
const SCENE_EMOJI = [[/冰箱/, '🧊'], [/书桌|桌/, '📚'], [/厨房/, '🍳'], [/玩具/, '🧸'], [/客厅/, '🛋️'], [/菜|超市/, '🥬']];

Page({
  data: { photo: '', aspect: '4 / 3', objects: [], scene: '', sceneEmoji: '📷', sel: '', scanning: false, status: '', cost: '', aiOk: false,
    manual: '', pending: null, added: false, storyReady: false, storyLoading: false },

  onShow() {
    if (this.getTabBar) this.getTabBar().setData({ selected: 1 });
    const set = () => this.setData({ aiOk: ai.can('vision') });
    set(); (getApp().ready || Promise.resolve()).then(set);
    if (!this.data.photo) this.setData({ status: '拍一张照片，我来告诉你上面的东西怎么读、怎么写～' });
  },
  onReady() { wx.createSelectorQuery().select('#work').fields({ node: true }).exec(r => { this.work = r[0] && r[0].node; }); },

  // ---------- 取图 ----------
  camera() { this.pick(['camera']); },
  album() { this.pick(['album']); },
  pick(sourceType) {
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType, sizeType: ['compressed'], success: r => {
      const f = r.tempFiles[0].tempFilePath;
      wx.compressImage({ src: f, quality: 80, compressedWidth: 1280, success: c => this.usePhoto(c.tempFilePath), fail: () => this.usePhoto(f) });
    } });
  },
  reset(photo, aspect) {
    this.storyRun = (this.storyRun || 0) + 1;
    session.set({ photo, scene: '', objects: [], story: null });
    this.setData({ photo, aspect, objects: [], scene: '', sel: '', pending: null, added: false, storyReady: false, storyLoading: false, cost: '' });
  },
  usePhoto(path) {
    wx.getImageInfo({ src: path, success: info => {
      this.reset(path, info.width + ' / ' + info.height);
      if (!ai.can('vision')) { this.setData({ status: '点一下照片上的东西，再在上面输入它的名字，我帮你贴上字。' }); return; }
      const base64 = fs.readFileSync(path, 'base64'), t0 = Date.now();
      this.setData({ scanning: true, status: '我在仔细看照片里有什么…' });
      ai.call(AI.visionMessages({ max: 8 }), { mediaType: 'image/jpeg', base64 }).then(t => {
        const r = AI.normalizeVision(P.extractJSON(t));
        r.objects.forEach(o => { if (!o.pinyin) o.pinyin = pinyin(o.zh); });
        this.showResult(r.objects, r.scene, '用时 ' + ((Date.now() - t0) / 1000).toFixed(1) + ' 秒');
      }).catch(e => this.setData({ status: '没认出来：' + e.message + '。可以点照片手动贴字。', aiOk: false }))
        .then(() => this.setData({ scanning: false }));
    } });
  },
  demo() {
    const c = this.work; if (!c) return;
    c.width = Demo.W; c.height = Demo.H; Demo.draw(c.getContext('2d'));
    wx.canvasToTempFilePath({ canvas: c, fileType: 'jpg', quality: 0.9, success: r => {
      this.reset(r.tempFilePath, '4 / 3');
      this.setData({ scanning: true, status: '我在仔细看照片里有什么…' });
      setTimeout(() => { this.setData({ scanning: false }); this.showResult(Demo.objects(L), Demo.scene, '示例数据'); }, 1200);
    } });
  },
  showResult(objects, scene, cost) {
    const objs = objects.map((o, i) => Object.assign({}, o, { top: Math.max(14, o.box[1] / 10 + 6), rot: ((i % 3) - 1) * 4 }));
    const em = (SCENE_EMOJI.find(x => x[0].test(scene || '')) || [0, '📷'])[1];
    session.set({ scene, objects: objs }); session.remember();
    this.setData({ objects: objs, scene, sceneEmoji: em, cost, status: objs.length ? '点一点贴纸，听它怎么读、看它怎么写～' : '这张照片里没找到能学的东西，换个角度再拍一张？' });
    this.makeStory();
  },

  // ---------- 小故事：识别完自动生成 ----------
  makeStory() {
    const run = this.storyRun = (this.storyRun || 0) + 1, s = session.get();
    if (!s.objects.length) return;
    this.setData({ storyLoading: true, storyReady: false });
    storyMaker.make(s.objects, s.scene, 0).then(st => {
      if (run !== this.storyRun) return;
      session.set({ story: st }); this.setData({ storyReady: true, storyLoading: false });
    }).catch(() => this.setData({ storyLoading: false }));
  },
  openStory() {
    if (!this.data.objects.length) { wx.showToast({ title: '先拍一张照片', icon: 'none' }); return; }
    wx.navigateTo({ url: '/pages/story/index' });
  },

  // ---------- 学一个词 ----------
  learn(e) {
    const zh = e.currentTarget.dataset.zh; this.setData({ sel: zh });
    wx.navigateTo({ url: '/pages/learn/index?zh=' + encodeURIComponent(zh) });
  },
  addAll() {
    const s = session.get();
    deck.addAll(s.objects, s.photo, s.scene).then(n => { this.setData({ added: true }); wx.showToast({ title: n ? '加入 ' + n + ' 个新词' : '都已经在复习里了', icon: 'none' }); });
  },

  // ---------- 手动贴字 ----------
  tapPhoto(e) {
    if (this.data.aiOk) return;
    wx.createSelectorQuery().select('.photo').boundingClientRect(rect => {
      const x = (e.detail.x - rect.left) / rect.width * 100, y = (e.detail.y - rect.top) / rect.height * 100;
      this.setData({ pending: { x, y } });
    }).exec();
  },
  onManual(e) { this.setData({ manual: e.detail.value }); },
  addManual() {
    const zh = this.data.manual.trim(); if (!zh) return;
    const p = this.data.pending || { x: 50, y: 50 }, t = L.thing(zh) || {};
    const box = [p.x * 10 - 90, p.y * 10 - 90, p.x * 10 + 90, p.y * 10 + 90].map(v => Math.max(0, Math.min(1000, v)));
    const o = { id: 'm' + Date.now(), zh, pinyin: t.pinyin || pinyin(zh), en: t.en || '', emoji: t.emoji || '', sentence: t.sentence || '', sentence_en: '', box };
    this.setData({ manual: '', pending: null });
    this.showResult(this.data.objects.concat([o]), this.data.scene || '照片里', '手动标注');
  }
});
