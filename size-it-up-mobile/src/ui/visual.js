// 视觉比例模式（GDD 3.x）：固定量程、同源输入（滑块/微调/键盘/拖拽只操作同一个 q）、揭晓口径统一。
import { SLIDER_STEPS, COARSE_FACTOR } from '../core/constants.js';
import {
  vToRatio, ratioToV, clampQ, fineAdjust, randomStartV, tickMarks,
} from '../core/scale.js';
import { visualError, visualScore, ratioSentence, linearDeviationPct } from '../core/scoring.js';
import { fmtSize, fmtRatio } from '../core/format.js';
import { dotClassFor } from '../core/constants.js';
import { SFX, feedbackForScore } from './audio.js';
import { rollCount, confetti, showHint } from './effects.js';

const $ = (id) => document.getElementById(id);

// 插画素材表：构建时由 build.mjs 以 window.__BSZ_ASSET_MANIFEST__ 注入（GDD 6.6）
const MANIFEST = (typeof window !== 'undefined' && window.__BSZ_ASSET_MANIFEST__) || {};

// 舞台渲染参数：以参考物 120px 为基准，目标高度按 q 缩放并整体回缩到舞台内。
const BASE_REF_PX = 120;
const ARENA_PX = 250;   // 舞台最大可用高度/盒边
const MIN_PX = 6;       // 物体最小可辨高度
const DRAG_PX_PER_DOUBLE = 120; // 拖拽灵敏度：每 120px 使比例翻倍
const ARENA_GAP = 34;   // 两物间距（与 CSS .arena gap 一致）
const ARENA_PAD = 16;   // 舞台两侧安全边距

let ctx = null;
let session = null;   // { mode, questions, idx, scores, locked }
let q = 1;            // 当前估测比例（唯一状态源）
let truth = null;     // 当前题 { ref, tgt, qStar }
let repeatTimer = null;
let useArt = false;   // 本题是否两物都有插画（否则整题 emoji）
let artRef = null;    // 参考物/目标物的插画条目（用于落地对齐换算）
let artTgt = null;
let kRef = 1;         // 画布边长 / 内容度量轴长（含透明留白的换算系数）
let kTgt = 1;

/** 查插画条目；题目两物都有 assetId 且素材存在才启用（GDD 6.6） */
function artFor(side) {
  const id = side && side.assetId;
  return id && MANIFEST[id] ? MANIFEST[id] : null;
}

function setArt(el, entry) {
  el.innerHTML = `<img src="${entry.file}" alt="" draggable="false">`;
}

/** 题目 dimension → 素材度量轴：同一素材在不同题目里可能按不同维度比较（如小轿车 长度/高度），轴随题目走 */
const DIM_AXIS = { '高度': 'h', '身高': 'h', '长度': 'w', '宽度': 'w', '直径': 'w' };

/** 画布边长 / 内容度量轴长：内容轴 = px 时整个画布盒子边长 = px * k */
function kOf(entry, dim) {
  const b = entry.bounds;
  const axis = DIM_AXIS[dim] || entry.axis || (b.w >= b.h ? 'w' : 'h');
  return entry.canvas.w / (axis === 'w' ? b.w : b.h);
}

export function initVisual(context) {
  ctx = context;
  bindSlider();
  bindFine();
  bindKeyboard();
  bindDrag();
  $('v-lock').addEventListener('click', lockAnswer);
  $('v-next').addEventListener('click', nextRound);
  $('v-report').addEventListener('click', copyReport);
}

/** 开始一局视觉模式：questions 为 5 题（已排好序） */
export function startVisual(mode, questions) {
  session = { mode, questions, idx: 0, scores: [], locked: false };
  loadRound();
}

