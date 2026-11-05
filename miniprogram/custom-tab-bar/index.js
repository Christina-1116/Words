Component({
  data: {
    selected: 0,
    list: [
      { path: '/pages/home/index', text: '首页', glyph: '识' },
      { path: '/pages/snap/index', text: '拍照', glyph: '拍' },
      { path: '/pages/family/index', text: '字族', glyph: '族' },
      { path: '/pages/review/index', text: '复习', glyph: '习' }
    ]
  },
  methods: { go(e) { wx.switchTab({ url: this.data.list[e.currentTarget.dataset.i].path }); } }
});
