import { describe, it, expect } from 'vitest';
import { visualScore, visualError, numericScore, numericError, scoreFromError, ordersAway, linearDeviationPct, ratioSentence } from '../src/core/scoring.js';

// GDD 12.2 标准计分测试向量（视觉）
describe('视觉计分 · 标准向量', () => {
  const vec = [
    { r: 1, e: 0, score: 100 },
    { r: 1.05, e: Math.log(1.05), score: 100 },
    { r: 2, e: Math.log(2), score: 59 },
    { r: 0.5, e: Math.log(2), score: 59 },
    { r: 5, e: Math.log(5), score: 0 },
  ];
  for (const v of vec) {
    it(`q/q*=${v.r} → e≈${v.e.toFixed(5)} → ${v.score} 分`, () => {
      expect(visualError(v.r, 1)).toBeCloseTo(v.e, 5);
      expect(visualScore(v.r, 1)).toBe(v.score);
    });
  }
});

// GDD 12.2 标准向量（数量级 point，a=1,000,000）
describe('数量级计分 · 单点标准向量', () => {
  const q = { answerType: 'point', a: 1e6 };
  const vec = [
    { x: 1e6, d: 0, score: 100 },
    { x: 1.1e6, d: Math.log10(1.1), score: 100 },
    { x: 1e7, d: 1, score: 81 },
    { x: 1e11, d: 5, score: 0 },
  ];
  for (const v of vec) {
    it(`x=${v.x} → d≈${v.d.toFixed(5)} → ${v.score} 分`, () => {
      expect(numericError(v.x, q)).toBeCloseTo(v.d, 5);
      expect(numericScore(v.x, q)).toBe(v.score);
    });
  }
});

// GDD 12.2 区间答案
describe('数量级计分 · 区间答案', () => {
  const q = { answerType: 'range', answerRange: { min: 1e6, max: 1.5e6 } };
  it('区间内部得 100', () => {
    expect(numericError(1.2e6, q)).toBe(0);
    expect(numericScore(1.2e6, q)).toBe(100);
  });
  it('恰好等于上下边界得 100', () => {
    expect(numericScore(1e6, q)).toBe(100);
    expect(numericScore(1.5e6, q)).toBe(100);
  });
  it('略低于下界 / 略高于上界按到最近边界计算', () => {
    expect(numericError(9e5, q)).toBeCloseTo(Math.log10(1e6 / 9e5), 6);
    expect(numericError(1.6e6, q)).toBeCloseTo(Math.log10(1.6e6 / 1.5e6), 6);
  });
  it('距最近边界正好 1 个数量级 → 81 分', () => {
    expect(numericError(1e5, q)).toBeCloseTo(1, 6);
    expect(numericScore(1e5, q)).toBe(81);
    expect(numericError(1.5e7, q)).toBeCloseTo(1, 6);
    expect(numericScore(1.5e7, q)).toBe(81);
  });
  it('d ≥ 5 归零', () => {
    expect(numericScore(1, q)).toBe(0);
    expect(numericScore(1e12, q)).toBe(0);
  });
});

describe('计分边界与非法输入', () => {
  it('满分阈值边界（e/d 恰为 0.06 得 100，略超开始衰减）', () => {
    expect(scoreFromError(0.06, 0.06, 1.54)).toBe(100);
    expect(scoreFromError(0.07, 0.06, 1.54)).toBe(99); // 超阈值后开始衰减
    expect(scoreFromError(0.061, 0.06, 4.94)).toBe(100); // 整数舍入下的紧邻边界
    expect(scoreFromError(0.1, 0.06, 4.94)).toBe(99);
  });
  it('零分阈值边界（视觉 e=1.60 → 0；数值 d=5 → 0）', () => {
    expect(visualScore(Math.exp(1.6), 1)).toBe(0);
    expect(numericScore(1e5, { answerType: 'point', a: 1e10 })).toBe(0);
  });
  it('非法输入（0 / 负 / NaN / Infinity）不产生分数异常', () => {
    expect(visualScore(0, 1)).toBe(0);
    expect(visualScore(-1, 1)).toBe(0);
    expect(visualScore(NaN, 1)).toBe(0);
    expect(visualScore(Infinity, 1)).toBe(0);
    expect(numericScore(0, { answerType: 'point', a: 1 })).toBe(0);
    expect(numericScore(-5, { answerType: 'point', a: 1 })).toBe(0);
    expect(numericScore(NaN, { answerType: 'point', a: 1 })).toBe(0);
    expect(numericScore(Infinity, { answerType: 'range', answerRange: { min: 1, max: 2 } })).toBe(0);
  });
  it('非法区间 schema 不放行（min>max 等）', () => {
    expect(numericScore(1, { answerType: 'range', answerRange: { min: 5, max: 1 } })).toBe(0);
    expect(numericScore(1, { answerType: 'range' })).toBe(0);
  });
  it('误差内部不预先舍入（分数由未舍入误差计算）', () => {
    const d = Math.log10(1e7 / 1e6); // 恰为 1
    expect(numericScore(1e7, { answerType: 'point', a: 1e6 })).toBe(Math.round(100 * (1 - (d - 0.06) / 4.94)));
  });
  it('四舍五入到整数', () => {
    expect(Number.isInteger(visualScore(1.3, 1))).toBe(true);
    expect(Number.isInteger(numericScore(3e6, { answerType: 'point', a: 1e6 }))).toBe(true);
  });
});

describe('揭晓偏差展示口径（GDD 3.4）', () => {
  it('倍数关系主表达基于 q/q*', () => {
    expect(ratioSentence(2.1, 1)).toContain('2.1');
    expect(ratioSentence(0.4, 1)).toContain('0.4');
  });
  it('小倍数用自然语言，不出现 e-notation（GDD 3.4）', () => {
    expect(ratioSentence(1, 500)).toBe('约 0.002 倍');
    expect(ratioSentence(1, 500)).not.toMatch(/e-/i);
    expect(ratioSentence(1.2e-3, 1)).not.toMatch(/e-/i);
  });
  it('线性偏差为次要数字，与对数误差分离', () => {
    expect(linearDeviationPct(2, 1)).toBe(100);
    expect(linearDeviationPct(1, 1)).toBe(0);
  });
  it('数量级差展示：满分区为 0，否则至少 1', () => {
    expect(ordersAway(0.03)).toBe(0);
    expect(ordersAway(1)).toBe(1);
    expect(ordersAway(2.4)).toBe(2);
    expect(ordersAway(Infinity)).toBe('∞');
  });
});
