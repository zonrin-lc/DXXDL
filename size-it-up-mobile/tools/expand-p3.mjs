// P3 体积+速度分类种子题库（GDD 6.5）：向 data/pools.json 注入 volume 与 speed 池。
// 体积单位立方米（m³），速度单位米/秒（m/s）；素材复用现有插画（assetId）或 emoji 兜底。
// 体积渲染取立方根（visual.js dispExp=1/3），速度为线性（dispExp=1）；本脚本只负责数据；
// 发布带宽 1/32~32 照常硬校验。口径纪律：容积↔容积、巡航/冲刺↔同类速度口径。
// 用法：node tools/expand-p3.mjs [--dry-run]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));
const dryRun = process.argv.includes('--dry-run');

const W = (p) => `https://en.wikipedia.org/wiki/${p}`;

// ---------- 体积对象表（m³；容积口径，非排开体积的已注明） ----------
const VOLUME_OBJECTS = {
  'egg': { name: '鸡蛋', size: 5.5e-5, status: 'derived', emoji: '🥚', assetId: 'egg',
    url: W('Chicken_egg'), srcName: 'Wikipedia: Chicken egg',
    note: '大号鸡蛋约 55mL',
    evidence: 'A large chicken egg is about 55 mL in volume; game value 5.5e-5 m3 matches.' },
  'tennis-ball-v': { name: '网球', size: 1.6e-4, status: 'verified', emoji: '🎾', assetId: 'tennis-ball',
    url: W('Tennis_ball'), srcName: 'Wikipedia: Tennis ball / ITF Rules',
    note: 'ITF 直径 6.54–6.86cm，取 6.7cm 算球体体积约 160mL',
    evidence: 'ITF Rules: diameter 6.54-6.86 cm; a 6.7 cm sphere has volume about 1.6e-4 m3; game value matches.' },
  'apple': { name: '苹果', size: 2e-4, status: 'derived', emoji: '🍎', assetId: 'apple',
    url: W('Apple'), srcName: 'Wikipedia: Apple',
    note: '中等苹果体积约 200mL（密度≈水，约 200g）',
    evidence: 'A medium apple weighs about 200 g with density near water, giving volume about 2e-4 m3.' },
  'soda-can': { name: '易拉罐', size: 3.3e-4, status: 'verified', emoji: '🥤', assetId: 'soda-can',
    url: W('Beverage_can'), srcName: 'Wikipedia: Beverage can',
    note: '标准易拉罐 330mL',
    evidence: 'The standard beverage can size is 330 mL = 3.3e-4 m3; game value matches.' },
  'house-cat': { name: '家猫', size: 4.5e-3, status: 'derived', emoji: '🐱', assetId: 'house-cat',
    url: W('Cat'), srcName: 'Wikipedia: Cat',
    note: '4.5kg、密度≈水 → 约 4.5 升',
    evidence: 'A 4.5 kg cat with body density close to water occupies about 4.5e-3 m3.' },
  'soccer-ball-v': { name: '足球', size: 5.6e-3, status: 'verified', emoji: '⚽', assetId: 'soccer-ball',
    url: W('Football_(ball)'), srcName: 'Wikipedia: Football (ball) / IFAB Law 2',
    note: '5 号球直径约 22cm，体积约 5.6 升',
    evidence: 'IFAB Law 2 size-5 circumference 68-70 cm implies diameter about 22 cm and volume about 5.6e-3 m3.' },
  'basketball-v': { name: '篮球', size: 7.2e-3, status: 'verified', emoji: '🏀', assetId: 'basketball',
    url: W('Basketball_(ball)'), srcName: 'Wikipedia: Basketball (ball)',
    note: '7 号球直径约 24cm，体积约 7.2 升',
    evidence: 'Size-7 basketball circumference 75-76 cm implies diameter about 24 cm and volume about 7.2e-3 m3.' },
  'adult-human': { name: '成年人', size: 0.07, status: 'derived', emoji: '🧍', assetId: 'adult-human',
    url: W('Human_body_weight'), srcName: 'Wikipedia: Human body weight',
    note: '70kg、密度≈水 → 约 70 升',
    evidence: 'A 70 kg adult with body density close to water occupies about 0.07 m3 (70 L).' },
  'bathtub': { name: '浴缸（满水）', size: 0.3, status: 'derived', emoji: '🛁',
    url: W('Bathtub'), srcName: 'Wikipedia: Bathtub',
    note: '常见浴缸满水约 250–350 升，取 300 升',
    evidence: 'A typical bathtub holds roughly 250-350 L; game value 0.3 m3 is the representative midpoint.' },
  'fridge': { name: '双门冰箱（内部容积）', size: 0.5, status: 'derived', emoji: '🗄️',
    url: W('Refrigerator'), srcName: 'Wikipedia: Refrigerator',
    note: '双门冰箱内部容积常见 450–550 升，取 500 升',
    evidence: 'A typical two-door refrigerator has about 450-550 L of internal volume; game value 0.5 m3 is the representative midpoint.' },
  'sedan-cabin': { name: '轿车（乘员舱）', size: 2.8, status: 'derived', emoji: '🚗', assetId: 'sedan-car',
    url: W('Sedan_(automobile)'), srcName: 'Wikipedia: Sedan (automobile) / EPA passenger volume',
    note: '中型轿车乘员舱容积约 100 立方英尺 ≈ 2.8m³',
    evidence: 'EPA passenger volume for a mid-size sedan is about 100 cubic feet, roughly 2.8 m3.' },
  'container-20ft': { name: '20 尺集装箱（内部）', size: 33.1, status: 'verified', emoji: '📦',
    url: W('Intermodal_container'), srcName: 'Wikipedia: Intermodal container / ISO',
    note: 'ISO 20GP 内部容积 33.1m³',
    evidence: 'ISO 20-foot general-purpose container internal volume is 33.1 m3; game value matches.' },
  'blue-whale': { name: '蓝鲸', size: 150, status: 'derived', emoji: '🐋', assetId: 'blue-whale',
    url: W('Blue_whale'), srcName: 'Wikipedia: Blue whale',
    note: '150 吨、密度≈水 → 约 150m³',
    evidence: 'A 150 t blue whale with body density close to water occupies about 150 m3.' },
  'an-225-cargo': { name: '安-225 货舱', size: 1300, status: 'verified', emoji: '✈️',
    url: W('Antonov_An-225_Mriya'), srcName: 'Wikipedia: Antonov An-225 Mriya',
    note: '货舱容积 1300m³',
    evidence: 'Wikipedia: the An-225 cargo hold has a volume of 1,300 m3; game value matches.' },
  'olympic-pool': { name: '奥运标准泳池', size: 2500, status: 'verified', emoji: '🏊',
    url: W('Olympic-size_swimming_pool'), srcName: 'Wikipedia: Olympic-size swimming pool',
    note: '50×25×2m = 2500m³',
    evidence: 'An Olympic-size pool is 50 m x 25 m x 2 m minimum depth = 2,500 m3; game value matches.' },
  'pantheon': { name: '罗马万神殿（内部）', size: 53000, status: 'derived', emoji: '🏛️',
    url: W('Pantheon,_Rome'), srcName: 'Wikipedia: Pantheon, Rome',
    note: '内殿直径与高均为 43.3m，圆柱+半球推算约 5.3 万 m³',
    evidence: 'Wikipedia: the rotunda interior diameter and height are both 43.3 m; cylinder plus hemisphere gives roughly 53,000 m3.' },
  'hindenburg': { name: '兴登堡号飞艇（气囊）', size: 200000, status: 'verified', emoji: '🎈',
    url: W('LZ_129_Hindenburg'), srcName: 'Wikipedia: LZ 129 Hindenburg',
    note: '气囊氢气容积 20 万 m³',
    evidence: 'Wikipedia: the Hindenburg had a gas capacity of 200,000 m3; game value matches.' },
  'cruise-ship': { name: '海洋交响号（总吨位折算）', size: 645000, status: 'derived', emoji: '🚢',
    url: W('Symphony_of_the_Seas'), srcName: 'Wikipedia: Symphony of the Seas',
    note: '总吨位 228081 GT × 2.83m³/GT ≈ 64.5 万 m³ 围蔽容积',
    evidence: 'Wikipedia: Symphony of the Seas is 228,081 GT; 1 GT corresponds to 100 ft3 (2.83 m3) of enclosed volume, giving about 645,000 m3.' },
  'empire-state': { name: '帝国大厦（容积）', size: 1050000, status: 'verified', emoji: '🏙️', assetId: 'empire-state-building',
    url: W('Empire_State_Building'), srcName: 'Wikipedia: Empire State Building',
    note: '建筑容积约 3700 万立方英尺 ≈ 105 万 m³',
    evidence: 'The Empire State Building has a volume of about 37 million cubic feet, roughly 1.05 million m3.' },
  'tokyo-dome': { name: '东京巨蛋（内部）', size: 1240000, status: 'verified', emoji: '🏟️',
    url: W('Tokyo_Dome'), srcName: 'Wikipedia: Tokyo Dome',
    note: '内部容积 124 万 m³',
    evidence: 'Wikipedia: Tokyo Dome has an interior volume of 1,240,000 m3; game value matches.' },
  'red-pyramid': { name: '红金字塔', size: 1694000, status: 'verified', emoji: '🔺',
    url: W('Red_Pyramid'), srcName: 'Wikipedia: Red Pyramid',
    note: '体积约 169.4 万 m³',
    evidence: 'Wikipedia: the Red Pyramid has a volume of 1,694,000 m3; game value matches.' },
  'giza-volume': { name: '吉萨大金字塔', size: 2580000, status: 'verified', emoji: '🔺', assetId: 'pyramid-giza',
    url: W('Great_Pyramid_of_Giza'), srcName: 'Wikipedia: Great Pyramid of Giza',
    note: '体积约 258 万 m³',
    evidence: 'Wikipedia: the Great Pyramid has a volume of about 2.58 million m3; game value matches.' },
  'vab': { name: 'NASA 航天器装配大楼', size: 3660000, status: 'verified', emoji: '🚀',
    url: W('Vehicle_Assembly_Building'), srcName: 'Wikipedia: Vehicle Assembly Building',
    note: '内部容积 366 万 m³，曾是世界容积最大建筑',
    evidence: 'Wikipedia: the VAB encloses about 3.66 million m3; game value matches.' },
  'everett-factory': { name: '波音埃弗里特工厂', size: 13300000, status: 'verified', emoji: '🏭',
    url: W('Boeing_Everett_Factory'), srcName: 'Wikipedia: Boeing Everett Factory',
    note: '内部容积 1330 万 m³，世界容积最大建筑',
    evidence: 'Wikipedia: the Boeing Everett Factory has a volume of 13.3 million m3, the largest building by volume; game value matches.' },
};

