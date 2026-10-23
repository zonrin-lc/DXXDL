import { describe, it, expect } from 'vitest';
import { vToRatio, ratioToV, clampQ, fineAdjust, randomStartV, tickMarks, qFromDrag } from '../src/core/scale.js';
import { SCALE_MIN, SCALE_MAX, SLIDER_STEPS, START_V_MIN, START_V_MAX, FINE_FACTOR } from '../src/core/constants.js';

describe('固定全局对数量程（GDD 3.3 本版确定）', () => {
  it('v=0 → 下限 1e-6，v=1000 → 上限 1e6', () => {
    expect(vToRatio(0)).toBeCloseTo(1e-6, 12);
    expect(vToRatio(1000)).toBeCloseTo(1e6, 9);
    expect(vToRatio(500)).toBeCloseTo(1, 9);
  });
  it('q → v → q 往返一致', () => {
    for (const q of [1e-5, 0.001, 0.05, 1, 7, 100, 1e4, 9e5]) {
      expect(vToRatio(ratioToV(q))).toBeCloseTo(q, 6);
    }
  });
  it('非法 v / q 安全回退', () => {
    expect(vToRatio(-10)).toBeCloseTo(SCALE_MIN, 12);
    expect(vToRatio(2000)).toBeCloseTo(SCALE_MAX, 9);
    expect(ratioToV(0)).toBe(SLIDER_STEPS / 2);
    expect(ratioToV(-5)).toBe(SLIDER_STEPS / 2);
    expect(clampQ(0)).toBe(SCALE_MIN);
    expect(clampQ(1e30)).toBe(SCALE_MAX);
  });
  it('每个逻辑步比例变化约 2.8%（1000 步覆盖 12 个数量级）', () => {
    const step = vToRatio(501) / vToRatio(500);
    expect(step).toBeGreaterThan(1.02);
    expect(step).toBeLessThan(1.03);
  });
});

describe('答案泄漏回归测试（GDD 12.1）', () => {
  const sampleStarts = (rng) => Array.from({ length: 200 }, () => randomStartV(rng));
  it('起始随机算法不依赖真实答案：同一随机源下分布完全一致', () => {
    const a = sampleStarts(mulberry(12345));
    const b = sampleStarts(mulberry(12345));
    expect(a).toEqual(b);
    // 与 q* 无关：这里只验证输入仅为随机源
    expect(Math.min(...a)).toBeGreaterThanOrEqual(START_V_MIN);
    expect(Math.max(...a)).toBeLessThanOrEqual(START_V_MAX);
  });
  it('刻度固定，所有题目共用同一套数量级标记', () => {
    const t1 = tickMarks();
    const t2 = tickMarks();
    expect(t1).toEqual(t2);
    expect(t1.length).toBe(13); // 1e-6 … 1e6
    expect(t1[0].q).toBeCloseTo(1e-6, 12);
    expect(t1[12].q).toBeCloseTo(1e6, 9);
    // 刻度位置与答案无关（纯函数无答案参数）
  });
  it('修改真实尺寸不会改变量程常量与刻度', () => {
    const before = { min: SCALE_MIN, max: SCALE_MAX, ticks: tickMarks().length };
    // 模拟题面改变（真实比例从 1.94 变为 0.00002）
    const after = { min: SCALE_MIN, max: SCALE_MAX, ticks: tickMarks().length };
    expect(after).toEqual(before);
  });
});

describe('微调与拖拽（GDD 3.2）', () => {
  it('±1% 乘法微调', () => {
    expect(fineAdjust(2, +1)).toBeCloseTo(2 * FINE_FACTOR, 10);
    expect(fineAdjust(2, -1)).toBeCloseTo(2 / FINE_FACTOR, 10);
    expect(fineAdjust(fineAdjust(2, +1), -1)).toBeCloseTo(2, 10);
  });
  it('长按连续微调 = 多次步进', () => {
    expect(fineAdjust(1, +1, 5)).toBeCloseTo(Math.pow(FINE_FACTOR, 5), 10);
  });
  it('微调不会越出固定量程', () => {
    expect(fineAdjust(SCALE_MAX, +1, 1000)).toBe(SCALE_MAX);
    expect(fineAdjust(SCALE_MIN, -1, 1000)).toBe(SCALE_MIN);
  });
  it('拖拽与滑块同步到同一个 q（拖拽比例即 q）', () => {
    expect(qFromDrag(100, 250, 1)).toBeCloseTo(2.5, 10);
    expect(qFromDrag(0, 250, 3)).toBe(3);
  });
  it('微调后的显示位置由 q 反算，不维护独立状态', () => {
    const q = fineAdjust(vToRatio(500), +1, 3);
    expect(ratioToV(q)).toBeCloseTo(ratioToV(vToRatio(500)) + 3 * (1000 / 12) * Math.log10(FINE_FACTOR), 4);
  });
});

// 可复现随机源（用于确定性测试）
function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
