// 批次 E 第二档（冲 50 题档）：everyday 30→50、geo 25→50、pop 20→50、numeric 28→50（GDD 6.1）。
// geo 用本档新增的 11 张地标插画配对，pop 用 4 个新原创角色配对；全部回填 difficulty/memorable。
// numeric 新增 22 题（14 point + 8 range，单位限白名单），同步新增 fallback_v3 快照（含全部 50 题）。
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePack } from '../src/core/question.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));

// ---------- 共享参照物 ----------
const HUMAN = { name: '成年人', size: 1.7, emoji: '🧍', assetId: 'adult-human' };
const HOUSE = { name: '一层楼房', size: 3, emoji: '🏠', assetId: 'single-storey-house' };
const BUS = { name: '双层巴士', size: 4.4, emoji: '🚌', assetId: 'double-decker-bus' };
const LAMP = { name: '红绿灯', size: 4.5, emoji: '🚦', assetId: 'traffic-light' };
const SIGN = { name: '公交站牌', size: 2.5, emoji: '🚏', assetId: 'bus-stop-sign' };
const OAK = { name: '成年橡树', size: 20, emoji: '🌳', assetId: 'mature-oak-tree' };
const APPLE = { name: '苹果', size: 0.08, emoji: '🍎', assetId: 'apple' };
const TENNIS = { name: '网球', size: 0.067, emoji: '🎾', assetId: 'tennis-ball' };
const EGG = { name: '鸡蛋', size: 0.055, emoji: '🥚', assetId: 'egg' };
const BALL = { name: '篮球', size: 0.24, emoji: '🏀', assetId: 'basketball' };
const SOCCER = { name: '足球', size: 0.22, emoji: '⚽', assetId: 'soccer-ball' };
const PHONE = { name: '手机', size: 0.15, emoji: '📱', assetId: 'smartphone' };
const CAN = { name: '易拉罐', size: 0.12, emoji: '🥤', assetId: 'soda-can' };
const BIKE = { name: '自行车（车把高）', size: 1, emoji: '🚲', assetId: 'bicycle' };
const GIRAFFE = { name: '长颈鹿', size: 5.5, emoji: '🦒', assetId: 'giraffe' };
const ELEPHANT = { name: '非洲象', size: 3.3, emoji: '🐘', assetId: 'african-elephant' };
const CAT = { name: '家猫（肩高）', size: 0.25, emoji: '🐱', assetId: 'house-cat' };
const PENGUIN = { name: '帝企鹅', size: 1.2, emoji: '🐧', assetId: 'emperor-penguin' };
const KANGAROO = { name: '红袋鼠', size: 2, emoji: '🦘', assetId: 'red-kangaroo' };
const WHALE = { name: '蓝鲸（体长）', size: 26, emoji: '🐋', assetId: 'blue-whale' };
const CAR = { name: '小轿车', size: 1.5, emoji: '🚗', assetId: 'sedan-car' };
const DOOR = { name: '标准房门', size: 2, emoji: '🚪', assetId: 'standard-door' };

const mk = (id, ref, tgt, dimension, difficulty, memorable) => ({
  id, reference: ref, target: tgt, dimension,
  ...(memorable ? { memorable: true } : {}),
  difficulty,
  status: 'published',
  source: { name: '公开资料估算', year: 2026 },
});