// ---------- 速度对象表（m/s；巡航/冲刺/轨道速度口径注明） ----------
const SPEED_OBJECTS = {
  'adult-walk': { name: '成年人步行', size: 1.4, status: 'derived', emoji: '🚶', assetId: 'adult-human',
    url: W('Walking'), srcName: 'Wikipedia: Walking',
    note: '日常步行约 5km/h ≈ 1.4m/s',
    evidence: 'Wikipedia: typical walking speed is about 5 km/h, roughly 1.4 m/s; game value matches.' },
  'bicycle': { name: '自行车', size: 5.5, status: 'derived', emoji: '🚲', assetId: 'bicycle',
    url: W('Bicycle'), srcName: 'Wikipedia: Bicycle',
    note: '城市骑行常见 20km/h ≈ 5.5m/s',
    evidence: 'A typical urban cycling speed is about 20 km/h, roughly 5.5 m/s.' },
  'sprinter': { name: '短跑运动员（冲刺）', size: 12.4, status: 'verified', emoji: '🏃',
    url: W('Usain_Bolt'), srcName: 'Wikipedia: Usain Bolt',
    note: '博尔特百米峰值速度 12.4m/s',
    evidence: 'Wikipedia: Bolt reached a peak speed of about 12.4 m/s in his 100 m world record; game value matches.' },
  'house-cat-sprint': { name: '家猫（冲刺）', size: 13.3, status: 'derived', emoji: '🐱', assetId: 'house-cat',
    url: W('Cat'), srcName: 'Wikipedia: Cat',
    note: '家猫冲刺约 48km/h ≈ 13.3m/s',
    evidence: 'Domestic cats can sprint at about 48 km/h, roughly 13.3 m/s.' },
  'red-kangaroo': { name: '红袋鼠（跳跃）', size: 20, status: 'verified', emoji: '🦘', assetId: 'red-kangaroo',
    url: W('Red_kangaroo'), srcName: 'Wikipedia: Red kangaroo',
    note: '红袋鼠跳跃行进可达 70km/h ≈ 20m/s',
    evidence: 'Wikipedia: red kangaroos can hop at up to about 70 km/h, roughly 20 m/s; game value matches.' },
  'cheetah': { name: '猎豹（冲刺）', size: 33, status: 'verified', emoji: '🐆',
    url: W('Cheetah'), srcName: 'Wikipedia: Cheetah',
    note: '猎豹冲刺可达 120km/h ≈ 33m/s',
    evidence: 'Wikipedia: cheetahs can sprint at up to about 120 km/h, roughly 33 m/s; game value matches.' },
  'sedan-highway': { name: '轿车（高速巡航）', size: 33, status: 'derived', emoji: '🚗', assetId: 'sedan-car',
    url: W('Speed_limit'), srcName: 'Wikipedia: Speed limit',
    note: '高速限速 120km/h ≈ 33m/s',
    evidence: 'A typical motorway speed limit is 120 km/h, roughly 33 m/s.' },
  'hsr': { name: '高铁（巡航）', size: 97, status: 'verified', emoji: '🚄',
    url: W('High-speed_rail_in_China'), srcName: 'Wikipedia: High-speed rail in China',
    note: '复兴号运营时速 350km/h ≈ 97m/s',
    evidence: 'Wikipedia: Chinese high-speed trains operate at up to 350 km/h, roughly 97 m/s; game value matches.' },
  'airliner': { name: '民航客机（巡航）', size: 250, status: 'verified', emoji: '✈️',
    url: W('Cruise_(aeronautics)'), srcName: 'Wikipedia: Cruise (aeronautics)',
    note: '巡航约 900km/h ≈ 250m/s',
    evidence: 'Wikipedia: typical airliner cruise speed is about 900 km/h, roughly 250 m/s; game value matches.' },
  'sound': { name: '声音（空气中）', size: 343, status: 'verified', emoji: '🔊',
    url: W('Speed_of_sound'), srcName: 'Wikipedia: Speed of sound',
    note: '20°C 空气中声速 343m/s',
    evidence: 'Wikipedia: the speed of sound in air at 20°C is 343 m/s; game value matches.' },
  'fighter-jet': { name: '战斗机（最大）', size: 600, status: 'derived', emoji: '🛩️',
    url: W('General_Dynamics_F-16_Fighting_Falcon'), srcName: 'Wikipedia: F-16 Fighting Falcon',
    note: 'F-16 最大约 2 马赫 ≈ 600+m/s，取 600m/s',
    evidence: 'Wikipedia: the F-16 has a maximum speed of about Mach 2, over 600 m/s; game value 600 m/s is a conservative figure.' },
  'iss': { name: '国际空间站（轨道）', size: 7800, status: 'verified', emoji: '🛰️',
    url: W('International_Space_Station'), srcName: 'Wikipedia: International Space Station',
    note: '轨道速度约 7.66km/s ≈ 7800m/s',
    evidence: 'Wikipedia: the ISS orbits at about 7.66 km/s, roughly 7,800 m/s; game value matches.' },
  'earth-orbit': { name: '地球公转', size: 29780, status: 'verified', emoji: '🌍',
    url: W('Earth%27s_orbit'), srcName: "Wikipedia: Earth's orbit",
    note: '地球公转平均速度 29.78km/s',
    evidence: "Wikipedia: Earth's average orbital speed is 29.78 km/s; game value matches." },
};

