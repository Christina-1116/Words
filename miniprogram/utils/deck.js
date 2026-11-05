// 加入复习：从照片里裁出物品缩略图，存进复习牌组
const S = require('./core/srs.js');
const store = require('./store.js');
const study = require('./study.js');

function crop(photo, box) {
  return new Promise(resolve => {
    if (!photo || !box) return resolve('');
    const c = wx.createOffscreenCanvas({ type: '2d', width: 200, height: 200 }), g = c.getContext('2d'), img = c.createImage();
    img.onload = () => {
      const W = img.width, H = img.height;
      const x = box[0] / 1000 * W, y = box[1] / 1000 * H, w = (box[2] - box[0]) / 1000 * W, h = (box[3] - box[1]) / 1000 * H, side = Math.max(w, h) * 1.15;
      g.fillStyle = '#fff'; g.fillRect(0, 0, 200, 200);
      g.drawImage(img, x + w / 2 - side / 2, y + h / 2 - side / 2, side, side, 0, 0, 200, 200);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve('');
    img.src = photo;
  });
}

function add(o, photo, scene) {
  const deck = store.get('deck', []);
  if (deck.some(c => c.id === o.zh)) { return Promise.resolve(false); }
  return crop(photo, o.box).then(thumb => {
    const d = store.get('deck', []);
    S.add(d, { zh: o.zh, pinyin: o.pinyin, en: o.en, emoji: o.emoji, sentence: o.sentence, sentence_en: o.sentence_en, thumb, scene });
    store.set('deck', d); study.mark(1);
    return true;
  });
}

function addAll(objects, photo, scene) {
  return objects.reduce((p, o) => p.then(n => add(o, photo, scene).then(ok => n + (ok ? 1 : 0))), Promise.resolve(0));
}
module.exports = { add, addAll, crop };
