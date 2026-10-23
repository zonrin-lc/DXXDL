// 连胜规则（GDD 4.1【本版确定，规则已收敛】）：
// 同日幂等 / 上次是昨天则 +1 / 断签重置为 1；只在正式每日题完成后更新。
import { prevDateKey, dayDiff } from './daily.js';

/**
 * @param {{lastCompletedDate?:string|null,currentStreak?:number,bestStreak?:number}} state
 * @param {string} today  YYYY-MM-DD
 * 完全纯函数：同日重复调用返回等价状态（幂等，不重复计数）。
 */
export function applyDailyCompletion(state, today) {
  const last = state.lastCompletedDate || null;
  const streak = Number.isFinite(state.currentStreak) ? state.currentStreak : 0;
  if (last === today) {
    return { lastCompletedDate: last, currentStreak: streak, bestStreak: Math.max(streak, state.bestStreak || 0), changed: false };
  }
  let next;
  if (last && dayDiff(last, today) === 1) next = streak + 1;
  else next = 1;
  return {
    lastCompletedDate: today,
    currentStreak: next,
    bestStreak: Math.max(next, state.bestStreak || 0),
    changed: true,
  };
}

/**
 * 存档迁移（GDD 4.1 / 9.3）：
 * 扫描 bsz_daily_YYYYMMDD 完成记录，恢复可验证的最近完成日期；
 * 无法还原日期时，旧连胜只作历史展示，不参与推算，下次完成从 1 重建。
 */
export function migrateStreak(stored, completedDateKeys) {
  const oldStreak = Number.isFinite(stored.currentStreak) ? stored.currentStreak : 0;
  const oldBest = Number.isFinite(stored.bestStreak) ? stored.bestStreak : 0;
  const dates = (completedDateKeys || []).filter(Boolean).sort();
  if (!dates.length) {
    return {
      lastCompletedDate: null,
      currentStreak: 0,
      bestStreak: oldBest,
      legacyStreakDisplay: oldStreak, // 仅历史展示，不参与累加
      migrated: true,
    };
  }
  const last = dates[dates.length - 1];
  // 已有可靠 lastCompletedDate 时以记录为准；当前连胜无法仅凭日期列表还原跨年断点，
  // 因此只有当旧值可被日期连续性佐证时才保留，否则下次完成时重建。
  const inferred = inferStreak(dates);
  const current = oldStreak > 0 && inferred > 0 ? Math.min(oldStreak, inferred) : 0;
  return { lastCompletedDate: last, currentStreak: current, bestStreak: Math.max(oldBest, inferred), legacyStreakDisplay: oldStreak, migrated: true };
}

function inferStreak(dates) {
  if (!dates.length) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dayDiff(dates[i - 1], dates[i]) === 1) cur++;
    else cur = 1;
    best = Math.max(best, cur);
  }
  return best;
}

/** 供主页展示：是否今天已完成、连胜天数 */
export function streakDisplay(state, today) {
  if (!state || !state.lastCompletedDate) return { todayDone: false, display: 0 };
  const todayDone = state.lastCompletedDate === today;
  // 昨天之后没完成过 → 当前连胜按规则已失效（显示 0，但存档值保留至下次完成重建）
  const alive = dayDiff(state.lastCompletedDate, today) <= 1;
  return { todayDone, display: alive ? state.currentStreak || 0 : 0 };
}

export { prevDateKey };