function loadRound() {
  const item = session.questions[session.idx];
  truth = { ref: item.ref, tgt: item.tgt, qStar: item.tgt.s / item.ref.s };

  $('v-ref-label').textContent = item.ref.n;
  $('v-ref-size').textContent = fmtSize(item.ref.s);
  $('v-tgt-label').textContent = item.tgt.n;
  const refArt = artFor(item.ref);
  const tgtArt = artFor(item.tgt);
  useArt = !!(refArt && tgtArt);
  artRef = useArt ? refArt : null;
  artTgt = useArt ? tgtArt : null;
  if (useArt) {
    kRef = kOf(refArt, item.dimension);
    kTgt = kOf(tgtArt, item.dimension);
    setArt($('v-ref-emoji'), refArt);
    setArt($('v-tgt-emoji'), tgtArt);
  } else {
    kRef = 1;
    kTgt = 1;
    $('v-ref-emoji').textContent = item.ref.e || '🧍';
    $('v-tgt-emoji').textContent = item.tgt.e || '❓';
  }
  $('v-note').textContent = item.note ? '💡 ' + item.note : '';

  $('v-round').textContent = `第 ${session.idx + 1} / ${session.questions.length} 题`;
  $('v-total').textContent = `总分 ${session.scores.reduce((a, b) => a + b, 0)}`;
  renderDots();

  $('v-reveal').classList.add('hidden');
  $('v-lock').disabled = false;
  $('v-lock').classList.remove('hidden');
  setControlsEnabled(true);

  session.locked = false;
  q = vToRatio(randomStartV());
  render();

  renderTicks();
  showHint(
    'v-hint',
    '拖动滑块或直接上下拖拽目标物来调整比例；差一点时用 ±1% 微调更稳。',
    'visual_tip_v1',
    ctx.store
  );
}

function renderDots() {
  const box = $('v-dots');
  box.innerHTML = '';
  session.questions.forEach((_, i) => {
    const d = document.createElement('span');
    d.className = 'dot';
    if (i < session.scores.length) d.classList.add(dotClassFor(session.scores[i]));
    if (i === session.idx && !session.locked) d.classList.add('on');
    box.appendChild(d);
  });
}

/** 布局：内容轴按 (refPx, tgtPx) 渲染进舞台；插画画布盒（含透明留白）按 k 换算，横竖都收进舞台 */
function layout(ratio) {
  const small = Math.min(1, ratio);
  // 插画模式下盒子边 = 内容轴 × k，竖向和横向都要装得下
  let z = Math.min(1, ARENA_PX / (BASE_REF_PX * Math.max(kRef, ratio * kTgt)));
  const arena = $('v-arena');
  const arenaW = (arena && arena.clientWidth) || 340;
  const zW = (arenaW - ARENA_PAD * 2 - ARENA_GAP) / (BASE_REF_PX * (kRef + ratio * kTgt));
  if (zW > 0 && zW < z) z = zW;
  const zNeed = MIN_PX / (BASE_REF_PX * small);              // 小物体不低于最小高度
  let clamped = false;
  if (zNeed > z) {
    z = zNeed;
    clamped = true; // 极端比例：无法同时满足，进入钳制态
  }
  let refPx = BASE_REF_PX * z;
  let tgtPx = BASE_REF_PX * ratio * z;
  const boxRef = refPx * kRef;
  const boxTgt = tgtPx * kTgt;
  if (boxRef > ARENA_PX || boxTgt > ARENA_PX || (clamped && (refPx < MIN_PX || tgtPx < MIN_PX))) {
    const cRef = Math.min(ARENA_PX, Math.max(MIN_PX * kRef, boxRef));
    const cTgt = Math.min(ARENA_PX, Math.max(MIN_PX * kTgt, boxTgt));
    refPx = cRef / kRef;
    tgtPx = cTgt / kTgt;
    clamped = true;
  }
  const faithful = !clamped && Math.abs(Math.log(tgtPx / refPx / ratio)) < 0.05;
  return {
    refPx, tgtPx,
    boxRef: refPx * kRef, boxTgt: tgtPx * kTgt,
    scaled: Math.abs(z - 1) > 1e-9 || clamped, faithful, clamped,
  };
}

/** 把一个舞台物渲染到布局结果：插画画布盒（含留白）定边长，emoji 按字号 */
function paint(el, px, box, entry) {
  if (useArt) {
    el.style.width = box + 'px';
    el.style.height = box + 'px';
    el.style.fontSize = '';
    // 内容底边贴盒子底边：画布内内容垂直居中，横构图（车/山）否则会飘在半空
    const img = el.firstElementChild;
    if (img && entry) {
      const bottomMargin = entry.canvas.h - (entry.bounds.y + entry.bounds.h);
      const shift = bottomMargin * (box / entry.canvas.h);
      img.style.transform = shift > 0.5 ? `translateY(${shift.toFixed(1)}px)` : '';
    }
  } else {
    el.style.width = '';
    el.style.fontSize = px + 'px';
    el.style.height = px + 'px';
  }
}

