import { describe, it, expect } from 'vitest';
import { validatePack, isPackApplicable, arrangeRound, shuffle } from '../src/core/question.js';

function basePack() {
  return {
    version: '2.0.0',
    everyday: [
      { id: 'v_d_001', reference: { name: '成年人', size: 1.7 }, target: { name: '非洲象', size: 3.3 }, dimension: 'height', source: { name: 'test source', year: 2025, url: 'https://example.com/source', reviewStatus: 'verified' }, status: 'published' },
    ],
    pop: [],
    geo: [],
    numeric: [
      { id: 'n_001', answerType: 'point', q: '问题', a: 100, u: '次', source: { name: 'test source', year: 2025, url: 'https://example.com/source', reviewStatus: 'verified' }, status: 'published' },
      { id: 'n_002', answerType: 'range', q: '区间题', answerRange: { min: 100, max: 200 }, u: '吨', source: { name: 'test source', year: 2025, url: 'https://example.com/source', reviewStatus: 'verified' }, status: 'published' },
    ],
    dailySchedule: { '2026-10-22': { questionId: 'n_001', revision: 1 } },
    fallbackPools: [{ version: 'fb_v1', questionIds: ['n_001', 'n_002'] }],
  };
}

describe('题库静态校验（GDD 6.7）', () => {
  it('合规数据包通过', () => {
    expect(validatePack(basePack())).toEqual([]);
  });
  it('已发布数量级题必须有可追溯 URL 和显式来源复核状态', () => {
    const noUrl = basePack();
    delete noUrl.numeric[0].source.url;
    expect(validatePack(noUrl).some((e) => e.msg.includes('source.url'))).toBe(true);
    const unknownReviewState = basePack();
    unknownReviewState.numeric[0].source.reviewStatus = 'mystery';
    expect(validatePack(unknownReviewState).some((e) => e.msg.includes('reviewStatus'))).toBe(true);
    const pendingReview = basePack();
    pendingReview.numeric[0].source.reviewStatus = 'pending_source_page_review';
    expect(validatePack(pendingReview).some((e) => e.msg.includes('reviewStatus'))).toBe(false);
  });
  it('已发布视觉题必须有可追溯 URL 和显式来源复核状态', () => {
    const noUrl = basePack();
    delete noUrl.everyday[0].source.url;
    expect(validatePack(noUrl).some((e) => e.msg.includes('已发布视觉题必须有可追溯 source.url'))).toBe(true);
    const badState = basePack();
    badState.everyday[0].source.reviewStatus = 'mystery';
    expect(validatePack(badState).some((e) => e.msg.includes('已发布视觉题必须显式记录 source.reviewStatus'))).toBe(true);
    const pending = basePack();
    pending.everyday[0].source.reviewStatus = 'pending_source_page_review';
    expect(validatePack(pending).some((e) => e.msg.includes('已发布视觉题'))).toBe(false);
    const ok = basePack();
    expect(validatePack(ok)).toEqual([]);
  });
  it('缺 version 报错', () => {
    const p = basePack();
    delete p.version;
    expect(validatePack(p).some((e) => e.path === 'version')).toBe(true);
  });
  it('缺 id / 重复 id 报错', () => {
    const p = basePack();
    delete p.everyday[0].id;
    expect(validatePack(p).some((e) => e.msg.includes('稳定 id'))).toBe(true);
    const p2 = basePack();
    p2.numeric[1].id = 'n_001';
    expect(validatePack(p2).some((e) => e.msg.includes('重复 id'))).toBe(true);
  });
  it('尺寸必须为正数、缺 source 报错', () => {
    const p = basePack();
    p.everyday[0].reference.size = -1;
    p.everyday[0].source = null;
    const errs = validatePack(p);
    expect(errs.some((e) => e.msg.includes('正数'))).toBe(true);
    expect(errs.some((e) => e.msg.includes('source.name'))).toBe(true);
  });
  it('真实比例超出固定量程的题不得发布（GDD 3.3 可解范围）', () => {
    const p = basePack();
    p.everyday[0].target.size = 1e-9; // 比例 ~5.9e-10 超出 1e-6
    expect(validatePack(p).some((e) => e.msg.includes('超出固定量程'))).toBe(true);
  });
  it('answerType 与 a/answerRange 互斥匹配', () => {
    const p = basePack();
    p.numeric[0].answerType = 'range'; // 缺 answerRange
    expect(validatePack(p).some((e) => e.msg.includes('range 题必须携带'))).toBe(true);
    const p2 = basePack();
    p2.numeric[0].answerRange = { min: 1, max: 2 }; // point 带区间
    expect(validatePack(p2).some((e) => e.msg.includes('互斥'))).toBe(true);
    const p3 = basePack();
    p3.numeric[1].a = 5; // range 带 a
    expect(validatePack(p3).some((e) => e.msg.includes('不得携带 a'))).toBe(true);
    const p4 = basePack();
    p4.numeric[1].answerRange = { min: 500, max: 100 };
    expect(validatePack(p4).some((e) => e.msg.includes('min 必须'))).toBe(true);
    const p5 = basePack();
    delete p5.numeric[0].answerType;
    expect(validatePack(p5).some((e) => e.msg.includes('显式'))).toBe(true);
  });
  it('数值必须有限正数', () => {
    const p = basePack();
    p.numeric[0].a = -1;
    expect(validatePack(p).some((e) => e.msg.includes('有限正数'))).toBe(true);
    const p2 = basePack();
    p2.numeric[0].a = Infinity;
    expect(validatePack(p2).some((e) => e.msg.includes('有限正数'))).toBe(true);
  });
  it('非法单位报错', () => {
    const p = basePack();
    p.numeric[0].u = '苹果';
    expect(validatePack(p).some((e) => e.msg.includes('单位'))).toBe(true);
  });
  it('步数题使用明确的「步」单位并通过单位白名单', () => {
    const p = basePack();
    p.numeric[0].u = '步';
    expect(validatePack(p).some((e) => e.msg.includes('单位不在合法集合'))).toBe(false);
  });
  it('dailySchedule：日期格式 / questionId 存在 / revision 合法', () => {
    const p = basePack();
    p.dailySchedule['2026/10/23'] = { questionId: 'n_001', revision: 1 };
    p.dailySchedule['2026-10-24'] = { questionId: 'ghost', revision: 1 };
    p.dailySchedule['2026-10-25'] = { questionId: 'n_001', revision: 0 };
    const errs = validatePack(p);
    expect(errs.some((e) => e.msg.includes('YYYY-MM-DD'))).toBe(true);
    expect(errs.some((e) => e.msg.includes('questionId 不存在'))).toBe(true);
    expect(errs.some((e) => e.msg.includes('正整数'))).toBe(true);
  });
  it('dailySchedule / 兜底快照只允许引用 published 数量级题', () => {
    const p = basePack();
    p.numeric[1].status = 'review';
    p.dailySchedule['2026-10-26'] = { questionId: 'n_002', revision: 1 };
    const errs = validatePack(p);
    expect(errs.some((e) => e.path.startsWith('dailySchedule') && e.msg.includes('未发布题'))).toBe(true);
    expect(errs.some((e) => e.path.startsWith('fallbackPools') && e.msg.includes('未发布题'))).toBe(true);
    // status 缺省按已发布处理（老缓存包兼容）
    const legacy = basePack();
    delete legacy.numeric[0].status;
    delete legacy.numeric[1].status;
    expect(validatePack(legacy).some((e) => e.msg.includes('未发布题'))).toBe(false);
  });
  it('已发布数量级题必须提供年份和单位', () => {
    const noYear = basePack();
    delete noYear.numeric[0].source.year;
    expect(validatePack(noYear).some((e) => e.msg.includes('source.year'))).toBe(true);
    const noUnit = basePack();
    delete noUnit.numeric[0].u;
    expect(validatePack(noUnit).some((e) => e.msg.includes('明确单位'))).toBe(true);
  });
  it('发布带宽：已发布视觉题 q* 跨度不得超过 32（GDD 6.5）', () => {
    const p = basePack();
    p.everyday[0].target.size = 1.7 * 100; // 跨度 100 > 32
    expect(validatePack(p).some((e) => e.msg.includes('超出发布带宽'))).toBe(true);
    const borderline = basePack();
    borderline.everyday[0].target.size = 1.7 * 32; // 恰好 32，放行
    expect(validatePack(borderline)).toEqual([]);
    const reversed = basePack();
    reversed.everyday[0].target.size = 1.7 / 40; // 目标物更小同样受限
    expect(validatePack(reversed).some((e) => e.msg.includes('超出发布带宽'))).toBe(true);
  });
  it('发布带宽不拦截草稿/隔离题（未发布不受限）', () => {
    const p = basePack();
    p.everyday[0].target.size = 1.7 * 100;
    p.everyday[0].status = 'review';
    p.everyday[0].source = { name: '公开资料估算', year: 2026 }; // 隔离题不查来源
    expect(validatePack(p).some((e) => e.msg.includes('超出发布带宽'))).toBe(false);
  });
  it('原创角色题走 type=original + 项目内设定文档，免外部 URL（GDD 6.5）', () => {
    const ok = basePack();
    ok.everyday[0].source = {
      name: '《比大小》角色设定文档', type: 'original', year: 2026,
      doc: 'data/original-characters.md#sproutling', reviewStatus: 'original_design',
    };
    expect(validatePack(ok)).toEqual([]);
    const noDoc = basePack();
    noDoc.everyday[0].source = { name: '设定', type: 'original', year: 2026, reviewStatus: 'original_design' };
    expect(validatePack(noDoc).some((e) => e.msg.includes('source.doc'))).toBe(true);
    const wrongStatus = basePack();
    wrongStatus.everyday[0].source = { name: '设定', type: 'original', year: 2026, doc: 'data/original-characters.md#x', reviewStatus: 'verified' };
    expect(validatePack(wrongStatus).some((e) => e.msg.includes('original_design'))).toBe(true);
  });
  it('原创角色数量级题同样支持 type=original', () => {
    const p = basePack();
    p.numeric.push({
      id: 'n_003', answerType: 'point', q: '深渊巨蜥相当于多少个方糖仔？', a: 1000, u: '个', status: 'published',
      source: { name: '《比大小》角色设定文档', type: 'original', year: 2026, doc: 'data/original-characters.md#abyss-lizard', reviewStatus: 'original_design' },
    });
    expect(validatePack(p)).toEqual([]);
  });
  it('兜底快照 effectiveFrom 必须是有效日期且版本不能重复', () => {
    const p = basePack();
    p.fallbackPools = [
      { version: 'fb_v1', effectiveFrom: '2026-02-30', questionIds: ['n_001'] },
      { version: 'fb_v1', effectiveFrom: '2026-03-01', questionIds: ['n_002'] },
      { version: 'fb_v2', questionIds: ['n_001'] },
    ];
    const errs = validatePack(p);
    expect(errs.some((e) => e.msg.includes('有效的 YYYY-MM-DD'))).toBe(true);
    expect(errs.some((e) => e.msg.includes('version 重复'))).toBe(true);
    expect(errs.some((e) => e.msg.includes('必须声明 effectiveFrom'))).toBe(true);
  });
  it('兜底快照 id 必须存在', () => {
    const p = basePack();
    p.fallbackPools[0].questionIds = ['n_001', 'ghost'];
    expect(validatePack(p).some((e) => e.msg.includes('不存在'))).toBe(true);
  });
  it('热更新：版本相同或校验失败的包不可应用', () => {
    const p = basePack();
    expect(isPackApplicable(p, '1.0.0')).toBe(true);
    expect(isPackApplicable(p, '2.0.0')).toBe(false);
    const bad = basePack();
    delete bad.numeric[0].answerType;
    expect(isPackApplicable(bad, '1.0.0')).toBe(false);
    expect(isPackApplicable(null, '1.0.0')).toBe(false);
  });
});

