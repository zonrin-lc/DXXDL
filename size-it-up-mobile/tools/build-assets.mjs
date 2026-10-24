#!/usr/bin/env node
/**
 * 题目插画素材流水线（GDD 6.6）
 * 输入：assets/raw/*.jpg|png —— AI 生成原图（洋红底、可能含 AI 水印）
 * 输出：assets/img/<assetId>.png + assets/manifest.json
 *
 * 处理步骤：
 *  1. 从四边洪泛填充抠出洋红背景（容忍背景渐变色差，物体边缘色彩跳变处停止）
 *  2. 前景做连通域分析，只保留最大连通域 —— 丢弃 "AI生成" 水印等孤立前景
 *  3. 按色度连续计算 alpha（半洋红像素部分透明，抑制 JPEG 洋红边带）
 *  4. 依据有效内容边界 bbox 裁剪，缩放至内容最长边 = CANVAS*0.9，居中贴到
 *     统一 CANVAS×CANVAS 透明画布（GDD 6.6 第 4 条：统一规范化画布）
 *  5. 登记 assetId / 许可 / 画布尺寸 / bounds / 提示词 → manifest.json
 */
import Jimp from 'jimp';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { basename, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RAW_DIR = join(ROOT, 'assets', 'raw');
const OUT_DIR = join(ROOT, 'assets', 'img');
const CANVAS = 512;
const FILL = 0.9; // 内容最长边占画布比例，其余为透明留白（登记在 bounds 中）

// 缩放轴覆盖（GDD 6.6）：题目尺寸沿该轴度量；未列出的素材默认取内容最长轴。
// 山体/自行车的题目按高度比较，但插画是横构图，必须显式指定 h。
const AXIS_OVERRIDES = { 'mount-tai': 'h', 'mount-everest': 'h', bicycle: 'h' };

/** 素材的度量轴：优先覆盖表，否则 bounds 较长的一边 */
function axisFor(id, bounds) {
  if (AXIS_OVERRIDES[id]) return AXIS_OVERRIDES[id];
  return bounds.w >= bounds.h ? 'w' : 'h';
}

/** 洋红底程度 0..1：r/b 高、g 低 → 背景 */
function magentaScore(r, g, b) {
  const s = (Math.min(r, b) - g - 25) / 90;
  return s < 0 ? 0 : s > 1 ? 1 : s;
}

/** 四边洪泛填充背景：种子=明显洋红，扩展=自身洋红 或 与已知背景色平滑相接 */
function floodBackground(data, w, h) {
  const bg = new Uint8Array(w * h);
  const score = new Uint8Array(w * h); // magentaScore*255
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    score[i] = Math.round(magentaScore(data[o], data[o + 1], data[o + 2]) * 255);
  }
  const stack = [];
  const push = (i) => {
    if (!bg[i] && score[i] >= 96) {
      bg[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % w;
    const y = (i / w) | 0;
    const o = i * 4;
    const r = data[o], g = data[o + 1], b = data[o + 2];
    const visit = (j) => {
      if (bg[j]) return;
      const jo = j * 4;
      const dr = Math.abs(data[jo] - r);
      const dg = Math.abs(data[jo + 1] - g);
      const db = Math.abs(data[jo + 2] - b);
      // 背景内部渐变：相邻像素色差小就继续蔓延；物体边缘处跳变大，停止
      if (score[j] >= 64 || (dr + dg + db < 72 && score[j] >= 24)) {
        bg[j] = 1;
        stack.push(j);
      }
    };
    if (x > 0) visit(i - 1);
    if (x < w - 1) visit(i + 1);
    if (y > 0) visit(i - w);
    if (y < h - 1) visit(i + w);
  }
  return { bg, score };
}

/** 前景最大连通域（4 邻接），返回 keep 掩码与 bbox */
function largestForeground(bg, w, h) {
  const label = new Int32Array(w * h).fill(-1);
  const keep = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  let best = null;
  let bestSize = 0;
  for (let s = 0; s < w * h; s++) {
    if (bg[s] || label[s] >= 0) continue;
    let sp = 0;
    stack[sp++] = s;
    label[s] = s;
    let size = 0;
    let minX = w, minY = h, maxX = 0, maxY = 0;
    while (sp) {
      const i = stack[--sp];
      size++;
      const x = i % w;
      const y = (i / w) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      const tryPush = (j) => {
        if (!bg[j] && label[j] < 0) {
          label[j] = s;
          stack[sp++] = j;
        }
      };
      if (x > 0) tryPush(i - 1);
      if (x < w - 1) tryPush(i + 1);
      if (y > 0) tryPush(i - w);
      if (y < h - 1) tryPush(i + w);
    }
    if (size > bestSize) {
      bestSize = size;
      best = { seed: s, minX, minY, maxX, maxY };
    }
  }
  if (!best) return null;
  // keep = 最大连通域；向外扩 3px，保留抗锯齿边缘
  for (let i = 0; i < w * h; i++) if (label[i] === best.seed) keep[i] = 1;
  const dil = new Uint8Array(keep);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (dil[i]) continue;
        const l = x > 0 && keep[i - 1];
        const r = x < w - 1 && keep[i + 1];
        const u = y > 0 && keep[i - w];
        const d = y < h - 1 && keep[i + w];
        if (l || r || u || d) dil[i] = 1;
      }
    }
    keep.set(dil);
  }
  return { keep, bbox: best, size: bestSize };
}

