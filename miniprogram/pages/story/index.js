const session = require('../../utils/session.js');
const storyMaker = require('../../utils/story-maker.js');
const speak = require('../../utils/tts.js');

Page({
  data: { story: null, reading: -1, playing: false, progress: 0, lang: 'zh', showEn: false },
  onLoad() {
    const s = session.get();
    if (s.story) this.setData({ story: s.story });
    else this.make(0);
  },
  onUnload() { this.stop(); },
  make(seed) {
    const s = session.get(); this.stop(); this.setData({ story: null });
    storyMaker.make(s.objects, s.scene, seed).then(st => { session.set({ story: st }); this.setData({ story: st }); })
      .catch(() => wx.showToast({ title: '先去拍一张照片', icon: 'none' }));
  },
  again() { this.seed = (this.seed || 0) + 1; this.make(this.seed); },

  // 逐句朗读：当前句高亮 + 进度条
  play(from) {
    const st = this.data.story; if (!st) return;
    const run = this.run = (this.run || 0) + 1, en = this.data.lang === 'en';
    this.setData({ playing: true });
    const next = i => {
      if (run !== this.run) return;
      if (i >= st.lines.length) { this.setData({ playing: false, reading: -1, progress: 100 }); return; }
      this.setData({ reading: i, progress: Math.round(i / st.lines.length * 100) });
      speak(en ? st.lines[i].en : st.lines[i].zh, en ? 'en' : 'zh', () => setTimeout(() => next(i + 1), 250));
    };
    next(from || 0);
  },
  stop() { this.run = (this.run || 0) + 1; speak.stop(); this.setData({ playing: false, reading: -1 }); },
  toggle() { this.data.playing ? this.stop() : this.play(0); },
  readOne(e) { this.stop(); const i = +e.currentTarget.dataset.i, l = this.data.story.lines[i]; this.setData({ reading: i }); speak(this.data.lang === 'en' ? l.en : l.zh, this.data.lang === 'en' ? 'en' : 'zh', () => this.setData({ reading: -1 })); },
  switchLang() { this.stop(); this.setData({ lang: this.data.lang === 'en' ? 'zh' : 'en' }); },
  toggleEn() { this.setData({ showEn: !this.data.showEn }); },
  learn(e) { this.stop(); wx.navigateTo({ url: '/pages/learn/index?zh=' + encodeURIComponent(e.currentTarget.dataset.zh) }); }
});