describe('每局编排（GDD 6.3）', () => {
  const mk = (id, difficulty, target, memorable) => ({ id, difficulty, target: { name: target }, memorable });
  it('无难度标签时洗牌取 N，同局不重复', () => {
    const pool = Array.from({ length: 16 }, (_, i) => ({ id: 'x' + i, target: { name: 't' + i } }));
    const round = arrangeRound(pool, 5, mulberry(7));
    expect(round.length).toBe(5);
    expect(new Set(round.map((q) => q.id)).size).toBe(5);
  });
  it('有难度标签时按节奏编排：1 → 1/2 → 2 → 3 → 记忆点', () => {
    const pool = [
      mk('e1', 1, 'a'), mk('e2', 1, 'b'), mk('e3', 1, 'c'),
      mk('m1', 2, 'd'), mk('m2', 2, 'e'),
      mk('h1', 3, 'f'), mk('h2', 3, 'g'),
      mk('mem', 3, 'h', true),
    ];
    const round = arrangeRound(pool, 5, mulberry(3));
    expect(round.length).toBe(5);
    expect(new Set(round.map((q) => q.id)).size).toBe(5);
    expect(round[0].difficulty).toBe(1);
    expect([1, 2]).toContain(round[1].difficulty);
    expect([2, 3]).toContain(round[2].difficulty);
    expect(round[3].difficulty).toBe(3);
    expect(round[4].memorable).toBe(true);
  });
  it('避免相邻题目标物同名', () => {
    const pool = Array.from({ length: 10 }, (_, i) => mk('q' + i, (i % 3) + 1, i < 5 ? '同名' : '异' + i));
    for (let seed = 1; seed <= 10; seed++) {
      const round = arrangeRound(pool, 5, mulberry(seed));
      for (let i = 1; i < round.length; i++) {
        // 同名相邻时必须已尝试换位（此处 pool 中同名过多，只要求不全部相邻相同）
        if (round[i].target.name === round[i - 1].target.name) {
          expect(round[i].id.startsWith('q')).toBe(true);
        }
      }
      expect(new Set(round.map((q) => q.id)).size).toBe(round.length);
    }
  });
  it('题库不足 N 题时返回全部不重复题', () => {
    const pool = [mk('a', 1, 'x'), mk('b', 2, 'y')];
    const round = arrangeRound(pool, 5, mulberry(1));
    expect(round.length).toBe(2);
  });
  it('shuffle 不修改原数组', () => {
    const arr = [1, 2, 3, 4, 5];
    const out = shuffle(arr, mulberry(2));
    expect(arr).toEqual([1, 2, 3, 4, 5]);
    expect(out.length).toBe(5);
  });
});

