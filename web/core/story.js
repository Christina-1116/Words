/**
 * 拍照小故事：用这次照片里认出的词编一个 4~6 句的小故事。
 * - storyMessages：给大模型的提示词（有 Key 时用）
 * - offline：没有 Key / 调用失败时的模板故事（保证一定有故事）
 * - segments：把一句话切成「普通文字 / 生词」片段，用于高亮、点读
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HZStory = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var HEROES = [['小兔子', 'Little Bunny', '🐰'], ['小熊', 'Little Bear', '🐻'], ['小猫咪', 'Kitty', '🐱'], ['小企鹅', 'Little Penguin', '🐧']];

  function pickWords(objects, n) {
    var seen = {}, out = [];
    objects.forEach(function (o) { if (o.zh && !seen[o.zh] && out.length < n) { seen[o.zh] = 1; out.push(o); } });
    return out;
  }

  function storyMessages(objects, scene, opts) {
    opts = opts || {};
    var words = pickWords(objects, opts.max || 5);
    return {
      words: words,
      system: '你是给 4~8 岁孩子写睡前小故事的作家。只输出 JSON，不要解释。',
      user: [
        '孩子刚刚拍了一张照片' + (scene ? '（' + scene + '）' : '') + '，里面有：' + words.map(function (w) { return w.zh + '(' + w.en + ')'; }).join('、') + '。',
        '用这些词写一个温暖、有一点点幽默的小故事：',
        '- 4~6 句，每句不超过 18 个字，用孩子能读懂的常用字；',
        '- 每个词至少出现一次，词必须原样出现（不要改字、不要加量词拆开）；',
        '- 主角是一只小动物，故事发生在孩子自己家里；',
        '- 最后一句是一个能和孩子互动的问题；',
        '- 每句给出对应的简单英文翻译 en。',
        '格式：{"title":"","title_en":"","hero_emoji":"","lines":[{"zh":"","en":""}]}'
      ].join('\n')
    };
  }

  function normalize(raw, words) {
    var lines = (raw.lines || []).map(function (l) { return { zh: String(l.zh || l.text || '').trim(), en: String(l.en || '').trim() }; })
      .filter(function (l) { return l.zh; }).slice(0, 8);
    return { title: raw.title || '小故事', title_en: raw.title_en || '', hero: raw.hero_emoji || '🐰', lines: lines, words: words, source: 'ai' };
  }

  // 离线模板故事：按物品数量轮换句式，保证语句通顺
  function offline(objects, scene, seed) {
    var words = pickWords(objects, 5);
    var h = HEROES[(seed || 0) % HEROES.length], hero = h[0], heroEn = h[1];
    var fridge = /冰箱/.test(scene || '');
    var place = fridge ? '冰箱' : (scene || '家里').replace(/[里上中]$/, '');
    var lines = [];
    lines.push(fridge
      ? { zh: hero + '悄悄打开冰箱门。', en: heroEn + ' quietly opens the fridge.' }
      : { zh: hero + '来到' + place + '，东看看，西看看。', en: heroEn + ' looks around.' });
    var T = [
      function (w) { return { zh: '它先看见了' + w.zh + '，开心地跳了起来。', en: 'First it sees the ' + w.en + ' and jumps for joy.' }; },
      function (w) { return { zh: w.zh + '眨眨眼睛说：“还有我呢！”', en: 'The ' + w.en + ' winks: "Don\'t forget me!"' }; },
      function (w) { return { zh: hero + '轻轻抱起' + w.zh + '，放进小篮子。', en: 'It puts the ' + w.en + ' into a little basket.' }; },
      function (w) { return { zh: '咦，' + w.zh + '躲在最里面，被它找到啦！', en: 'Oh! The ' + w.en + ' was hiding, but it found it!' }; },
      function (w) { return { zh: '最后，它和' + w.zh + '一起笑哈哈。', en: 'In the end, it laughs with the ' + w.en + '.' }; }
    ];
    words.forEach(function (w, i) { lines.push(T[i % T.length](w)); });
    lines.push({ zh: '你能找到' + (words[0] ? words[0].zh : '它们') + '在哪里吗？', en: 'Can you find the ' + (words[0] ? words[0].en : 'things') + '?' });
    return {
      title: hero + (fridge ? '打开冰箱' : '的小发现'), title_en: heroEn + (fridge ? ' Opens the Fridge' : '\'s Little Discovery'),
      hero: h[2], lines: lines, words: words, source: 'template'
    };
  }

  /** 切分：[{t:'它先看见了'}, {t:'苹果', w:0}, ...]，w 为 words 下标；长词优先匹配 */
  function segments(line, words) {
    var order = words.map(function (w, i) { return i; }).sort(function (a, b) { return words[b].zh.length - words[a].zh.length; });
    var out = [], i = 0, buf = '';
    while (i < line.length) {
      var hit = -1;
      for (var k = 0; k < order.length; k++) { var z = words[order[k]].zh; if (z && line.substr(i, z.length) === z) { hit = order[k]; break; } }
      if (hit >= 0) { if (buf) { out.push({ t: buf }); buf = ''; } out.push({ t: words[hit].zh, w: hit }); i += words[hit].zh.length; }
      else { buf += line[i]; i++; }
    }
    if (buf) out.push({ t: buf });
    return out;
  }

  /** 检查：每个词都出现了吗？（AI 故事偶尔漏词，漏了就在末尾补一句） */
  function ensureWords(story) {
    var all = story.lines.map(function (l) { return l.zh; }).join('');
    var miss = story.words.filter(function (w) { return all.indexOf(w.zh) < 0; });
    if (miss.length) story.lines.splice(Math.max(0, story.lines.length - 1), 0, {
      zh: '还有' + miss.map(function (w) { return w.zh; }).join('和') + '，也来一起玩！',
      en: 'And the ' + miss.map(function (w) { return w.en; }).join(' and the ') + ' join in, too!'
    });
    return story;
  }

  return { storyMessages: storyMessages, normalize: normalize, offline: offline, segments: segments, ensureWords: ensureWords };
});
