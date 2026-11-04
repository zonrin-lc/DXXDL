// P2 面积分类种子题库（GDD 6.5）：向 data/pools.json 注入 area 池。
// 数值单位平方米（m²）；有现成插画的复用 assetId，没有的用 emoji 兜底（visual.js 的 useArt 回退路径）。
// 渲染取平方根（visual.js dispExp），本脚本只负责数据；发布带宽 1/32~32 照常硬校验。
// 用法：node tools/expand-area.mjs [--dry-run]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));
const dryRun = process.argv.includes('--dry-run');

// ---------- 面积对象表（m²；status: verified=来源直接给出数值/区间内，derived=代表值估算） ----------
// name 口径括注说明面积口径（底面/塔基/国土等），避免与长度题混淆
const W = (p) => `https://en.wikipedia.org/wiki/${p}`;
const AREA_OBJECTS = {
  'smartphone-face': { name: '手机正面', size: 0.011, status: 'derived', emoji: '📱', assetId: 'smartphone',
    url: W('Smartphone'), srcName: 'Wikipedia: Smartphone',
    note: '主流旗舰手机正面约 16×7.5cm，取 0.011m²',
    evidence: 'Mainstream flagship phones measure roughly 16 x 7.5 cm, giving a face area around 0.012 m2; game value 0.011 m2 is a representative value.' },
  'a4-paper': { name: 'A4 纸', size: 0.0624, status: 'verified', emoji: '📄',
    url: W('ISO_216'), srcName: 'Wikipedia: ISO 216 (A4)',
    note: 'A4 = 210×297mm = 0.06237m²，取 0.0624m²',
    evidence: 'ISO 216: A4 is defined as 210 mm x 297 mm = 0.06237 m2; game value 0.0624 m2 is the rounded figure.' },
  'standard-door': { name: '标准房门', size: 1.8, status: 'derived', emoji: '🚪', assetId: 'standard-door',
    url: W('Door'), srcName: 'Wikipedia: Door',
    note: '常见室内门 2.0×0.9m，取 1.8m²',
    evidence: 'Common interior door leaf is about 2.0 m x 0.9 m = 1.8 m2; game value is the representative product.' },
  'pingpong-table': { name: '乒乓球台', size: 4.18, status: 'verified', emoji: '🏓',
    url: W('Table_tennis'), srcName: 'Wikipedia: Table tennis / ITTF',
    note: 'ITTF 规定台面 2.74×1.525m = 4.18m²',
    evidence: 'ITTF Laws: the table is 2.74 m long and 1.525 m wide = 4.18 m2; game value matches the regulation.' },
  'parking-space': { name: '标准停车位', size: 12.5, status: 'derived', emoji: '🅿️',
    url: W('Parking_space'), srcName: 'Wikipedia: Parking space',
    note: '常见标准车位 2.5×5m，取 12.5m²',
    evidence: 'A common standard parking bay is 2.5 m x 5.0 m = 12.5 m2; game value is the representative product.' },
  'badminton-court': { name: '羽毛球场（双打）', size: 81.7, status: 'verified', emoji: '🏸',
    url: W('Badminton'), srcName: 'Wikipedia: Badminton / BWF',
    note: 'BWF 双打场地 13.4×6.1m = 81.7m²',
    evidence: 'BWF Laws: doubles court is 13.4 m x 6.1 m = 81.74 m2; game value 81.7 m2 matches the regulation.' },
  'single-storey-house': { name: '一层平房（占地）', size: 100, status: 'derived', emoji: '🏠', assetId: 'single-storey-house',
    url: W('House'), srcName: 'Wikipedia: House',
    note: '普通独栋平房占地常见 80–120m²，取 100m²',
    evidence: 'A modest single-storey detached house commonly occupies 80-120 m2 of floor plan; game value 100 m2 is a representative midpoint.' },
  'volleyball-court': { name: '排球场', size: 162, status: 'verified', emoji: '🏐',
    url: W('Volleyball'), srcName: 'Wikipedia: Volleyball / FIVB',
    note: 'FIVB 场地 18×9m = 162m²',
    evidence: 'FIVB Rules: the playing court is 18 m x 9 m = 162 m2; game value matches the regulation.' },
  'tennis-court': { name: '网球场（双打）', size: 260.8, status: 'verified', emoji: '🎾',
    url: W('Tennis_court'), srcName: 'Wikipedia: Tennis court / ITF',
    note: 'ITF 双打场地 23.77×10.97m = 260.8m²',
    evidence: 'ITF Rules: doubles court is 23.77 m x 10.97 m = 260.76 m2; game value 260.8 m2 matches the regulation.' },
  'basketball-court': { name: '篮球场（FIBA）', size: 420, status: 'verified', emoji: '🏀',
    url: W('Basketball_court'), srcName: 'Wikipedia: Basketball court / FIBA',
    note: 'FIBA 场地 28×15m = 420m²',
    evidence: 'FIBA: the court is 28 m x 15 m = 420 m2; game value matches the regulation.' },
  'football-pitch': { name: '标准足球场', size: 7140, status: 'verified', emoji: '🏟️',
    url: W('Football_pitch'), srcName: 'Wikipedia: Football pitch / FIFA',
    note: 'FIFA 标准 105×68m = 7140m²',
    evidence: 'FIFA Laws / standard international pitch: 105 m x 68 m = 7,140 m2; game value matches the standard.' },
  'eiffel-base': { name: '埃菲尔铁塔（塔基）', size: 15625, status: 'verified', emoji: '🗼', assetId: 'eiffel-tower',
    url: W('Eiffel_Tower'), srcName: 'Wikipedia: Eiffel Tower',
    note: '塔基四条腿外接正方形 125×125m = 15625m²',
    evidence: 'Wikipedia: the tower base is a square measuring 125 m on each side = 15,625 m2; game value is that base square.' },
  'sydney-opera': { name: '悉尼歌剧院（建筑）', size: 18000, status: 'verified', emoji: '🎭', assetId: 'sydney-opera-house',
    url: W('Sydney_Opera_House'), srcName: 'Wikipedia: Sydney Opera House',
    note: '建筑占地 1.8 公顷 = 18000m²',
    evidence: 'Wikipedia: the building covers 1.8 hectares (4.4 acres) of land = 18,000 m2; game value matches.' },
  'colosseum-base': { name: '罗马斗兽场（基底）', size: 24000, status: 'verified', emoji: '🏛️', assetId: 'colosseum',
    url: W('Colosseum'), srcName: 'Wikipedia: Colosseum',
    note: '椭圆基底 189×156m，基底面积约 24000m²',
    evidence: 'Wikipedia: the Colosseum is 189 m x 156 m in plan with a base area of about 24,000 m2; game value matches.' },
  'giza-base': { name: '吉萨大金字塔（底面）', size: 53000, status: 'verified', emoji: '🔺', assetId: 'pyramid-giza',
    url: W('Great_Pyramid_of_Giza'), srcName: 'Wikipedia: Great Pyramid of Giza',
    note: '底面边长约 230.4m，底面积约 53000m²',
    evidence: 'Wikipedia: the base side is about 230.4 m, giving a base area around 53,000 m2; game value matches.' },
  'taj-mahal-complex': { name: '泰姬陵（建筑群）', size: 170000, status: 'verified', emoji: '🕌', assetId: 'taj-mahal',
    url: W('Taj_Mahal'), srcName: 'Wikipedia: Taj Mahal',
    note: '整个建筑群占地 17 公顷 = 170000m²',
    evidence: 'Wikipedia: the Taj Mahal complex covers 17 hectares = 170,000 m2; game value matches.' },
  'vatican-city': { name: '梵蒂冈（国土）', size: 490000, status: 'verified', emoji: '🇻🇦',
    url: W('Vatican_City'), srcName: 'Wikipedia: Vatican City',
    note: '国土面积 0.49km² = 49 公顷 = 490000m²',
    evidence: 'Wikipedia: Vatican City has an area of 0.49 km2 (49 ha) = 490,000 m2; game value matches.' },
  'forbidden-city': { name: '故宫（紫禁城）', size: 720000, status: 'verified', emoji: '🏯',
    url: W('Forbidden_City'), srcName: 'Wikipedia: Forbidden City',
    note: '占地 72 公顷 = 720000m²',
    evidence: 'Wikipedia: the Forbidden City covers 72 hectares (720,000 m2); game value matches.' },
  'monaco': { name: '摩纳哥（国土）', size: 2080000, status: 'verified', emoji: '🇲🇨',
    url: W('Monaco'), srcName: 'Wikipedia: Monaco',
    note: '国土面积 2.08km² = 2080000m²',
    evidence: 'Wikipedia: Monaco has an area of 2.08 km2 = 2,080,000 m2; game value matches.' },
  'central-park': { name: '纽约中央公园', size: 3410000, status: 'verified', emoji: '🌳',
    url: W('Central_Park'), srcName: 'Wikipedia: Central Park',
    note: '占地 843 英亩 ≈ 3.41km² = 3410000m²',
    evidence: 'Wikipedia: Central Park covers 843 acres, about 3.41 km2 = 3,410,000 m2; game value matches.' },
};