// ---------- everyday 30 → 50（+20，复用已有插画交叉配对）----------
const NEW_EVERYDAY = [
  mk('ev-30', GIRAFFE, BUS, '高度', 1),
  mk('ev-31', ELEPHANT, OAK, '身高', 2),
  mk('ev-32', KANGAROO, DOOR, '身高', 1),
  mk('ev-33', PENGUIN, CAN, '身高', 2),
  mk('ev-34', SOCCER, APPLE, '直径', 2),
  mk('ev-35', TENNIS, BALL, '直径', 2),
  mk('ev-36', SIGN, HUMAN, '高度', 1),
  mk('ev-37', BUS, LAMP, '高度', 1),
  mk('ev-38', CAR, DOOR, '高度', 1),
  mk('ev-39', OAK, GIRAFFE, '高度', 2),
  mk('ev-40', PENGUIN, BIKE, '高度', 1),
  mk('ev-41', KANGAROO, BUS, '身高', 1),
  mk('ev-42', PHONE, TENNIS, '长度', 2),
  mk('ev-43', BUS, CAN, '高度', 3),
  mk('ev-44', GIRAFFE, HOUSE, '高度', 1),
  mk('ev-45', BALL, APPLE, '直径', 2),
  mk('ev-46', EGG, SOCCER, '直径', 2),
  mk('ev-47', HUMAN, CAR, '高度', 1),
  mk('ev-48', BIKE, SIGN, '高度', 1),
  mk('ev-49', WHALE, CAT, '长度', 3, true),
];

// ---------- geo 25 → 50（+25，11 张新地标插画，本档新增素材）----------
const GIZA = { name: '胡夫金字塔（原高）', size: 146.6, emoji: '🏛️', assetId: 'pyramid-giza' };
const TAIPEI = { name: '台北101', size: 508, emoji: '🏢', assetId: 'taipei-101' };
const CANTON = { name: '广州塔', size: 604, emoji: '🗼', assetId: 'canton-tower' };
const PEARL = { name: '东方明珠', size: 468, emoji: '📡', assetId: 'oriental-pear-tower' };
const EMPIRE = { name: '帝国大厦（含天线）', size: 443, emoji: '🏙️', assetId: 'empire-state-building' };
const WALL = { name: '万里长城（明长城全长）', size: 8851000, emoji: '🐉', assetId: 'great-wall' };
const OPERA = { name: '悉尼歌剧院', size: 65, emoji: '🎭', assetId: 'sydney-opera-house' };
const TAJ = { name: '泰姬陵（主体高）', size: 74, emoji: '🕌', assetId: 'taj-mahal' };
const COLOSSEUM = { name: '罗马斗兽场', size: 48, emoji: '🏟️', assetId: 'colosseum' };
const PISA = { name: '比萨斜塔', size: 56, emoji: '📐', assetId: 'leaning-tower-of-pisa' };
const EYE = { name: '伦敦眼', size: 135, emoji: '🎡', assetId: 'london-eye' };

const NEW_GEO = [
  mk('geo-25', HUMAN, GIZA, '高度', 3),
  mk('geo-26', HOUSE, GIZA, '高度', 3),
  mk('geo-27', OAK, GIZA, '高度', 2),
  mk('geo-28', HUMAN, TAIPEI, '高度', 3),
  mk('geo-29', HOUSE, TAIPEI, '高度', 3),
  mk('geo-30', OAK, TAIPEI, '高度', 2),
  mk('geo-31', BUS, TAIPEI, '高度', 3),
  mk('geo-32', HUMAN, CANTON, '高度', 3),
  mk('geo-33', OAK, CANTON, '高度', 3),
  mk('geo-34', HUMAN, PEARL, '高度', 3),
  mk('geo-35', HOUSE, PEARL, '高度', 3),
  mk('geo-36', HUMAN, EMPIRE, '高度', 3),
  mk('geo-37', LAMP, EMPIRE, '高度', 3),
  mk('geo-38', HUMAN, OPERA, '高度', 3),
  mk('geo-39', HOUSE, OPERA, '高度', 2),
  mk('geo-40', GIZA, EYE, '高度', 1),
  mk('geo-41', HOUSE, TAJ, '高度', 2),
  mk('geo-42', COLOSSEUM, PISA, '高度', 1),
  mk('geo-43', HUMAN, COLOSSEUM, '高度', 2),
  mk('geo-44', OAK, COLOSSEUM, '高度', 1),
  mk('geo-45', HUMAN, PISA, '高度', 3),
  mk('geo-46', HUMAN, EYE, '高度', 3),
  mk('geo-47', HUMAN, TAJ, '高度', 3),
  mk('geo-48', OAK, WALL, '长度', 3, true),
  mk('geo-49', WHALE, WALL, '长度', 3, true),
];

