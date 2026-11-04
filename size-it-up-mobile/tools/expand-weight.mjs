// P1 重量分类种子题库（GDD 6.5）：向 data/pools.json 注入 weight 池。
// 数值单位千克（kg）；素材复用现有插画（assetId 必须在现有题库中出现过）。
// 渲染取立方根（visual.js dispExp），本脚本只负责数据；发布带宽 1/32~32 照常硬校验。
// 用法：node tools/expand-weight.mjs [--dry-run]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));
const dryRun = process.argv.includes('--dry-run');

// ---------- 重量对象表（kg；status: verified=来源直接给出数值/区间内，derived=代表值估算） ----------
const W = (p) => `https://en.wikipedia.org/wiki/${p}`;
const WEIGHT_OBJECTS = {
  'adult-human': { size: 70, status: 'derived', url: W('Human_body_weight'), srcName: 'Wikipedia: Human body weight',
    note: '成年人代表体重取 70kg（全球成人均值约 62kg，成年男性常见更高）',
    evidence: 'Wikipedia: Human body weight — global adult average is about 62 kg; 70 kg is a conventional representative adult value.' },
  'house-cat': { size: 4.5, status: 'verified', url: W('Cat'), srcName: 'Wikipedia: Cat',
    note: '家猫常见体重 4–5kg，取 4.5kg',
    evidence: 'Wikipedia and veterinary references: typical domestic cat weighs 4–5 kg; game value 4.5 kg is the midpoint.' },
  'emperor-penguin': { size: 30, status: 'verified', url: W('Emperor_penguin'), srcName: 'Wikipedia: Emperor penguin',
    note: '成年帝企鹅 22–45kg，取 30kg',
    evidence: 'Wikipedia: adult emperor penguins weigh 22–45 kg depending on season and sex; game value 30 kg sits inside that range.' },
  'red-kangaroo': { size: 85, status: 'verified', url: W('Red_kangaroo'), srcName: 'Wikipedia: Red kangaroo',
    note: '成年雄性红袋鼠 55–90kg，取 85kg',
    evidence: 'Wikipedia: adult male red kangaroos typically weigh 55–90 kg; game value 85 kg sits inside that range.' },
  'giraffe': { size: 1200, status: 'verified', url: W('Giraffe'), srcName: 'Wikipedia: Giraffe',
    note: '成年雄性平均约 1192kg，取 1200kg',
    evidence: 'Wikipedia: adult male giraffes average approximately 1,192 kg; game value 1,200 kg is the rounded figure.' },
  'african-elephant': { size: 6000, status: 'verified', url: W('African_bush_elephant'), srcName: 'Wikipedia: African bush elephant',
    note: '成年公象平均约 6 吨（5.2–6.9 吨）',
    evidence: 'Wikipedia: adult bulls average about 6 t (range 5.2–6.9 t); game value 6,000 kg is the cited average.' },
  'blue-whale': { size: 150000, status: 'derived', url: W('Blue_whale'), srcName: 'Wikipedia: Blue whale',
    note: '成年蓝鲸常见 100–160 吨，最大约 190 吨，取 150 吨为代表值',
    evidence: 'Wikipedia: adult blue whales commonly weigh 100–160 t, with the largest recorded near 190 t; game uses 150 t as a representative adult value.' },
  'sedan-car': { size: 1500, status: 'derived', url: W('Sedan_(automobile)'), srcName: 'Wikipedia: Sedan (automobile)',
    note: '中型三厢轿车整备质量常见 1.4–1.6 吨，取 1.5 吨',
    evidence: 'Typical mid-size sedan curb weight is 1,400–1,600 kg; 1,500 kg is a conventional representative value.' },
  'double-decker-bus': { size: 12000, status: 'derived', url: W('Double-decker_bus'), srcName: 'Wikipedia: Double-decker bus',
    note: '双层巴士整备质量常见约 11–14 吨，取 12 吨',
    evidence: 'Typical double-decker bus unladen weight is around 11–14 t depending on model; game uses 12 t as a representative value.' },
  'apple': { size: 0.2, status: 'derived', url: W('Apple'), srcName: 'Wikipedia: Apple',
    note: '中等苹果约 180–200g，取 200g',
    evidence: 'A medium table apple weighs about 182 g (USDA reference); game value 200 g is a rounded representative value.' },
  'egg': { size: 0.06, status: 'derived', url: W('Chicken_egg'), srcName: 'Wikipedia: Chicken egg',
    note: '大号鸡蛋约 57–60g，取 60g',
    evidence: 'USDA large egg grade is about 57 g; game value 60 g is a rounded representative value.' },
  'tennis-ball': { size: 0.058, status: 'verified', url: W('Tennis_ball'), srcName: 'Wikipedia: Tennis ball / ITF Rules',
    note: 'ITF 规定重量 56.0–59.4g，取 58g',
    evidence: 'ITF Rules of Tennis, Appendix I: mass 56.0–59.4 g; game value 58 g sits inside the regulation range.' },
  'basketball': { size: 0.62, status: 'verified', url: W('Basketball_(ball)'), srcName: 'Wikipedia: Basketball (ball)',
    note: '7 号球重 567–650g，取 620g',
    evidence: 'Size-7 basketball specification: 567–650 g; game value 620 g sits inside the regulation range.' },
  'soccer-ball': { size: 0.43, status: 'verified', url: W('Football_(ball)'), srcName: 'Wikipedia: Football (ball) / IFAB Law 2',
    note: 'IFAB 规定 5 号球开赛重 410–450g，取 430g',
    evidence: 'IFAB Law 2: size-5 ball weighs 410–450 g at the start of the match; game value 430 g sits inside that range.' },
  'smartphone': { size: 0.2, status: 'derived', url: W('Smartphone'), srcName: 'Wikipedia: Smartphone',
    note: '主流旗舰手机约 170–230g，取 200g',
    evidence: 'Mainstream flagship smartphones weigh roughly 170–230 g; 200 g is a conventional representative value.' },
  't-rex': { size: 9000, status: 'derived', url: W('Tyrannosaurus'), srcName: 'Wikipedia: Tyrannosaurus',
    note: '成年霸王龙体重估计 8–14 吨，取 9 吨为保守代表值',
    evidence: 'Palaeontology mass estimates for adult T. rex range roughly 8–14 t; game uses 9 t as a conservative representative value.' },
};

