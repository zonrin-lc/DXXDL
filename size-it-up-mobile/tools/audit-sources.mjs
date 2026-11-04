// Source-provenance gate for numeric questions in the editorial/release pool.
// The normal audit reports candidate URLs and pending page review explicitly.
// Passing `npm run verify` is an engineering check, not editorial approval.
// Use `npm run audit:sources:release` to fail closed until all release questions are verified.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const strict = process.argv.includes('--strict');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));
const numeric = Array.isArray(pack.numeric) ? pack.numeric : [];

// ---------- 视觉三池（everyday/pop/geo）来源证据门槛 ----------
// 与数量级题同口径：published 必须有可追溯 url、证据文本与 verified/derived 结论；
// 无可靠来源的题转 review 隔离，不得带着"公开资料估算/原创设定"这类泛化标签发布。
// 例外（GDD 6.5）：原创角色题走 source.type='original'——免外部 URL，
// 但必须有 source.doc（项目内设定文档锚点）且 reviewStatus='original_design'。
const isOriginal = (q) => q.source?.type === 'original';
const originalOk = (q) => typeof q.source?.doc === 'string' && q.source.doc.includes('.md')
  && q.source?.reviewStatus === 'original_design'
  && typeof q.source?.reviewNote === 'string' && q.source.reviewNote.trim().length > 10;
