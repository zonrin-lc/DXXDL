// ScaleEngine：固定全局对数映射、微调与刻度（GDD 3.3）
// 所有输入方式（滑块 / 微调按钮 / 键盘 / 拖拽）只允许操作同一个 q 值。
import { SCALE_MIN, SCALE_MAX, SLIDER_STEPS, FINE_FACTOR, START_V_MIN, START_V_MAX } from './constants.js';

/** 滑块逻辑位置 v(0..1000) → 估测比例 q */
export function vToRatio(v) {
  const vv = clampSteps(v);
  return SCALE_MIN * Math.pow(SCALE_MAX / SCALE_MIN, vv / SLIDER_STEPS);
}

/** 估测比例 q → 滑块逻辑位置 v(0..1000)（显示层反算，禁止独立状态） */
export function ratioToV(q) {
  if (!(q > 0) || !isFinite(q)) return SLIDER_STEPS / 2;
  const r = Math.log10(q / SCALE_MIN) / Math.log10(SCALE_MAX / SCALE_MIN);
  return clampSteps(r * SLIDER_STEPS);
}

export function clampQ(q) {
  if (!(q > 0) || !isFinite(q)) return SCALE_MIN;
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, q));
}

export function clampSteps(v) {
  if (!isFinite(v)) return SLIDER_STEPS / 2;
  return Math.min(SLIDER_STEPS, Math.max(0, v));
}

/** 乘法微调：每次 ×1.01 或 ×1/1.01（GDD 3.2 第 3 条），返回钳制后的 q */
export function fineAdjust(q, dir, steps = 1) {
  const f = Math.pow(FINE_FACTOR, steps);
  return clampQ(dir >= 0 ? q * f : q / f);
}

/** 默认随机起点：v 在 380–620 均匀随机；不得由 q* 或答案相关字段推导 */
export function randomStartV(rng = Math.random) {
  return Math.floor(START_V_MIN + rng() * (START_V_MAX - START_V_MIN + 1));
}

/** 固定数量级刻度：所有题目共用，刻度不随答案变化（GDD 3.3） */
export function tickMarks() {
  const out = [];
  for (let e = -6; e <= 6; e++) {
    const q = Math.pow(10, e);
    out.push({ exp: e, q, v: ratioToV(q) });
  }
  return out;
}

/**
 * 拖拽缩放 → q：把拖拽得到的显示尺寸比例直接折算为目标 q。
 * refPx/tgtPx 为两物体当前显示像素高度；返回钳制后的 q。
 * 拖拽与滑块必须双向同步到同一个 q（GDD 3.3 实现注意）。
 */
export function qFromDrag(refPx, tgtPx, prevQ) {
  if (!(refPx > 0) || !(tgtPx > 0)) return clampQ(prevQ);
  return clampQ(tgtPx / refPx);
}
