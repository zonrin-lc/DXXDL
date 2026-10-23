// 一次性脚本：给 pools.json 视觉三池回填 difficulty(1/2/3) 与 memorable 标签（GDD 6.3）。
// 难度依据：跨度/细微差异/反直觉程度（初始主观分档，待试玩数据校准）；memorable = 揭晓效果有趣的记忆点题。
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));

// difficulty: 1=简单(直觉明显) 2=中等(需思考/接近值) 3=困难(极端跨度或强反直觉)
const TAGS = {
  // everyday：1 直觉明显 / 2 需思考或近似值 / 3 极端跨度或强反直觉
  'ev-0': 1, 'ev-1': 1, 'ev-2': 2, 'ev-3': 2, 'ev-4': 2, 'ev-5': 1, 'ev-6': 1,
  'ev-7': 3, 'ev-8': 2, 'ev-9': 2, 'ev-10': 2, 'ev-11': 2, 'ev-12': 3, 'ev-13': 2,
  'ev-14': 1, 'ev-15': 3,
  // pop：原创角色，参照物明确
  'pop-0': 1, 'pop-1': 2, 'pop-2': 2, 'pop-3': 2, 'pop-4': 2, 'pop-5': 2,
  'pop-6': 1, 'pop-7': 2, 'pop-8': 3, 'pop-9': 3,
  // geo：全部以一层楼房为参照，跨度大，按常识可知度分档
  'geo-0': 1, 'geo-1': 2, 'geo-2': 2, 'geo-3': 2, 'geo-4': 3, 'geo-5': 3,
  'geo-6': 3, 'geo-7': 3, 'geo-8': 3, 'geo-9': 3,
};
const MEMORABLE = ['ev-7', 'ev-15', 'pop-9', 'geo-9', 'geo-7'];

let n = 0;
for (const key of ['everyday', 'pop', 'geo']) {
  for (const q of pack[key]) {
    if (TAGS[q.id] == null) throw new Error(`缺少 difficulty 标签: ${q.id}`);
    q.difficulty = TAGS[q.id];
    if (MEMORABLE.includes(q.id)) q.memorable = true;
    else delete q.memorable;
    n++;
  }
}
pack.version = '2.2.0';
writeFileSync(file, JSON.stringify(pack, null, 2) + '\n');
console.log(`✅ 已回填 ${n} 题 difficulty / memorable，version → ${pack.version}`);
