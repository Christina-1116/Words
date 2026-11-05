const AI = require('../../utils/core/ai.js');
const ai = require('../../utils/ai-client.js');
const store = require('../../utils/store.js');
const keys = Object.keys(AI.PRESETS);

Page({
  data: { s: {}, can: {}, presetNames: keys.map(k => AI.PRESETS[k].label), presetIndex: 0 },
  onLoad() { const s = ai.settings(); this.setData({ s, presetIndex: Math.max(0, keys.indexOf(s.preset)) }); ai.refresh().then(can => this.setData({ can })); },
  setMode(e) { this.setData({ 's.mode': e.currentTarget.dataset.v }); },
  setPreset(e) {
    const k = keys[+e.detail.value], p = AI.PRESETS[k];
    this.setData({ presetIndex: +e.detail.value, 's.preset': k, 's.provider': p.provider, 's.base': p.base, 's.model': p.model });
  },
  edit(e) { this.setData({ ['s.' + e.currentTarget.dataset.k]: e.detail.value.trim() }); },
  save() { store.set('settings', this.data.s); ai.refresh().then(can => this.setData({ can })); wx.showToast({ title: '已保存' }); setTimeout(() => wx.navigateBack(), 600); }
});
