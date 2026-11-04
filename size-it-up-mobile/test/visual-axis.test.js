// 轴向一致性不变量（P0 修复的防回归测试，对应审查「渲染尺寸比 = 理论显示比」）：
// 渲染器 kOf 的轴解析链为 侧.axis → DIM_AXIS[dimension] → 素材.axis → 宽高启发式。
// 对 length 题，每个带素材的侧面解析出的轴必须等于对象表（objects.json dim）登记的测量轴，
// 否则竖向素材会被按宽度归一，产生数倍失真（历史案例：ev-7 成年人 1.7m 身高被按 w 轴渲染，感知比 5.01 vs 真实 15.29）。
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pack = JSON.parse(readFileSync(path.join(root, 'data', 'pools.json'), 'utf8'));
const objects = JSON.parse(readFileSync(path.join(root, 'data', 'objects.json'), 'utf8')).objects;
const manifest = JSON.parse(readFileSync(path.join(root, 'assets', 'img', 'manifest.json'), 'utf8'));

// 与 src/ui/visual.js 同口径
const DIM_AXIS = { '高度': 'h', '身高': 'h', '长度': 'w', '宽度': 'w', '直径': 'w' };
const LENGTH_POOLS = ['everyday', 'pop', 'geo'];

function rendererAxis(side, dimension, entry) {
  const b = entry.bounds;
  return side.axis || DIM_AXIS[dimension] || entry.axis || (b.w >= b.h ? 'w' : 'h');
}

describe('视觉题轴向一致性（P0）', () => {
  it('length 题带素材的侧面：渲染解析轴 == 对象表测量轴', () => {
    const bad = [];
    for (const key of LENGTH_POOLS) {
      for (const q of pack[key]) {
        for (const sideName of ['reference', 'target']) {
          const side = q[sideName];
          if (!side?.assetId || !manifest[side.assetId]) continue;
          const obj = objects[`length:${side.assetId}`];
          expect(obj, `${q.id} ${side.assetId} 不在对象表`).toBeTruthy();
          const canonical = DIM_AXIS[obj.dim];
          expect(canonical, `${q.id} ${side.assetId} 的 dim=${obj.dim} 无法映射轴`).toBeTruthy();
          const resolved = rendererAxis(side, q.dimension, manifest[side.assetId]);
          if (resolved !== canonical) {
            bad.push(`${q.id} ${sideName} ${side.name}：渲染轴 ${resolved} ≠ 测量轴 ${canonical}`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('显式 axis 只取 h/w，且与对象表一致', () => {
    for (const key of Object.keys(pack)) {
      if (!Array.isArray(pack[key]) || ['numeric', 'fallbackPools'].includes(key)) continue;
      for (const q of pack[key]) {
        for (const sideName of ['reference', 'target']) {
          const side = q[sideName];
          if (side?.axis === undefined) continue;
          expect(['h', 'w']).toContain(side.axis);
          const obj = objects[`${q.measure || 'length'}:${side.assetId}`];
          if (obj) expect(side.axis).toBe(DIM_AXIS[obj.dim]);
        }
      }
    }
  });
});
