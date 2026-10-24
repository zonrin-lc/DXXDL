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
const published = numeric.filter((q) => q.status === 'published' || q.status === undefined);
const reviewPool = numeric.filter((q) => q.status === 'review');
const drafts = numeric.filter((q) => q.status === 'draft');
const missingUrl = published.filter((q) => !/^https?:\/\//i.test(q.source?.url || ''));
const pendingPageReview = published.filter((q) => q.source?.reviewStatus === 'pending_source_page_review');
const directlyReviewed = published.filter((q) => ['verified', 'derived'].includes(q.source?.reviewStatus)
  && typeof q.source?.reviewEvidence === 'string'
  && q.source.reviewEvidence.trim().length > 20);
const weakReviewEvidence = published.filter((q) => ['verified', 'derived'].includes(q.source?.reviewStatus)
  && !(typeof q.source?.reviewEvidence === 'string' && q.source.reviewEvidence.trim().length > 20));
const unresolved = published.filter((q) => !['verified', 'derived', 'pending_source_page_review'].includes(q.source?.reviewStatus));
const genericSource = published.filter((q) => /内部整理|公开资料估算|待核验|来源待补/i.test(q.source?.name || ''));
const badUpcomingSchedule = Object.entries(pack.dailySchedule || {}).filter(([date, value]) => {
  if (date < new Date().toISOString().slice(0, 10)) return false;
  const q = numeric.find((entry) => entry.id === value?.questionId);
  return !q || (q.status !== 'published' && q.status !== undefined);
});
const scheduledPendingReview = Object.entries(pack.dailySchedule || {}).filter(([date, value]) => {
  if (date < new Date().toISOString().slice(0, 10)) return false;
  const q = numeric.find((entry) => entry.id === value?.questionId);
  return q && (q.status === 'published' || q.status === undefined)
    && !['verified', 'derived'].includes(q.source?.reviewStatus);
});
const latestFallback = [...(pack.fallbackPools || [])]
  .filter((pool) => pool.effectiveFrom)
  .sort((a, b) => String(b.effectiveFrom).localeCompare(String(a.effectiveFrom)))[0];
const fallbackPendingReview = (latestFallback?.questionIds || []).filter((id) => {
  const q = numeric.find((entry) => entry.id === id);
  return !q || (q.status !== 'published' && q.status !== undefined)
    || !['verified', 'derived'].includes(q.source?.reviewStatus);
});

console.log(`Source provenance audit | pack v${pack.version} | mode=${strict ? 'STRICT RELEASE' : 'development'}`);
console.log(`Published numeric questions: ${published.length}`);
console.log(`Editorial review pool excluded from new runs: ${reviewPool.length}`);
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

for (const q of [...missingUrl, ...weakReviewEvidence, ...unresolved, ...genericSource]) {
  console.error(`  [${q.id}] ${q.q} — source: ${q.source?.name || 'missing'} / status: ${q.source?.reviewStatus || 'missing'}`);
}
for (const q of pendingPageReview) console.warn(`  SOURCE PAGE REVIEW PENDING [${q.id}] ${q.q} — candidate URL is not a fact-check pass`);
for (const q of reviewPool) console.warn(`  EDITORIAL REVIEW [${q.id}] ${q.q} — excluded from new release pools`);
for (const q of drafts) console.warn(`  EDITORIAL DRAFT [${q.id}] ${q.q} — excluded from new release pools`);
for (const [date, entry] of badUpcomingSchedule) console.error(`  SCHEDULE ERROR [${date}] ${entry?.questionId || 'missing questionId'}`);

const hardErrors = missingUrl.length || weakReviewEvidence.length || unresolved.length || genericSource.length || badUpcomingSchedule.length;
const strictErrors = strict && (pendingPageReview.length || scheduledPendingReview.length || fallbackPendingReview.length);
if (hardErrors || strictErrors) {
  console.error(strictErrors
    ? '❌ STRICT RELEASE BLOCKED: every active question, future daily schedule, and latest fallback entry needs evidence-backed verified/derived review.'
    : '❌ Published content metadata has unresolved structure errors.');
  process.exitCode = 1;
} else {
  console.log(pendingPageReview.length
    ? '⚠️ Metadata audit passed, but direct page-to-claim review remains open; do not treat this as content approval.'
    : '✅ All published numeric questions have evidence-backed source review.');
}
