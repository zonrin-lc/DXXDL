// 构建脚本：esbuild 打包 src/ui/main.js 为 IIFE，CSS 与内置题库注入 shell.html，
// 插画全部内联为 data URI，输出根目录 index.html（单文件零依赖发布产物，构建 fail-closed）。
// data/pools.json 同时保留为热更新源。
import { build } from 'esbuild';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

function fail(msg) {
  console.error('❌ ' + msg);
  process.exit(1);
}

// 题库必须是合法 JSON 才允许进入发布产物（校验失败直接构建失败）
const packText = readFileSync(path.join(root, 'data', 'pools.json'), 'utf8');
try {
  JSON.parse(packText);
} catch (e) {
  console.error('❌ data/pools.json 不是合法 JSON：' + e.message);
  process.exit(1);
}

const result = await build({
  entryPoints: [path.join(root, 'src', 'ui', 'main.js')],
  bundle: true,
  format: 'iife',
  target: ['es2019'],
  write: false,
  logLevel: 'warning',
});
const js = result.outputFiles[0].text;
const css = readFileSync(path.join(root, 'src', 'styles', 'base.css'), 'utf8');
const shell = readFileSync(path.join(root, 'src', 'shell.html'), 'utf8');

// 插画 manifest（GDD 6.6）：assetId → 画布/bounds/度量轴，供 visual.js 渲染查表。
// fail-closed：manifest 缺失或非法直接构建失败——静默降级成纯 emoji 会让视觉题上线即残。
let manifest;
try {
  manifest = JSON.parse(readFileSync(path.join(root, 'assets', 'img', 'manifest.json'), 'utf8'));
} catch (e) {
  fail('插画 manifest 缺失或非法，构建中止：' + e.message);
}

// 把每张插画内联为 data URI：产物承诺「单 HTML 零依赖」，外链 assets/img/*.png 在
// 单文件分发场景会全部破图（P0 修复）。素材缺失同样 fail-closed。
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
let inlineCount = 0;
let inlineBytes = 0;
for (const [id, entry] of Object.entries(manifest)) {
  const file = entry && entry.file;
  if (typeof file !== 'string' || file.startsWith('data:')) continue; // 已内联的条目跳过
  const abs = path.join(root, file);
  if (!existsSync(abs)) fail(`manifest 条目 ${id} 指向的素材不存在：${file}`);
  const mime = MIME[path.extname(file).toLowerCase()];
  if (!mime) fail(`manifest 条目 ${id} 的素材格式不支持内联：${file}`);
  const buf = readFileSync(abs);
  entry.file = `data:${mime};base64,${buf.toString('base64')}`;
  inlineCount += 1;
  inlineBytes += buf.length;
}
const manifestText = JSON.stringify(manifest);

// 随机遭遇层对象表（GDD 6.10）：fail-closed，缺失时不再静默退化为运行时推导
let objectsText;
try {
  objectsText = readFileSync(path.join(root, 'data', 'objects.json'), 'utf8').trim();
  JSON.parse(objectsText);
} catch (e) {
  fail('对象表 data/objects.json 缺失或非法，构建中止：' + e.message);
}

// 内置兜底题库以全局变量注入，避免在打包产物里做字符串替换
const bundledJs =
  'window.__BSZ_BASE_PACK__ = ' + packText.trim() + ';\n' +
  'window.__BSZ_ASSET_MANIFEST__ = ' + manifestText + ';\n' +
  'window.__BSZ_OBJECTS__ = ' + objectsText + ';\n' + js;

const html = shell.split('/*__CSS__*/').join(css).split('/*__JS__*/').join(bundledJs);

if (html.includes('/*__CSS__*/') || html.includes('/*__JS__*/')) {
  fail('占位符未全部注入');
}

// 自包含断言：产物里不允许再出现本地素材外链（source 字段里的 https 出处 URL 不受影响）
if (html.includes('assets/img/')) {
  fail('产物仍包含 assets/img/ 外链引用，单文件零依赖不成立');
}

writeFileSync(path.join(root, 'index.html'), html);
console.log(
  `✅ index.html 已生成（${(html.length / 1024).toFixed(1)} KB，含题库 v${JSON.parse(packText).version}，` +
    `内联插画 ${inlineCount} 张 / ${(inlineBytes / 1024 / 1024).toFixed(1)} MB）`
);