// ---------- pop 20 → 50（+30，4 个新原创角色 + 旧角色新配对，全原创无第三方 IP）----------
const SPROUT = { name: '芽芽豆', size: 0.4, emoji: '🌱', assetId: 'sproutling' };
const BRASS = { name: '齿轮小铜', size: 1.29, emoji: '🤖', assetId: 'brass-bot' };
const CLOUD = { name: '云绒团子', size: 2.2, emoji: '☁️', assetId: 'cloud-giant' };
const MOSS = { name: '苔毛兽', size: 2, emoji: '🍄', assetId: 'moss-beast' };
const CUBE = { name: '方糖仔', size: 0.1, emoji: '🧊', assetId: 'cube-sprite' };
const STARVINE = { name: '星藤猎人', size: 3, emoji: '🌟', assetId: 'starvine-hunter' };
const MECHA = { name: '银岩机甲', size: 10.6, emoji: '🦾', assetId: 'mecha-colossus' };
const TREX = { name: '霸王龙（科学复原）', size: 4, emoji: '🦖', assetId: 't-rex' };
const TITAN = { name: '晶石巨人', size: 40, emoji: '💎', assetId: 'crystal-titan' };
const LIZARD = { name: '深渊巨蜥', size: 100, emoji: '🦎', assetId: 'abyss-lizard' };
const GOLEM = { name: '熔岩魔像', size: 6.5, emoji: '🔥', assetId: 'molten-golem' };
const GRIFFIN = { name: '风暴狮鹫', size: 3.2, emoji: '🦅', assetId: 'tempest-griffin' };
const WYRM = { name: '冰霜幼龙（体长）', size: 9, emoji: '🐲', assetId: 'frost-wyrm' };
const STALKER = { name: '暗影豹（肩高）', size: 1.1, emoji: '🐾', assetId: 'gloom-stalker' };

const NEW_POP = [
  mk('pop-20', HUMAN, GOLEM, '身高', 2),
  mk('pop-21', HUMAN, GRIFFIN, '身高', 1),
  mk('pop-22', HUMAN, WYRM, '长度', 2),
  mk('pop-23', HUMAN, STALKER, '身高', 1),
  mk('pop-24', HOUSE, GOLEM, '高度', 1),
  mk('pop-25', HOUSE, WYRM, '长度', 2),
  mk('pop-26', HOUSE, GRIFFIN, '高度', 1),
  mk('pop-27', HOUSE, STALKER, '高度', 2),
  mk('pop-28', MECHA, GOLEM, '高度', 1),
  mk('pop-29', TREX, GOLEM, '高度', 2),
  mk('pop-30', WYRM, LIZARD, '长度', 2, true),
  mk('pop-31', TITAN, MECHA, '高度', 2),
  mk('pop-32', GOLEM, TITAN, '高度', 2),
  mk('pop-33', GRIFFIN, STARVINE, '身高', 1),
  mk('pop-34', STALKER, CUBE, '身高', 2),
  mk('pop-35', BRASS, STALKER, '身高', 1),
  mk('pop-36', CLOUD, GOLEM, '身高', 2),
  mk('pop-37', STARVINE, WYRM, '长度', 2),
  mk('pop-38', MOSS, GRIFFIN, '身高', 2),
  mk('pop-39', SPROUT, STALKER, '身高', 2),
  mk('pop-40', CUBE, MOSS, '身高', 2),
  mk('pop-41', GRIFFIN, MECHA, '高度', 2),
  mk('pop-42', CUBE, TITAN, '身高', 3),
  mk('pop-43', SPROUT, MECHA, '身高', 3),
  mk('pop-44', CUBE, LIZARD, '长度', 3, true),
  mk('pop-45', BRASS, TITAN, '身高', 3),
  mk('pop-46', HUMAN, TITAN, '高度', 3),
  mk('pop-47', MOSS, LIZARD, '长度', 3),
  mk('pop-48', TREX, LIZARD, '长度', 3),
  mk('pop-49', CUBE, MECHA, '身高', 3),
];

