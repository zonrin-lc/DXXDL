// 一次性脚本：生成未来 30 天 dailySchedule（questionId + revision），已发布日期不动（GDD 6.4）。
// 同时新增 fallback_v2 快照（含全部 28 题），只影响排期未覆盖的日期。
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));

const today = new Date();
const key = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 题目顺序：range 题与 point 题交替穿插，避免连续多天同知识点（GDD 6.3）
const ids = pack.numeric.map((q) => q.id);
const rangeIds = pack.numeric.filter((q) => q.answerType === 'range').map((q) => q.id);
const pointIds = pack.numeric.filter((q) => q.answerType !== 'range').map((q) => q.id);

// 确定性洗牌（LCG），保证脚本可复现
let seed = 20261023;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
const jig = (a) => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

// 交替序列：7 道 range 与 21 道 point 先全量覆盖（28 天），最后 2 天复用（与首次出现隔开）
const rs = jig(rangeIds);   // 7
const ps = jig(pointIds);   // 21
const seq = [];
let ri = 0, pi = 0;
while (ri < rs.length || pi < ps.length) {
  // 每 3 天插一道 range，直到 range 用完后全部填 point
  if (ri < rs.length && (pi * 3 >= ri * 7 + 2)) seq.push(rs[ri++]);
  else if (pi < ps.length) seq.push(ps[pi++]);
  else seq.push(rs[ri++]);
}
// 复用题：取首尾之外的题补满 30 天（与首次出现至少隔 10 天）
for (const i of [0, Math.floor(seq.length / 2)]) seq.push(seq[i]);

const schedule = pack.dailySchedule || {};
let added = 0;
const start = new Date(today);
for (let i = 0; i < 30; i++) {
  const d = new Date(start);
  d.setDate(start.getDate() + i);
  const k = key(d);
  if (schedule[k]) continue; // 已发布日期不可变
  schedule[k] = { questionId: seq[i], revision: 1 };
  added++;
}
pack.dailySchedule = Object.fromEntries(Object.keys(schedule).sort().map((k) => [k, schedule[k]]));

// 兜底快照 v2：包含新 range 题（旧快照冻结不动）
if (!pack.fallbackPools.some((f) => f.version === 'fallback_v2')) {
  pack.fallbackPools.push({ version: 'fallback_v2', questionIds: ids });
}

pack.version = '2.4.0';
writeFileSync(file, JSON.stringify(pack, null, 2) + '\n');
const covered = Object.keys(pack.dailySchedule).length;
console.log(`✅ 新增 ${added} 天排期，共 ${covered} 天覆盖；fallback 版本 ${pack.fallbackPools.map((f) => f.version).join(', ')}；version → ${pack.version}`);
console.log('排期预览:', JSON.stringify(Object.fromEntries(Object.entries(pack.dailySchedule).slice(-5)), null, 0));
