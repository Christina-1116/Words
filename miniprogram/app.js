App({
  onLaunch() {
    if (wx.cloud) { try { wx.cloud.init({ traceUser: false }); } catch (e) {} }
    require('./utils/fonts.js')();
    this.ready = require('./utils/ai-client.js').refresh(); // 查询云函数里配了哪些模型
  }
});