// ---------- 配对表：[refAssetId, tgtAssetId, note?, memorable?]（span 全部 ≤ 32，生成后自检） ----------
const PAIRS = [
  ['adult-human', 'house-cat'],              // 15.6
  ['house-cat', 'apple'],                    // 22.5
  ['egg', 'tennis-ball', '一个鸡蛋和一个网球几乎一样重', true], // 1.03
  ['smartphone', 'apple', '一部旗舰手机和一个苹果几乎同重', true], // 1.0
  ['blue-whale', 'african-elephant'],        // 25
  ['blue-whale', 't-rex'],                   // 16.7
  ['african-elephant', 'sedan-car'],         // 4
  ['double-decker-bus', 'african-elephant'], // 2
  ['t-rex', 'double-decker-bus'],            // 1.33
  ['giraffe', 'red-kangaroo'],               // 14.1
  ['giraffe', 'adult-human'],                // 17.1
  ['adult-human', 'emperor-penguin'],        // 2.33
  ['emperor-penguin', 'red-kangaroo'],       // 2.83
  ['red-kangaroo', 'adult-human'],           // 1.21
  ['basketball', 'soccer-ball'],             // 1.44
  ['soccer-ball', 'apple'],                  // 2.15
  ['apple', 'egg'],                          // 3.33
  ['tennis-ball', 'smartphone'],             // 3.45
  ['sedan-car', 'giraffe'],                  // 1.25
  ['blue-whale', 'double-decker-bus'],       // 12.5
  ['t-rex', 'giraffe'],                      // 7.5
  ['house-cat', 'soccer-ball'],              // 10.5
];

// ---------- 从现有题库提取对象的名称/emoji/assetId（保证素材已存在） ----------
const artObjects = new Map();
for (const key of ['everyday', 'pop', 'geo']) {
  for (const q of pack[key] || []) {
    for (const side of ['reference', 'target']) {
      const o = q[side];
      if (o?.assetId && !artObjects.has(o.assetId)) artObjects.set(o.assetId, o);
    }
  }
}

