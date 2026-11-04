// P0 题库整改（一次性迁移，2026-11-04）：
// 1) 超带宽视觉题重新配对（发布带宽 1/32 ≤ q* ≤ 32，GDD 6.5 新增规则）
// 2) 蓝鲸vs家猫、明长城两题转成数量级题（num-50/51/52）
// 3) 为全部视觉题注入对象级来源（source.url/reviewStatus/reviewEvidence），
//    原创角色走 source.type='original' + data/original-characters.md
// 用法：node tools/p0-repair.mjs [--dry-run]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));
const dryRun = process.argv.includes('--dry-run');

// 对象级来源登记已抽取到 tools/object-registry.mjs（与 extract-objects.mjs 共用，避免两份注册表漂移）
import { OBJECT_SOURCES, ORIGINAL_CHARACTERS, ORIGINAL_DOC } from './object-registry.mjs';

// ---------- 对象尺寸表（从现有题目提取；泰姬陵按核验结果 74→73） ----------
const objects = new Map();
for (const key of ['everyday', 'pop', 'geo']) {
  for (const q of pack[key]) {
    for (const side of ['reference', 'target']) {
      const o = q[side];
      if (o?.assetId && !objects.has(o.assetId)) objects.set(o.assetId, { name: o.name, size: o.size, emoji: o.emoji, assetId: o.assetId });
    }
  }
}
objects.get('taj-mahal').size = 73;

// ---------- 重配对表（id → [refAssetId, tgtAssetId, dimension, difficulty]） ----------
const REPAIR = {
  everyday: {
    'ev-21': ['standard-door', 'giraffe', '高度', 2],
    'ev-43': ['sedan-car', 'soda-can', '高度', 2],
    'ev-45': ['smartphone', 'basketball', '长度', 2],
    'ev-49': ['single-storey-house', 'blue-whale', '长度', 3],
  },
  pop: {
    'pop-9': ['crystal-titan', 'abyss-lizard', '长度', 2],
    'pop-42': ['cube-sprite', 'cloud-giant', '身高', 3],
    'pop-44': ['tempest-griffin', 'crystal-titan', '高度', 3],
    'pop-47': ['moss-beast', 'crystal-titan', '高度', 3],
    'pop-49': ['cube-sprite', 'starvine-hunter', '身高', 3],
  },
  geo: {
    'geo-3': ['golden-gate-tower', 'eiffel-tower', '高度', 2],
    'geo-4': ['eiffel-tower', 'tokyo-tower', '高度', 1],
    'geo-5': ['tokyo-tower', 'empire-state-building', '高度', 2],
    'geo-6': ['shanghai-tower', 'burj-khalifa', '高度', 2],
    'geo-7': ['canton-tower', 'burj-khalifa', '高度', 2],
    'geo-8': ['mount-tai', 'shanghai-tower', '高度', 3],
    'geo-9': ['mount-everest', 'mount-tai', '高度', 2],
    'geo-11': ['statue-of-liberty', 'big-ben', '高度', 1],
    'geo-12': ['big-ben', 'london-eye', '高度', 2],
    'geo-13': ['eiffel-tower', 'oriental-pear-tower', '高度', 2],
    'geo-14': ['burj-khalifa', 'mount-tai', '高度', 3],
    'geo-18': ['mature-oak-tree', 'london-eye', '高度', 3],
    'geo-22': ['tokyo-tower', 'taipei-101', '高度', 2],
    'geo-23': ['shanghai-tower', 'taipei-101', '高度', 2],
    'geo-24': ['mount-everest', 'burj-khalifa', '高度', 3],
    'geo-25': ['pyramid-giza', 'big-ben', '高度', 2],
    'geo-26': ['pyramid-giza', 'statue-of-liberty', '高度', 2],
    'geo-28': ['taipei-101', 'oriental-pear-tower', '高度', 1],
    'geo-29': ['taipei-101', 'canton-tower', '高度', 1],
    'geo-31': ['double-decker-bus', 'easter-island-statue', '高度', 1],
    'geo-32': ['canton-tower', 'shanghai-tower', '高度', 1],
    'geo-34': ['oriental-pear-tower', 'empire-state-building', '高度', 1],
    'geo-35': ['oriental-pear-tower', 'tokyo-tower', '高度', 2],
    'geo-36': ['empire-state-building', 'taipei-101', '高度', 1],
    'geo-37': ['golden-gate-tower', 'pyramid-giza', '高度', 2],
    'geo-38': ['sydney-opera-house', 'leaning-tower-of-pisa', '高度', 1],
    'geo-45': ['leaning-tower-of-pisa', 'taj-mahal', '高度', 2],
    'geo-46': ['london-eye', 'golden-gate-tower', '高度', 2],
    'geo-47': ['taj-mahal', 'sydney-opera-house', '高度', 1],
    'geo-48': ['mature-oak-tree', 'taj-mahal', '高度', 2],
    'geo-49': ['golden-gate-tower', 'shanghai-tower', '高度', 2],
  },
};

