// ScoringEngine：视觉与数量级计分（GDD 3.4 / 4.2）
// 计分与排序唯一依据对数误差；最终分数四舍五入到整数，误差内部不预先舍入。
import { VISUAL_FULL, VISUAL_SPAN, NUMERIC_FULL, NUMERIC_SPAN } from './constants.js';

/** 通用计分曲线：e≤full 满分；否则线性衰减，不低于 0，round 到整数 */
export function scoreFromError(err, full, span) {
  if (!isFinite(err)) return 0;
  if (err <= full) return 100;
  return Math.max(0, Math.round(100 * (1 - (err - full) / span)));
}

/** 视觉对数误差 e = |ln(q/q*)| */
export function visualError(q, qStar) {
  if (!(q > 0) || !(qStar > 0) || !isFinite(q) || !isFinite(qStar)) return Infinity;
  return Math.abs(Math.log(q / qStar));
}

export function visualScore(q, qStar) {
  return scoreFromError(visualError(q, qStar), VISUAL_FULL, VISUAL_SPAN);
}

/**
 * 数量级误差（GDD 4.2 本版确定）：
 *  - answerType "point"：d = |log10(x/a)|
 *  - answerType "range"：区间内 d=0；区间外取到最近有效区间边界的对数距离
 * 未显式声明 answerType 的旧题按 "point" 兼容读取（迁移期）。
 */
export function numericError(x, question) {
  if (!(x > 0) || !isFinite(x)) return Infinity;
  const type = question.answerType || 'point';
  if (type === 'range') {
    const { min, max } = question.answerRange || {};
    if (!(min > 0) || !(max > 0) || !(min <= max)) return Infinity;
    if (x >= min && x <= max) return 0;
    return x < min ? Math.log10(min / x) : Math.log10(x / max);
  }
  const a = question.a;
  if (!(a > 0) || !isFinite(a)) return Infinity;
  return Math.abs(Math.log10(x / a));
}

export function numericScore(x, question) {
  return scoreFromError(numericError(x, question), NUMERIC_FULL, NUMERIC_SPAN);
}

/** 数量级差（展示用）：满分区记 0，否则至少 1，四舍五入 */
export function ordersAway(d) {
  if (!isFinite(d)) return '∞';
  if (d < NUMERIC_FULL) return 0;
  return Math.max(1, Math.round(d));
}

/** 揭晓主表达：自然语言倍数关系（GDD 3.4 本版确定，唯一口径） */
export function ratioSentence(guess, actual) {
  const r = guess / actual;
  if (r >= 1) return `约 ${fmtMult(r)} 倍`;
  return `约 ${fmtMult(r)} 倍`;
}
function fmtMult(r) {
  if (r >= 100) return Math.round(r).toLocaleString('zh-CN');
  if (r >= 10) return r.toFixed(1);
  if (r >= 1) return r.toFixed(2);
  if (r >= 0.01) return r.toFixed(2);
  if (r >= 0.0001) return String(Number(r.toFixed(4))); // 自然语言倍数，避免揭晓页出现 1.2e-3
  return r.toExponential(1);
}

/** 次要数字：线性偏差，必须标注「与真实值相差」（GDD 3.4） */
export function linearDeviationPct(guess, actual) {
  if (!(actual > 0)) return 0;
  return Math.round(Math.abs(guess - actual) / actual * 100);
}
