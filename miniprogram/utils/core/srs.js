/**
 * 间隔复习（Leitner 盒子 + 艾宾浩斯间隔）。纯函数，存储交给平台（localStorage / wx.setStorageSync）。
 * 卡片：{ id, zh, pinyin, en, emoji, sentence, thumb, scene, level, due, added, reps, lapses }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HZSRS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var DAY = 864e5;
  var INTERVALS = [0, 1, 2, 4, 7, 15, 30, 60]; // 天：当天 → 1 → 2 → 4 → 7 → 15 → 30 → 60

  function add(deck, item, now) {
    now = now || Date.now();
    var id = item.zh;
    for (var i = 0; i < deck.length; i++) if (deck[i].id === id) {
      // 再次拍到：更新照片、立即可复习，但不清零进度
      deck[i].thumb = item.thumb || deck[i].thumb; deck[i].seen = (deck[i].seen || 1) + 1;
      return deck;
    }
    deck.push({
      id: id, zh: item.zh, pinyin: item.pinyin, en: item.en, emoji: item.emoji, sentence: item.sentence || '',
      sentence_en: item.sentence_en || '', thumb: item.thumb || '', scene: item.scene || '',
      level: 0, due: now + 10 * 60 * 1000, added: now, reps: 0, lapses: 0, seen: 1
    });
    return deck;
  }

  /** grade: 'again' 不认识 | 'hard' 有点模糊 | 'good' 认识 */
  function grade(card, g, now) {
    now = now || Date.now();
    card.reps++;
    if (g === 'again') { card.lapses++; card.level = Math.max(0, card.level - 2); card.due = now + 5 * 60 * 1000; }
    else if (g === 'hard') { card.due = now + Math.max(1, INTERVALS[card.level] / 2) * DAY; }
    else { card.level = Math.min(INTERVALS.length - 1, card.level + 1); card.due = now + INTERVALS[card.level] * DAY; }
    card.last = now;
    return card;
  }

  function due(deck, now) { now = now || Date.now(); return deck.filter(function (c) { return c.due <= now; }).sort(function (a, b) { return a.due - b.due; }); }

  function stats(deck, now) {
    now = now || Date.now();
    var s = { total: deck.length, due: 0, learning: 0, mastered: 0, tomorrow: 0 };
    deck.forEach(function (c) {
      if (c.due <= now) s.due++;
      else if (c.due <= now + DAY) s.tomorrow++;
      if (c.level >= 5) s.mastered++; else s.learning++;
    });
    return s;
  }

  /** 选择题干扰项：同牌组里随机取 n 个不同的词 */
  function distractors(deck, card, n, rand) {
    rand = rand || Math.random;
    var pool = deck.filter(function (c) { return c.id !== card.id; }).slice();
    for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    return pool.slice(0, n);
  }

  function nextLabel(card, now) {
    now = now || Date.now();
    var d = card.due - now;
    if (d <= 0) return '现在';
    if (d < 3600e3) return Math.ceil(d / 60e3) + ' 分钟后';
    if (d < DAY) return Math.ceil(d / 3600e3) + ' 小时后';
    return Math.round(d / DAY) + ' 天后';
  }

  return { INTERVALS: INTERVALS, add: add, grade: grade, due: due, stats: stats, distractors: distractors, nextLabel: nextLabel };
});