const VISUAL_POOLS = ['everyday', 'pop', 'geo', 'weight', 'area', 'volume', 'speed'];
const visualAll = VISUAL_POOLS.flatMap((key) => (Array.isArray(pack[key]) ? pack[key] : []));
const visualPublished = visualAll.filter((q) => q.status === 'published' || q.status === undefined);
const visualReviewPool = visualAll.filter((q) => ['review', 'needs-review', 'draft'].includes(q.status));
const visualMissingUrl = visualPublished.filter((q) => !isOriginal(q) && !/^https?:\/\//i.test(q.source?.url || ''));
const visualBadOriginal = visualPublished.filter((q) => isOriginal(q) && !originalOk(q));
const visualPendingPageReview = visualPublished.filter((q) => q.source?.reviewStatus === 'pending_source_page_review');
const visualDirectlyReviewed = visualPublished.filter((q) => (['verified', 'derived'].includes(q.source?.reviewStatus)
  && typeof q.source?.reviewEvidence === 'string'
  && q.source.reviewEvidence.trim().length > 20) || (isOriginal(q) && originalOk(q)));
const visualWeakEvidence = visualPublished.filter((q) => ['verified', 'derived'].includes(q.source?.reviewStatus)
  && !(typeof q.source?.reviewEvidence === 'string' && q.source.reviewEvidence.trim().length > 20));
const visualUnresolved = visualPublished.filter((q) => isOriginal(q)
  ? false
  : !['verified', 'derived', 'pending_source_page_review'].includes(q.source?.reviewStatus));
const visualGenericSource = visualPublished.filter((q) => !isOriginal(q) && /内部整理|公开资料估算|原创设定|待核验|来源待补/i.test(q.source?.name || ''));
const visualBadPool = VISUAL_POOLS.filter((key) => !Array.isArray(pack[key]));

const published = numeric.filter((q) => q.status === 'published' || q.status === undefined);
const reviewPool = numeric.filter((q) => ['review', 'needs-review'].includes(q.status));
const drafts = numeric.filter((q) => q.status === 'draft');
const missingUrl = published.filter((q) => !isOriginal(q) && !/^https?:\/\//i.test(q.source?.url || ''));
const badOriginal = published.filter((q) => isOriginal(q) && !originalOk(q));
const pendingPageReview = published.filter((q) => q.source?.reviewStatus === 'pending_source_page_review');
const directlyReviewed = published.filter((q) => (['verified', 'derived'].includes(q.source?.reviewStatus)
  && typeof q.source?.reviewEvidence === 'string'
  && q.source.reviewEvidence.trim().length > 20) || (isOriginal(q) && originalOk(q)));
const weakReviewEvidence = published.filter((q) => ['verified', 'derived'].includes(q.source?.reviewStatus)
  && !(typeof q.source?.reviewEvidence === 'string' && q.source.reviewEvidence.trim().length > 20));
const unresolved = published.filter((q) => isOriginal(q)
  ? false
  : !['verified', 'derived', 'pending_source_page_review'].includes(q.source?.reviewStatus));
const genericSource = published.filter((q) => !isOriginal(q) && /内部整理|公开资料估算|待核验|来源待补/i.test(q.source?.name || ''));
const badUpcomingSchedule = Object.entries(pack.dailySchedule || {}).filter(([date, value]) => {
  if (date < new Date().toISOString().slice(0, 10)) return false;
  const q = numeric.find((entry) => entry.id === value?.questionId);
  return !q || (q.status !== 'published' && q.status !== undefined);
});
const scheduledPendingReview = Object.entries(pack.dailySchedule || {}).filter(([date, value]) => {
  if (date < new Date().toISOString().slice(0, 10)) return false;
  const q = numeric.find((entry) => entry.id === value?.questionId);
  return q && (q.status === 'published' || q.status === undefined)
    && !['verified', 'derived', 'original_design'].includes(q.source?.reviewStatus);
});
const latestFallback = [...(pack.fallbackPools || [])]
  .filter((pool) => pool.effectiveFrom)
  .sort((a, b) => String(b.effectiveFrom).localeCompare(String(a.effectiveFrom)))[0];
const fallbackPendingReview = (latestFallback?.questionIds || []).filter((id) => {
  const q = numeric.find((entry) => entry.id === id);
  return !q || (q.status !== 'published' && q.status !== undefined)
    || !['verified', 'derived', 'original_design'].includes(q.source?.reviewStatus);
});

console.log(`Source provenance audit | pack v${pack.version} | mode=${strict ? 'STRICT RELEASE' : 'development'}`);
console.log(`Published numeric questions: ${published.length}`);
console.log(`Editorial review/needs-review pool excluded from new runs: ${reviewPool.length}`);
console.log(`Draft numeric questions excluded from release: ${drafts.length}`);
console.log(`Published missing source.url: ${missingUrl.length}`);
console.log(`Published with source-page review pending: ${pendingPageReview.length}`);
console.log(`Published with evidence-backed verified/derived status: ${directlyReviewed.length}`);
console.log(`Published with verified/derived status but missing evidence text: ${weakReviewEvidence.length}`);
console.log(`Published with missing/invalid reviewStatus: ${unresolved.length}`);
console.log(`Published generic source labels: ${genericSource.length}`);
console.log(`Future schedules pointing at non-published questions: ${badUpcomingSchedule.length}`);
console.log(`Future schedules using questions not directly verified: ${scheduledPendingReview.length}`);
console.log(`Latest fallback snapshot: ${latestFallback?.version || 'none'}; unresolved entries: ${fallbackPendingReview.length}`);
console.log(`Published visual questions (everyday/pop/geo/weight/area): ${visualPublished.length}`);
console.log(`Visual excluded by review/draft status: ${visualReviewPool.length}`);
console.log(`Visual missing source.url: ${visualMissingUrl.length}`);
console.log(`Original-design questions with bad doc/status: ${badOriginal.length + visualBadOriginal.length}`);
console.log(`Visual with evidence-backed verified/derived/original status: ${visualDirectlyReviewed.length}`);
console.log(`Visual with verified/derived status but missing evidence text: ${visualWeakEvidence.length}`);
console.log(`Visual with missing/invalid reviewStatus: ${visualUnresolved.length}`);
console.log(`Visual generic source labels: ${visualGenericSource.length}`);
console.log(`Visual with source-page review pending: ${visualPendingPageReview.length}`);

for (const q of [...missingUrl, ...weakReviewEvidence, ...unresolved, ...genericSource, ...badOriginal]) {
  console.error(`  [${q.id}] ${q.q} — source: ${q.source?.name || 'missing'} / status: ${q.source?.reviewStatus || 'missing'}`);
}
for (const q of [...visualMissingUrl, ...visualWeakEvidence, ...visualUnresolved, ...visualGenericSource, ...visualBadOriginal]) {
  console.error(`  [${q.id}] ${q.reference?.name || '?'} vs ${q.target?.name || '?'} — source: ${q.source?.name || 'missing'} / status: ${q.source?.reviewStatus || 'missing'}`);
}
for (const q of pendingPageReview) console.warn(`  SOURCE PAGE REVIEW PENDING [${q.id}] ${q.q} — candidate URL is not a fact-check pass`);
for (const q of visualPendingPageReview) console.warn(`  VISUAL SOURCE PAGE REVIEW PENDING [${q.id}] — candidate URL is not a fact-check pass`);
for (const q of reviewPool) console.warn(`  EDITORIAL REVIEW [${q.id}] ${q.q} — status=${q.status}; excluded from new release pools`);
for (const q of visualReviewPool) console.warn(`  VISUAL EDITORIAL REVIEW [${q.id}] ${q.reference?.name || '?'} vs ${q.target?.name || '?'} — status=${q.status}; excluded from active pools`);
for (const q of drafts) console.warn(`  EDITORIAL DRAFT [${q.id}] ${q.q} — excluded from new release pools`);
for (const [date, entry] of badUpcomingSchedule) console.error(`  SCHEDULE ERROR [${date}] ${entry?.questionId || 'missing questionId'}`);

const visualStructureErrors = visualMissingUrl.length || visualWeakEvidence.length
  || visualUnresolved.length || visualGenericSource.length || visualBadPool.length || visualBadOriginal.length;
const hardErrors = missingUrl.length || weakReviewEvidence.length || unresolved.length
  || genericSource.length || badUpcomingSchedule.length || visualStructureErrors || badOriginal.length;
const strictErrors = strict && (pendingPageReview.length || scheduledPendingReview.length
  || fallbackPendingReview.length || visualPendingPageReview.length);
if (hardErrors || strictErrors) {
  console.error(strictErrors
    ? '❌ STRICT RELEASE BLOCKED: every active question, future daily schedule, and latest fallback entry needs evidence-backed verified/derived review.'
    : '❌ Published content metadata has unresolved structure errors.');
  process.exitCode = 1;
} else {
  console.log(pendingPageReview.length || visualPendingPageReview.length
    ? '⚠️ Metadata audit passed, but direct page-to-claim review remains open; do not treat this as content approval.'
    : '✅ All published numeric and visual questions have evidence-backed source review.');
}