function render() {
  const L = layout(q);
  paint($('v-ref-emoji'), L.refPx, L.boxRef, artRef);
  paint($('v-tgt-emoji'), L.tgtPx, L.boxTgt, artTgt);
  $('v-stagescale').classList.toggle('hidden', !L.scaled);
  // 目标物标签实时显示当前估测尺寸（= 估测比例 × 参考物尺寸，随拖动刷新；不涉及真实答案）
  if (truth && session && !session.locked) $('v-tgt-size').textContent = '≈ ' + fmtSize(q * truth.ref.s);
  const slider = $('v-slider');
  const v = ratioToV(q);
  if (Math.abs(Number(slider.value) - v) > 0.5) slider.value = String(v);
}

/** 揭晓后按真实比例渲染舞台 */
function renderTruth() {
  const L = layout(truth.qStar);
  paint($('v-ref-emoji'), L.refPx, L.boxRef, artRef);
  paint($('v-tgt-emoji'), L.tgtPx, L.boxTgt, artTgt);
  $('v-stagescale').classList.toggle('hidden', !L.scaled);
}

function setQ(next, syncSlider = true) {
  q = clampQ(next);
  if (syncSlider) {
    const v = ratioToV(q);
    const slider = $('v-slider');
    if (Math.abs(Number(slider.value) - v) > 0.5) slider.value = String(v);
  }
  render();
}

// ---------- 同源输入 ----------

function bindSlider() {
  $('v-slider').addEventListener('input', (e) => {
    if (!session || session.locked) return;
    q = vToRatio(Number(e.target.value));
    render();
  });
}

function bindFine() {
  const bind = (id, dir) => {
    const btn = $(id);
    const start = (e) => {
      e.preventDefault();
      btn.focus(); // 阻止原生聚焦后手动补焦点，键盘可继续微调
      if (!session || session.locked) return;
      adjust(dir, 1);
      clearInterval(repeatTimer);
      repeatTimer = setTimeout(() => {
        repeatTimer = setInterval(() => adjust(dir, 1), 90);
      }, 350);
    };
    const stop = () => {
      if (repeatTimer) {
        clearTimeout(repeatTimer);
        clearInterval(repeatTimer);
        repeatTimer = null;
      }
    };
    btn.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
    // 键盘可达：Enter/Space 触发的 click（detail===0），与 pointerdown 路径不重复
    btn.addEventListener('click', (e) => {
      if (e.detail !== 0 || !session || session.locked) return;
      adjust(dir, 1);
    });
  };
  bind('v-minus', -1);
  bind('v-plus', 1);
}

function adjust(dir, steps) {
  setQ(fineAdjust(q, dir, steps));
  SFX.tick();
}

function bindKeyboard() {
  document.addEventListener('keydown', (e) => {
    const scr = $('screen-visual');
    if (!scr || scr.classList.contains('hidden')) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (!session || session.locked) return;
    let dir = 0;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') dir = 1;
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') dir = -1;
    if (!dir) return;
    e.preventDefault();
    if (e.shiftKey) {
      // Shift = 10% 粗调（GDD 3.2）
      setQ(clampQ(dir > 0 ? q * COARSE_FACTOR : q / COARSE_FACTOR));
    } else {
      adjust(dir, 1); // 普通方向键 = 1% 微调
    }
  });
}

function bindDrag() {
  const tgt = $('v-tgt-emoji');
  let dragging = false;
  let startY = 0;
  let startQ = 1;
  tgt.addEventListener('pointerdown', (e) => {
    if (!session || session.locked) return;
    dragging = true;
    startY = e.clientY;
    startQ = q;
    tgt.classList.add('dragging');
    try { tgt.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
  });
  tgt.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dy = startY - e.clientY; // 上拖变大
    const factor = Math.pow(2, dy / DRAG_PX_PER_DOUBLE);
    setQ(startQ * factor);
    e.preventDefault();
  });
  const end = () => {
    dragging = false;
    tgt.classList.remove('dragging');
  };
  ['pointerup', 'pointercancel'].forEach((ev) => tgt.addEventListener(ev, end));
}

// ---------- 揭晓 ----------

function setControlsEnabled(on) {
  $('v-slider').disabled = !on;
  $('v-minus').disabled = !on;
  $('v-plus').disabled = !on;
}