// ---------- 配对表：[refId, tgtId, note?, memorable?]（span 全部 ≤ 32，生成后自检） ----------
const PAIRS = [
  ['a4-paper', 'smartphone-face'],                                    // 5.7
  ['standard-door', 'a4-paper'],                                      // 28.8
  ['pingpong-table', 'standard-door'],                                // 2.3
  ['parking-space', 'pingpong-table'],                                // 3.0
  ['parking-space', 'standard-door'],                                 // 6.9
  ['badminton-court', 'parking-space'],                               // 6.5
  ['badminton-court', 'pingpong-table'],                              // 19.5
  ['single-storey-house', 'badminton-court', '一座平房占地和一片羽毛球场几乎一样大', true], // 1.2
  ['volleyball-court', 'single-storey-house'],                        // 1.6
  ['volleyball-court', 'badminton-court'],                            // 2.0
  ['tennis-court', 'volleyball-court'],                               // 1.6
  ['tennis-court', 'badminton-court'],                                // 3.2
  ['basketball-court', 'tennis-court'],                               // 1.6
  ['basketball-court', 'volleyball-court'],                           // 2.6
  ['single-storey-house', 'parking-space'],                           // 8.0
  ['football-pitch', 'basketball-court'],                             // 17
  ['football-pitch', 'tennis-court'],                                 // 27.4
  ['tennis-court', 'parking-space'],                                  // 20.9
  ['eiffel-base', 'football-pitch', '埃菲尔铁塔底座比两个足球场还大', true],   // 2.2
  ['sydney-opera', 'eiffel-base'],                                    // 1.15
  ['sydney-opera', 'football-pitch'],                                 // 2.5
  ['colosseum-base', 'sydney-opera'],                                 // 1.33
  ['colosseum-base', 'eiffel-base'],                                  // 1.5
  ['colosseum-base', 'football-pitch'],                               // 3.4
  ['giza-base', 'colosseum-base'],                                    // 2.2
  ['giza-base', 'sydney-opera'],                                      // 2.9
  ['giza-base', 'eiffel-base'],                                       // 3.4
  ['giza-base', 'football-pitch'],                                    // 7.4
  ['taj-mahal-complex', 'giza-base'],                                 // 3.2
  ['taj-mahal-complex', 'colosseum-base'],                            // 7.1
  ['vatican-city', 'taj-mahal-complex'],                              // 2.9
  ['vatican-city', 'giza-base'],                                      // 9.2
  ['forbidden-city', 'taj-mahal-complex'],                            // 4.2
  ['forbidden-city', 'vatican-city'],                                 // 1.5
  ['monaco', 'forbidden-city'],                                       // 2.9
  ['monaco', 'vatican-city', '摩纳哥差不多有 4 个梵蒂冈那么大', true],          // 4.2
  ['central-park', 'monaco'],                                         // 1.6
  ['central-park', 'forbidden-city'],                                 // 4.7
  ['central-park', 'vatican-city'],                                   // 7.0
  ['tennis-court', 'single-storey-house'],                            // 2.6
];