// ---------- numeric 28 → 50（+22：14 point + 8 range；单位限白名单，range 口径统一「参考范围」）----------
const NUM_SRC = (name) => ({ name, year: 2026 });
const NEW_NUMERIC = [
  { id: 'num-28', q: '一天大约有多少秒？', a: 86400, u: '秒', note: '24 小时 × 60 分钟 × 60 秒 = 86,400 秒（闰秒除外）。', answerType: 'point', status: 'published', source: NUM_SRC('内部整理') },
  { id: 'num-29', q: '一位成年人全身大约有多少块骨头？', a: 206, u: '个', note: '成人 206 块；婴儿约 300 块，成长中逐渐融合。', answerType: 'point', status: 'published', source: NUM_SRC('公开医学资料估算') },
  { id: 'num-30', q: '长江的全长大约是多少千米？', a: 6300, u: '千米', note: '干流约 6,300 千米，长度居世界第三。', answerType: 'point', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-31', q: '赤道的周长大约是多少千米？', a: 40075, u: '千米', note: '约 40,075 千米；地球是扁球体，两极方向的周长要短约 120 千米。', answerType: 'point', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-32', q: '一个人一天大约心跳多少次？', a: 100000, u: '次', note: '静息约 60~100 次/分，叠加全天活动 ≈ 10 万次。', answerType: 'point', status: 'published', source: NUM_SRC('公开医学资料估算') },
  { id: 'num-33', q: '亚马逊河的全长大约是多少千米？', a: 6400, u: '千米', note: '约 6,400 千米；与尼罗河的「世界第一长河」之争随测量口径变化。', answerType: 'point', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-34', q: '地球自转一周大约是多少分钟？', a: 1440, u: '分钟', note: '太阳日 24 小时 = 1,440 分钟；恒星日约 23 小时 56 分。', answerType: 'point', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-35', q: '京沪高速铁路的全长大约是多少千米？', a: 1318, u: '千米', note: '北京南—上海虹桥 1,318 千米，设计时速 350 千米。', answerType: 'point', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-36', q: '声音在空气中传播 1 千米大约需要多少秒？', a: 3, u: '秒', note: '15℃ 空气中声速约 340 米/秒，1,000 ÷ 340 ≈ 2.9 秒。', answerType: 'point', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-37', q: '地球上的水大约有多少立方米？', a: 1.4e18, u: '立方米', note: '约 13.86 亿立方千米 = 1.4×10¹⁸ 立方米，其中 97.5% 是海水。', answerType: 'point', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-38', q: '河马一次潜水大约能屏息多少分钟？', a: 5, u: '分钟', note: '河马可潜水约 5 分钟，出水时会从耳鼻喷出水柱。', answerType: 'point', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-39', q: '珠穆朗玛峰比泰山大约高多少米？', a: 7304, u: '米', note: '8,849 − 1,545 = 7,304 米，接近再叠 3 座泰山。', answerType: 'point', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-40', q: '恐龙灭绝距今大约多少年？', a: 66000000, u: '年', note: '白垩纪末大灭绝约 6,600 万年前，小行星撞击与德干火山活动共同作用。', answerType: 'point', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-41', q: '一个 50 米标准泳池大约蓄水多少立方米？', a: 2500, u: '立方米', note: '50 × 25 × 平均水深 2 米 = 2,500 立方米，约 2,500 吨。', answerType: 'point', status: 'published', source: NUM_SRC('内部整理') },

  { id: 'num-42', q: '成年人平静时每分钟大约呼吸多少次？', u: '次', answerRange: { min: 12, max: 20 }, note: '参考范围：静息 12~20 次/分；运动、情绪与年龄都会让数值明显变化，故不给单点。', answerType: 'range', status: 'published', source: NUM_SRC('公开医学资料估算') },
  { id: 'num-43', q: '一个成年人头上大约有多少根头发？', u: '根', answerRange: { min: 80000, max: 150000 }, note: '参考范围：常见估算 8~15 万根，随种族、年龄、发色差异明显，个体差异大。', answerType: 'range', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-44', q: '一位成年人大约有多少颗牙齿？', u: '个', answerRange: { min: 28, max: 32 }, note: '参考范围：恒牙 28~32 颗，是否长出 4 颗智齿因人而异。', answerType: 'range', status: 'published', source: NUM_SRC('公开医学资料估算') },
  { id: 'num-45', q: '马里亚纳海沟最深处大约有多深？', u: '米', answerRange: { min: 10500, max: 11000 }, note: '参考范围：挑战者深渊约 10,900~11,000 米，不同测次存在数十米误差。', answerType: 'range', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-46', q: '地球的年龄大约是多少年？', u: '年', answerRange: { min: 450000000, max: 460000000 }, note: '参考范围：同位素测年约 45.4 亿年，± 数千万年的不确定度。', answerType: 'range', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-47', q: '一只家猫每天大约睡多少小时？', u: '小时', answerRange: { min: 12, max: 16 }, note: '参考范围：猫每天睡 12~16 小时且多为浅睡，幼猫与老年猫睡得更多。', answerType: 'range', status: 'published', source: NUM_SRC('公开资料估算') },
  { id: 'num-48', q: '成年人的体温大约是多少摄氏度？', u: '度', answerRange: { min: 36.1, max: 37.2 }, note: '参考范围：常规口/腋温 36.1~37.2℃，一天内自然波动约 0.5℃。', answerType: 'range', status: 'published', source: NUM_SRC('公开医学资料估算') },
  { id: 'num-49', q: '一个成年人每天大约走多少步？', u: '次', answerRange: { min: 3000, max: 8000 }, note: '参考范围：研究常见区间 3,000~8,000 步，职业与生活方式差异极大，步数以「次」计。', answerType: 'range', status: 'published', source: NUM_SRC('公开研究资料估算') },
];

// ---------- 追加（幂等：已有 id 跳过）----------
function append(poolKey, list) {
  const ids = new Set(pack[poolKey].map((q) => q.id));
  let n = 0;
  for (const q of list) {
    if (ids.has(q.id)) continue;
    pack[poolKey].push(q);
    ids.add(q.id);
    n++;
  }
  return n;
}

const a = append('everyday', NEW_EVERYDAY);
const b = append('geo', NEW_GEO);
const c = append('pop', NEW_POP);
const d = append('numeric', NEW_NUMERIC);

// fallback_v3：numeric 扩到 50 后的新快照（只影响尚未发布日期；已发布日期由 dailySchedule 保护）
if (!pack.fallbackPools.some((f) => f.version === 'fallback_v3')) {
  pack.fallbackPools.push({ version: 'fallback_v3', questionIds: pack.numeric.map((q) => q.id) });
}

pack.version = '2.6.0';

// ---------- 写入前静态校验（不通过绝不落盘）----------
const errors = validatePack(pack);
if (errors.length) {
  console.error('❌ validatePack 未通过：');
  errors.forEach((e) => console.error(` - ${e.path}: ${e.msg}`));
  process.exit(1);
}

writeFileSync(file, JSON.stringify(pack, null, 2) + '\n');

const dist = (pool) => {
  const c = { 1: 0, 2: 0, 3: 0 };
  let memo = 0;
  pack[pool].forEach((q) => { if (q.difficulty) c[q.difficulty]++; if (q.memorable) memo++; });
  return `难度 ${c[1]}/${c[2]}/${c[3]} · 记忆点 ${memo}`;
};
console.log(`✅ everyday +${a}(${pack.everyday.length}, ${dist('everyday')}) / geo +${b}(${pack.geo.length}, ${dist('geo')}) / pop +${c}(${pack.pop.length}, ${dist('pop')})`);
console.log(`✅ numeric +${d}(${pack.numeric.length})，point ${pack.numeric.filter((q) => q.answerType === 'point').length} / range ${pack.numeric.filter((q) => q.answerType === 'range').length}`);
console.log(`✅ fallbackPools: ${pack.fallbackPools.map((f) => f.version).join(' → ')}；version → ${pack.version}`);