// 与 src/core/pairing.js deriveDifficulty 同口径
function deriveDifficulty(span) {
  if (span < 1.5) return 3;
  if (span <= 4) return 1;
  return 2;
}

function questionSource(refId, tgtId) {
  const r = WEIGHT_OBJECTS[refId], t = WEIGHT_OBJECTS[tgtId];
  return {
    name: `${r.srcName} / ${t.srcName}`,
    year: 2026,
    url: t.url,
    additionalUrls: [r.url],
    reviewStatus: r.status === 'verified' && t.status === 'verified' ? 'verified' : 'derived',
    reviewNote: `${artObjects.get(refId).name.replace(/（[^）]*）/g, '')}=${r.size}kg：${r.note}；${artObjects.get(tgtId).name.replace(/（[^）]*）/g, '')}=${t.size}kg：${t.note}。`,
    reviewEvidence: `${refId}: ${r.evidence} | ${tgtId}: ${t.evidence}`,
  };
}

const weight = PAIRS.map(([refId, tgtId, note, memorable], i) => {
  const r = WEIGHT_OBJECTS[refId], t = WEIGHT_OBJECTS[tgtId];
  const rArt = artObjects.get(refId), tArt = artObjects.get(tgtId);
  if (!r || !t) throw new Error(`未知重量对象: ${refId}/${tgtId}`);
  if (!rArt || !tArt) throw new Error(`对象缺少现有插画（不在 everyday/pop/geo 中）: ${refId}/${tgtId}`);
  const span = Math.max(r.size, t.size) / Math.min(r.size, t.size);
  if (span > 32) throw new Error(`超带宽配对: ${refId} vs ${tgtId} span=${span.toFixed(1)}`);
  const q = {
    id: `wt-${String(i + 1).padStart(2, '0')}`,
    // 名称剥离原题库的维度括注（如「家猫（肩高）」「蓝鲸（体长）」）——重量题里那些修饰语是长度语境的
    reference: { name: rArt.name.replace(/（[^）]*）/g, ''), size: r.size, emoji: rArt.emoji, assetId: refId },
    target: { name: tArt.name.replace(/（[^）]*）/g, ''), size: t.size, emoji: tArt.emoji, assetId: tgtId },
    dimension: '重量',
    measure: 'weight',
    difficulty: deriveDifficulty(span),
    status: 'published',
    source: questionSource(refId, tgtId),
  };
  if (note) q.note = note;
  if (memorable) q.memorable = true;
  return q;
});

if (Array.isArray(pack.weight) && pack.weight.length) {
  console.error('❌ weight 池已存在（本脚本为一次性迁移，勿重复运行）');
  process.exit(1);
}
pack.weight = weight;
pack.version = '3.0.0';
pack._说明 = '热更新数据包 v3.0.0（P1 重量分类 + 随机遭遇层地基）：新增 weight 池 22 题（单位 kg，渲染按立方根缩放，素材复用现有插画）；视觉题全部满足 1/32≤q*≤32 带宽并带对象级来源；数量级题含 num-50~52 超带宽换算题。随机遭遇模式由构建注入的 data/objects.json 驱动，不占本题库。';
pack._字段['weight'] = '重量模式题库：结构同 everyday/pop/geo，size 单位为千克（kg），measure=weight，dimension=重量；渲染时图上大小按重量的立方根显示（仅影响呈现，不影响计分）';

if (!dryRun) {
  writeFileSync(file, JSON.stringify(pack, null, 2) + '\n', 'utf8');
  console.log(`✅ 已写入 ${file}（v${pack.version}，weight ${weight.length} 题）`);
} else {
  console.log(`（dry-run）weight ${weight.length} 题，版本将升为 3.0.0`);
}
for (const q of weight) {
  const span = Math.max(q.reference.size, q.target.size) / Math.min(q.reference.size, q.target.size);
  console.log(`  ${q.id} ${q.reference.name} vs ${q.target.name} span=${span.toFixed(2)} d${q.difficulty}`);
}
