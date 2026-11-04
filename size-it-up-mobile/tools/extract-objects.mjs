// 对象表生成（随机遭遇层数据地基，GDD 6.10）：
// 从 data/pools.json 全部视觉池提取全部对象，合并 tools/object-registry.mjs 的对象级来源，
// 产出 data/objects.json。
// 用法：node tools/extract-objects.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OBJECT_SOURCES, ORIGINAL_CHARACTERS, ORIGINAL_DOC } from './object-registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pack = JSON.parse(readFileSync(path.join(root, 'data', 'pools.json'), 'utf8'));

// 比较维度 → 方向组：v=竖向（身高/高度），h=横向（长度/宽度/直径）。
// 随机配对只在同组内进行：竖立的物体不和横躺的物体比，避免「蜂鸟体长 vs 人身高」这类错位比较。
const DIM_GROUP = { 高度: 'v', 身高: 'v', 长度: 'h', 宽度: 'h', 直径: 'h' };

const LENGTH_POOLS = ['everyday', 'pop', 'geo'];
// 非长度度量没有横竖方向概念：方向组直接用度量名，配对约束已由「同 measure」保证
const SCALAR_POOLS = ['weight', 'area', 'volume', 'speed'];

// 对象键按 measure 作用域隔离：同一 assetId 在长度题里是 1.7m、在重量题里是 70kg，
// 尺寸语义不同，必须是两个对象。运行时渲染用的 assetId 原样保留在对象字段里。
const objects = new Map(); // scopedKey → { assetId?, name, size, emoji, measure, dims, sampleQuestion }
function collect(poolKey) {
  for (const q of pack[poolKey] || []) {
    if (!(q.status === 'published' || q.status === undefined)) continue;
    const measure = q.measure || 'length';
    for (const side of ['reference', 'target']) {
      const o = q[side];
      if (!o) continue;
      // 无素材的对象以名字为键（同名同度量视为同一对象）
      const scoped = `${measure}:${o.assetId || 'name:' + o.name}`;
      if (!objects.has(scoped)) {
        objects.set(scoped, {
          assetId: o.assetId || null, name: o.name, size: o.size, emoji: o.emoji,
          measure, dims: new Map(), sampleQuestion: q,
        });
      }
      const entry = objects.get(scoped);
      if (entry.size !== o.size) throw new Error(`${scoped} 尺寸不一致：${entry.size} vs ${o.size}（${q.id}）`);
      if (q.dimension) entry.dims.set(q.dimension, (entry.dims.get(q.dimension) || 0) + 1);
    }
  }
}
LENGTH_POOLS.forEach(collect);
SCALAR_POOLS.forEach(collect);

// 代表维度：出现次数最多者；并列时优先竖向组（人形/建筑类素材以竖向呈现更自然）。
function pickDim(dims) {
  let best = null;
  let bestN = -1;
  for (const [dim, n] of dims) {
    if (n > bestN || (n === bestN && DIM_GROUP[dim] === 'v' && DIM_GROUP[best] !== 'v')) {
      best = dim;
      bestN = n;
    }
  }
  return best;
}

/** 对象级来源：length 对象优先用注册表（带证据文本）；其余从样本题目的来源派生 */
function sourceFor(scoped, o) {
  const reg = o.assetId && OBJECT_SOURCES[o.assetId];
  const isOriginal = o.assetId && ORIGINAL_CHARACTERS.includes(o.assetId);
  if (isOriginal) return { type: 'original', doc: `${ORIGINAL_DOC}#${o.assetId}` };
  if (o.measure === 'length') {
    if (!reg) return null; // length 对象必须注册，缺登记视为失败（见下方 missing 检查）
    return { type: 'reference', name: reg.srcName, url: reg.url, reviewStatus: reg.status, note: reg.note };
  }
  if (reg) return { type: 'reference', name: reg.srcName, url: reg.url, reviewStatus: reg.status, note: reg.note };
  const qs = o.sampleQuestion && o.sampleQuestion.source;
  if (!qs || !qs.url) return null;
  return {
    type: 'reference',
    name: qs.name,
    url: qs.url,
    reviewStatus: ['verified', 'derived'].includes(qs.reviewStatus) ? qs.reviewStatus : 'derived',
    note: `数值口径见题库题目 ${o.sampleQuestion.id} 的来源与备注`,
  };
}

const out = { version: '1.1.0', generatedFrom: `pools.json v${pack.version}`, objects: {} };
const missing = [];
for (const [scoped, o] of [...objects.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const dim = pickDim(o.dims);
  if (!dim) throw new Error(`${scoped} 缺少可识别的比较维度`);
  const dimGroup = o.measure === 'length' ? DIM_GROUP[dim] : o.measure;
  if (!dimGroup) throw new Error(`${scoped} 缺少可识别的比较维度`);
  const source = sourceFor(scoped, o);
  if (!source) { missing.push(scoped); continue; }
  out.objects[scoped] = {
    assetId: o.assetId,
    name: o.name,
    size: o.size,
    emoji: o.emoji,
    measure: o.measure,
    dim,
    dimGroup,
    source,
  };
}
if (missing.length) {
  console.error('❌ 以下对象缺少来源登记（object-registry.mjs 或题目级 source）：' + missing.join(', '));
  process.exit(1);
}

const file = path.join(root, 'data', 'objects.json');
writeFileSync(file, JSON.stringify(out, null, 2) + '\n', 'utf8');
const vals = Object.values(out.objects);
const byMeasure = {};
for (const o of vals) byMeasure[o.measure] = (byMeasure[o.measure] || 0) + 1;
const v = vals.filter((o) => o.dimGroup === 'v').length;
const h = vals.filter((o) => o.dimGroup === 'h').length;
console.log(
  `✅ ${file} 已生成：${vals.length} 个对象（length 竖向 ${v} / 横向 ${h}）｜` +
    Object.entries(byMeasure).map(([m, n]) => `${m} ${n}`).join(' / ')
);
