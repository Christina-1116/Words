/* 识字工坊 Web Demo —— 字族图 / 拍照识字 / 复习 */
(function () {
  'use strict';
  var L = window.HZLexicon, P = window.HZPlanner, R = window.HZRender, AI = window.HZAI, S = window.HZSRS;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('hz:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('hz:' + k, JSON.stringify(v)); } catch (e) { /* 存储不可用时只在内存里保留 */ } }
  };
  var pinyinFn = function (t) { return window.pinyinPro ? window.pinyinPro.pinyin(t) : ''; };

  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('on'); }, 2200); }
  function copy(text) {
    var done = function () { toast('已复制'); };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
    function fallback() { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('请手动复制'); } ta.remove(); }
  }

  /* ================= 导航 ================= */
  function show(view) {
    $$('.rail [data-view]').forEach(function (b) { b.setAttribute('aria-selected', String(b.dataset.view === view)); });
    $$('main .view').forEach(function (v) { v.hidden = v.id !== 'view-' + view; });
    if (view === 'review') renderReview();
    if (location.hash !== '#' + view) history.replaceState(null, '', '#' + view);
  }
  $$('.rail [data-view]').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.view); }); });

  /* ================= 设置 ================= */
  var settings = store.get('settings', { preset: 'claude', provider: 'anthropic', base: AI.PRESETS.claude.base, model: AI.PRESETS.claude.model, key: '' });
  var sPreset = $('#sPreset');
  Object.keys(AI.PRESETS).forEach(function (k) { var o = document.createElement('option'); o.value = k; o.textContent = AI.PRESETS[k].label; sPreset.appendChild(o); });
  function fillSettings() { sPreset.value = settings.preset; $('#sBase').value = settings.base; $('#sModel').value = settings.model; $('#sKey').value = settings.key; }
  sPreset.addEventListener('change', function () { var p = AI.PRESETS[sPreset.value]; $('#sBase').value = p.base; $('#sModel').value = p.model; });
  $('#openSettings').addEventListener('click', function () { fillSettings(); $('#settings').showModal(); });
  $('#settings').addEventListener('close', function () {
    if ($('#settings').returnValue !== 'save') return;
    settings = { preset: sPreset.value, provider: AI.PRESETS[sPreset.value].provider, base: $('#sBase').value.trim(), model: $('#sModel').value.trim(), key: $('#sKey').value.trim() };
    store.set('settings', settings); toast(settings.key ? '已保存，AI 功能可用' : '已保存（未填 Key，仅用内置词库）');
  });

  function callAI(msgs, image) {
    if (!settings.key) return Promise.reject(new Error('NO_KEY'));
    var req = AI.buildRequest(settings, msgs.system, msgs.user, image);
    return fetch(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(req.body) })
      .then(function (r) { return r.json().catch(function () { throw new Error('接口返回 ' + r.status); }); })
      .then(function (j) { return AI.parseResponse(settings, j); });
  }

  /* ================= 字族图 ================= */
  var fam = { data: L.expand('明'), ratio: '3:4', theme: 'mist', lang: 'en', textless: false, qc: {} };
  var canvas = $('#poster');
  var FONTS_READY = {};

  function ensureFonts(text) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    var key = text;
    if (FONTS_READY[key]) return Promise.resolve();
    return Promise.all([
      document.fonts.load('600 100px "Noto Serif SC"', text),
      document.fonts.load('400 40px "Noto Serif SC"', text),
      document.fonts.load('400 40px "Noto Serif"', 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü abc'),
      document.fonts.load('italic 40px "Noto Serif"', 'abc')
    ]).then(function () { FONTS_READY[key] = 1; }, function () {});
  }
  function allText(d) { return d.char + d.words.map(function (w) { return w.word; }).join('') + '字家族本义生活动作反差' + ($('#brandInput').value || ''); }

  function opts(d) {
    var sz = P.SIZES[fam.ratio];
    return { width: sz[0], height: sz[1], theme: fam.theme, brand: $('#brandInput').value.trim(), showCat: $('#showCat').checked };
  }
  function drawTo(cv, d) {
    var o = opts(d); cv.width = o.width; cv.height = o.height;
    R.draw(cv.getContext('2d'), d, o);
  }
  var drawSeq = 0;
  function redraw() {
    var d = fam.data, seq = ++drawSeq;
    drawTo(canvas, d);              // 先用后备字体画一帧，避免空白
    ensureFonts(allText(d)).then(function () { if (seq === drawSeq) drawTo(canvas, d); });
    renderPrompt(); renderQC();
  }

  // 控件
  L.chars.forEach(function (c) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = c; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () { $('#charInput').value = c; loadChar(c); });
    $('#charChips').appendChild(b);
  });
  Object.keys(R.THEMES).forEach(function (k) {
    var t = R.THEMES[k], b = document.createElement('button');
    b.type = 'button'; b.className = 'sw'; b.dataset.v = k; b.setAttribute('aria-pressed', String(k === fam.theme));
    b.innerHTML = '<i style="background: linear-gradient(135deg, ' + t.bg + ' 50%, ' + t.accent + ' 50%)"></i>' + t.name;
    b.addEventListener('click', function () { fam.theme = k; $$('#themeSw .sw').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); redraw(); });
    $('#themeSw').appendChild(b);
  });
  function seg(id, cb) { $$('#' + id + ' button').forEach(function (b) { b.addEventListener('click', function () { $$('#' + id + ' button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); cb(b.dataset.v); }); }); }
  seg('ratioSeg', function (v) { fam.ratio = v; redraw(); });
  seg('langSeg', function (v) { fam.lang = v; renderPrompt(); });
  seg('textSeg', function (v) { fam.textless = v === '1'; renderPrompt(); });
  $('#brandInput').addEventListener('input', redraw);
  $('#showCat').addEventListener('change', redraw);
  $('#genBtn').addEventListener('click', function () { loadChar($('#charInput').value.trim()); });
  $('#charInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') loadChar($('#charInput').value.trim()); });
  $$('.detail .tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.detail .tabs button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
      $$('.detail .tabpane').forEach(function (p) { p.hidden = p.id !== 'pane-' + b.dataset.pane; });
    });
  });

  function markChip(c) { $$('#charChips .chip').forEach(function (b) { b.setAttribute('aria-pressed', String(b.textContent === c)); }); }

  function planWithAI(c) {
    var m = P.planMessages(c);
    return callAI(m).then(function (txt) { return P.normalize(P.extractJSON(txt), c); });
  }

  function loadChar(c) {
    c = Array.from(c || '')[0];
    if (!c || !/\p{Script=Han}/u.test(c)) { toast('请输入一个汉字'); return; }
    markChip(c);
    var d = L.expand(c);
    if (d) { setData(d, '内置词库'); return; }
    if (!settings.key) {
      toast('内置词库没有「' + c + '」。在「设置」里填入大模型 Key 后，可以策划任意汉字');
      $('#openSettings').focus(); return;
    }
    $('#srcTag').textContent = 'AI 正在策划「' + c + '」…'; $('#genBtn').disabled = true;
    planWithAI(c).then(function (d2) {
      if (!d2.pinyin) d2.pinyin = pinyinFn(c);
      setData(d2, 'AI 策划 · ' + (AI.PRESETS[settings.preset] || {}).label);
    }).catch(function (e) { toast('策划失败：' + e.message); $('#srcTag').textContent = '策划失败'; })
      .then(function () { $('#genBtn').disabled = false; });
  }

  function setData(d, src) { fam.data = d; fam.qc = {}; $('#srcTag').textContent = src; renderWords(); redraw(); }

  function renderWords() {
    var d = fam.data, box = $('#wordList'); box.innerHTML = '';
    d.words.forEach(function (w, i) {
      var row = document.createElement('div'); row.className = 'wrow';
      row.innerHTML =
        '<select aria-label="词类" data-k="cat">' + ['B', 'L', 'A', 'C'].map(function (k) { return '<option value="' + k + '"' + (w.cat === k ? ' selected' : '') + '>' + P.CAT_ZH[k] + '</option>'; }).join('') + '</select>' +
        '<input class="w" aria-label="词" data-k="word" value="' + esc(w.word) + '">' +
        '<input aria-label="拼音" data-k="pinyin" value="' + esc(w.pinyin) + '">' +
        '<input class="em" aria-label="图标" data-k="emoji" value="' + esc(w.emoji) + '">' +
        '<div class="sub"><input aria-label="英文" data-k="english" value="' + esc(w.english) + '"><input aria-label="图标描述" data-k="icon" value="' + esc(w.icon) + '"></div>';
      row.querySelector('select').style.width = '100%';
      $$('input, select', row).forEach(function (el) {
        el.addEventListener('input', function () { d.words[i][el.dataset.k] = el.value; redraw(); });
      });
      box.appendChild(row);
    });
  }
  $('#fillPinyin').addEventListener('click', function () {
    fam.data.words.forEach(function (w) { if (!w.pinyin) w.pinyin = pinyinFn(w.word); });
    renderWords(); redraw(); toast('已为空白项补拼音（已有的不改）');
  });

  function renderPrompt() { $('#promptOut').value = P.imagePrompt(fam.data, { ratio: fam.ratio, theme: fam.theme, lang: fam.lang, textless: fam.textless }); }
  $('#copyPromptBtn').addEventListener('click', function () { copy($('#promptOut').value); });

  function renderQC() {
    var auto = P.autoCheck(fam.data, pinyinFn);
    $('#qcAuto').innerHTML = auto.map(function (x) {
      return '<div class="' + x.level + '"><b>' + ({ ok: '通过', warn: '注意', error: '错误' })[x.level] + '</b><span>' + esc(x.msg) + '</span></div>';
    }).join('');
    $('#qcList').innerHTML = P.CHECKLIST.map(function (c) {
      var st = fam.qc[c.id] || '', fix = P.FIXES[c.fix];
      var extra = '';
      if (st === 'fail') {
        extra = '<div class="fix"><b>返工：' + fix.name + '</b><span>' + esc(fix.how) + '</span>';
        if (c.fix === 'inpaint-center') extra += '<button class="btn sm" type="button" data-copy="center">复制局部重绘提示词</button>';
        if (c.fix === 'inpaint-card') extra += '<div class="row">' + fam.data.words.map(function (w, i) { return '<button class="btn sm" type="button" data-copy="' + i + '">' + esc(w.word) + '</button>'; }).join('') + '</div><span class="hint">选出错的那张卡，复制它的重绘提示词</span>';
        if (c.fix === 'textless') extra += '<button class="btn sm" type="button" data-copy="textless">复制无字版提示词</button>';
        extra += '</div>';
      }
      return '<div class="check" data-s="' + st + '"><div class="t"><h4>' + c.title + '</h4><div class="row">' +
        '<button class="btn sm" type="button" data-qc="' + c.id + '" data-v="pass">通过</button>' +
        '<button class="btn sm" type="button" data-qc="' + c.id + '" data-v="fail">要返工</button></div></div><p>' + c.detail + '</p>' + extra + '</div>';
    }).join('');
  }
  $('#qcList').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.qc) { fam.qc[b.dataset.qc] = b.dataset.v; renderQC(); return; }
    var k = b.dataset.copy;
    if (k === 'center') copy(P.inpaintPrompt(fam.data, -1));
    else if (k === 'textless') copy(P.imagePrompt(fam.data, { ratio: fam.ratio, theme: fam.theme, lang: fam.lang, textless: true }));
    else if (k != null) copy(P.inpaintPrompt(fam.data, +k));
  });

  // 导出：浏览器能下载就下载，同时弹出大图（右键/长按保存）
  function showImage(url, name) {
    var ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = '<div><img alt="导出的识字图" src="' + url + '"><div class="bar"><span>右键或长按图片保存</span><a class="btn primary" download="' + esc(name) + '" href="' + url + '">下载</a><button class="btn" type="button">关闭</button></div></div>';
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.tagName === 'BUTTON') ov.remove(); });
    document.body.appendChild(ov);
  }
  $('#exportBtn').addEventListener('click', function () {
    ensureFonts(allText(fam.data)).then(function () {
      drawTo(canvas, fam.data);
      showImage(canvas.toDataURL('image/png'), fam.data.char + '-字族图-' + fam.ratio.replace(':', 'x') + '.png');
    });
  });
  $('#batchBtn').addEventListener('click', function () {
    var chars = Array.from($('#batchInput').value).filter(function (c) { return /\p{Script=Han}/u.test(c); });
    if (!chars.length) { toast('请输入要批量生成的汉字'); return; }
    var btn = $('#batchBtn'); btn.disabled = true;
    var zip = new window.JSZip(), prompts = [], missing = [], i = 0;
    var cv = document.createElement('canvas');
    (function next() {
      if (i >= chars.length) {
        zip.file('提示词.txt', prompts.join('\n\n==========\n\n'));
        zip.generateAsync({ type: 'blob' }).then(function (blob) {
          var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '字族图-' + chars.join('') + '.zip'; a.click();
          toast('已打包 ' + (chars.length - missing.length) + ' 张' + (missing.length ? '，跳过 ' + missing.join('') : ''));
          btn.disabled = false;
        });
        return;
      }
      var c = chars[i++], n = String(i).padStart(2, '0');
      var p = L.expand(c) ? Promise.resolve(L.expand(c)) : (settings.key ? planWithAI(c) : Promise.reject(new Error('skip')));
      btn.textContent = i + '/' + chars.length;
      p.then(function (d) {
        return ensureFonts(allText(d)).then(function () {
          drawTo(cv, d);
          zip.file(n + '-' + c + '.png', cv.toDataURL('image/png').split(',')[1], { base64: true });
          prompts.push('【' + c + '】\n' + P.imagePrompt(d, { ratio: fam.ratio, theme: fam.theme, lang: fam.lang }));
        });
      }).catch(function () { missing.push(c); }).then(function () { btn.textContent = '打包'; next(); });
    })();
  });

  /* ================= 拍照识字 ================= */
  var snap = { img: null, url: '', objects: [], scene: '', sel: -1, pending: null };
  var photo = $('#photo');

  function compress(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var k = Math.min(1, 1280 / Math.max(img.width, img.height));
        var c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = function () { reject(new Error('图片读不出来，换一张试试')); };
      img.src = URL.createObjectURL(file);
    });
  }

  function setPhoto(url) {
    return new Promise(function (resolve) {
      snap.url = url; snap.objects = []; snap.sel = -1;
      photo.innerHTML = '<img alt="拍的照片"><div class="layer" id="layer"></div>';
      var img = photo.querySelector('img');
      img.onload = function () { snap.img = img; photo.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight; resolve(); };
      img.src = url;
      renderObjList(); $('#learn').innerHTML = '<div class="empty">正在看照片里有什么…</div>';
    });
  }
  function scanning(on) {
    var old = photo.querySelector('.scan'); if (old) old.remove();
    if (on) { var s = document.createElement('div'); s.className = 'scan'; photo.appendChild(s); }
  }

  function placeTags() {
    var layer = $('#layer'); if (!layer) return; layer.innerHTML = '';
    snap.objects.forEach(function (o, i) {
      var b = o.box, el = document.createElement('div');
      el.className = 'obj' + (i === snap.sel ? ' on' : '');
      el.style.cssText = 'left:' + b[0] / 10 + '%;top:' + b[1] / 10 + '%;width:' + (b[2] - b[0]) / 10 + '%;height:' + (b[3] - b[1]) / 10 + '%';
      el.innerHTML = '<button type="button" class="tag" style="animation-delay:' + (i * 0.12) + 's" aria-label="学 ' + esc(o.zh) + '"><div class="zh">' + esc(o.zh) + '</div><div class="py">' + esc(o.pinyin) + '</div></button>';
      el.querySelector('.tag').addEventListener('click', function (e) { e.stopPropagation(); select(i); });
      layer.appendChild(el);
    });
    renderObjList();
  }
  function renderObjList() {
    $('#objList').innerHTML = snap.objects.map(function (o, i) { return '<button type="button" class="' + (i === snap.sel ? 'on' : '') + '" data-i="' + i + '">' + esc(o.zh) + '</button>'; }).join('');
    if (snap.objects.length) {
      var all = document.createElement('button'); all.type = 'button'; all.textContent = '全部加入复习'; all.style.fontFamily = 'inherit'; all.style.fontWeight = '400';
      all.addEventListener('click', function () { snap.objects.forEach(addToDeck); toast('已加入 ' + snap.objects.length + ' 个词'); });
      $('#objList').appendChild(all);
    }
  }
  $('#objList').addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) select(+b.dataset.i); });

  function crop(o) {
    if (!snap.img) return '';
    var im = snap.img, W = im.naturalWidth, H = im.naturalHeight, b = o.box;
    var x = b[0] / 1000 * W, y = b[1] / 1000 * H, w = (b[2] - b[0]) / 1000 * W, h = (b[3] - b[1]) / 1000 * H;
    var side = Math.max(w, h) * 1.15, cx = x + w / 2, cy = y + h / 2;
    var c = document.createElement('canvas'); c.width = c.height = 200;
    var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 200, 200);
    g.drawImage(im, cx - side / 2, cy - side / 2, side, side, 0, 0, 200, 200);
    try { return c.toDataURL('image/jpeg', 0.8); } catch (e) { return ''; }
  }
  function addToDeck(o) {
    var deck = store.get('deck', []);
    S.add(deck, { zh: o.zh, pinyin: o.pinyin, en: o.en, emoji: o.emoji, sentence: o.sentence, sentence_en: o.sentence_en, thumb: crop(o), scene: snap.scene });
    store.set('deck', deck);
  }

  function speak(text, lang) {
    if (!('speechSynthesis' in window)) { toast('这个浏览器不支持朗读'); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = lang.indexOf('zh') === 0 ? 0.8 : 0.9;
    speechSynthesis.speak(u);
  }

  function charLoader(ch, onLoad, onError) {
    fetch('hanzi-data/' + encodeURIComponent(ch) + '.json').then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .catch(function () { return fetch('https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/' + encodeURIComponent(ch) + '.json').then(function (r) { if (!r.ok) throw 0; return r.json(); }); })
      .then(onLoad).catch(onError);
  }

  var writers = [];
  function select(i) {
    snap.sel = i; var o = snap.objects[i]; placeTags();
    addToDeck(o);
    var chars = Array.from(o.zh);
    var sent = esc(o.sentence || '').split(esc(o.zh)).join('<mark>' + esc(o.zh) + '</mark>');
    $('#learn').innerHTML =
      '<div class="lw-head"><div><div class="lw-py">' + esc(o.pinyin) + '</div><div class="lw-en">' + esc(o.en) + '</div></div>' +
      '<div class="row"><button class="btn sm" type="button" id="sayZh">读中文</button><button class="btn sm" type="button" id="sayEn">读英文</button></div></div>' +
      '<div class="grids" style="grid-template-columns: repeat(' + chars.length + ', minmax(0, 132px))">' + chars.map(function (c, k) { return '<div class="tzg" id="tzg' + k + '" aria-label="' + esc(c) + ' 的笔顺"></div>'; }).join('') + '</div>' +
      '<div class="row"><button class="btn primary sm" type="button" id="animBtn">看笔顺</button><button class="btn sm" type="button" id="quizBtn">跟着写</button><span class="hint" id="writeHint"></span></div>' +
      (o.sentence ? '<div><div class="sentence">' + sent + '</div><div class="sentence-en">' + esc(o.sentence_en) + '</div></div>' : '') +
      '<p class="hint" style="margin:0">已自动加入复习，' + '明天会再出现。</p>';
    writers = chars.map(function (c, k) {
      var host = $('#tzg' + k), size = host.clientWidth;
      var css = getComputedStyle(document.documentElement);
      try {
        return window.HanziWriter.create(host, c, {
          width: size, height: size, padding: 8, showCharacter: true, showOutline: true,
          strokeColor: css.getPropertyValue('--ink').trim() || '#1D2622', radicalColor: css.getPropertyValue('--cinnabar').trim() || '#B5432F',
          outlineColor: css.getPropertyValue('--line').trim() || '#ddd', drawingColor: css.getPropertyValue('--accent').trim(),
          strokeAnimationSpeed: 1.1, delayBetweenStrokes: 180, charDataLoader: charLoader,
          onLoadCharDataError: function () { host.innerHTML = '<div class="fallback">' + esc(c) + '</div>'; }
        });
      } catch (e) { host.innerHTML = '<div class="fallback">' + esc(c) + '</div>'; return null; }
    });
    $('#sayZh').onclick = function () { speak(o.zh + '。' + (o.sentence || ''), 'zh-CN'); };
    $('#sayEn').onclick = function () { speak(o.en, 'en-US'); };
    $('#animBtn').onclick = function () {
      var k = 0; (function run() { var w = writers[k]; if (!w) return; w.animateCharacter({ onComplete: function () { k++; setTimeout(run, 250); } }); })();
    };
    $('#quizBtn').onclick = function () {
      $('#writeHint').textContent = '在格子里按笔顺写，写错会提示';
      writers.forEach(function (w, k) { if (w) w.quiz({ onComplete: function (s) { if (k === writers.length - 1) { $('#writeHint').textContent = '写完啦！错了 ' + s.totalMistakes + ' 笔'; } } }); });
    };
    speak(o.zh, 'zh-CN');
  }

  function recognize() {
    snap.scene = '';
    if (!settings.key) {
      $('#snapStatus').textContent = '没有设置视觉模型 Key：点照片上的东西，再在下方输入词语手动标注；或打开「设置」接入模型自动识别。';
      $('#learn').innerHTML = '<div class="empty">点照片上的位置 → 输入词语 → 手动标注。</div>';
      return;
    }
    var b64 = snap.url.split(',')[1];
    scanning(true); $('#snapStatus').textContent = '正在识别…';
    var t0 = performance.now();
    callAI(AI.visionMessages({ max: 8 }), { mediaType: 'image/jpeg', base64: b64 }).then(function (txt) {
      var r = AI.normalizeVision(P.extractJSON(txt));
      r.objects.forEach(function (o) { if (!o.pinyin) o.pinyin = pinyinFn(o.zh); });
      snap.objects = r.objects; snap.scene = r.scene;
      $('#snapStatus').textContent = (r.scene ? r.scene + '：' : '') + '找到 ' + r.objects.length + ' 样东西，用时 ' + ((performance.now() - t0) / 1000).toFixed(1) + ' 秒';
      placeTags();
      $('#learn').innerHTML = '<div class="empty">点一个标签，开始学这个词。</div>';
    }).catch(function (e) {
      $('#snapStatus').textContent = '识别失败：' + e.message + '。可以点照片手动标注。';
    }).then(function () { scanning(false); });
  }

  $('#fileInput').addEventListener('change', function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    compress(f).then(setPhoto).then(recognize).catch(function (err) { toast(err.message); });
    e.target.value = '';
  });

  // 手动标注：先点照片位置，再输入词
  photo.addEventListener('click', function (e) {
    if (!snap.img || e.target.closest('.tag')) return;
    var r = photo.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width * 1000, y = (e.clientY - r.top) / r.height * 1000;
    snap.pending = [Math.max(0, x - 90), Math.max(0, y - 90), Math.min(1000, x + 90), Math.min(1000, y + 90)];
    $('#manualInput').focus(); $('#snapStatus').textContent = '位置已记下，输入这个东西叫什么';
  });
  $('#manualForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var zh = $('#manualInput').value.trim(); if (!zh) return;
    if (!snap.img) { toast('先拍一张照片'); return; }
    var t = L.thing(zh) || {};
    snap.objects.push({ id: 'm' + Date.now(), zh: zh, pinyin: t.pinyin || pinyinFn(zh), en: t.en || '', emoji: t.emoji || '', sentence: t.sentence || '', sentence_en: '', box: snap.pending || [400, 400, 600, 600] });
    snap.pending = null; $('#manualInput').value = '';
    placeTags(); select(snap.objects.length - 1);
  });

  // 示例冰箱（插画，坐标已知，不需要 Key）
  function demoFridge() {
    var c = document.createElement('canvas'); c.width = window.HZDemo.W; c.height = window.HZDemo.H;
    window.HZDemo.draw(c.getContext('2d'));
    return { url: c.toDataURL('image/jpeg', 0.9), objects: window.HZDemo.objects(L) };
  }
  function runDemo() {
    var d = demoFridge();
    setPhoto(d.url).then(function () {
      scanning(true); $('#snapStatus').textContent = '正在识别…';
      setTimeout(function () {
        scanning(false); snap.objects = d.objects; snap.scene = '冰箱里';
        $('#snapStatus').textContent = '冰箱里：找到 ' + d.objects.length + ' 样东西（示例数据）';
        placeTags(); $('#learn').innerHTML = '<div class="empty">点一个标签，开始学这个词。</div>';
      }, 1300);
    });
  }
  $('#demoBtn').addEventListener('click', runDemo);
  $('#demoBtn2').addEventListener('click', runDemo);

  /* ================= 复习 ================= */
  var quiz = { card: null, answered: false, mistakes: 0 };
  function renderReview() {
    var deck = store.get('deck', []), st = S.stats(deck);
    $('#stats').innerHTML = [['hot', st.due, '现在要复习'], ['', st.tomorrow, '24 小时内到期'], ['', st.learning, '学习中'], ['', st.mastered, '已掌握']]
      .map(function (s) { return '<div class="panel stat ' + s[0] + '"><b>' + s[1] + '</b><span>' + s[2] + '</span></div>'; }).join('');
    var list = deck.slice().sort(function (a, b) { return a.due - b.due; });
    $('#deck').innerHTML = '<h3>我的词（' + deck.length + '）</h3>' + (list.length ? list.map(function (c) {
      return '<div class="it"><div class="th">' + (c.thumb ? '<img alt="" src="' + c.thumb + '">' : esc(c.emoji)) + '</div><div><b>' + esc(c.zh) + '</b><small>' + esc(c.pinyin) + ' · ' + esc(c.en) + '</small></div>' +
        '<div style="text-align:right"><span class="lvl">' + [1, 2, 3, 4, 5].map(function (k) { return '<i class="' + (c.level >= k ? 'f' : '') + '"></i>'; }).join('') + '</span><small class="hint" style="display:block">' + S.nextLabel(c) + '</small></div></div>';
    }).join('') : '<p class="hint" style="padding: 0 16px">还没有词。去「拍照识字」点一个标签，就会出现在这里。</p>');
    nextQuiz();
  }
  function nextQuiz() {
    var deck = store.get('deck', []), due = S.due(deck), q = $('#quiz');
    if (deck.length < 2) {
      q.innerHTML = '<div class="q">先去拍照学几个词</div><p class="hint">至少 2 个词才能出选择题。示例冰箱可以一键加入 10 个。</p><button class="btn primary" type="button" id="goSnap">去拍照识字</button>';
      $('#goSnap').onclick = function () { show('snap'); }; return;
    }
    if (!due.length) { q.innerHTML = '<div class="q">今天的复习都完成了</div><p class="hint">下一个词 ' + S.nextLabel(deck.slice().sort(function (a, b) { return a.due - b.due; })[0]) + '到期。</p>'; return; }
    var card = due[0], opts = S.distractors(deck, card, 3).concat([card]);
    opts.sort(function () { return Math.random() - 0.5; });
    quiz = { card: card, answered: false, mistakes: 0 };
    q.innerHTML = '<div class="pic">' + (card.thumb ? '<img alt="复习图片" src="' + card.thumb + '">' : esc(card.emoji)) + '</div>' +
      '<div class="q">这是什么？<button class="btn sm ghost" type="button" id="hear">听一听</button></div>' +
      '<div class="opts">' + opts.map(function (o) { return '<button type="button" data-id="' + esc(o.id) + '">' + esc(o.zh) + '<small>' + (o.id === card.id ? '' : '') + '</small></button>'; }).join('') + '</div>' +
      '<p class="hint">还剩 ' + due.length + ' 个</p>';
    $('#hear').onclick = function () { speak(card.zh, 'zh-CN'); };
    $$('.opts button', q).forEach(function (b) {
      b.onclick = function () {
        if (quiz.answered) return;
        if (b.dataset.id === card.id) {
          quiz.answered = true; b.classList.add('right'); b.querySelector('small').textContent = card.pinyin;
          speak(card.zh, 'zh-CN');
          var all = store.get('deck', []);
          all.forEach(function (c) { if (c.id === card.id) S.grade(c, quiz.mistakes ? 'again' : 'good'); });
          store.set('deck', all);
          setTimeout(renderReview, 1100);
        } else { quiz.mistakes++; b.classList.add('wrong'); }
      };
    });
  }

  /* ================= 启动 ================= */
  markChip('明'); renderWords(); redraw();
  var h = (location.hash || '').slice(1);
  show(['family', 'snap', 'review'].indexOf(h) >= 0 ? h : 'family');
})();