// ---------- 配对表（span ≤ 32，生成后自检） ----------
const VOLUME_PAIRS = [
  ['tennis-ball-v', 'egg'],                                              // 2.9
  ['apple', 'tennis-ball-v', '一个苹果和一颗网球的体积几乎一样', true],          // 1.25
  ['soda-can', 'apple'],                                                 // 1.65
  ['soda-can', 'tennis-ball-v'],                                         // 2.1
  ['soccer-ball-v', 'soda-can'],                                         // 17
  ['basketball-v', 'soccer-ball-v'],                                     // 1.29
  ['house-cat', 'soccer-ball-v'],                                        // 1.24
  ['house-cat', 'basketball-v'],                                         // 1.6
  ['adult-human', 'house-cat'],                                          // 15.6
  ['adult-human', 'basketball-v'],                                       // 9.7
  ['bathtub', 'adult-human'],                                            // 4.3
  ['fridge', 'bathtub'],                                                 // 1.67
  ['sedan-cabin', 'fridge'],                                             // 5.6
  ['sedan-cabin', 'bathtub'],                                            // 9.3
  ['container-20ft', 'sedan-cabin'],                                     // 11.8
  ['blue-whale', 'container-20ft'],                                      // 4.5
  ['an-225-cargo', 'blue-whale'],                                        // 8.7
  ['olympic-pool', 'an-225-cargo'],                                      // 1.9
  ['olympic-pool', 'blue-whale'],                                        // 16.7
  ['pantheon', 'olympic-pool'],                                          // 21.2
  ['hindenburg', 'pantheon'],                                            // 3.8
  ['cruise-ship', 'hindenburg'],                                         // 3.2
  ['cruise-ship', 'pantheon'],                                           // 12.2
  ['empire-state', 'cruise-ship'],                                       // 1.63
  ['tokyo-dome', 'empire-state', '东京巨蛋内部比帝国大厦还略大', true],           // 1.18
  ['tokyo-dome', 'cruise-ship'],                                         // 1.92
  ['tokyo-dome', 'hindenburg'],                                          // 6.2
  ['red-pyramid', 'tokyo-dome'],                                         // 1.37
  ['red-pyramid', 'empire-state'],                                       // 1.61
  ['giza-volume', 'red-pyramid'],                                        // 1.52
  ['giza-volume', 'tokyo-dome'],                                         // 2.08
  ['vab', 'giza-volume'],                                                // 1.42
  ['vab', 'tokyo-dome'],                                                 // 2.95
  ['vab', 'red-pyramid'],                                                // 2.16
  ['everett-factory', 'vab'],                                            // 3.63
  ['everett-factory', 'giza-volume'],                                    // 5.16
  ['everett-factory', 'red-pyramid'],                                    // 7.85
  ['everett-factory', 'tokyo-dome', '世界最大建筑能装下 3700 多个奥运泳池', true], // 10.7
  ['everett-factory', 'empire-state'],                                   // 12.7
  ['empire-state', 'hindenburg'],                                        // 5.25
];