// ---------- 来源组装 ----------
function questionSource(refId, tgtId) {
  const refSrc = OBJECT_SOURCES[refId];
  const tgtSrc = OBJECT_SOURCES[tgtId];
  const refOrig = ORIGINAL_CHARACTERS.includes(refId);
  const tgtOrig = ORIGINAL_CHARACTERS.includes(tgtId);
  if (!refSrc && !refOrig) throw new Error(`缺少来源登记: ${refId}`);
  if (!tgtSrc && !tgtOrig) throw new Error(`缺少来源登记: ${tgtId}`);
  const ref = objects.get(refId), tgt = objects.get(tgtId);

  if (refOrig || tgtOrig) {
    const origId = refOrig ? refId : tgtId;
    const other = refOrig ? tgtSrc : refSrc;
    const otherObj = refOrig ? tgt : ref;
    const src = {
      name: '《比大小》角色设定文档 v1.0（游戏自设角色）',
      type: 'original',
      year: 2026,
      doc: `${ORIGINAL_DOC}#${origId}`,
      reviewStatus: 'original_design',
      reviewNote: `${ref.name}=${ref.size}m 与 ${tgt.name}=${tgt.size}m 中的原创角色尺寸为游戏自设，设定依据见 ${ORIGINAL_DOC} 对应条目。`,
      reviewEvidence: `Original character size defined in ${ORIGINAL_DOC}#${origId}; the value is a game design choice, not an external measurement.`,
    };
    if (other) {
      src.additionalUrls = [other.url];
      src.reviewNote += ` 另一方 ${otherObj.name}=${otherObj.size}m：${other.note}。`;
      src.reviewEvidence += ` Other side (${otherObj.name}): ${other.evidence}`;
    }
    return src;
  }

  const status = refSrc.status === 'verified' && tgtSrc.status === 'verified' ? 'verified' : 'derived';
  return {
    name: `${refSrc.srcName} / ${tgtSrc.srcName}`,
    year: 2026,
    url: tgtSrc.url,
    additionalUrls: [refSrc.url],
    reviewStatus: status,
    reviewNote: `${ref.name}=${ref.size}m：${refSrc.note}；${tgt.name}=${tgt.size}m：${tgtSrc.note}。`,
    reviewEvidence: `${ref.name}: ${refSrc.evidence} | ${tgt.name}: ${tgtSrc.evidence}`,
  };
}

// ---------- 应用重配对 ----------
const changed = [];
for (const [pool, table] of Object.entries(REPAIR)) {
  for (const q of pack[pool]) {
    const spec = table[q.id];
    if (!spec) continue;
    const [refId, tgtId, dimension, difficulty] = spec;
    const ref = objects.get(refId), tgt = objects.get(tgtId);
    if (!ref || !tgt) throw new Error(`${q.id}: 未知对象 ${refId}/${tgtId}`);
    changed.push(`${q.id}: ${q.reference.name} vs ${q.target.name} → ${ref.name} vs ${tgt.name}`);
    q.reference = { name: ref.name, size: ref.size, emoji: ref.emoji, assetId: ref.assetId };
    q.target = { name: tgt.name, size: tgt.size, emoji: tgt.emoji, assetId: tgt.assetId };
    q.dimension = dimension;
    q.difficulty = difficulty;
  }
}

// ---------- 全量刷新对象尺寸（泰姬陵 74→73 影响未重配对的 geo-41 等） ----------
for (const key of ['everyday', 'pop', 'geo']) {
  for (const q of pack[key]) {
    for (const side of ['reference', 'target']) {
      const o = q[side];
      const canonical = objects.get(o?.assetId);
      if (canonical && canonical.size !== o.size) {
        changed.push(`${q.id}: ${o.name} 尺寸 ${o.size} → ${canonical.size}`);
        o.size = canonical.size;
      }
    }
  }
}

// ---------- 注入来源（全量重写 source，保证口径一致） ----------
for (const key of ['everyday', 'pop', 'geo']) {
  for (const q of pack[key]) {
    q.source = questionSource(q.reference.assetId, q.target.assetId);
  }
}

