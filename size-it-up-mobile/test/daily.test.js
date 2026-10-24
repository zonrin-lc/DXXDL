import { describe, it, expect } from 'vitest';
import { dateKey, prevDateKey, dayDiff, resolveDailyQuestionId, resolveDailyQuestion } from '../src/core/daily.js';

const pack = {
  version: '2.0.0',
  scheduleVersion: 'schedule_2026_q4_01',
  dailySchedule: {
    '2026-10-22': { questionId: 'numeric_001', revision: 1 },
    '2026-10-23': { questionId: 'numeric_007', revision: 2 },
  },
  fallbackPools: [
    { version: 'fallback_v1', questionIds: ['numeric_001', 'numeric_002', 'numeric_003'] },
    { version: 'fallback_v2', questionIds: ['numeric_001', 'numeric_004'] },
  ],
  numeric: [
    { id: 'numeric_001', answerType: 'point', q: '题一', a: 100, u: '个' },
    { id: 'numeric_004', answerType: 'point', q: '题四', a: 400, u: '个' },
  ],
  daily: { '2026-01-01': { q: '旧覆盖题', a: 5, u: '个', note: 'x' } },
};

describe('日期键与连续性', () => {
  it('dateKey / prevDateKey / dayDiff', () => {
    expect(dateKey(new Date(2026, 9, 22))).toBe('2026-10-22');
    expect(prevDateKey('2026-01-01')).toBe('2025-12-31');
    expect(prevDateKey('2026-03-01')).toBe('2026-02-28');
    expect(dayDiff('2026-10-21', '2026-10-22')).toBe(1);
    expect(dayDiff('2026-10-01', '2026-10-25')).toBe(24);
    expect(dayDiff('2026-10-22', '2026-10-21')).toBe(-1);
  });
});

describe('每日不可变排期（GDD 4.1 本版确定）', () => {
  it('已发布日期一律按排期取固定 questionId', () => {
    expect(resolveDailyQuestionId('2026-10-22', pack).questionId).toBe('numeric_001');
    expect(resolveDailyQuestionId('2026-10-23', pack).questionId).toBe('numeric_007');
    expect(resolveDailyQuestionId('2026-10-22', pack).source).toBe('schedule');
  });
  it('题库扩容/重排不改变已发布日期的题目（排期优先于任何数组长度）', () => {
    const grown = JSON.parse(JSON.stringify(pack));
    grown.numeric.push({ id: 'numeric_002', answerType: 'point', a: 2, u: '个', q: '新题' });
    grown.numeric.push({ id: 'numeric_003', answerType: 'point', a: 3, u: '个', q: '新题' });
    // 即使兜底池长度变化，排期日期仍取原题
    expect(resolveDailyQuestionId('2026-10-22', grown).questionId).toBe('numeric_001');
    expect(resolveDailyQuestionId('2026-10-22', grown).questionId).toBe(resolveDailyQuestionId('2026-10-22', pack).questionId);
  });
  it('未配置日期走版本化兜底快照 + 固定映射，结果与快照内容稳定对应', () => {
    const r1 = resolveDailyQuestionId('2026-11-05', pack);
    const r2 = resolveDailyQuestionId('2026-11-05', pack);
    expect(r1.questionId).toBe(r2.questionId);
    expect(r1.source).toBe('fallback');
    expect(r1.fallbackVersion).toBe('fallback_v2'); // 默认取最新版本化快照
  });
  it('兜底版本按 effectiveFrom 生效，未来新增版本不改写之前日期', () => {
    const versioned = {
      ...pack,
      fallbackPools: [
        { version: 'fallback_v1', effectiveFrom: '0001-01-01', questionIds: ['numeric_001', 'numeric_002', 'numeric_003'] },
        { version: 'fallback_v2', effectiveFrom: '2026-11-01', questionIds: ['numeric_004'] },
      ],
    };
    expect(resolveDailyQuestionId('2026-10-31', versioned).fallbackVersion).toBe('fallback_v1');
    expect(resolveDailyQuestionId('2026-11-05', versioned).fallbackVersion).toBe('fallback_v2');
    expect(resolveDailyQuestionId('2026-10-31', versioned).questionId).toBe('numeric_001');
  });
  it('更新兜底池（新版本）不影响已发布日期', () => {
    const r = resolveDailyQuestionId('2026-10-22', pack);
    expect(r.source).toBe('schedule');
  });
  it('可指定旧版本快照（回滚预案）', () => {
    const r = resolveDailyQuestionId('2026-11-05', pack, { fallbackVersion: 'fallback_v1' });
    expect(r.fallbackVersion).toBe('fallback_v1');
    const dayNum = 20261105;
    expect(r.questionId).toBe(pack.fallbackPools[0].questionIds[dayNum % 3]);
  });
  it('禁止对当前可变数组长度取模：无排期且无兜底 → 返回 null（不得静默取模）', () => {
    expect(resolveDailyQuestionId('2026-10-22', { numeric: pack.numeric, version: '1' })).toBeNull();
  });
  it('排期指向不存在的题 → 报错标记，不静默降级', () => {
    const broken = { ...pack, dailySchedule: { '2026-10-22': { questionId: 'missing_id', revision: 1 } } };
    const r = resolveDailyQuestion('2026-10-22', broken);
    expect(r.question).toBeNull();
    expect(r.meta.error).toBe('question_not_found');
  });
  it('迁移期旧 daily 覆盖格式仍可读取', () => {
    const r = resolveDailyQuestion('2026-01-01', { ...pack, dailySchedule: null });
    expect(r.question.q).toBe('旧覆盖题');
    expect(r.meta.source).toBe('legacy_daily');
  });
  it('新旧格式同时存在时以 dailySchedule 为准（不双重选择）', () => {
    const both = { ...pack, daily: { '2026-10-22': { q: '旧', a: 1, u: '个' } } };
    expect(resolveDailyQuestion('2026-10-22', both).meta.source).toBe('schedule');
  });
});
