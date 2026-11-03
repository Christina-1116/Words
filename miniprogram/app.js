App({
  onLaunch() {
    // 用云函数代理大模型时打开（需开通云开发，并在 cloudfunctions/aiProxy 配置 Key）
    if (wx.cloud) { try { wx.cloud.init({ traceUser: false }); } catch (e) {} }
  }
});
