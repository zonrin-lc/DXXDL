// SurvivalEngine：生命、扣血回血与基于时间戳的计时（GDD 5.1 / 5.2 / 5.3）
import { SURVIVAL } from './constants.js';

/** 答错扣血：max(1, round(d))（GDD 5.2 现行实现） */
export function damageFor(d) {
  if (!isFinite(d)) return SURVIVAL.maxLife;
  if (d < SURVIVAL.healThreshold) return 0;
  return Math.max(1, Math.round(d));
}

/**
 * 应用一次答题结果。扣血与回血互斥，单题只发生其一。
 * @returns {{life:number, delta:number, type:'heal'|'damage'|'none'}}
 */
export function applyAnswer(life, d) {
  if (d < SURVIVAL.healThreshold) {
    const next = Math.min(SURVIVAL.maxLife, life + 1);
    return { life: next, delta: next - life, type: 'heal' };
  }
  const dmg = damageFor(d);
  const next = Math.max(0, life - dmg);
  return { life: next, delta: next - life, type: 'damage' };
}

/** 超时：直接扣 3 */
export function applyTimeout(life) {
  const next = Math.max(0, life - SURVIVAL.timeoutDamage);
  return { life: next, delta: next - life, type: 'timeout' };
}

/**
 * 基于 deadline 的剩余时间（GDD 5.3 待修复项的修复方向）。
 * 不依赖 setInterval 累减：后台节流后按时间戳重算，恢复即一致。
 */
export function makeTimer(durationMs, now = () => Date.now()) {
  let startAt = null;
  let deadline = null;
  return {
    start(offsetMs = 0) {
      startAt = now() - offsetMs;
      deadline = startAt + durationMs;
    },
    remainingMs() {
      if (deadline == null) return durationMs;
      return Math.max(0, deadline - now());
    },
    running() {
      return deadline != null && this.remainingMs() > 0;
    },
    stop() {
      const used = deadline == null ? 0 : durationMs - this.remainingMs();
      deadline = null;
      startAt = null;
      return used;
    },
    reset() {
      deadline = null;
      startAt = null;
    },
  };
}

/** 进度条颜色分档：绿 → 橙 → 红（GDD 5.1） */
export function timerColor(remainingMs, totalMs) {
  const r = remainingMs / totalMs;
  return r > 0.5 ? 'green' : r > 0.25 ? 'orange' : 'red';
}

/** 生存难度编排：按已答题数限制连续极难题（GDD 5.3 建议） */
export function pickSurvivalQuestion(pool, playedIds, rng = Math.random) {
  const fresh = pool.filter((q) => !playedIds.has(q.id || q.q));
  const source = fresh.length ? fresh : pool;
  return source[Math.floor(rng() * source.length)];
}
