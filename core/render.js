/**
 * 字族图 Canvas 渲染器。只用标准 Canvas 2D API，Web 与微信小程序 (type="2d") 通用。
 * draw(ctx, data, { width, height, theme, brand, showCat, fonts, images })
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HZRender = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var THEMES = {
    mist:    { name: '雾青', bg: '#E6EAE8', bg2: '#D9DFDC', card: '#F7F8F6', ink: '#25343A', sub: '#76868B', accent: '#3C6273', line: 'rgba(37,52,58,', seal: '#3C6273', sealInk: '#F7F8F6' },
    paper:   { name: '宣纸', bg: '#F1ECE2', bg2: '#E6DECF', card: '#FBF8F2', ink: '#24201B', sub: '#857A6B', accent: '#9E3A2B', line: 'rgba(60,45,30,', seal: '#A63A2A', sealInk: '#FBF8F2' },
    celadon: { name: '青瓷', bg: '#E2EBE3', bg2: '#D3E0D5', card: '#F5F9F4', ink: '#1F3530', sub: '#6E8A80', accent: '#2F6B5A', line: 'rgba(31,53,48,', seal: '#2F6B5A', sealInk: '#F5F9F4' },
    night:   { name: '墨金', bg: '#16181E', bg2: '#0E1014', card: '#20232B', ink: '#EFE7D4', sub: '#9C9483', accent: '#CDA65C', line: 'rgba(239,231,212,', seal: '#B98E43', sealInk: '#16181E' }
  };
  var CAT_ZH = { B: '本义', L: '生活', A: '动作', C: '反差' };

  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }

  /** 计算卡片位置：椭圆等弧长初始分布 + 碰撞松弛；放不下就整体缩小卡片重排。
   *  返回 {cx, cy, R, cw, ch, cards:[{x,y}] (中心点)} */
  function layout(W, H, n) {
    var s = Math.min(W, H);
    var m = s * 0.05, head = s * 0.085, foot = s * 0.06;
    var box = { x0: m, y0: m + head, x1: W - m, y1: H - m - foot };
    var cx = (box.x0 + box.x1) / 2, cy = (box.y0 + box.y1) / 2;
    var R = Math.min(box.x1 - box.x0, box.y1 - box.y0) * 0.19;
    var best = null;
    for (var k = 1; k >= 0.6; k -= 0.04) {
      var cw = s * 0.205 * k, ch = cw * 1.2;
      var res = place(box, cx, cy, R, cw, ch, n, s);
      best = { s: s, m: m, cx: cx, cy: cy, R: R, cw: cw, ch: ch, cards: res.cards, footY: H - m - foot / 2 };
      if (res.ok) break;
    }
    return best;
  }

  function place(box, cx, cy, R, cw, ch, n, s) {
    var ex = (box.x1 - box.x0 - cw) / 2, ey = (box.y1 - box.y0 - ch) / 2;
    var N = 720, pts = [], acc = [0];
    for (var i = 0; i <= N; i++) { var t = -Math.PI / 2 + (i / N) * Math.PI * 2; pts.push([cx + ex * Math.cos(t), cy + ey * Math.sin(t)]); if (i) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); }
    var total = acc[N], cards = [], j = 0;
    for (var q = 0; q < n; q++) { var target = total * q / n; while (acc[j] < target) j++; cards.push({ x: pts[j][0], y: pts[j][1] }); }
    var gap = s * 0.022, need = R + gap * 1.6;
    function circleDist(C) {
      var nx = Math.max(C.x - cw / 2, Math.min(cx, C.x + cw / 2)), ny = Math.max(C.y - ch / 2, Math.min(cy, C.y + ch / 2));
      return Math.hypot(nx - cx, ny - cy);
    }
    for (var it = 0; it < 500; it++) {
      for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) {
        var A = cards[a], B = cards[b];
        var ox = cw + gap - Math.abs(A.x - B.x), oy = ch + gap - Math.abs(A.y - B.y);
        if (ox > 0 && oy > 0) {
          if (ox < oy) { var dx = (A.x < B.x ? -1 : 1) * ox / 2; A.x += dx; B.x -= dx; }
          else { var dy = (A.y < B.y ? -1 : 1) * oy / 2; A.y += dy; B.y -= dy; }
        }
      }
      for (var c = 0; c < n; c++) {
        var C = cards[c], d = circleDist(C);
        if (d < need) { var vx = C.x - cx, vy = C.y - cy, L = Math.hypot(vx, vy) || 1; C.x += vx / L * (need - d); C.y += vy / L * (need - d); }
        C.x = Math.max(box.x0 + cw / 2, Math.min(box.x1 - cw / 2, C.x));
        C.y = Math.max(box.y0 + ch / 2, Math.min(box.y1 - ch / 2, C.y));
      }
    }
    var ok = true, tol = gap * 0.5;
    for (a = 0; a < n && ok; a++) {
      if (circleDist(cards[a]) < R + tol) ok = false;
      for (b = a + 1; b < n; b++) if (cw + tol - Math.abs(cards[a].x - cards[b].x) > 0 && ch + tol - Math.abs(cards[a].y - cards[b].y) > 0) { ok = false; break; }
    }
    return { cards: cards, ok: ok };
  }

  function draw(ctx, d, o) {
    o = o || {};
    var W = o.width, H = o.height, T = THEMES[o.theme] || THEMES.mist;
    var F = o.fonts || {};
    var zh = F.zh || '"Noto Serif SC", "Songti SC", "STSong", serif';
    var lat = F.latin || '"Noto Serif", "Noto Serif SC", Georgia, serif';
    var n = d.words.length, L = layout(W, H, n), s = L.s, u = s / 1000;
    var rand = rng(hash(d.char + (o.theme || '')));

    // 背景 + 柔光 + 纸纹
    ctx.save();
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    var g = ctx.createRadialGradient(L.cx, L.cy, s * 0.05, L.cx, L.cy, Math.max(W, H) * 0.75);
    g.addColorStop(0, T.card); g.addColorStop(0.45, T.bg); g.addColorStop(1, T.bg2);
    ctx.globalAlpha = 0.85; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    for (var i = 0; i < 2600; i++) {
      ctx.fillStyle = T.line + (0.02 + rand() * 0.04) + ')';
      var dw = rand() * 2.2 * u + 0.4;
      ctx.fillRect(rand() * W, rand() * H, dw, dw * (0.3 + rand()));
    }
    // 放射细线
    ctx.lineWidth = Math.max(1, 1.2 * u);
    for (i = 0; i < 28; i++) {
      var ang = i / 28 * Math.PI * 2 + 0.06;
      ctx.strokeStyle = T.line + '0.05)';
      ctx.beginPath(); ctx.moveTo(L.cx + Math.cos(ang) * L.R * 1.3, L.cy + Math.sin(ang) * L.R * 1.3);
      ctx.lineTo(L.cx + Math.cos(ang) * s * 1.2, L.cy + Math.sin(ang) * s * 1.2); ctx.stroke();
    }
    // 同心环
    [1.28, 1.62].forEach(function (k, idx) {
      ctx.strokeStyle = T.line + (idx ? '0.06)' : '0.11)');
      ctx.beginPath(); ctx.arc(L.cx, L.cy, L.R * k, 0, Math.PI * 2); ctx.stroke();
    });
    // 连线：中心 → 卡片
    ctx.strokeStyle = T.line + '0.18)'; ctx.lineWidth = Math.max(1, 1.6 * u);
    L.cards.forEach(function (c) {
      var vx = c.x - L.cx, vy = c.y - L.cy, len = Math.hypot(vx, vy) || 1;
      ctx.beginPath(); ctx.moveTo(L.cx + vx / len * L.R * 1.02, L.cy + vy / len * L.R * 1.02); ctx.lineTo(c.x, c.y); ctx.stroke();
      ctx.fillStyle = T.accent; ctx.beginPath(); ctx.arc(L.cx + vx / len * L.R * 1.28, L.cy + vy / len * L.R * 1.28, 3.2 * u, 0, Math.PI * 2); ctx.fill();
    });

    // 中心徽章
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 40 * u; ctx.shadowOffsetY = 14 * u;
    ctx.fillStyle = T.card; ctx.beginPath(); ctx.arc(L.cx, L.cy, L.R, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = T.accent; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.4 * u;
    ctx.beginPath(); ctx.arc(L.cx, L.cy, L.R - 12 * u, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = T.accent; ctx.font = '600 ' + (L.R * 1.02) + 'px ' + zh;
    ctx.fillText(d.char, L.cx, L.cy - L.R * 0.13);
    ctx.fillStyle = T.ink; ctx.font = (L.R * 0.19) + 'px ' + lat;
    ctx.fillText(d.pinyin, L.cx, L.cy + L.R * 0.5);
    ctx.fillStyle = T.sub; ctx.font = 'italic ' + (L.R * 0.13) + 'px ' + lat;
    ctx.fillText(d.english, L.cx, L.cy + L.R * 0.7);

    // 卡片
    var cw = L.cw, chh = L.ch;
    d.words.forEach(function (w, idx) {
      var c = L.cards[idx], x = c.x - cw / 2, y = c.y - chh / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.10)'; ctx.shadowBlur = 26 * u; ctx.shadowOffsetY = 10 * u;
      ctx.fillStyle = T.card; rr(ctx, x, y, cw, chh, cw * 0.07); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = T.line + '0.10)'; ctx.lineWidth = Math.max(1, u); rr(ctx, x + 0.5, y + 0.5, cw - 1, chh - 1, cw * 0.07); ctx.stroke();

      if (o.showCat !== false) {
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillStyle = w.cat === 'C' ? T.accent : T.sub; ctx.font = (cw * 0.052) + 'px ' + zh;
        ctx.fillText(CAT_ZH[w.cat] || '', x + cw - cw * 0.07, y + cw * 0.085);
      }
      // 词（主字高亮）
      var chars = Array.from(w.word), fs = cw * (chars.length >= 3 ? 0.2 : 0.235);
      ctx.font = '600 ' + fs + 'px ' + zh; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      var tw = 0; chars.forEach(function (ch) { tw += ctx.measureText(ch).width; });
      var gapc = fs * 0.06, tx = c.x - (tw + gapc * (chars.length - 1)) / 2, ty = y + chh * 0.2;
      chars.forEach(function (ch) { ctx.fillStyle = ch === d.char ? T.accent : T.ink; ctx.fillText(ch, tx, ty); tx += ctx.measureText(ch).width + gapc; });
      ctx.textAlign = 'center';
      ctx.fillStyle = T.ink; ctx.globalAlpha = 0.78; ctx.font = (cw * 0.082) + 'px ' + lat;
      ctx.fillText(w.pinyin, c.x, y + chh * 0.345); ctx.globalAlpha = 1;
      ctx.fillStyle = T.accent; ctx.font = 'italic ' + fitSize(ctx, w.english, cw * 0.074, cw * 0.86, lat, 'italic ') + 'px ' + lat;
      ctx.fillText(w.english, c.x, y + chh * 0.435);
      ctx.strokeStyle = T.line + '0.16)'; ctx.beginPath(); ctx.moveTo(c.x - cw * 0.09, y + chh * 0.51); ctx.lineTo(c.x + cw * 0.09, y + chh * 0.51); ctx.stroke();
      var img = o.images && o.images[idx];
      if (img) {
        var sz = cw * 0.44; ctx.drawImage(img, c.x - sz / 2, y + chh * 0.745 - sz / 2, sz, sz);
      } else {
        ctx.font = (cw * 0.29) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.fillStyle = T.ink; ctx.fillText(w.emoji, c.x, y + chh * 0.75);
      }
    });

    // 页眉：栏目名 + 印章
    var hy = L.m + s * 0.035;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = T.ink; ctx.font = '600 ' + (s * 0.03) + 'px ' + zh;
    ctx.fillText(o.title || ('「' + d.char + '」字家族'), L.m, hy);
    ctx.fillStyle = T.sub; ctx.font = (s * 0.017) + 'px ' + lat;
    ctx.fillText('WORD FAMILY · ' + n + ' WORDS', L.m, hy + s * 0.034);
    var ss = s * 0.062, sx = W - L.m - ss, sy = hy - ss / 2 + s * 0.012;
    ctx.fillStyle = T.seal; rr(ctx, sx, sy, ss, ss, ss * 0.12); ctx.fill();
    ctx.strokeStyle = T.sealInk; ctx.globalAlpha = 0.6; ctx.lineWidth = Math.max(1, u * 1.2); rr(ctx, sx + ss * 0.09, sy + ss * 0.09, ss * 0.82, ss * 0.82, ss * 0.06); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = T.sealInk; ctx.textAlign = 'center'; ctx.font = '600 ' + (ss * 0.58) + 'px ' + zh;
    ctx.fillText(d.char, sx + ss / 2, sy + ss / 2 + ss * 0.02);
    // 页脚署名
    if (o.brand) {
      ctx.fillStyle = T.sub; ctx.font = (s * 0.018) + 'px ' + zh; ctx.textAlign = 'center';
      ctx.fillText(o.brand, W / 2, L.footY);
    }
    ctx.restore();
    return L;
  }

  function fitSize(ctx, text, size, maxW, family, prefix) {
    ctx.font = (prefix || '') + size + 'px ' + family;
    var w = ctx.measureText(text).width;
    return w > maxW ? size * maxW / w : size;
  }

  return { THEMES: THEMES, layout: layout, draw: draw, roundRect: rr };
});
