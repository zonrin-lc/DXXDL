// 一次性脚本：向 numeric 题库新增 range 区间题（GDD 4.2），note 写明口径与不确定性原因。
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));

const NEW = [
  {
    id: 'num-21', q: '一个人每天大约会眨眼多少次？', u: '次',
    answerRange: { min: 12000, max: 20000 },
    note: '口径：清醒时每分钟约 15~20 次、每天约 16 小时清醒时间折算；个体与用眼强度差异大，故给区间。',
    answerType: 'range', status: 'published', source: { name: '公开医学资料估算', year: 2026 },
  },
  {
    id: 'num-22', q: '银河系大约有多少颗恒星？', u: '个',
    answerRange: { min: 1e11, max: 4e11 },
    note: '口径：不同巡天与暗物质模型给出 1000 亿~4000 亿颗的估计，无单一精确值。',
    answerType: 'range', status: 'published', source: { name: '公开天文资料估算', year: 2026 },
  },
  {
    id: 'num-23', q: '一个成年人体内的血液总量大约是多少升？', u: '升',
    answerRange: { min: 3.5, max: 5.5 },
    note: '口径：约为体重的 7%~8%，按 50~70 千克体重折算；性别与个体差异导致区间。',
    answerType: 'range', status: 'published', source: { name: '公开医学资料估算', year: 2026 },
  },
  {
    id: 'num-24', q: '太阳表面（光球层）的温度大约是多少摄氏度？', u: '度',
    answerRange: { min: 5000, max: 6000 },
    note: '口径：光球层平均约 5500℃，不同测量波段与太阳活动周期存在数百摄氏度差异。',
    answerType: 'range', status: 'published', source: { name: '公开天文资料估算', year: 2026 },
  },
  {
    id: 'num-25', q: '世界海洋的平均深度大约是多少米？', u: '米',
    answerRange: { min: 3500, max: 3800 },
    note: '口径：船测声呐与卫星测高反演结果不一，常用均值约 3680 米，故取 3500~3800。',
    answerType: 'range', status: 'published', source: { name: '公开海洋资料估算', year: 2026 },
  },
  {
    id: 'num-26', q: '月球到地球的距离大约是多少千米？', u: '千米',
    answerRange: { min: 356000, max: 407000 },
    note: '口径：月球轨道为椭圆，近地点约 35.65 万千米、远地点约 40.67 万千米，平均 38.44 万千米。',
    answerType: 'range', status: 'published', source: { name: '公开天文资料估算', year: 2026 },
  },
  {
    id: 'num-27', q: '全球人均预期寿命大约是多少年？', u: '年',
    answerRange: { min: 71, max: 74 },
    note: '口径：联合国 2024 年估算约 73.3 岁，各机构统计口径与年份略有出入。',
    answerType: 'range', status: 'published', source: { name: '公开人口资料估算', year: 2026 },
  },
];

const existing = new Set(pack.numeric.map((q) => q.id));
let n = 0;
for (const q of NEW) {
  if (existing.has(q.id)) continue;
  pack.numeric.push(q);
  n++;
}
pack.version = '2.3.0';
writeFileSync(file, JSON.stringify(pack, null, 2) + '\n');
console.log(`✅ 新增 ${n} 道 range 题，numeric 共 ${pack.numeric.length} 题，version → ${pack.version}`);
