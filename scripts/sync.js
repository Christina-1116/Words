// 把 core/ 和依赖同步到 web/ 与 miniprogram/。用法：node scripts/sync.js [node_modules 路径]
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const nm = process.argv[2] || path.join(root, 'node_modules');
const cp = (a, b) => { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); };
for (const f of fs.readdirSync(path.join(root, 'core'))) {
  cp(path.join(root, 'core', f), path.join(root, 'web/core', f));
  cp(path.join(root, 'core', f), path.join(root, 'miniprogram/utils/core', f));
}
cp(path.join(nm, 'pinyin-pro/dist/index.js'), path.join(root, 'web/vendor/pinyin-pro.js'));
cp(path.join(nm, 'pinyin-pro/dist/index.js'), path.join(root, 'miniprogram/utils/pinyin-pro.js'));
cp(path.join(nm, 'hanzi-writer/dist/hanzi-writer.min.js'), path.join(root, 'web/vendor/hanzi-writer.min.js'));
cp(path.join(nm, 'jszip/dist/jszip.min.js'), path.join(root, 'web/vendor/jszip.min.js'));
// 笔顺数据：打包内置词库 + 常见物品用到的字，其余运行时走 CDN
const L = require(path.join(root, 'core/lexicon.js'));
const chars = new Set();
Object.entries(L.FAMILY).forEach(([c, f]) => { chars.add(c); f.words.forEach(w => [...w[0]].forEach(x => chars.add(x))); });
L.THINGS.forEach(t => [...t[0]].forEach(x => chars.add(x)));
let n = 0;
for (const c of chars) {
  const src = path.join(nm, 'hanzi-writer-data', c + '.json');
  if (fs.existsSync(src)) { cp(src, path.join(root, 'web/hanzi-data', c + '.json')); n++; }
}
// 小程序：笔顺数据打成一个 JS 模块；云函数：复制 ai.js
const strokeMap = {};
for (const c of chars) { const src = path.join(nm, 'hanzi-writer-data', c + '.json'); if (fs.existsSync(src)) strokeMap[c] = JSON.parse(fs.readFileSync(src, 'utf8')); }
fs.writeFileSync(path.join(root, 'miniprogram/utils/stroke-data.js'), '// 自动生成：node scripts/sync.js\nmodule.exports = ' + JSON.stringify(strokeMap) + ';\n');
cp(path.join(root, 'core/ai.js'), path.join(root, 'cloudfunctions/aiProxy/ai.js'));
console.log('core synced; stroke data for', n, '/', chars.size, 'chars');
