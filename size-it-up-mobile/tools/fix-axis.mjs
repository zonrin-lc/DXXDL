// 轴向失真修复（P0）：length 题里存在「题目 dimension 轴 ≠ 对象测量轴」的错位
// （如 ev-7 成年人 1.7m 是身高，却被长度题的 w 轴归一，渲染被放大 3 倍）。
// 本脚本以对象表 data/objects.json 的 dim 为权威测量轴，给错位侧写入显式 axis 字段；
// 渲染器（visual.js kOf）优先使用每侧 axis。一次性迁移，勿重复运行。
// 用法：node tools/fix-axis.mjs [--dry-run]
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packFile = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(packFile, 'utf8'));
const objects = JSON.parse(readFileSync(path.join(root, 'data', 'objects.json'), 'utf8')).objects;
const dryRun = process.argv.includes('--dry-run');

// 与 src/ui/visual.js 的 DIM_AXIS 同口径：测量维度 → 内容轴
const DIM_AXIS = { '高度': 'h', '身高': 'h', '长度': 'w', '宽度': 'w', '直径': 'w' };

const objAxis = new Map();
for (const [assetId, o] of Object.entries(objects)) {
  const axis = DIM_AXIS[o.dim];
  if (axis) objAxis.set(assetId, axis);
}

const LENGTH_POOLS = ['everyday', 'pop', 'geo']; // measure 缺省即 length 的三个精选池
let annotated = 0;
const changes = [];
for (const key of LENGTH_POOLS) {
  for (const q of pack[key] || []) {
    const qAxis = DIM_AXIS[q.dimension];
    for (const sideName of ['reference', 'target']) {
      const side = q[sideName];
      const aid = side?.assetId;
      if (!aid) continue;
      const expected = objAxis.get(aid);
      if (!expected) throw new Error(`${q.id} 的 ${aid} 不在对象表中，无法确定测量轴`);
      if (side.axis !== undefined && side.axis !== expected) {
        throw new Error(`${q.id} ${sideName} 已有 axis=${side.axis}，与对象表测量轴 ${expected} 冲突`);
      }
      if (expected !== qAxis) {
        side.axis = expected;
        annotated++;
        changes.push(`${q.id} ${sideName} ${side.name}：题目轴 ${qAxis} → 测量轴 ${expected}`);
      }
    }
  }
}

pack.version = '3.2.1';
pack._说明 = '热更新数据包 v3.2.1（P0 轴向失真修复）：length 题中题目 dimension 轴与对象测量轴不一致的侧面写入显式 axis 字段（ev-7/pop-22 成年人、pop-37 星藤猎人、pop-9 晶石巨人），渲染器按每侧 axis 归一，消除系统性失真。其余同 v3.2.0。';
pack._字段['axis'] = '可选。reference/target 侧字段：该侧 size 的测量内容轴（h=竖向身高/高度，w=横向长度/宽度/直径）。缺省时渲染器按题目 dimension 推导；仅当对象测量轴与题目轴不一致时显式标注（权威来源为 data/objects.json 的 dim）';

if (!dryRun) {
  writeFileSync(packFile, JSON.stringify(pack, null, 2) + '\n', 'utf8');
  console.log(`✅ 已写入 ${packFile}（v${pack.version}，标注 ${annotated} 侧）`);
} else {
  console.log(`（dry-run）将标注 ${annotated} 侧，版本升为 3.2.1`);
}
for (const c of changes) console.log('  ' + c);
