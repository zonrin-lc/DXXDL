// 视觉题比例带宽报告：逐池统计 q* 分布，标记超出发布带宽（1/32~32，GDD 6.5）的题目。
// validate-pools 只对 published 题做硬性拦截；本工具给出全量分布，供选题与重配对参考。
// 用法：node tools/audit-ratios.mjs [--verbose]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VISUAL_MAX_RATIO } from '../src/core/constants.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pack = JSON.parse(readFileSync(path.join(root, 'data', 'pools.json'), 'utf8'));
const verbose = process.argv.includes('--verbose');

const BUCKETS = [
  ['1:1 ~ 1:2', (r) => r < 2],
  ['1:2 ~ 1:4', (r) => r >= 2 && r < 4],
  ['1:4 ~ 1:8', (r) => r >= 4 && r < 8],
  ['1:8 ~ 1:16', (r) => r >= 8 && r < 16],
  ['1:16 ~ 1:32', (r) => r >= 16 && r <= 32],
  ['超带宽 >1:32', (r) => r > 32],
];

let overTotal = 0;
for (const key of ['everyday', 'pop', 'geo', 'weight', 'area']) {
  const arr = Array.isArray(pack[key]) ? pack[key] : [];
  const rows = arr.map((q) => ({
    id: q.id,
    label: `${q.reference?.name}(${q.reference?.size}m) vs ${q.target?.name}(${q.target?.size}m)`,
    r: Math.max(q.reference?.size ?? 1, q.target?.size ?? 1) / Math.min(q.reference?.size ?? 1, q.target?.size ?? 1),
    published: q.status === 'published' || q.status === undefined,
  })).sort((a, b) => a.r - b.r);

  console.log(`\n=== ${key}（${rows.length} 题）===`);
  for (const [label, test] of BUCKETS) {
    const n = rows.filter((row) => test(row.r)).length;
    console.log(`  ${label}: ${'█'.repeat(n)} ${n}`);
  }
  const over = rows.filter((row) => row.r > VISUAL_MAX_RATIO);
  overTotal += over.filter((row) => row.published).length;
  if (over.length) {
    console.log(`  ⚠️ 超带宽 ${over.length} 题：`);
    for (const row of over) console.log(`    ${row.published ? '❌' : '（隔离）'} ${row.id} q*=${row.r.toFixed(1)} ${row.label}`);
  }
  if (verbose) {
    for (const row of rows) console.log(`    ${row.r > VISUAL_MAX_RATIO ? '❌' : '  '} ${row.id} q*=${row.r.toFixed(2)} ${row.label}`);
  }
}

console.log(`\n发布带宽：1/${VISUAL_MAX_RATIO} ≤ q* ≤ ${VISUAL_MAX_RATIO}（ARENA 250px / MIN 6px ≈ 41 理论上限留余量）`);
console.log(overTotal === 0 ? '✅ 全部已发布视觉题均在带宽内' : `❌ ${overTotal} 道已发布题超出带宽（validate-pools 会拦截）`);
process.exit(overTotal === 0 ? 0 : 1);
