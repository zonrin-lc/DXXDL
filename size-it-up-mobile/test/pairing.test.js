import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mulberry32, deriveDifficulty, samplePairs, buildRandomQuestion } from '../src/core/pairing.js';
import { VISUAL_MAX_RATIO } from '../src/core/constants.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const objectsTable = JSON.parse(readFileSync(path.join(root, 'data', 'objects.json'), 'utf8'));
// 与运行时 objectPool 同口径：无素材对象以作用域键为身份
const OBJECTS = Object.entries(objectsTable.objects).map(([key, o]) => ({ ...o, assetId: o.assetId || key }));

function pairSpan(a, b) {
  return Math.max(a.size, b.size) / Math.min(a.size, b.size);
}

describe('mulberry32 种子化随机（GDD 6.10）', () => {
  it('同一种子产生同一序列', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });
  it('输出落在 [0,1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('deriveDifficulty 难度推导', () => {
  it('几乎一样大最难，明显差异入门，跨档中等', () => {
    expect(deriveDifficulty(1.0)).toBe(3);
    expect(deriveDifficulty(1.49)).toBe(3);
    expect(deriveDifficulty(1.5)).toBe(1);
    expect(deriveDifficulty(4)).toBe(1);
    expect(deriveDifficulty(4.01)).toBe(2);
    expect(deriveDifficulty(VISUAL_MAX_RATIO)).toBe(2);
  });
});

describe('samplePairs 随机抽对', () => {
  it('同一种子抽出同一局（可复现）', () => {
    const a = samplePairs(OBJECTS, 5, mulberry32(20261104)).map(([r, t]) => `${r.assetId}>${t.assetId}`);
    const b = samplePairs(OBJECTS, 5, mulberry32(20261104)).map(([r, t]) => `${r.assetId}>${t.assetId}`);
    expect(a).toEqual(b);
    expect(a).toHaveLength(5);
  });
  it('200 局内全部满足：带宽内、同方向组、同度量、无自配对', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const pairs = samplePairs(OBJECTS, 5, mulberry32(seed));
      expect(pairs).toHaveLength(5);
      const seen = new Set();
      const targets = new Set();
      for (const [ref, tgt] of pairs) {
        expect(ref.assetId).not.toBe(tgt.assetId);
        expect(ref.dimGroup).toBe(tgt.dimGroup);
        expect(ref.measure).toBe(tgt.measure);
        expect(pairSpan(ref, tgt)).toBeLessThanOrEqual(VISUAL_MAX_RATIO);
        const key = [ref.assetId, tgt.assetId].sort().join('|');
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        expect(targets.has(tgt.assetId)).toBe(false);
        targets.add(tgt.assetId);
      }
    }
  });
  it('候选不足时返回部分结果而不死循环', () => {
    const tiny = [
      { assetId: 'a', name: 'A', size: 1, measure: 'length', dim: '高度', dimGroup: 'v' },
      { assetId: 'b', name: 'B', size: 2, measure: 'length', dim: '高度', dimGroup: 'v' },
    ];
    const pairs = samplePairs(tiny, 5, mulberry32(1));
    expect(pairs.length).toBeLessThanOrEqual(1);
  });
  it('多度量对象表：同一 assetId 跨 measure 是不同对象，抽对不串度量', () => {
    const byId = OBJECTS.filter((o) => o.assetId === 'adult-human');
    expect(byId.length).toBeGreaterThanOrEqual(3); // length/weight/volume/speed 至少三处
    const sizes = new Set(byId.map((o) => `${o.measure}:${o.size}`));
    expect(sizes.size).toBe(byId.length);
    // 无素材对象以作用域键为身份且能成对（同 measure 内）
    const weightObjs = OBJECTS.filter((o) => o.measure === 'weight');
    const pairs = samplePairs(weightObjs, 3, mulberry32(99));
    expect(pairs.length).toBeGreaterThanOrEqual(1);
    for (const [ref, tgt] of pairs) {
      expect(ref.measure).toBe('weight');
      expect(tgt.measure).toBe('weight');
    }
  });
});

describe('buildRandomQuestion 题目组装', () => {
  const human = OBJECTS.find((o) => o.assetId === 'adult-human');
  const cat = OBJECTS.find((o) => o.assetId === 'house-cat');
  const sprout = OBJECTS.find((o) => o.assetId === 'sproutling');

  it('产出与精选池同构的题目（published、带宽内、难度已推导）', () => {
    const q = buildRandomQuestion(human, cat);
    expect(q.id).toBe('rv:length:adult-human>house-cat');
    expect(q.status).toBe('published');
    expect(q.reference.name).toBe(human.name);
    expect(q.target.size).toBe(cat.size);
    expect(q.measure).toBe('length');
    expect(q.difficulty).toBe(deriveDifficulty(pairSpan(human, cat)));
  });
  it('双方真实对象：来源合成 url=目标方、additionalUrls=参考方、状态取较弱', () => {
    const derived = OBJECTS.find((o) => o.source?.reviewStatus === 'derived' && o.dimGroup === 'v');
    const q = buildRandomQuestion(human, derived); // human 是 derived，合成必为 derived
    expect(q.source.type).toBeUndefined();
    expect(q.source.url).toBe(derived.source.url);
    expect(q.source.additionalUrls).toEqual([human.source.url]);
    expect(q.source.reviewStatus).toBe('derived');
    expect(q.source.reviewNote).toContain(human.name);
    expect(q.source.reviewNote).toContain(derived.name);
  });
  it('含原创角色：整题走 original + 设定文档锚点', () => {
    const q = buildRandomQuestion(sprout, human);
    expect(q.source.type).toBe('original');
    expect(q.source.doc).toContain('original-characters.md#sproutling');
    expect(q.source.reviewStatus).toBe('original_design');
    expect(q.source.additionalUrls).toEqual([human.source.url]);
  });
  it('双方都缺来源时省略 source（运行时题不进发布门禁）', () => {
    const bare = (id) => ({ assetId: id, name: id, size: 1, measure: 'length', dim: '高度', dimGroup: 'v' });
    const q = buildRandomQuestion(bare('x'), bare('y'));
    expect(q.source).toBeUndefined();
  });
});
