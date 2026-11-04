// 全局参数：所有阈值集中管理，供实现与单测共同引用（GDD 3.3 / 3.4 / 4.2 / 5.1 / 5.2）

// ---- 视觉比例固定全局对数量程（GDD 3.3 本版确定）----
// 量程、刻度、起点一律不得由真实答案 q* 推导（答案泄漏回归测试见 test/scale.test.js）
export const SCALE_MIN = 1e-6;
export const SCALE_MAX = 1e6;
// 发布带宽（GDD 6.5 新增）：已发布视觉题须满足 1/32 ≤ q* ≤ 32。
// 依据：竞技区 250px / 最小渲染 6px ≈ 41 为理论上限，32 预留余量，
// 保证双方尺寸差异在缩放过程中肉眼可辨（GDD 3.2 可读性目标）。
export const VISUAL_MAX_RATIO = 32;
export const SLIDER_STEPS = 1000;
export const START_V_MIN = 380;
export const START_V_MAX = 620;
export const FINE_FACTOR = 1.01; // ±1% 乘法微调步长（Shift / 长按连发用同基数的 10 倍）
export const COARSE_FACTOR = 1.1;

// ---- 计分曲线（GDD 3.4 / 4.2，含整数舍入）----
export const VISUAL_FULL = 0.06;   // 满分区间 e ≤ 0.06（约 ±6%）
export const VISUAL_SPAN = 1.54;   // e > 0.06 线性衰减，1.60 附近归零
export const NUMERIC_FULL = 0.10;  // 满分区间 d ≤ 0.10（约 ±26%，2026-11 由 0.06 放宽：开放式费米估算可达性）
export const NUMERIC_SPAN = 4.90;  // d ≥ 5 归零

// ---- 生存模式（GDD 5.1 / 5.2 初始参数，待试玩校准）----
export const SURVIVAL = {
  initLife: 10,
  maxLife: 10,
  timeSec: 15,
  timeoutDamage: 3,
  healThreshold: 0.10, // 极准回血：d < 0.10（与数量级满分区间一致）
};

// ---- 每日排期（GDD 4.1 / 6.4）----
export const SCHEDULE_FALLBACK_VERSION = 'fallback_v1';

// ---- 分享方块分档（GDD 7.2）----
export function squareFor(score) {
  return score >= 90 ? '🟩' : score >= 60 ? '🟨' : score >= 30 ? '🟧' : '🟥';
}
export function dotClassFor(score) {
  return score >= 90 ? 'done-90' : score >= 60 ? 'done-mid' : 'done-bad';
}