const SPEED_PAIRS = [
  ['bicycle', 'adult-walk'],                                             // 3.9
  ['sprinter', 'bicycle'],                                               // 2.3
  ['house-cat-sprint', 'sprinter', '家猫冲刺比博尔特还快', true],              // 1.07
  ['sprinter', 'adult-walk'],                                            // 8.9
  ['red-kangaroo', 'house-cat-sprint'],                                  // 1.5
  ['red-kangaroo', 'bicycle'],                                           // 3.6
  ['cheetah', 'red-kangaroo'],                                           // 1.65
  ['sedan-highway', 'cheetah', '高速上的轿车和猎豹冲刺一样快', true],            // 1.0
  ['sedan-highway', 'red-kangaroo'],                                     // 1.65
  ['cheetah', 'sprinter'],                                               // 2.7
  ['hsr', 'sedan-highway'],                                              // 2.9
  ['hsr', 'cheetah'],                                                    // 2.9
  ['airliner', 'hsr'],                                                   // 2.6
  ['airliner', 'sedan-highway'],                                         // 7.6
  ['sound', 'airliner'],                                                 // 1.4
  ['sound', 'hsr'],                                                      // 3.5
  ['fighter-jet', 'sound', '战斗机可以飞得比声音还快', true],                  // 1.75
  ['fighter-jet', 'airliner'],                                           // 2.4
  ['iss', 'fighter-jet'],                                                // 13
  ['iss', 'sound'],                                                      // 22.7
  ['earth-orbit', 'iss'],                                                // 3.8
  ['red-kangaroo', 'sprinter'],                                          // 1.6
  ['cheetah', 'bicycle'],                                                // 6
  ['sedan-highway', 'bicycle'],                                          // 6
  ['hsr', 'red-kangaroo'],                                               // 4.85
  ['airliner', 'red-kangaroo'],                                          // 12.5
  ['sound', 'sedan-highway'],                                            // 10.4
  ['fighter-jet', 'hsr'],                                                // 6.2
  ['iss', 'airliner'],                                                   // 31.2
  ['house-cat-sprint', 'bicycle'],                                       // 2.4
];