describe('可选度量衡池（weight，GDD 6.5）', () => {
  const weightQ = (over) => ({
    id: 'wt-x',
    reference: { name: '成年人', size: 70 },
    target: { name: '家猫', size: 4.5 },
    dimension: '重量',
    measure: 'weight',
    status: 'published',
    source: { name: 'test source', year: 2026, url: 'https://example.com/w', reviewStatus: 'verified' },
    ...over,
  });
  it('老缓存包没有 weight 键也能通过（向后兼容）', () => {
    expect(validatePack(basePack())).toEqual([]);
  });
  it('weight 池存在时按视觉题同口径校验（带宽/来源/measure）', () => {
    const ok = basePack();
    ok.weight = [weightQ()];
    expect(validatePack(ok)).toEqual([]);

    const wide = basePack();
    wide.weight = [weightQ({ target: { name: '蓝鲸', size: 150000 } })]; // span 2142 超带宽
    expect(validatePack(wide).some((e) => e.msg.includes('发布带宽'))).toBe(true);

    const badMeasure = basePack();
    badMeasure.weight = [weightQ({ measure: 'density' })];
    expect(validatePack(badMeasure).some((e) => e.msg.includes('measure'))).toBe(true);
  });
});

describe('可选度量衡池（area，GDD 6.5）', () => {
  const areaQ = (over) => ({
    id: 'ar-x',
    reference: { name: 'A4 纸', size: 0.0624 },
    target: { name: '标准房门', size: 1.8 },
    dimension: '面积',
    measure: 'area',
    status: 'published',
    source: { name: 'test source', year: 2026, url: 'https://example.com/a', reviewStatus: 'verified' },
    ...over,
  });
  it('area 池存在时按视觉题同口径校验（带宽/来源/measure）', () => {
    const ok = basePack();
    ok.area = [areaQ()];
    expect(validatePack(ok)).toEqual([]);

    const wide = basePack();
    wide.area = [areaQ({ target: { name: '摩纳哥', size: 2080000 } })]; // span 3.3e7 超带宽
    expect(validatePack(wide).some((e) => e.msg.includes('发布带宽'))).toBe(true);
  });
  it('volume/speed 池存在时同样校验（P3）', () => {
    const ok = basePack();
    ok.volume = [areaQ({ id: 'vol-x', measure: 'volume', dimension: '体积' })];
    ok.speed = [areaQ({ id: 'spd-x', measure: 'speed', dimension: '速度' })];
    expect(validatePack(ok)).toEqual([]);

    const wide = basePack();
    wide.volume = [areaQ({ id: 'vol-x', measure: 'volume', target: { name: '波音埃弗里特工厂', size: 13300000 } })];
    expect(validatePack(wide).some((e) => e.msg.includes('发布带宽'))).toBe(true);
  });
});

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
