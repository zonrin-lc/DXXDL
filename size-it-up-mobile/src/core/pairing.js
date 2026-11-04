// 随机遭遇层（GDD 6.10）：从对象库随机抽对生成视觉题。
// 与精选池同口径：同度量、同方向组、发布带宽 1/VISUAL_MAX_RATIO ~ VISUAL_MAX_RATIO；
// 种子化随机（mulberry32）保证同一种子产出同一局，便于复盘与分享。
import { VISUAL_MAX_RATIO } from './constants.js';

/** mulberry32：32 位种子的确定性 PRNG，返回 [0,1) */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 难度推导（GDD 6.10）：与精选池人工标注同口径——
 * 几乎一样大（span<1.5）最难，需要 6% 以内的精细区分（对照精选池 ev-15 篮球vs足球 1.1 标 d3）；
 * 明显差异（span 1.5~4）为入门；跨档差异（4~32）为中等。
 */
export function deriveDifficulty(span) {
  if (span < 1.5) return 3;
  if (span <= 4) return 1;
  return 2;
}

/**
 * 从对象库抽 count 个不重复配对。
 * 约束：双方 measure 相同、dimGroup 相同（竖向不比横向）、尺寸比在发布带宽内、
 * 一局内无序对不重复、目标物不重复（参考物允许复现，与精选池一致）。
 * 对象：{ assetId, name, size, emoji, measure, dim, dimGroup, source? }
 * 返回 [[refObj, tgtObj], ...]；候选不足时返回已抽到的部分（可能少于 count）。
 */
export function samplePairs(objects, count, rng = Math.random) {
  const pool = (objects || []).filter((o) => o && o.size > 0 && o.dimGroup && o.measure);
  const usedPairs = new Set();
  const usedTargets = new Set();
  const out = [];
  let guard = pool.length * pool.length * 4 + 100; // 拒绝采样上限，防止候选耗尽时死循环
  while (out.length < count && guard-- > 0) {
    const a = pool[Math.floor(rng() * pool.length)];
    if (!a || usedTargets.has(a.assetId)) continue;
    const cands = pool.filter(
      (o) =>
        o !== a &&
        o.measure === a.measure &&
        o.dimGroup === a.dimGroup &&
        !usedTargets.has(o.assetId) &&
        !usedPairs.has(pairKey(a, o)) &&
        inBand(a.size, o.size)
    );
    if (!cands.length) continue;
    const b = cands[Math.floor(rng() * cands.length)];
    usedPairs.add(pairKey(a, b));
    usedTargets.add(b.assetId);
    out.push([a, b]);
  }
  return out;
}

function pairKey(a, b) {
  return [a.assetId, b.assetId].sort().join('|');
}

function inBand(x, y) {
  const span = Math.max(x, y) / Math.min(x, y);
  return span <= VISUAL_MAX_RATIO;
}

/**
 * 把一对对象组装成与 pools.json 视觉题同构的题目对象。
 * source 由双方对象级来源合成（与 tools/p0-repair.mjs 的口径一致）：
 * 任一方为原创角色时整题走 type='original'；双方都缺来源时省略 source（运行时题不进发布门禁）。
 */
export function buildRandomQuestion(refObj, tgtObj) {
  const span = Math.max(refObj.size, tgtObj.size) / Math.min(refObj.size, tgtObj.size);
  const q = {
    id: `rv:${refObj.assetId}>${tgtObj.assetId}`,
    reference: { name: refObj.name, size: refObj.size, emoji: refObj.emoji, assetId: refObj.assetId },
    target: { name: tgtObj.name, size: tgtObj.size, emoji: tgtObj.emoji, assetId: tgtObj.assetId },
    dimension: tgtObj.dim,
    measure: refObj.measure,
    difficulty: deriveDifficulty(span),
    status: 'published',
  };
  const source = composeSource(refObj, tgtObj);
  if (source) q.source = source;
  return q;
}

function composeSource(refObj, tgtObj) {
  const r = refObj.source;
  const t = tgtObj.source;
  if (!r && !t) return null;
  const rOrig = r && r.type === 'original';
  const tOrig = t && t.type === 'original';
  if (rOrig || tOrig) {
    const origObj = rOrig ? refObj : tgtObj;
    const other = rOrig ? t : r;
    const otherObj = rOrig ? tgtObj : refObj;
    const src = {
      name: '《比大小》角色设定文档 v1.0（游戏自设角色）',
      type: 'original',
      year: 2026,
      doc: (rOrig ? r : t).doc,
      reviewStatus: 'original_design',
      reviewNote: `${refObj.name}=${refObj.size}m 与 ${tgtObj.name}=${tgtObj.size}m 中的 ${origObj.name} 尺寸为游戏自设，设定依据见角色设定文档对应条目。`,
    };
    if (other && other.type === 'reference') {
      src.additionalUrls = [other.url];
      src.reviewNote += ` 另一方 ${otherObj.name}=${otherObj.size}m：${other.note}。`;
    }
    return src;
  }
  if (!r || !t || r.type !== 'reference' || t.type !== 'reference') return null;
  return {
    name: `${r.name} / ${t.name}`,
    year: 2026,
    url: t.url,
    additionalUrls: [r.url],
    reviewStatus: r.reviewStatus === 'verified' && t.reviewStatus === 'verified' ? 'verified' : 'derived',
    reviewNote: `${refObj.name}=${refObj.size}m：${r.note}；${tgtObj.name}=${tgtObj.size}m：${t.note}。`,
  };
}
