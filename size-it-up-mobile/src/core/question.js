// QuestionRepository 的纯逻辑部分：题库结构校验与每局编排（GDD 6.3 / 6.4 / 6.7）
import { SCALE_MIN, SCALE_MAX, VISUAL_MAX_RATIO } from './constants.js';

const STATUSES = ['draft', 'review', 'approved', 'published', 'retired'];
const REVIEW_STATUSES = ['verified', 'derived', 'pending_source_page_review', 'original_design'];

/** 已发布题的来源校验：真实对象需可追溯 URL；原创角色走 type='original' + 项目内设定文档 */
function checkSource(errors, p, q, { numeric }) {
  const src = q.source;
  if (!src || !src.name) errors.push({ path: p, msg: '已发布题必须有 source.name' });
  if (numeric ? !(src && Number.isInteger(src.year) && src.year >= 1) : !src?.year) {
    errors.push({ path: p, msg: `已发布${numeric ? '数量级' : ''}题必须有有效 source.year` });
  }
  if (src?.type === 'original') {
    if (typeof src.doc !== 'string' || !src.doc.includes('.md')) {
      errors.push({ path: p, msg: "original 来源必须有指向项目内设定文档的 source.doc（如 data/original-characters.md#xxx）" });
    }
    if (src.reviewStatus !== 'original_design') {
      errors.push({ path: p, msg: "original 来源的 reviewStatus 必须是 'original_design'" });
    }
  } else {
    if (!/^https?:\/\//i.test(src?.url || '')) errors.push({ path: p, msg: `已发布${numeric ? '数量级' : '视觉'}题必须有可追溯 source.url` });
    if (!['verified', 'derived', 'pending_source_page_review'].includes(src?.reviewStatus)) {
      errors.push({ path: p, msg: `已发布${numeric ? '数量级' : '视觉'}题必须显式记录 source.reviewStatus（${REVIEW_STATUSES.join('/')}）` });
    }
  }
}
const UNITS = ['次', '步', '吨', '棵', '杯', '千克', '词', '秒', '个', '只', '立方米', '件', '米', '条', '根', '千米', '小时', '分钟', '年', '度', '升'];

/** 静态校验：返回错误列表；空数组代表通过（校验不通过禁止发布，GDD 6.7） */
export function validatePack(pack) {
  const errors = [];
  if (!pack || typeof pack !== 'object') return [{ path: '$', msg: '数据包不是对象' }];
  if (!pack.version) errors.push({ path: 'version', msg: '缺少 version' });

  const ids = new Set();
  const dup = new Set();

  // everyday/pop/geo 为必需视觉池；weight 及后续度量衡分类为可选池（存在才校验，
  // 保证老版本缓存包仍能通过校验——热更新三级加载的向后兼容）
  const VISUAL_REQUIRED = ['everyday', 'pop', 'geo'];
  const VISUAL_OPTIONAL = ['weight'];
  for (const key of VISUAL_REQUIRED) {
    if (!Array.isArray(pack[key])) errors.push({ path: key, msg: '视觉题库必须是数组' });
  }
  for (const key of [...VISUAL_REQUIRED, ...VISUAL_OPTIONAL]) {
    const arr = pack[key];
    if (!Array.isArray(arr)) continue;
    arr.forEach((q, i) => {
      const p = `${key}[${i}]`;
      if (!q.id) errors.push({ path: p, msg: '缺少稳定 id' });
      else if (ids.has(q.id)) dup.add(q.id);
      else ids.add(q.id);
      if (!q.reference?.name || !q.target?.name) errors.push({ path: p, msg: '缺少 reference/target 名称' });
      if (!(q.reference?.size > 0) || !(q.target?.size > 0)) errors.push({ path: p, msg: '尺寸必须为正数' });
      else {
        const r = q.target.size / q.reference.size;
        if (r < SCALE_MIN || r > SCALE_MAX) errors.push({ path: p, msg: `真实比例 ${r} 超出固定量程 [1e-6,1e6]，不得发布（GDD 3.3）` });
        // 发布带宽（GDD 6.5）：保证缩放过程中双方大小差异肉眼可辨；
        // 超出带宽的对象应重新配对或转为数量级题，草稿/隔离题不受限
        if (q.status === 'published' || q.status === undefined) {
          const span = Math.max(q.reference.size, q.target.size) / Math.min(q.reference.size, q.target.size);
          if (span > VISUAL_MAX_RATIO) {
            errors.push({ path: p, msg: `真实比例跨度 ${span.toFixed(1)} 超出发布带宽 1:${VISUAL_MAX_RATIO}，须重新配对或转数量级题（GDD 6.5）` });
          }
        }
      }
      if (!q.dimension) errors.push({ path: p, msg: '缺少 dimension（比较维度）' });
      // 度量衡分类地基（P1 前瞻，GDD 6.5）：当前全部为 length；weight/area/volume/speed 渲染器落地前仅做枚举校验
      if (q.measure !== undefined && !['length', 'weight', 'area', 'volume', 'speed'].includes(q.measure)) {
        errors.push({ path: p, msg: `measure 必须是 length/weight/area/volume/speed: ${q.measure}` });
      }
      if (q.difficulty !== undefined && ![1, 2, 3].includes(q.difficulty)) errors.push({ path: p, msg: `difficulty 必须是 1/2/3: ${q.difficulty}` });
      if (q.memorable !== undefined && typeof q.memorable !== 'boolean') errors.push({ path: p, msg: 'memorable 必须是布尔值' });
      if (q.status && !STATUSES.includes(q.status)) errors.push({ path: p, msg: `非法 status: ${q.status}` });
      if (q.status === 'published' || q.status === undefined) {
        checkSource(errors, p, q, { numeric: false });
      }
      if (q.reference?.size && q.target?.size && !q.dimension) errors.push({ path: p, msg: '缺少 dimension' });
    });
  }

  const numArr = pack.numeric;
  if (!Array.isArray(numArr)) errors.push({ path: 'numeric', msg: '数量级题库必须是数组' });
  else {
    numArr.forEach((q, i) => {
      const p = `numeric[${i}]`;
      if (!q.id) errors.push({ path: p, msg: '缺少稳定 id' });
      else if (ids.has(q.id)) dup.add(q.id);
      else ids.add(q.id);
      if (!q.q) errors.push({ path: p, msg: '缺少问题文本' });
      if (q.u && !UNITS.includes(q.u)) errors.push({ path: p, msg: `单位不在合法集合: ${q.u}` });
      const type = q.answerType;
      if (type !== 'point' && type !== 'range') {
        errors.push({ path: p, msg: 'answerType 必须显式为 point 或 range（GDD 4.2）' });
      } else if (type === 'point') {
        if (!(q.a > 0) || !isFinite(q.a)) errors.push({ path: p, msg: 'point 题的 a 必须是有限正数' });
        if (q.answerRange) errors.push({ path: p, msg: 'point 题不得携带 answerRange（字段互斥）' });
      } else {
        const r = q.answerRange;
        if (!r || !(r.min > 0) || !(r.max > 0)) errors.push({ path: p, msg: 'range 题必须携带正数 answerRange' });
        else if (!(r.min <= r.max)) errors.push({ path: p, msg: 'answerRange.min 必须 ≤ max' });
        if (q.a !== undefined) errors.push({ path: p, msg: 'range 题不得携带 a（字段互斥）' });
      }
      if (q.status && !STATUSES.includes(q.status)) errors.push({ path: p, msg: `非法 status: ${q.status}` });
      if (q.status === 'published' || q.status === undefined) {
        checkSource(errors, p, q, { numeric: true });
        if (!q.u) errors.push({ path: p, msg: '已发布数量级题必须有明确单位 u' });
      }
    });
  }

  // 每日排期（GDD 6.4 数据契约）
  if (pack.dailySchedule) {
    const seenDates = new Set();
    for (const [date, entry] of Object.entries(pack.dailySchedule)) {
      const p = `dailySchedule.${date}`;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push({ path: p, msg: '日期必须为 YYYY-MM-DD' });
      if (seenDates.has(date)) errors.push({ path: p, msg: '日期重复' });
      seenDates.add(date);
      if (!entry || !entry.questionId) errors.push({ path: p, msg: '缺少 questionId' });
      else if (!ids.has(entry.questionId)) errors.push({ path: p, msg: `questionId 不存在: ${entry.questionId}` });
      if (entry && entry.revision !== undefined && !(Number.isInteger(entry.revision) && entry.revision > 0)) errors.push({ path: p, msg: 'revision 必须为正整数' });
    }
  }
  if (Array.isArray(pack.fallbackPools)) {
    const fallbackVersions = new Set();
    const datedFallbacks = pack.fallbackPools.some((fb) => fb && fb.effectiveFrom !== undefined);
    pack.fallbackPools.forEach((fb, i) => {
      const p = `fallbackPools[${i}]`;
      if (!fb.version) errors.push({ path: p, msg: '兜底快照缺少 version' });
      else if (fallbackVersions.has(fb.version)) errors.push({ path: p, msg: `兜底快照 version 重复: ${fb.version}` });
      else fallbackVersions.add(fb.version);
      if (datedFallbacks && fb.effectiveFrom === undefined) {
        errors.push({ path: `${p}.effectiveFrom`, msg: '版本化兜底快照必须声明 effectiveFrom，避免新增版本改写历史日期' });
      }
      if (fb.effectiveFrom !== undefined && !isValidDateKey(fb.effectiveFrom)) {
        errors.push({ path: `${p}.effectiveFrom`, msg: 'effectiveFrom 必须是有效的 YYYY-MM-DD 日期' });
      }
      if (!Array.isArray(fb.questionIds) || !fb.questionIds.length) errors.push({ path: p, msg: '兜底快照缺少 questionIds' });
      else fb.questionIds.forEach((id, j) => {
        if (!ids.has(id)) errors.push({ path: `${p}.questionIds[${j}]`, msg: `id 不存在: ${id}` });
      });
    });
  }

  dup.forEach((id) => errors.push({ path: 'id', msg: `重复 id: ${id}` }));
  return errors;
}

/** 题库版本与结构判断（热更新校验用，GDD 9.2） */
export function isPackApplicable(incoming, currentVersion) {
  if (!incoming || !incoming.version) return false;
  if (currentVersion && String(incoming.version) === String(currentVersion)) return false;
  return validatePack(incoming).length === 0;
}

/**
 * 每局 5 题节奏编排（GDD 6.3）：
 * 有难度标签时按 1→1/2→2→3→记忆点 分档抽样；无标签退回全池洗牌（同局不重复）。
 * 避免同局重复题、同对象近似重复题与连续相同知识点。
 */
export function arrangeRound(pool, rounds = 5, rng = Math.random) {
  const items = pool.slice();
  if (!items.length) return [];
  const hasDifficulty = items.some((q) => q.difficulty);
  const shuffled = shuffle(items, rng);
  if (!hasDifficulty || items.length < rounds) return shuffled.slice(0, rounds);

  // 目标难度节奏：简单、简单/中等、中等、困难、记忆点(=难度最高或 marked)
  const byDiff = (d) => shuffled.filter((q) => q.difficulty === d);
  const easy = byDiff(1), mid = byDiff(2), hard = byDiff(3);
  const picked = [];
  const used = new Set();
  const take = (arr) => {
    const c = arr.filter((q) => !used.has(q.id));
    if (!c.length) return null;
    const q = c[0];
    used.add(q.id);
    return q;
  };
  const plan = [
    take(easy),
    take(easy) || take(mid),
    take(mid) || take(hard.filter((q) => !q.memorable)),
    take(hard.filter((q) => !q.memorable)) || take(mid),
    pickMemorable(shuffled, used),
  ];
  plan.forEach((q) => q && picked.push(q));

  // 兜底：分档不足时从洗牌序列补足，保证同局不重复
  for (const q of shuffled) {
    if (picked.length >= rounds) break;
    if (!used.has(q.id)) {
      used.add(q.id);
      picked.push(q);
    }
  }
  // 防止相邻题同对象近似重复
  for (let i = 1; i < picked.length; i++) {
    if (picked[i].target?.name && picked[i].target.name === picked[i - 1].target?.name) {
      const swapIdx = picked.findIndex((q, j) => j > i && q.target?.name !== picked[i - 1].target?.name && !used.has('sw' + j));
      if (swapIdx > i) {
        const t = picked[i];
        picked[i] = picked[swapIdx];
        picked[swapIdx] = t;
      }
    }
  }
  return picked.slice(0, rounds);
}

function pickMemorable(shuffled, used) {
  const marked = shuffled.find((q) => q.memorable && !used.has(q.id));
  if (marked) {
    used.add(marked.id);
    return marked;
  }
  const hardest = shuffled.filter((q) => !used.has(q.id)).sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0))[0];
  if (hardest) used.add(hardest.id);
  return hardest;
}

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


function isValidDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
