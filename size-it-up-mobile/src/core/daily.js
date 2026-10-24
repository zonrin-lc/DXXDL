// DailyChallenge：日期键、不可变排期映射与版本化兜底（GDD 4.1 / 9.2 本版确定）
// 禁止用「当前可变题库数组长度取模」决定已发布日期的题目。

export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function prevDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  return dateKey(dt);
}

export function dayDiff(fromKey, toKey) {
  const parse = (k) => {
    const [y, m, d] = k.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((parse(toKey) - parse(fromKey)) / 86400000);
}

/**
 * 解析当日正式题目的 questionId。
 * 1) 优先 dailySchedule（date → {questionId, revision}），已发布日期不可变。
 * 2) 缺失时使用版本化、不可变的兜底快照 + 固定映射规则（日期数字 % 快照长度）。
 *    快照 questionIds 冻结，更新兜底池必须新建版本且只影响尚未发布日期。
 */
export function resolveDailyQuestionId(key, pack, opts = {}) {
  const schedule = pack && pack.dailySchedule;
  if (schedule && Object.prototype.hasOwnProperty.call(schedule, key)) {
    const entry = schedule[key];
    if (entry && entry.questionId) return { questionId: entry.questionId, source: 'schedule', revision: entry.revision || 1, scheduleVersion: pack.scheduleVersion || null };
  }
  const fb = pickFallback(pack, opts.fallbackVersion, key);
  if (fb && Array.isArray(fb.questionIds) && fb.questionIds.length) {
    const dayNum = Number(key.replace(/-/g, ''));
    const idx = dayNum % fb.questionIds.length;
    return { questionId: fb.questionIds[idx], source: 'fallback', fallbackVersion: fb.version, revision: 1, scheduleVersion: null };
  }
  return null;
}

function pickFallback(pack, forced, key) {
  if (!pack) return null;
  if (Array.isArray(pack.fallbackPools)) {
    if (forced) return pack.fallbackPools.find((p) => p.version === forced) || null;
    const pools = pack.fallbackPools;
    // Legacy packs retain their previous behavior. Once effectiveFrom is supplied,
    // select the newest snapshot effective on this date, not the newest snapshot today.
    if (pools.some((p) => p && p.effectiveFrom)) {
      const eligible = pools
        .map((p, index) => ({ p, index, effectiveFrom: p?.effectiveFrom || '0001-01-01' }))
        .filter((x) => x.p && x.effectiveFrom <= key)
        .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom) || a.index - b.index);
      return eligible.length ? eligible[eligible.length - 1].p : null;
    }
    return pools[pools.length - 1];
  }
  return pack.fallbackPool || null;
}

/** 按 id 取数量级题；同时兼容迁移期的旧数组结构 */
export function findNumericById(pack, id) {
  if (!pack || !Array.isArray(pack.numeric)) return null;
  return pack.numeric.find((q) => q.id === id) || null;
}

/**
 * 迁移期兼容：优先级为 dailySchedule > 旧 daily 整题覆盖 > 版本化兜底。
 * 新排期与旧 daily 不得双重选择：排期覆盖的日期一律以排期为准。
 */
export function resolveDailyQuestion(key, pack, opts = {}) {
  const r = resolveDailyQuestionId(key, pack, opts);
  const legacy = pack && pack.daily && pack.daily[key];

  if (r && r.source === 'schedule') {
    const q = findNumericById(pack, r.questionId);
    if (q) return { question: q, meta: r };
    // 排期指向的题不存在 → 结构不完整，调用方应回退内置题库并报告校验错误
    return { question: null, meta: { ...r, error: 'question_not_found' } };
  }

  // 旧格式兼容（迁移期）：排期未覆盖该日期时，运营旧覆盖仍生效
  if (legacy && legacy.q && legacy.a) {
    return { question: { ...legacy, answerType: 'point', id: `legacy_${key}` }, meta: { source: 'legacy_daily', revision: 1 } };
  }

  if (r && r.source === 'fallback') {
    const q = findNumericById(pack, r.questionId);
    if (q) return { question: q, meta: r };
    return { question: null, meta: { ...r, error: 'question_not_found' } };
  }
  return { question: null, meta: null };
}
