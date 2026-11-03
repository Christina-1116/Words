// 朗读：微信同声传译插件（app.json 已声明 WechatSI）。不可用时静默。
let plugin = null;
try { plugin = requirePlugin('WechatSI'); } catch (e) {}
const audio = wx.createInnerAudioContext();
module.exports = function speak(text, lang) {
  if (!plugin) { wx.showToast({ title: '未启用朗读插件', icon: 'none' }); return; }
  plugin.textToSpeech({
    lang: lang === 'en' ? 'en_US' : 'zh_CN', tts: true, content: text,
    success: r => { audio.stop(); audio.src = r.filename; audio.play(); },
    fail: () => wx.showToast({ title: '朗读失败', icon: 'none' })
  });
};