// 与 src/core/pairing.js deriveDifficulty 同口径
function deriveDifficulty(span) {
  if (span < 1.5) return 3;
  if (span <= 4) return 1;
  return 2;
}

function sideOf(id) {
  const o = AREA_OBJECTS[id];
  if (!o) throw new Error(`未知面积对象: ${id}`);
  const side = { name: o.name, size: o.size, emoji: o.emoji };
  if (o.assetId) side.assetId = o.assetId;
  return side;
}

function questionSource(refId, tgtId) {
  const r = AREA_OBJECTS[refId], t = AREA_OBJECTS[tgtId];
  return {
    name: `${r.srcName} / ${t.srcName}`,
    year: 2026,
    url: t.url,
    additionalUrls: [r.url],
    reviewStatus: r.status === 'verified' && t.status === 'verified' ? 'verified' : 'derived',
    reviewNote: `${r.name}=${r.size}m²：${r.note}；${t.name}=${t.size}m²：${t.note}。`,
    reviewEvidence: `${refId}: ${r.evidence} | ${tgtId}: ${t.evidence}`,
  };
}

const area = PAIRS.map(([refId, tgtId, note, memorable], i) => {
  const r = AREA_OBJECTS[refId], t = AREA_OBJECTS[tgtId];
  if (!r || !t) throw new Error(`未知面积对象: ${refId}/${tgtId}`);
  const span = Math.max(r.size, t.size) / Math.min(r.size, t.size);
  if (span > 32) throw new Error(`超带宽配对: ${refId} vs ${tgtId} span=${span.toFixed(1)}`);
  const q = {
    id: `ar-${String(i + 1).padStart(2, '0')}`,
    reference: sideOf(refId),
    target: sideOf(tgtId),
    dimension: '面积',
    measure: 'area',
    difficulty: deriveDifficulty(span),
    status: 'published',
    source: questionSource(refId, tgtId),
  };
  if (note) q.note = note;
  if (memorable) q.memorable = true;
  return q;
});

