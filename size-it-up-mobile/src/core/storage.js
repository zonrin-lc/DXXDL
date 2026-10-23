// StorageAdapter：本地持久化、降级与版本化迁移（GDD 9.1 / 9.3）
export const SAVE_VERSION = 2;

/** 创建安全存储：localStorage 不可用时降级为内存（降级需提示「本次记录不会持久保存」） */
export function createStorage(globalObj = globalThis) {
  try {
    const ls = globalObj.localStorage;
    const t = '__bsz_test';
    ls.setItem(t, '1');
    ls.removeItem(t);
    return {
      persistent: true,
      getItem: (k) => ls.getItem(k),
      setItem: (k, v) => ls.setItem(k, String(v)),
      removeItem: (k) => ls.removeItem(k),
      keys: () => {
        const out = [];
        for (let i = 0; i < ls.length; i++) out.push(ls.key(i));
        return out;
      },
    };
  } catch (e) {
    const mem = {};
    return {
      persistent: false,
      getItem: (k) => (k in mem ? mem[k] : null),
      setItem: (k, v) => {
        mem[k] = String(v);
      },
      removeItem: (k) => {
        delete mem[k];
      },
      keys: () => Object.keys(mem),
    };
  }
}

export function getJSON(store, key, fallback) {
  try {
    const raw = store.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

export function setJSON(store, key, val) {
  try {
    store.setItem(key, JSON.stringify(val));
    return true;
  } catch (e) {
    return false;
  }
}

/** 每日成绩记录：日期、questionId、题库版本、排期版本、答案口径与得分快照（GDD 4.1 第 6 条） */
export function dailyRecordKey(dateStr) {
  return 'bsz_daily_' + dateStr.replace(/-/g, '');
}

export function legacyDailyKeys(store) {
  return store
    .keys()
    .filter((k) => /^bsz_daily_\d{8}$/.test(k))
    .sort();
}

export function legacyDateFromKey(k) {
  const n = k.replace('bsz_daily_', '');
  return `${n.slice(0, 4)}-${n.slice(4, 6)}-${n.slice(6, 8)}`;
}

/**
 * 存档迁移（GDD 9.3 本版确定）：
 * 先备份旧数据，按版本顺序执行；可重复运行而不重复发奖或重复计数；
 * 迁移失败保留旧存档并记录可诊断错误，不得清空所有数据。
 */
export function migrateSave(store) {
  const ver = Number(store.getItem('bsz_save_version') || 0);
  if (ver >= SAVE_VERSION) return { ok: true, from: ver, to: ver, noop: true };

  const backup = {};
  try {
    store.keys().forEach((k) => {
      if (k.startsWith('bsz_')) backup[k] = store.getItem(k);
    });
    setJSON(store, 'bsz_backup_v' + ver, backup);

    if (ver < 2) {
      // v1→v2：旧连胜无断签检测，扫描每日完成记录重建可验证的最近完成日期
      const dates = legacyDailyKeys(store).map(legacyDateFromKey);
      const oldStreak = Number(store.getItem('bsz_daily_streak') || 0);
      const oldBest = Number(store.getItem('bsz_streak_best') || 0);
      const state = getJSON(store, 'bsz_streak', null) || {
        lastCompletedDate: null,
        currentStreak: oldStreak,
        bestStreak: oldBest,
      };
      if (!state.lastCompletedDate && dates.length) {
        state.lastCompletedDate = dates[dates.length - 1];
      }
      setJSON(store, 'bsz_streak', state);
    }

    store.setItem('bsz_save_version', String(SAVE_VERSION));
    return { ok: true, from: ver, to: SAVE_VERSION };
  } catch (e) {
    // 迁移失败：保留旧数据，记录错误，降级进入主页
    try {
      store.setItem('bsz_migration_error', String((e && e.message) || e));
    } catch (e2) {}
    return { ok: false, from: ver, to: SAVE_VERSION, error: String((e && e.message) || e) };
  }
}
