/**
 * 字族策划 / 生图提示词 / 质检 / 返工 —— 纯函数，Web 与小程序共用。
 * pinyinFn: 可选，(text) => 'xiǎo xué'，用于拼音交叉校验（pinyin-pro）。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HZPlanner = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var RATIO = { B: 3, L: 3, A: 2, C: 1 };
  var CAT_ZH = { B: '本义', L: '生活', A: '动作', C: '反差' };
  var SIZES = { '3:4': [1080, 1440], '1:1': [1200, 1200], '16:9': [1600, 900] };

  /* ---------- 1. 词组策划：给大模型的提示词 ---------- */
  function planMessages(ch) {
    var sys = '你是资深儿童识字与国际中文教育内容策划。只输出 JSON，不要解释。';
    var user = [
      '目标汉字：「' + ch + '」。',
      '请策划 9 个包含「' + ch + '」的常用词，严格按配比：',
      '- 3 个「本义」(cat=B)：直接体现该字本来意思；',
      '- 3 个「生活」(cat=L)：孩子日常生活里常见；',
      '- 2 个「动作」(cat=A)：动词或动作短语；',
      '- 1 个「反差」(cat=C)：字面意思出人意料、或多音/引申义，适合做记忆钩子。',
      '要求：词长 2~3 字为主；9 个词不重复；适合 4~10 岁儿童与 HSK1-3 学习者；避免生僻、负面、成人内容。',
      '拼音用声调符号，按音节空格分隔（如 "xiǎo xué"），多音字按词内实际读音。',
      'english：简短小写英文释义，≤3 个词。emoji：1 个最贴切的 emoji。',
      'icon：英文图标描述，一个可被扁平插画清晰画出的具体物体或场景，≤12 个词。',
      '输出格式：{"char":"' + ch + '","pinyin":"","english":"","words":[{"word":"","pinyin":"","english":"","cat":"B","emoji":"","icon":""}]}'
    ].join('\n');
    return { system: sys, user: user };
  }

  function extractJSON(text) {
    if (!text) throw new Error('模型没有返回内容');
    var s = String(text).replace(/```json|```/g, '');
    var a = s.indexOf('{'), b = s.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('模型返回的不是 JSON');
    return JSON.parse(s.slice(a, b + 1));
  }

  function normalize(raw, ch) {
    var words = (raw.words || []).map(function (w) {
      var cat = String(w.cat || w.category || 'L').toUpperCase();
      if (!RATIO[cat]) cat = ({ '本义': 'B', '生活': 'L', '动作': 'A', '反差': 'C' })[w.cat] || 'L';
      return {
        word: String(w.word || '').trim(), pinyin: String(w.pinyin || '').trim(),
        english: String(w.english || '').trim(), cat: cat,
        emoji: String(w.emoji || '').trim() || '◆', icon: String(w.icon || w.english || '').trim()
      };
    });
    var order = { B: 0, L: 1, A: 2, C: 3 };
    words.sort(function (x, y) { return order[x.cat] - order[y.cat]; });
    return { char: raw.char || ch, pinyin: raw.pinyin || '', english: raw.english || '', words: words.slice(0, 9), source: 'ai' };
  }

  /* ---------- 2. 生图提示词 ---------- */
  var STYLE_EN = {
    paper: 'refined Chinese rice-paper aesthetic, warm ivory background with subtle fibre texture, ink-black serif hanzi, a cinnabar red seal accent, soft paper-cut shadows',
    mist: 'Morandi muted palette, misty blue-grey background, calm slate ink, matte cards with soft long shadows, quiet museum-poster feeling',
    celadon: 'celadon porcelain palette, pale jade-green background, deep teal ink, glazed ceramic-like cards, delicate crackle texture',
    night: 'midnight indigo background, warm gold foil hanzi, ivory cards with fine gold hairlines, premium stationery feel'
  };

  function imagePrompt(d, opt) {
    opt = opt || {};
    var ratio = opt.ratio || '3:4';
    var style = STYLE_EN[opt.theme || 'paper'];
    var textless = !!opt.textless;
    var list = d.words.map(function (w, i) {
      return (i + 1) + '. ' + (textless ? '' : '"' + w.word + '" / ' + w.pinyin + ' / ' + w.english + ' — ') + 'icon: ' + w.icon;
    }).join('\n');
    var lines = [
      'A ' + ratio + ' ' + (ratio === '16:9' ? 'landscape' : ratio === '1:1' ? 'square' : 'portrait') + ' Chinese character learning infographic, "word family" mind-map layout.',
      textless
        ? 'CENTER: a large empty circular medallion (leave it blank, NO text) for the character to be typeset later.'
        : 'CENTER: a large circular medallion with the single Chinese character "' + d.char + '" in elegant brush-serif calligraphy, pinyin "' + d.pinyin + '" and English "' + d.english + '" beneath it.',
      'AROUND IT: exactly ' + d.words.length + ' rounded cards evenly arranged on an ellipse, connected to the center by thin radiating lines.',
      textless
        ? 'Each card: the top 55% is EMPTY blank space reserved for typesetting; the bottom 45% holds one small flat illustrated icon. NO letters, NO characters, NO numbers anywhere.'
        : 'Each card, top to bottom: the Chinese word (large, the character "' + d.char + '" highlighted in accent color), pinyin with tone marks, English gloss, then one small flat icon.',
      'Cards:',
      list,
      'Style: ' + style + '. Consistent icon style: flat vector illustration, 2-3 colors per icon, no outlines heavier than 2px, same lighting for every icon.',
      'Generous whitespace, nothing cropped at the edges, no overlapping cards, high legibility, print quality, 4k.',
      'Negative: watermark, signature, extra text, misspelled characters, distorted hanzi, random letters, cluttered background, photo-realism, 3d render.'
    ];
    if (opt.lang === 'zh') {
      lines = [
        ratio + ' 汉字识字信息图，字族思维导图版式。',
        textless ? '中心：大圆形徽章，留空不写任何字（后期排版补字）。'
          : '中心：大圆形徽章，内写单个汉字「' + d.char + '」（优雅书法衬线体），下方拼音「' + d.pinyin + '」与英文「' + d.english + '」。',
        '四周：' + d.words.length + ' 张圆角卡片沿椭圆均匀分布，以细放射线连向中心。',
        textless ? '每张卡片上半部留白，下半部一个扁平插画图标；画面中不得出现任何文字、字母、数字。'
          : '每张卡片自上而下：中文词（「' + d.char + '」用强调色）、带声调拼音、英文释义、一个扁平图标。',
        '卡片：', d.words.map(function (w, i) {
          return (i + 1) + '. ' + (textless ? '' : w.word + '｜' + w.pinyin + '｜' + w.english + '｜') + '图标：' + w.icon;
        }).join('\n'),
        '风格：' + style + '。图标风格统一、留白充足、元素不裁切不重叠、印刷级清晰。',
        '负面：水印、签名、多余文字、错别字、变形汉字、乱码字母、杂乱背景、写实照片、3D 渲染。'
      ];
    }
    return lines.join('\n');
  }

  /* ---------- 3. 质检 ---------- */
  var CHECKLIST = [
    { id: 'glyph', title: '主字字形正确', detail: '笔画完整、无错字/缺笔/多笔，中心字与输入一致。', fix: 'inpaint-center' },
    { id: 'pinyin', title: '拼音声调正确', detail: '每个音节声调符号正确，多音字按词内读音。', fix: 'textless' },
    { id: 'words', title: '9 个词齐全且都含主字', detail: '数量为 9，无重复，每个词都包含主字。', fix: 'replan' },
    { id: 'english', title: '英文释义准确', detail: '拼写正确，大小写风格统一，没有乱码字母。', fix: 'textless' },
    { id: 'icon', title: '图标与词义对应', detail: '一眼能看懂，无歧义、无不适合儿童的内容。', fix: 'inpaint-card' },
    { id: 'layout', title: '版式完整', detail: '比例正确，卡片不重叠，文字和图标没有被裁切。', fix: 'regen' },
    { id: 'style', title: '风格统一干净', detail: '配色、光影、图标画法一致，无水印、无多余杂字。', fix: 'regen' }
  ];

  var FIXES = {
    'inpaint-center': { name: '局部重绘中心', how: '框选中心圆，用下方「局部重绘提示词」重绘；仍不对就改用无字版，中心字交给排版补。' },
    'inpaint-card': { name: '局部重绘卡片', how: '只框选出错卡片的图标区域重绘，提示词只写这一张卡的图标描述。' },
    'textless': { name: '无字版 + 排版补字', how: '用「无字版提示词」出图（只有图标和版式），再用本工具的排版（或稿定/Canva）把文字盖上去，文字 100% 准确。' },
    'replan': { name: '重新策划词组', how: '回到第 1 步，替换不合格的词，再重新生成提示词。' },
    'regen': { name: '整图重抽', how: '固定 seed 以外的参数重抽 2~4 张择优；连续失败就把卡片数降到 8 或换 1:1 比例。' }
  };

  // 自动质检（数据层面）。返回 [{id, level:'ok'|'warn'|'error', msg}]
  function autoCheck(d, pinyinFn) {
    var out = [];
    var n = d.words.length;
    out.push(n === 9 ? { id: 'count', level: 'ok', msg: '共 9 个词' } : { id: 'count', level: 'error', msg: '词数为 ' + n + '，应为 9' });
    var cnt = { B: 0, L: 0, A: 0, C: 0 };
    d.words.forEach(function (w) { cnt[w.cat] = (cnt[w.cat] || 0) + 1; });
    var ratioOk = cnt.B === 3 && cnt.L === 3 && cnt.A === 2 && cnt.C === 1;
    out.push({ id: 'ratio', level: ratioOk ? 'ok' : 'warn', msg: '配比 本义' + cnt.B + ' · 生活' + cnt.L + ' · 动作' + cnt.A + ' · 反差' + cnt.C + (ratioOk ? '' : '（建议 3/3/2/1）') });
    var seen = {};
    d.words.forEach(function (w) {
      if (w.word.indexOf(d.char) < 0) out.push({ id: 'has-' + w.word, level: 'error', msg: '「' + w.word + '」不含主字「' + d.char + '」' });
      if (seen[w.word]) out.push({ id: 'dup-' + w.word, level: 'error', msg: '「' + w.word + '」重复' });
      seen[w.word] = 1;
      var syl = w.pinyin.split(/\s+/).filter(Boolean).length;
      if (syl !== Array.from(w.word).length) out.push({ id: 'syl-' + w.word, level: 'error', msg: '「' + w.word + '」拼音音节数与字数不符' });
      if (!w.english) out.push({ id: 'en-' + w.word, level: 'error', msg: '「' + w.word + '」缺英文释义' });
      if (pinyinFn) {
        var ref = pinyinFn(w.word);
        if (ref && ref !== w.pinyin) out.push({ id: 'py-' + w.word, level: 'warn', msg: '「' + w.word + '」拼音 ' + w.pinyin + '，词典给出 ' + ref + '，多音字请人工确认' });
      }
    });
    if (out.filter(function (x) { return x.level !== 'ok'; }).length === 0) out.push({ id: 'all', level: 'ok', msg: '每个词都含主字、无重复、拼音音节完整' });
    return out;
  }

  function inpaintPrompt(d, idx) {
    if (idx == null || idx < 0) return 'Inpaint only the masked center medallion: the single Chinese character "' + d.char + '" in clean brush-serif calligraphy, correct stroke structure, pinyin "' + d.pinyin + '" below. Keep background and colors unchanged.';
    var w = d.words[idx];
    return 'Inpaint only the masked icon area of one card: ' + w.icon + ', flat vector illustration matching the other icons (same palette, line weight and lighting). No text.';
  }

  return {
    RATIO: RATIO, CAT_ZH: CAT_ZH, SIZES: SIZES, STYLE_EN: STYLE_EN,
    CHECKLIST: CHECKLIST, FIXES: FIXES,
    planMessages: planMessages, extractJSON: extractJSON, normalize: normalize,
    imagePrompt: imagePrompt, autoCheck: autoCheck, inpaintPrompt: inpaintPrompt
  };
});