// 与 src/core/pairing.js deriveDifficulty 同口径
function deriveDifficulty(span) {
  if (span < 1.5) return 3;
  if (span <= 4) return 1;
  return 2;
}

function buildPool(objects, pairs, idPrefix, dimension, measure) {
  return pairs.map(([refId, tgtId, note, memorable], i) => {
    const r = objects[refId], t = objects[tgtId];
    if (!r || !t) throw new Error(`未知对象: ${refId}/${tgtId}`);
    const span = Math.max(r.size, t.size) / Math.min(r.size, t.size);
    if (span > 32) throw new Error(`超带宽配对: ${refId} vs ${tgtId} span=${span.toFixed(1)}`);
    const sideOf = (o) => {
      const side = { name: o.name, size: o.size, emoji: o.emoji };
      if (o.assetId) side.assetId = o.assetId;
      return side;
    };
    const q = {
      id: `${idPrefix}-${String(i + 1).padStart(2, '0')}`,
      reference: sideOf(r),
      target: sideOf(t),
      dimension,
      measure,
      difficulty: deriveDifficulty(span),
      status: 'published',
      source: {
        name: `${r.srcName} / ${t.srcName}`,
        year: 2026,
        url: t.url,
        additionalUrls: [r.url],
        reviewStatus: r.status === 'verified' && t.status === 'verified' ? 'verified' : 'derived',
        reviewNote: `${r.name}=${r.size}：${r.note}；${t.name}=${t.size}：${t.note}。`,
        reviewEvidence: `${refId}: ${r.evidence} | ${tgtId}: ${t.evidence}`,
      },
    };
    if (note) q.note = note;
    if (memorable) q.memorable = true;
    return q;
  });
}

