import { describe, it, expect } from 'vitest';
import { evaluateAchievements, ACH_MAP } from '../src/core/achievements.js';

const fresh = () => ({ unlocked: {}, stats: {} });

describe('成就判定（GDD 7.4）', () => {
  it('perfect_run 覆盖全部视觉模式（含度量衡新分类与随机遭遇）', () => {
    for (const mode of ['everyday', 'pop', 'geo', 'weight', 'area', 'volume', 'speed', 'random']) {
      const s = fresh();
      const got = evaluateAchievements(s, { type: 'round_end', mode, total: 500, rounds: 5, scores: [100, 100, 100, 100, 100], perfectAny: true });
      expect(got).toContain('perfect_run');
    }
    const s = fresh();
    const got = evaluateAchievements(s, { type: 'round_end', mode: 'everyday', total: 499, rounds: 5, scores: [100, 100, 100, 100, 99] });
    expect(got).not.toContain('perfect_run');
  });

  it('all_modes 要求全部 11 种模式（不再是旧五模式）', () => {
    const five = ['everyday', 'pop', 'geo', 'daily', 'survival'];
    const s = fresh();
    let got = [];
    for (const m of five) {
      s.stats.modesSeen = [...(s.stats.modesSeen || []), m];
      got = evaluateAchievements(s, { type: 'mode_seen', mode: m });
    }
    expect(got).not.toContain('all_modes');
    const all = ['everyday', 'pop', 'geo', 'weight', 'area', 'volume', 'speed', 'random', 'daily', 'survival', 'practice'];
    const s2 = fresh();
    let last = [];
    for (const m of all) {
      s2.stats.modesSeen = [...(s2.stats.modesSeen || []), m];
      last = evaluateAchievements(s2, { type: 'mode_seen', mode: m });
    }
    expect(last).toContain('all_modes');
    expect(ACH_MAP.all_modes.name).toBe('全模式通行');
  });

  it('成就幂等：已解锁的不再重复返回', () => {
    const s = fresh();
    s.unlocked.first_reveal = Date.now();
    const got = evaluateAchievements(s, { type: 'round_end', mode: 'geo', total: 0, rounds: 5, scores: [] });
    expect(got).not.toContain('first_reveal');
  });
});
