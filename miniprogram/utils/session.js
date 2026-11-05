// 当前这次拍照的数据（照片、场景、识别结果、故事）：拍照页写入，学习页/故事页读取。同时存一份「最近拍的」。
const store = require('./store.js');
const S = { photo: '', scene: '', objects: [], story: null };

module.exports = {
  get: () => S,
  set(patch) { Object.assign(S, patch); return S; },
  find: zh => S.objects.find(o => o.zh === zh),
  // 最近拍的：只存场景、词、emoji，不存原图（本地临时路径会失效）
  remember() {
    if (!S.objects.length) return;
    const list = store.get('recent', []).filter(r => r.key !== S.photo);
    list.unshift({ key: S.photo, scene: S.scene || '照片里', words: S.objects.map(o => o.zh), emoji: S.objects.slice(0, 3).map(o => o.emoji).join(''), at: Date.now() });
    store.set('recent', list.slice(0, 6));
  }
};