const volume = buildPool(VOLUME_OBJECTS, VOLUME_PAIRS, 'vol', '体积', 'volume');
const speed = buildPool(SPEED_OBJECTS, SPEED_PAIRS, 'spd', '速度', 'speed');

for (const key of ['volume', 'speed']) {
  if (Array.isArray(pack[key]) && pack[key].length) {
    console.error(`❌ ${key} 池已存在（本脚本为一次性迁移，勿重复运行）`);
    process.exit(1);
  }
}
pack.volume = volume;
pack.speed = speed;
pack.version = '3.2.0';
pack._说明 = '热更新数据包 v3.2.0（P3 体积+速度分类）：新增 volume 池 40 题（单位 m³，渲染按立方根缩放）与 speed 池 30 题（单位 m/s，线性渲染）；全部满足 1/32≤q*≤32 带宽并带对象级来源；素材复用现有插画+emoji 兜底。';
pack._字段['volume'] = '体积模式题库：size 单位为立方米（m³），measure=volume，dimension=体积；渲染时图上边长按体积的立方根显示（仅影响呈现，不影响计分）';
pack._字段['speed'] = '速度模式题库：size 单位为米/秒（m/s），measure=speed，dimension=速度；线性渲染（dispExp=1），巡航/冲刺/轨道速度口径以对象名括注标明';

if (!dryRun) {
  writeFileSync(file, JSON.stringify(pack, null, 2) + '\n', 'utf8');
  console.log(`✅ 已写入 ${file}（v${pack.version}，volume ${volume.length} 题 / speed ${speed.length} 题）`);
} else {
  console.log(`（dry-run）volume ${volume.length} / speed ${speed.length} 题，版本将升为 3.2.0`);
}
for (const q of [...volume, ...speed]) {
  const span = Math.max(q.reference.size, q.target.size) / Math.min(q.reference.size, q.target.size);
  console.log(`  ${q.id} ${q.reference.name} vs ${q.target.name} span=${span.toFixed(2)} d${q.difficulty}`);
}
