// 成就系统（轻成就，GDD 7.4）：本地判定、只记录不加成，首批 ≤10 个，判定条件只增不改。
export const ACHIEVEMENTS = [
  { id: 'first_reveal', name: '初次揭晓', icon: '✨', desc: '完成第一道题', type: 'guide' },
  { id: 'first_perfect', name: '首个满分', icon: '🎯', desc: '任一题拿到 100 分', type: 'exp' },
  { id: 'perfect_run', name: '完美一局', icon: '🏆', desc: '视觉模式单局 500 分', type: 'challenge' },
  { id: 'streak_7', name: '连胜一周', icon: '🔥', desc: '每日一题连胜 ≥ 7 天', type: 'retain' },
  { id: 'survival_30', name: '生存 30 题', icon: '💀', desc: '生存模式单局答满 30 题', type: 'challenge' },
  { id: 'geo_all_green', name: '地理全绿', icon: '🌍', desc: '地理模式一局五题均 ≥ 90', type: 'challenge' },
  { id: 'fermi_30', name: '费米思想家', icon: '🧠', desc: '累计完成 30 道数量级题', type: 'milestone' },
  { id: 'all_modes', name: '五模式通行', icon: '🗝️', desc: '五种模式各完成至少一局', type: 'guide' },
  { id: 'streak_30', name: '坚持三十天', icon: '📅', desc: '每日一题连胜 ≥ 30 天', type: 'retain' },
  { id: 'daily_100', name: '每日满分', icon: '🌟', desc: '每日一题拿到 100 分', type: 'exp' },
];

export const ACH_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/**
 * 依据一次事件计算新解锁的成就（幂等：已解锁的不再返回）。
 * @param {object} state  { unlocked: {id: timestamp}, stats: {...} }
 * @param {object} event  { type, ...payload }
 * @returns {string[]} 新解锁的成就 id 列表
 */
export function evaluateAchievements(state, event) {
  const unlocked = state.unlocked || {};
  const stats = state.stats || {};
  const fresh = [];
  const has = (id) => Boolean(unlocked[id]);
  const unlock = (id) => {
    if (!has(id) && ACH_MAP[id]) fresh.push(id);
  };

  switch (event.type) {
    case 'round_end': {
      // payload: { mode, total, rounds, scores, perfectAny }
      unlock('first_reveal');
      if (event.perfectAny) unlock('first_perfect');
      if (event.mode === 'everyday' || event.mode === 'pop' || event.mode === 'geo') {
        if (event.total >= event.rounds * 100) unlock('perfect_run');
        if (event.mode === 'geo' && event.scores && event.scores.length === event.rounds && event.scores.every((s) => s >= 90)) unlock('geo_all_green');
      }
      break;
    }
    case 'daily_complete':
      unlock('first_reveal');
      if (event.score >= 100) unlock('daily_100');
      if ((event.streak || 0) >= 7) unlock('streak_7');
      if ((event.streak || 0) >= 30) unlock('streak_30');
      break;
    case 'survival_end':
      unlock('first_reveal');
      if ((event.answered || 0) >= 30) unlock('survival_30');
      break;
    case 'numeric_done':
      unlock('first_reveal');
      if ((stats.numericCompleted || 0) >= 30) unlock('fermi_30');
      break;
    case 'mode_seen': {
      const seen = new Set(stats.modesSeen || []);
      seen.add(event.mode);
      if ([...['everyday', 'pop', 'geo', 'daily', 'survival']].every((m) => seen.has(m))) unlock('all_modes');
      break;
    }
    default:
      break;
  }
  return fresh;
}

/** 事件 → 统计增量（纯函数，调用方负责落盘） */
export function reduceStats(stats, event) {
  const s = { ...stats };
  s.modesSeen = Array.from(new Set([...(s.modesSeen || []), event.mode || (event.type === 'round_end' ? event.mode : null)].filter(Boolean)));
  if (event.type === 'numeric_done') s.numericCompleted = (s.numericCompleted || 0) + 1;
  if (event.type === 'round_end') s.roundsPlayed = (s.roundsPlayed || 0) + 1;
  if (event.type === 'survival_end') s.bestSurvival = Math.max(s.bestSurvival || 0, event.answered || 0);
  return s;
}