if (Array.isArray(pack.area) && pack.area.length) {
  console.error('❌ area 池已存在（本脚本为一次性迁移，勿重复运行）');
  process.exit(1);
}
pack.area = area;
pack.version = '3.1.0';
pack._说明 = '热更新数据包 v3.1.0（P2 面积分类）：新增 area 池 40 题（单位 m²，渲染按平方根缩放，素材复用现有插画+emoji 兜底）；视觉题全部满足 1/32≤q*≤32 带宽并带对象级来源。其余同 v3.0.0（weight 池 22 题、数量级题含 num-50~52）。';
pack._字段['area'] = '面积模式题库：结构同 everyday/pop/geo，size 单位为平方米（m²），measure=area，dimension=面积；渲染时图上边长按面积的平方根显示（仅影响呈现，不影响计分）；无 assetId 的对象用 emoji 兜底渲染';

if (!dryRun) {
  writeFileSync(file, JSON.stringify(pack, null, 2) + '\n', 'utf8');
  console.log(`✅ 已写入 ${file}（v${pack.version}，area ${area.length} 题）`);
} else {
  console.log(`（dry-run）area ${area.length} 题，版本将升为 3.1.0`);
}
for (const q of area) {
  const span = Math.max(q.reference.size, q.target.size) / Math.min(q.reference.size, q.target.size);
  console.log(`  ${q.id} ${q.reference.name} vs ${q.target.name} span=${span.toFixed(2)} d${q.difficulty}`);
}
