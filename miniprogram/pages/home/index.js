const S = require('../../utils/core/srs.js');
const store = require('../../utils/store.js');
const study = require('../../utils/study.js');
const speak = require('../../utils/tts.js');

Page({
  data: { today: {}, hello: '你好', due: 0, deckSize: 0, streak: 0, week: { list: [], total: 0 }, recent: [] },
  onShow() {
    if (this.getTabBar) this.getTabBar().setData({ selected: 0 });
    const h = new Date().getHours(), deck = store.get('deck', []);
    this.setData({
      today: study.todayChar(), hello: h < 11 ? '早上好' : h < 14 ? '中午好' : h < 18 ? '下午好' : '晚上好',
      due: S.due(deck).length, deckSize: deck.length, streak: study.streak(), week: study.week(), recent: store.get('recent', []).slice(0, 2)
    });
  },
  sayToday() { speak(this.data.today.char, 'zh'); },
  openToday() { getApp().familyChar = this.data.today.char; wx.switchTab({ url: '/pages/family/index' }); },
  goSnap() { wx.switchTab({ url: '/pages/snap/index' }); },
  goFamily() { this.openToday(); },
  goReview() { wx.switchTab({ url: '/pages/review/index' }); }
});
