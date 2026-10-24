// Informational source-provenance audit for published numeric questions.
// This command deliberately does not fail the build yet: existing content has legacy
// entries without URLs. It reports the debt transparently rather than inventing sources.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'data', 'pools.json');
const pack = JSON.parse(readFileSync(file, 'utf8'));
const published = (pack.numeric || []).filter((q) => q.status === 'published' || q.status === undefined);
const missingUrl = published.filter((q) => !/^https?:\/\//i.test(q.source?.url || ''));
const genericSource = published.filter((q) => /内部整理|公开资料估算|公开.*资料.*估算/i.test(q.source?.name || ''));

console.log(`Source provenance audit | pack v${pack.version}`);
console.log(`Published numeric questions: ${published.length}`);
console.log(`Missing source.url: ${missingUrl.length}`);
console.log(`Generic/insufficiently specific source labels: ${genericSource.length}`);

if (missingUrl.length || genericSource.length) {
  console.warn('⚠️ 内容来源仍需人工补证；此报告不表示题目已事实核验，也暂不阻断构建。');
  for (const q of missingUrl) {
    const label = q.source?.name || 'no source label';
    console.warn(`  [${q.id}] ${q.q} — source: ${label}`);
  }
} else {
  console.log('✅ All published numeric questions have URL-based source metadata.');
}
