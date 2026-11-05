/**
 * 轻量笔顺动画（Canvas 2D）。数据来自 hanzi-writer-data（Make Me a Hanzi）：
 * strokes 为 SVG 路径（1024 坐标系，y 轴向上），medians 为每笔中线。
 * 原理同 hanzi-writer：用笔画轮廓做裁剪，沿中线画一条粗线，按进度推进。
 */
const LOCAL = require('./stroke-data.js');
const CDN = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/';
const cache = {};

function load(ch) {
  if (LOCAL[ch]) return Promise.resolve(LOCAL[ch]);
  if (cache[ch]) return cache[ch];
  cache[ch] = new Promise((resolve, reject) => {
    wx.request({ url: CDN + encodeURIComponent(ch) + '.json', success: r => r.statusCode === 200 ? resolve(r.data) : reject(new Error('no data')), fail: reject });
  });
  return cache[ch];
}

function parsePath(d) {
  const t = d.match(/[MLQCZ]|-?\d+(\.\d+)?/g) || [], out = []; let i = 0, cmd = '';
  while (i < t.length) {
    if (/[MLQCZ]/.test(t[i])) cmd = t[i++];
    const n = { M: 2, L: 2, Q: 4, C: 6, Z: 0 }[cmd];
    out.push([cmd].concat(t.slice(i, i + n).map(Number))); i += n;
    if (cmd === 'Z') continue;
  }
  return out;
}
function trace(ctx, cmds) {
  ctx.beginPath();
  cmds.forEach(c => {
    if (c[0] === 'M') ctx.moveTo(c[1], c[2]); else if (c[0] === 'L') ctx.lineTo(c[1], c[2]);
    else if (c[0] === 'Q') ctx.quadraticCurveTo(c[1], c[2], c[3], c[4]); else if (c[0] === 'C') ctx.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]);
    else if (c[0] === 'Z') ctx.closePath();
  });
}
function lens(m) { let s = 0; const a = [0]; for (let i = 1; i < m.length; i++) { s += Math.hypot(m[i][0] - m[i - 1][0], m[i][1] - m[i - 1][1]); a.push(s); } return a; }

class StrokeAnimator {
  constructor(canvas, size, colors) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.size = size; this.c = colors || {};
    this.data = null; this.paths = []; this.timer = null;
  }
  setChar(ch) {
    this.stop();
    return load(ch).then(d => { this.data = d; this.paths = d.strokes.map(parsePath); this.render(d.strokes.length, 0); }).catch(() => { this.data = null; this.fallback(ch); });
  }
  begin() {
    const ctx = this.ctx, k = this.size / 1024;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const dpr = this.canvas.width / this.size;
    ctx.setTransform(dpr * k, 0, 0, -dpr * k, 0, dpr * k * 900); // y 轴翻转，基线 900
  }
  // done：已完成笔数；p：当前笔进度 0~1
  render(done, p) {
    if (!this.data) return;
    const ctx = this.ctx; this.begin();
    this.paths.forEach((cmds, i) => { trace(ctx, cmds); ctx.fillStyle = i < done ? (this.c.ink || '#1D2622') : (this.c.outline || '#E4E7E2'); ctx.fill(); });
    if (p > 0 && done < this.paths.length) {
      const m = this.data.medians[done], L = lens(m), target = L[L.length - 1] * p;
      ctx.save(); trace(ctx, this.paths[done]); ctx.clip();
      ctx.beginPath(); ctx.moveTo(m[0][0], m[0][1]);
      for (let i = 1; i < m.length; i++) {
        if (L[i] <= target) ctx.lineTo(m[i][0], m[i][1]);
        else { const r = (target - L[i - 1]) / (L[i] - L[i - 1]); ctx.lineTo(m[i - 1][0] + (m[i][0] - m[i - 1][0]) * r, m[i - 1][1] + (m[i][1] - m[i - 1][1]) * r); break; }
      }
      ctx.lineWidth = 180; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = this.c.active || '#B5432F'; ctx.stroke();
      ctx.restore();
    }
  }
  get strokes() { return this.paths.length; }
  // onStroke(i, n)：开始画第 i+1 笔时回调，用于「第 i / n 笔」
  animate(onDone, onStroke) {
    if (!this.data) { onDone && onDone(); return; }
    this.stop();
    const n = this.paths.length, per = 520, pause = 160; let i = 0, t0 = Date.now();
    if (onStroke) onStroke(0, n);
    const tick = () => {
      const t = Date.now() - t0;
      if (t < per) this.render(i, t / per);
      else if (t < per + pause) this.render(i + 1, 0);
      else { i++; t0 = Date.now(); if (i >= n) { this.render(n, 0); this.timer = null; onDone && onDone(); return; } if (onStroke) onStroke(i, n); }
      this.timer = this.canvas.requestAnimationFrame(tick);
    };
    this.render(0, 0); this.timer = this.canvas.requestAnimationFrame(tick);
  }
  outlineOnly() { if (this.data) this.render(0, 0); }
  stop() { if (this.timer) { this.canvas.cancelAnimationFrame(this.timer); this.timer = null; } }
  fallback(ch) {
    const ctx = this.ctx, dpr = this.canvas.width / this.size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, this.size, this.size);
    ctx.fillStyle = this.c.ink || '#1D2622'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 ' + this.size * 0.72 + 'px serif'; ctx.fillText(ch, this.size / 2, this.size / 2);
  }
}
module.exports = { StrokeAnimator, load };
