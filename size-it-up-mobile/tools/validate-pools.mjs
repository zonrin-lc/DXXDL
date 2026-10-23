// 题库静态校验：读取 data/pools.json，跑 src/core/question.js 的 validatePack，
// 逐条打印 {path, msg}。0 错误 → exit 0，否则 exit 1（npm run check）。
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePack } from '../src/core/question.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');

let pack;
try {
  pack = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.error(`❌ data/pools.json 读取或解析失败：${e.message}`);
  process.exit(1);
}

const errors = validatePack(pack);
if (errors.length) {
  console.error(`❌ data/pools.json 校验未通过，共 ${errors.length} 处问题：`);
  for (const { path: p, msg } of errors) console.error(`  [${p}] ${msg}`);
  process.exit(1);
}

const counts = ['everyday', 'pop', 'geo', 'numeric']
  .map((k) => `${k} ${Array.isArray(pack[k]) ? pack[k].length : '—'}`)
  .join(' / ');
console.log(`✅ data/pools.json 通过 validatePack（0 错误）｜v${pack.version}｜${counts}`);
process.exit(0);
