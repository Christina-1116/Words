/**
 * 示例冰箱：插画 + 已知坐标的物品，用来在没有 Key 时演示拍照识字。Web / 小程序共用。
 * draw(ctx) 画在 1200×900 的画布上；objects(lexicon) 返回识别结果（box 为 0~1000 归一化坐标）。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HZDemo = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var W = 1200, H = 900;
  // [词, emoji(null=手绘), x, y, 尺寸, 英文例句]
  var ITEMS = [
    ['苹果', '🍎', 230, 205, 170, 'I eat an apple every day.'], ['橘子', '🍊', 470, 215, 150, 'Oranges are sweet and sour.'],
    ['葡萄', '🍇', 730, 205, 160, 'A bunch of purple grapes.'], ['酸奶', null, 1000, 205, 160, 'A cup of yogurt for breakfast.'],
    ['鸡蛋', '🥚', 250, 515, 140, 'Mom fried an egg.'], ['胡萝卜', '🥕', 560, 510, 160, 'Bunnies love carrots.'],
    ['奶酪', '🧀', 860, 520, 150, 'Mice like cheese.'], ['番茄', '🍅', 300, 805, 150, 'Tomato with eggs is yummy.'],
    ['牛奶', '🥛', 640, 790, 170, 'Milk is white.'], ['草莓', '🍓', 950, 805, 140, 'Strawberries are red.']
  ];
  var EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

  function draw(g) {
    var bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#F4F8FA'); bg.addColorStop(1, '#DCE6EA'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    var glow = g.createRadialGradient(600, 0, 50, 600, 0, 700); glow.addColorStop(0, 'rgba(255,255,240,.9)'); glow.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.fillStyle = '#C9D6DC'; g.fillRect(0, 0, 40, H); g.fillRect(W - 40, 0, 40, H);
    [300, 600].forEach(function (y) { g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(40, y, W - 80, 14); g.fillStyle = 'rgba(80,110,125,.25)'; g.fillRect(40, y + 14, W - 80, 6); });
    g.textAlign = 'center'; g.textBaseline = 'middle';
    ITEMS.forEach(function (it) {
      g.save(); g.fillStyle = '#000'; // 彩色 emoji 会继承 fillStyle 的透明度，必须重置
      g.shadowColor = 'rgba(40,60,70,.25)'; g.shadowBlur = 18; g.shadowOffsetY = 8;
      if (it[1]) { g.font = it[4] + 'px ' + EMOJI; g.fillText(it[1], it[2], it[3]); }
      else {
        var x = it[2], y = it[3];
        g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(x - 55, y - 55); g.lineTo(x + 55, y - 55); g.lineTo(x + 42, y + 70); g.lineTo(x - 42, y + 70); g.closePath(); g.fill();
        g.shadowColor = 'transparent'; g.fillStyle = '#E86A8A'; g.fillRect(x - 60, y - 68, 120, 16);
        g.fillStyle = '#F7B5C4'; g.beginPath(); g.moveTo(x - 50, y - 5); g.lineTo(x + 50, y - 5); g.lineTo(x + 46, y + 30); g.lineTo(x - 46, y + 30); g.closePath(); g.fill();
        g.fillStyle = '#B3405E'; g.font = '600 22px sans-serif'; g.fillText('YOGURT', x, y + 13);
      }
      g.restore();
    });
  }

  function objects(lexicon) {
    return ITEMS.map(function (it, i) {
      var t = lexicon.thing(it[0]), s = it[4] * 0.62;
      return {
        id: 'd' + i, zh: it[0], pinyin: t.pinyin, en: t.en, emoji: t.emoji, sentence: t.sentence, sentence_en: it[5],
        box: [(it[2] - s) / 1.2, (it[3] - s) / 0.9, (it[2] + s) / 1.2, (it[3] + s) / 0.9].map(Math.round)
      };
    });
  }

  return { W: W, H: H, draw: draw, objects: objects, scene: '冰箱里' };
});
