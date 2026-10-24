import { describe, it, expect } from 'vitest';
import { applyDailyCompletion, migrateStreak, streakDisplay } from '../src/core/streak.js';
import { createStorage, migrateSave, SAVE_VERSION, dailyRecordKey, getJSON, legacyDailyKeys, legacyDateFromKey } from '../src/core/storage.js';

describe('连胜规则（GDD 4.1）', () => {
  it('同日重复进入：幂等，不重复计数', () => {
    const s1 = applyDailyCompletion({ lastCompletedDate: null, currentStreak: 0, bestStreak: 0 }, '2026-10-22');
    expect(s1.currentStreak).toBe(1);
    const s2 = applyDailyCompletion(s1, '2026-10-22');
    expect(s2.currentStreak).toBe(1);
    expect(s2.changed).toBe(false);
    const s3 = applyDailyCompletion(s2, '2026-10-22');
    expect(s3.currentStreak).toBe(1);
  });
  it('上次完成是昨天：本次 +1', () => {
    const s = applyDailyCompletion({ lastCompletedDate: '2026-10-21', currentStreak: 6, bestStreak: 6 }, '2026-10-22');
    expect(s.currentStreak).toBe(7);
    expect(s.bestStreak).toBe(7);
    expect(s.changed).toBe(true);
  });
  it('没有可验证的上次完成日期：从 1 开始', () => {
    expect(applyDailyCompletion({ currentStreak: 0 }, '2026-10-22').currentStreak).toBe(1);
    expect(applyDailyCompletion({ lastCompletedDate: null, currentStreak: 5 }, '2026-10-22').currentStreak).toBe(1);
  });
  it('系统日期回拨时不回滚已验证的完成记录，也不重新发放连胜', () => {
    const state = { lastCompletedDate: '2026-10-22', currentStreak: 5, bestStreak: 8 };
    expect(applyDailyCompletion(state, '2026-10-20')).toEqual({
      lastCompletedDate: '2026-10-22',
      currentStreak: 5,
      bestStreak: 8,
      changed: false,
    });
    expect(streakDisplay(state, '2026-10-20').display).toBe(0);
  });
  it('断签（上次早于昨天）：重置为 1', () => {
    const s = applyDailyCompletion({ lastCompletedDate: '2026-10-15', currentStreak: 20, bestStreak: 20 }, '2026-10-22');
    expect(s.currentStreak).toBe(1);
    expect(s.bestStreak).toBe(20); // 最佳纪录保留
  });
  it('连续 30 天逐日完成 → 30', () => {
    let state = { lastCompletedDate: null, currentStreak: 0, bestStreak: 0 };
    for (let i = 1; i <= 30; i++) {
      const d = new Date(2026, 8, 30 + i); // 2026-10-01 起跨月
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      state = applyDailyCompletion(state, key);
    }
    expect(state.currentStreak).toBe(30);
    expect(state.bestStreak).toBe(30);
  });
  it('展示层：昨天之后未完成则当前连胜显示 0', () => {
    expect(streakDisplay({ lastCompletedDate: '2026-10-22', currentStreak: 5 }, '2026-10-22').display).toBe(5);
    expect(streakDisplay({ lastCompletedDate: '2026-10-22', currentStreak: 5 }, '2026-10-23').display).toBe(5);
    expect(streakDisplay({ lastCompletedDate: '2026-10-20', currentStreak: 5 }, '2026-10-22').display).toBe(0);
    expect(streakDisplay({ lastCompletedDate: '2026-10-22', currentStreak: 5 }, '2026-10-22').todayDone).toBe(true);
  });
});

