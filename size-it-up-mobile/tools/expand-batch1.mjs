// 批次 E 第一档：everyday 16→30、geo 10→25、pop 10→20（GDD 6.1 分档推进）。
// 新题全部复用已有 42 张插画素材配对（本档零新图），并回填 difficulty/memorable。
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));

const HUMAN = { name: '成年人', size: 1.7, emoji: '🧍', assetId: 'adult-human' };
const HOUSE = { name: '一层楼房', size: 3, emoji: '🏠', assetId: 'single-storey-house' };
const CAR = { name: '小轿车', size: 1.5, emoji: '🚗', assetId: 'sedan-car' };
const BUS = { name: '双层巴士', size: 4.4, emoji: '🚌', assetId: 'double-decker-bus' };
const DOOR = { name: '标准房门', size: 2, emoji: '🚪', assetId: 'standard-door' };
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

const mk = (id, ref, tgt, dimension, difficulty, memorable) => ({
  id, reference: ref, target: tgt, dimension,
  ...(memorable ? { memorable: true } : {}),
  difficulty,
  status: 'published',
  source: { name: '公开资料估算', year: 2026 },
});

// ---------- everyday 16 → 30（+14）----------
const NEW_EVERYDAY = [
  mk('ev-16', APPLE, BALL, '直径', 1),
  mk('ev-17', APPLE, PHONE, '长度', 2),
  mk('ev-18', TENNIS, EGG, '直径', 2),
  mk('ev-19', SOCCER, TENNIS, '直径', 2),
  mk('ev-20', HUMAN, HOUSE, '高度', 1),
  mk('ev-21', DOOR, HUMAN, '高度', 1),
  mk('ev-22', ELEPHANT, GIRAFFE, '身高', 1),
  mk('ev-23', LAMP, DOOR, '高度', 2),
  mk('ev-24', SIGN, DOOR, '高度', 2),
  mk('ev-25', BIKE, HUMAN, '高度', 2),
  mk('ev-26', WHALE, BUS, '长度', 3),
  mk('ev-27', PENGUIN, CAT, '身高', 2),
  mk('ev-28', GIRAFFE, LAMP, '高度', 2),
  mk('ev-29', BALL, EGG, '直径', 3),
];

// ---------- geo 10 → 25（+15）----------
const MOAI = { name: '复活节岛石像', size: 4, emoji: '🗿', assetId: 'easter-island-statue' };
const LIBERTY = { name: '自由女神像（含基座）', size: 93, emoji: '🗽', assetId: 'statue-of-liberty' };
const BIGBEN = { name: '大本钟', size: 96, emoji: '🕰️', assetId: 'big-ben' };
const GOLDEN = { name: '金门大桥桥塔', size: 227, emoji: '🌉', assetId: 'golden-gate-tower' };
const EIFFEL = { name: '埃菲尔铁塔', size: 330, emoji: '🗼', assetId: 'eiffel-tower' };
const TOKYO = { name: '东京铁塔', size: 333, emoji: '📡', assetId: 'tokyo-tower' };
const SHANGHAI = { name: '上海中心大厦', size: 632, emoji: '🏙️', assetId: 'shanghai-tower' };
const BURJ = { name: '哈利法塔', size: 828, emoji: '🏢', assetId: 'burj-khalifa' };
const TAI = { name: '泰山', size: 1545, emoji: '⛰️', assetId: 'mount-tai' };
const EVEREST = { name: '珠穆朗玛峰', size: 8849, emoji: '🏔️', assetId: 'mount-everest' };

const NEW_GEO = [
  mk('geo-10', HUMAN, MOAI, '高度', 1),
  mk('geo-11', HUMAN, LIBERTY, '高度', 3),
  mk('geo-12', HUMAN, BIGBEN, '高度', 3),
  mk('geo-13', HUMAN, EIFFEL, '高度', 3),
  mk('geo-14', HUMAN, BURJ, '高度', 3),
  mk('geo-15', OAK, GOLDEN, '高度', 3),
  mk('geo-16', OAK, TOKYO, '高度', 3),
  mk('geo-17', OAK, SHANGHAI, '高度', 3),
  mk('geo-18', OAK, TAI, '高度', 3, true),
  mk('geo-19', BUS, LIBERTY, '高度', 3),
  mk('geo-20', BUS, BIGBEN, '高度', 3),
  mk('geo-21', LAMP, MOAI, '高度', 2),
  mk('geo-22', HUMAN, TOKYO, '高度', 3),
  mk('geo-23', HUMAN, SHANGHAI, '高度', 3),
  mk('geo-24', HUMAN, EVEREST, '高度', 3),
];

// ---------- pop 10 → 20（+10）：角色交叉配对，全部原创素材 ----------
const SPROUT = { name: '芽芽豆', size: 0.4, emoji: '🌱', assetId: 'sproutling' };
const BRASS = { name: '齿轮小铜', size: 1.29, emoji: '🤖', assetId: 'brass-bot' };
const CLOUD = { name: '云绒团子', size: 2.2, emoji: '☁️', assetId: 'cloud-giant' };
const MOSS = { name: '苔毛兽', size: 2, emoji: '🍄', assetId: 'moss-beast' };
const CUBE = { name: '方糖仔', size: 0.1, emoji: '🧊', assetId: 'cube-sprite' };
const STARVINE = { name: '星藤猎人', size: 3, emoji: '🌟', assetId: 'starvine-hunter' };
const MECHA = { name: '银岩机甲', size: 10.6, emoji: '🦾', assetId: 'mecha-colossus' };
const TREX = { name: '霸王龙（科学复原）', size: 4, emoji: '🦖', assetId: 't-rex' };
const TITAN = { name: '晶石巨人', size: 40, emoji: '💎', assetId: 'crystal-titan' };
const LIZARD = { name: '深渊巨蜥（体长）', size: 100, emoji: '🦎', assetId: 'abyss-lizard' };

const NEW_POP = [
  mk('pop-10', SPROUT, CUBE, '身高', 2),
  mk('pop-11', CLOUD, MOSS, '身高', 2),
  mk('pop-12', STARVINE, BRASS, '身高', 2),
  mk('pop-13', HUMAN, MECHA, '高度', 3),
  mk('pop-14', TREX, MECHA, '高度', 2),
  mk('pop-15', HOUSE, MOSS, '高度', 2),
  mk('pop-16', HUMAN, TREX, '高度', 2),
  mk('pop-17', BRASS, MOSS, '身高', 3),
  mk('pop-18', CLOUD, MECHA, '高度', 3),
  mk('pop-19', CUBE, BRASS, '身高', 3),
];

function append(poolKey, list) {
  const ids = new Set(pack[poolKey].map((q) => q.id));
  let n = 0;
  for (const q of list) {
    if (ids.has(q.id)) continue;
    pack[poolKey].push(q);
    n++;
  }
  return n;
}

// 修正 ev-8：双层巴士 4.4m 是车高（长度应约 11m），dimension 由「长度」改「高度」
const ev8 = pack.everyday.find((q) => q.id === 'ev-8');
if (ev8 && ev8.dimension === '长度') ev8.dimension = '高度';

const a = append('everyday', NEW_EVERYDAY);
const b = append('geo', NEW_GEO);
const c = append('pop', NEW_POP);

pack.version = '2.5.0';
writeFileSync(file, JSON.stringify(pack, null, 2) + '\n');
console.log(`✅ everyday +${a}(${pack.everyday.length}) / geo +${b}(${pack.geo.length}) / pop +${c}(${pack.pop.length})；ev-8 dimension 修正；version → ${pack.version}`);
