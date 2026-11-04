// 对象表生成（随机遭遇层数据地基，GDD 6.10）：
// 从 data/pools.json 三个视觉池提取全部对象（assetId 唯一），
// 合并 tools/object-registry.mjs 的对象级来源，产出 data/objects.json。
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

const objects = new Map(); // assetId → { name, size, emoji, dims: Map<dimension, count> }
for (const key of ['everyday', 'pop', 'geo']) {
  for (const q of pack[key] || []) {
    for (const side of ['reference', 'target']) {
      const o = q[side];
      if (!o?.assetId) continue;
      if (!objects.has(o.assetId)) {
        objects.set(o.assetId, { name: o.name, size: o.size, emoji: o.emoji, dims: new Map() });
      }
      const entry = objects.get(o.assetId);
      if (entry.size !== o.size) throw new Error(`${o.assetId} 尺寸不一致：${entry.size} vs ${o.size}（${q.id}）`);
      if (q.dimension) entry.dims.set(q.dimension, (entry.dims.get(q.dimension) || 0) + 1);
    }
  }
}

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

const out = { version: '1.0.0', generatedFrom: `pools.json v${pack.version}`, objects: {} };
const missing = [];
for (const [assetId, o] of [...objects.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const dim = pickDim(o.dims);
  if (!dim || !DIM_GROUP[dim]) throw new Error(`${assetId} 缺少可识别的比较维度`);
  const reg = OBJECT_SOURCES[assetId];
  const isOriginal = ORIGINAL_CHARACTERS.includes(assetId);
  if (!reg && !isOriginal) { missing.push(assetId); continue; }
  out.objects[assetId] = {
    name: o.name,
    size: o.size,
    emoji: o.emoji,
    measure: 'length',
    dim,
    dimGroup: DIM_GROUP[dim],
    source: isOriginal
      ? { type: 'original', doc: `${ORIGINAL_DOC}#${assetId}` }
      : { type: 'reference', name: reg.srcName, url: reg.url, reviewStatus: reg.status, note: reg.note },
  };
}
if (missing.length) {
  console.error('❌ 以下对象缺少来源登记（object-registry.mjs）：' + missing.join(', '));
  process.exit(1);
}

const file = path.join(root, 'data', 'objects.json');
writeFileSync(file, JSON.stringify(out, null, 2) + '\n', 'utf8');
const v = Object.values(out.objects).filter((o) => o.dimGroup === 'v').length;
console.log(`✅ ${file} 已生成：${Object.keys(out.objects).length} 个对象（竖向 ${v} / 横向 ${Object.keys(out.objects).length - v}）`);