async function processOne(file) {
  const id = basename(file, extname(file));
  const rawPath = join(RAW_DIR, file);
  const img = await Jimp.read(rawPath);
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  const data = img.bitmap.data;

  const { bg, score } = floodBackground(data, w, h);
  const fg = largestForeground(bg, w, h);
  if (!fg) throw new Error(`${id}: 未找到前景主体`);
  const { keep, bbox } = fg;

  // alpha = (1-洋红度) × keep；水印等孤立前景 keep=0 → 透明
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (!keep[i]) {
      data[o + 3] = 0;
    } else {
      const soft = 1 - score[i] / 255;
      data[o + 3] = Math.max(0, Math.min(255, Math.round(255 * soft)));
    }
  }

  // 按有效边界裁剪
  const bw = bbox.maxX - bbox.minX + 1;
  const bh = bbox.maxY - bbox.minY + 1;
  const cropped = img.clone().crop(bbox.minX, bbox.minY, bw, bh);

  // 缩放：内容最长边 = CANVAS*FILL
  const scale = (CANVAS * FILL) / Math.max(bw, bh);
  const tw = Math.max(1, Math.round(bw * scale));
  const th = Math.max(1, Math.round(bh * scale));
  cropped.resize(tw, th);

  // 居中贴到统一透明画布
  const canvas = new Jimp(CANVAS, CANVAS, 0x00000000);
  canvas.composite(cropped, Math.round((CANVAS - tw) / 2), Math.round((CANVAS - th) / 2));

  // 在最终画布上重新计算可见 bounds（排除透明留白）
  const cb = visibleBounds(canvas.bitmap.data, CANVAS, CANVAS);
  const outPath = join(OUT_DIR, `${id}.png`);
  await canvas.writeAsync(outPath);

  const manifestPath = join(OUT_DIR, 'manifest.json');
  let manifest = {};
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch { /* 首次生成 */ }
  manifest[id] = {
    file: `assets/img/${id}.png`,
    canvas: { w: CANVAS, h: CANVAS },
    bounds: cb,
    axis: axisFor(id, cb),
    source: 'AI 生成（Trae text-to_image）',
    license: 'AI 生成素材，随游戏包分发',
    generatedAt: new Date().toISOString().slice(0, 10),
  };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`✓ ${id}: content ${bw}x${bh} → canvas ${tw}x${th}, bounds ${JSON.stringify(cb)}`);
}

function visibleBounds(rgba, w, h) {
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (rgba[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

const only = process.argv[2];
await mkdir(OUT_DIR, { recursive: true });
const files = (await readdir(RAW_DIR)).filter((f) => /\.(png|jpe?g)$/i.test(f) && (!only || f.includes(only)));
if (!files.length) {
  console.error('assets/raw 下没有待处理图片');
  process.exit(1);
}
for (const f of files) {
  await processOne(f);
}
console.log(`完成 ${files.length} 张 → ${OUT_DIR}`);
