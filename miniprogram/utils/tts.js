// 朗读：微信同声传译插件（app.json 已声明 WechatSI）。onEnd 在读完（或失败）后回调，用于逐句读故事。
let plugin = null;
try { plugin = requirePlugin('WechatSI'); } catch (e) {}
const audio = wx.createInnerAudioContext();
let pending = null;
const finish = () => { const f = pending; pending = null; if (f) f(); };
audio.onEnded(finish);
audio.onError(finish);

function speak(text, lang, onEnd) {
  pending = null; audio.stop();
  if (!plugin) { wx.showToast({ title: '未启用朗读插件', icon: 'none' }); if (onEnd) onEnd(); return; }
  plugin.textToSpeech({
    lang: lang === 'en' ? 'en_US' : 'zh_CN', tts: true, content: text,
    success: r => { pending = onEnd || null; audio.src = r.filename; audio.play(); },
    fail: () => { wx.showToast({ title: '朗读失败', icon: 'none' }); if (onEnd) onEnd(); }
  });
}
speak.stop = () => { pending = null; audio.stop(); };
module.exports = speak;