function lockAnswer() {
  if (!session || session.locked) return;
  session.locked = true;
  setControlsEnabled(false); // 揭晓后输入全部锁定，只能看结果或进下一题
  $('v-lock').classList.add('hidden');
  SFX.lock();

  const qStar = truth.qStar;
  const e = visualError(q, qStar);
  const score = visualScore(q, qStar);
  session.scores.push(score);

  renderDots();
  $('v-total').textContent = `总分 ${session.scores.reduce((a, b) => a + b, 0)}`;
  renderTruth();
  // 揭晓后把估测尺寸切换为真实尺寸
  $('v-tgt-size').textContent = fmtSize(truth.tgt.s);

  // 揭晓口径统一：主显示倍数关系，次要显示线性偏差（GDD P0-5）
  const pct = linearDeviationPct(q, qStar);
  const verdict =
    score >= 90 ? '🎉 几乎完美！' : score >= 60 ? '👍 不错哦' : score >= 30 ? '🤔 差一点' : '😅 偏得有点远';
  $('v-verdict').textContent = verdict;
  $('v-detail').innerHTML =
    `你估测的「${truth.tgt.n}」是「${truth.ref.n}」的 <b>${fmtRatio(q)}</b>，` +
    `相当于真实值的 <b>${ratioSentence(q, qStar)}</b>，与真实值相差 <b>${pct}%</b>。<br>` +
    `真实比例 <b>${fmtRatio(qStar)}</b>（${fmtSize(truth.tgt.s)} ÷ ${fmtSize(truth.ref.s)}），` +
    `误差指数 e = ${e.toFixed(2)}`;
  const note = $('v-note');
  if (!note.textContent) note.classList.add('hidden');
  else note.classList.remove('hidden');

  $('v-reveal').classList.remove('hidden');
  rollCount($('v-score'), score, 700);
  feedbackForScore(score);
  if (score === 100) confetti();

  showHint(
    'v-hint',
    score >= 90
      ? '这就是「量级直觉」——记住这个手感。'
      : '记住这次的偏差方向，下一题往回找一点。',
    null,
    ctx.store
  );
  ctx.emit('visual_reveal', { mode: session.mode, score, e });
}

function nextRound() {
  SFX.lock();
  session.idx += 1;
  if (session.idx >= session.questions.length) {
    const payload = {
      mode: session.mode,
      rounds: session.questions.length,
      scores: session.scores.slice(),
      total: session.scores.reduce((a, b) => a + b, 0),
      perfectAny: session.scores.some((s) => s === 100),
    };
    const done = session;
    session = null;
    ctx.onVisualEnd(payload, done);
    return;
  }
  loadRound();
}

function copyReport() {
  if (!session) return;
  const qStar = truth.qStar;
  const score = session.scores[session.scores.length - 1] || 0;
  const lines = [
    '【比大小 · 反馈报告】',
    `模式：${session.mode}　第 ${session.idx + 1}/${session.questions.length} 题　本题得分：${score}`,
    `参考：${truth.ref.n}（${fmtSize(truth.ref.s)}）　目标：${truth.tgt.n}（${fmtSize(truth.tgt.s)}）`,
    `估测比例 q = ${q.toPrecision(4)}　真实比例 q* = ${qStar.toPrecision(4)}`,
    `对数误差 e = ${visualError(q, qStar).toFixed(3)}`,
    `题库版本：${(ctx.getPack() && ctx.getPack().version) || '?'}　页面：index.html v1.2.0`,
    '如结果与常识不符，请附上本报告反馈。',
  ];
  const text = lines.join('\n');
  copyText(text);
  ctx.toast('反馈报告已复制，可直接粘贴发送');
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  } catch (e) {
    /* 剪贴板不可用：静默降级 */
  }
}

// ---------- 刻度 ----------

const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶' };
function sup(n) {
  return String(n).split('').map((c) => SUP[c] || c).join('');
}

let ticksRendered = false;
function renderTicks() {
  if (ticksRendered) return;
  ticksRendered = true;
  const box = $('v-ticks');
  box.innerHTML = '';
  tickMarks().forEach((t) => {
    const el = document.createElement('span');
    el.className = 'tick';
    el.style.left = (t.v / SLIDER_STEPS) * 100 + '%';
    el.textContent = '10' + sup(t.exp);
    box.appendChild(el);
  });
}

// 供调试 / 验收用
export function _debugState() {
  return { q, session, truth };
}
