// 构建脚本：esbuild 打包 src/ui/main.js 为 IIFE，CSS 与内置题库注入 shell.html，
// 输出根目录 index.html（单文件零依赖发布产物）。data/pools.json 同时保留为热更新源。
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

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

// 插画 manifest（GDD 6.6）：assetId → 文件/画布/bounds/度量轴，供 visual.js 渲染查表
let manifestText = '{}';
try {
  manifestText = readFileSync(path.join(root, 'assets', 'img', 'manifest.json'), 'utf8').trim();
  JSON.parse(manifestText);
} catch (e) {
  console.warn('⚠️ 插画 manifest 缺失或非法，将以纯 emoji 模式构建：' + e.message);
  manifestText = '{}';
}

// 内置兜底题库以全局变量注入，避免在打包产物里做字符串替换
const bundledJs =
  'window.__BSZ_BASE_PACK__ = ' + packText.trim() + ';\n' +
  'window.__BSZ_ASSET_MANIFEST__ = ' + manifestText + ';\n' + js;

const html = shell.split('/*__CSS__*/').join(css).split('/*__JS__*/').join(bundledJs);

if (html.includes('/*__CSS__*/') || html.includes('/*__JS__*/')) {
  console.error('❌ 占位符未全部注入');
  process.exit(1);
}

writeFileSync(path.join(root, 'index.html'), html);
console.log(
  `✅ index.html 已生成（${(html.length / 1024).toFixed(1)} KB，含题库 v${JSON.parse(packText).version}）`
);
