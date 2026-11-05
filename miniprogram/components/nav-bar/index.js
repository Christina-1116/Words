// 自定义导航栏：标题用可爱字体，右侧插槽放状态标签；自动避开胶囊按钮
Component({
  options: { multipleSlots: false },
  properties: { title: String, back: Boolean },
  data: { top: 20, height: 44, capsule: 100 },
  lifetimes: {
    attached() {
      const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      let rect = null; try { rect = wx.getMenuButtonBoundingClientRect(); } catch (e) {}
      const top = win.statusBarHeight || 20;
      const height = rect ? (rect.top - top) * 2 + rect.height : 44;
      this.setData({ top, height, capsule: rect ? win.windowWidth - rect.left + 8 : 100 });
    }
  },
  methods: { goBack() { getCurrentPages().length > 1 ? wx.navigateBack() : wx.switchTab({ url: '/pages/home/index' }); } }
});