describe('旧存档迁移（GDD 4.1 / 9.3）', () => {
  it('扫描 bsz_daily_* 恢复可验证的最近完成日期', () => {
    const dates = ['2026-10-19', '2026-10-20', '2026-10-21'];
    const m = migrateStreak({ currentStreak: 3, bestStreak: 3 }, dates);
    expect(m.lastCompletedDate).toBe('2026-10-21');
    expect(m.migrated).toBe(true);
    expect(m.currentStreak).toBeLessThanOrEqual(3);
  });
  it('存档迁移使用最近连续段恢复当前连胜，不把历史最佳误当当前连胜', () => {
    const dates = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-10'];
    const m = migrateStreak({ currentStreak: 5, bestStreak: 5 }, dates);
    expect(m.lastCompletedDate).toBe('2026-10-10');
    expect(m.currentStreak).toBe(1);
    expect(m.bestStreak).toBe(5);
  });
  it('无法还原日期时：旧连胜仅作历史展示，不参与累加', () => {
    const m = migrateStreak({ currentStreak: 12, bestStreak: 12 }, []);
    expect(m.lastCompletedDate).toBeNull();
    expect(m.currentStreak).toBe(0);
    expect(m.legacyStreakDisplay).toBe(12);
    // 迁移后首次完成从 1 重建，而非 13
    expect(applyDailyCompletion(m, '2026-10-22').currentStreak).toBe(1);
  });
  it('迁移不重复计入当前日期', () => {
    const m = migrateStreak({ currentStreak: 2 }, ['2026-10-22']);
    const after = applyDailyCompletion(m, '2026-10-22');
    expect(after.currentStreak).toBeLessThanOrEqual(m.currentStreak || 1);
    expect(after.changed).toBe(false);
  });
});

describe('存档 schema 迁移（GDD 9.3）', () => {
  it('首启迁移 v1→v2：备份旧数据 + 重建 lastCompletedDate + 可重复运行', () => {
    const store = fakeStore();
    store.setItem('bsz_daily_streak', '5');
    store.setItem('bsz_daily_20261021', '88');
    store.setItem('bsz_daily_20261020', '60');

    const r1 = migrateSave(store);
    expect(r1.ok).toBe(true);
    expect(r1.to).toBe(SAVE_VERSION);
    const state = getJSON(store, 'bsz_streak', null);
    expect(state.lastCompletedDate).toBe('2026-10-21');

    // 可重复运行：不重复计数、不报错
    const r2 = migrateSave(store);
    expect(r2.noop).toBe(true);
    expect(getJSON(store, 'bsz_streak', null).lastCompletedDate).toBe('2026-10-21');
    // 备份存在
    expect(store.getItem('bsz_backup_v0')).toBeTruthy();
  });
  it('迁移失败保留旧存档并记录错误（不清空数据）', () => {
    const store = fakeStore();
    store.setItem('bsz_daily_streak', '9');
    store.setItem('bsz_daily_20261021', '77');
    store.failOnSet = (k) => k === 'bsz_save_version';
    const r = migrateSave(store);
    expect(r.ok).toBe(false);
    expect(store.getItem('bsz_daily_streak')).toBe('9'); // 旧数据保留
    expect(store.getItem('bsz_migration_error')).toBeTruthy();
  });
  it('localStorage 不可用时降级内存并标记 persistent=false', () => {
    const store = createStorage({ get localStorage() { throw new Error('blocked'); } });
    expect(store.persistent).toBe(false);
    store.setItem('a', '1');
    expect(store.getItem('a')).toBe('1');
  });
  it('每日记录键与旧键解析', () => {
    expect(dailyRecordKey('2026-10-22')).toBe('bsz_daily_20261022');
    expect(legacyDateFromKey('bsz_daily_20261022')).toBe('2026-10-22');
    const store = fakeStore();
    store.setItem('bsz_daily_20261021', '70');
    store.setItem('bsz_mute', '1');
    expect(legacyDailyKeys(store)).toEqual(['bsz_daily_20261021']);
  });
});

function fakeStore() {
  const mem = {};
  const api = {
    persistent: true,
    failOnSet: null,
    getItem: (k) => (k in mem ? mem[k] : null),
    setItem: (k, v) => {
      if (api.failOnSet && api.failOnSet(k)) throw new Error('disk full');
      mem[k] = String(v);
    },
    removeItem: (k) => {
      delete mem[k];
    },
    keys: () => Object.keys(mem),
  };
  return api;
}
