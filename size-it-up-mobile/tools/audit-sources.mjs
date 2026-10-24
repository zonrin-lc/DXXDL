// Source-provenance gate for released numeric questions.
// Draft entries may remain in the editorial pool, but must not be assigned to new
// daily schedules or included in the active fallback snapshot.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));
const numeric = Array.isArray(pack.numeric) ? pack.numeric : [];
const published = numeric.filter((q) => q.status === 'published' || q.status === undefined);
const drafts = numeric.filter((q) => q.status === 'draft');
const missingUrl = published.filter((q) => !/^https?:\/\//i.test(q.source?.url || ''));
const pendingPageReview = published.filter((q) => q.source?.reviewStatus === 'pending_source_page_review');
const unresolved = published.filter((q) => !['verified', 'derived', 'pending_source_page_review'].includes(q.source?.reviewStatus));
const genericSource = published.filter((q) => /内部整理|公开资料估算|待核验|来源待补/i.test(q.source?.name || ''));
const badUpcomingSchedule = Object.entries(pack.dailySchedule || {}).filter(([date, value]) => {
  if (date < new Date().toISOString().slice(0, 10)) return false;
  const q = numeric.find((entry) => entry.id === value?.questionId);
  return !q || (q.status !== 'published' && q.status !== undefined);
});

console.log(`Source provenance gate | pack v${pack.version}`);
console.log(`Published numeric questions: ${published.length}`);
console.log(`Draft numeric questions excluded from release: ${drafts.length}`);
console.log(`Published missing source.url: ${missingUrl.length}`);
console.log(`Published with source-page review pending: ${pendingPageReview.length}`);
console.log(`Published with missing/invalid reviewStatus: ${unresolved.length}`);
console.log(`Published generic source labels: ${genericSource.length}`);
console.log(`Future daily schedules pointing to non-published questions: ${badUpcomingSchedule.length}`);

for (const q of [...missingUrl, ...unresolved, ...genericSource]) {
  console.error(`  [${q.id}] ${q.q} — source: ${q.source?.name || 'missing'} / status: ${q.source?.reviewStatus || 'missing'}`);
}
for (const q of pendingPageReview) console.warn(`  SOURCE PAGE REVIEW PENDING [${q.id}] ${q.q} — URL mapped, but this is not a fact-check pass`);
for (const q of drafts) console.warn(`  EDITORIAL DRAFT [${q.id}] ${q.q} — excluded from new release pools`);
for (const [date, entry] of badUpcomingSchedule) console.error(`  SCHEDULE ERROR [${date}] ${entry?.questionId || 'missing questionId'}`);

if (missingUrl.length || unresolved.length || genericSource.length || badUpcomingSchedule.length) {
  console.error('❌ Published content is not source-complete; release gate failed.');
  process.exitCode = 1;
} else {
  console.log(pendingPageReview.length
    ? '⚠️ Source URL metadata is complete, but direct page-to-claim review remains open; do not treat this build as content approval.'
    : '✅ All published numeric questions have traceable URLs and explicit review status.');
}