// ---------- 超带宽题转数量级 ----------
const gw = OBJECT_SOURCES['great-wall'], human = OBJECT_SOURCES['adult-human'];
const bw = OBJECT_SOURCES['blue-whale'], cat = OBJECT_SOURCES['house-cat'];
pack.numeric.push(
  {
    id: 'num-50',
    q: '把明长城拉直，大约相当于多少名成年人躺下首尾相接？',
    a: 5000000,
    u: '个',
    note: '明长城全长 8851.8km ÷ 成人身高约 1.7m ≈ 5.2×10⁶，约 500 万人',
    answerType: 'point',
    status: 'published',
    source: {
      name: `${gw.srcName} / ${human.srcName}`,
      year: 2026,
      url: gw.url,
      additionalUrls: [human.url],
      reviewStatus: 'derived',
      reviewNote: '国家文物局 2012 年公布明长城全长 8851.8km；成人身高取 1.7m 常规近似，8851800÷1.7≈5.2×10⁶，答案取整为 500 万。',
      reviewEvidence: 'China State Administration of Cultural Heritage 2012 survey: Ming Great Wall 8,851.8 km. 8,851,800 m ÷ 1.7 m ≈ 5.2e6; game answer 5,000,000 is a rounded derived estimate.',
    },
  },
  {
    id: 'num-51',
    q: '一头蓝鲸的体长，大约相当于多少只家猫的肩高叠起来？',
    a: 100,
    u: '只',
    note: '蓝鲸约 26m ÷ 家猫肩高约 0.25m ≈ 104，约 100 只',
    answerType: 'point',
    status: 'published',
    source: {
      name: `${bw.srcName} / ${cat.srcName}`,
      year: 2026,
      url: bw.url,
      additionalUrls: [cat.url],
      reviewStatus: 'derived',
      reviewNote: '蓝鲸代表体长取 26m（成熟雌性约 26–27m），家猫肩高取 0.25m（常见 20–25cm），26÷0.25=104，答案取整为 100。',
      reviewEvidence: 'Blue whale representative adult length 26 m (females physically mature at 26–27 m; max confirmed 29.9 m); domestic cat shoulder height 20–25 cm. 26 ÷ 0.25 = 104; game answer 100 is rounded.',
    },
  },
  {
    id: 'num-52',
    q: '深渊巨蜥的体长，大约相当于多少个方糖仔叠起来？',
    a: 1000,
    u: '个',
    note: '深渊巨蜥 100m ÷ 方糖仔 0.1m = 1000，正好三个数量级',
    answerType: 'point',
    status: 'published',
    source: {
      name: '《比大小》角色设定文档 v1.0（游戏自设角色）',
      type: 'original',
      year: 2026,
      doc: `${ORIGINAL_DOC}#abyss-lizard`,
      additionalDocs: [`${ORIGINAL_DOC}#cube-sprite`],
      reviewStatus: 'original_design',
      reviewNote: '深渊巨蜥 100m 与方糖仔 0.1m 均为游戏自设尺寸，设定依据见角色设定文档对应条目。',
      reviewEvidence: 'Both sizes are original game design values defined in data/original-characters.md (abyss-lizard 100 m, cube-sprite 0.1 m); 100 ÷ 0.1 = 1000 exactly.',
    },
  },
);

// ---------- 版本与说明 ----------
pack.version = '2.9.0';
pack._说明 = '热更新数据包 v2.9.0（P0 整改）：全部发布视觉题满足 1/32≤q*≤32 带宽（geo/pop/everyday 共 38 题重配对）；泰姬陵主体高按核验改为 73m；蓝鲸vs家猫、明长城换算、深渊巨蜥vs方糖仔转为数量级题 num-50~52；全部视觉题补齐对象级来源（原创角色走 source.type=original + data/original-characters.md）。';
pack._字段['everyday/pop/geo'] = '视觉模式题库：reference=参考物(标注尺寸) target=目标物，name/size(米)/emoji/assetId，dimension=比较维度，status=状态。published 题：q* 须在 [1/32,32] 带宽内；source 需 name/year/url/reviewStatus/reviewEvidence（真实对象），或 type=original + doc + reviewStatus=original_design（原创角色）';

console.log(`重配对/尺寸修正 ${changed.length} 处：`);
for (const c of changed) console.log('  ' + c);

// ---------- 自检：带宽、重复配对、q* 分布 ----------
let bad = 0;
const seenPairs = new Set();
for (const key of ['everyday', 'pop', 'geo']) {
  for (const q of pack[key]) {
    const r = Math.max(q.reference.size, q.target.size) / Math.min(q.reference.size, q.target.size);
    if (r > 32) { console.error(`  ❌ 仍超带宽 ${q.id} q*=${r.toFixed(1)}`); bad++; }
    const pk = [q.reference.assetId, q.target.assetId].sort().join('|');
    if (seenPairs.has(pk)) console.warn(`  ⚠️ 重复配对（跨池） ${q.id}: ${pk}`);
    seenPairs.add(pk);
  }
}
if (bad) { console.error(`❌ ${bad} 题仍超带宽，中止写入`); process.exit(1); }

if (!dryRun) {
  writeFileSync(file, JSON.stringify(pack, null, 2) + '\n', 'utf8');
  console.log(`✅ 已写入 ${file}（v${pack.version}，numeric ${pack.numeric.length} 题）`);
} else {
  console.log('（dry-run，未写入）');
}
