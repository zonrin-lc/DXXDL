// 数值模式（GDD 4.x / 5.x）：每日一题、生存、练习共用一套题目渲染与揭晓。
// 生存计时使用 deadline 时间戳（makeTimer），后台节流后恢复仍一致（P0-4）。
import { numericError, numericScore, ordersAway, ratioSentence, linearDeviationPct } from '../core/scoring.js';
import { fmtCN, parseNumericInput, normalizeForDisplay } from '../core/format.js';
import { SURVIVAL } from '../core/constants.js';
import { makeTimer, timerColor, applyAnswer, applyTimeout, pickSurvivalQuestion } from '../core/survival.js';
import { SFX, feedbackForScore } from './audio.js';
import { rollCount, confetti, showHint } from './effects.js';
import { createTapTapRewardedAd } from '../platform/taptap-rewarded-ad.js';
import { TAPTAP_REWARDED_VIDEO_AD_UNIT_ID } from '../platform/taptap-config.js';

const $ = (id) => document.getElementById(id);

let ctx = null;
let session = null;
let tickHandle = null;

const GENERIC_TIP = '把问题拆成「人数 × 人均 × 频率」这类小块，分别估出数量级再相乘；10 的幂比精确数字重要。';
const rewardedVideoAd = createTapTapRewardedAd({ adUnitId: TAPTAP_REWARDED_VIDEO_AD_UNIT_ID });

/** dateKey（YYYY-MM-DD，存储键保持不变）→ 中文日期展示（仅展示层本地化） */
export function fmtDateCN(dateKey, withYear = false) {
  if (!dateKey) return '';
  const p = String(dateKey).split('-').map(Number);
  if (p.length < 3 || !p[0]) return dateKey;
  const opt = { month: 'long', day: 'numeric' };
  if (withYear) opt.year = 'numeric';
  return new Intl.DateTimeFormat('zh-CN', opt).format(new Date(p[0], p[1] - 1, p[2]));
}

export function initNumeric(context) {
  ctx = context;
  $('n-lock').addEventListener('click', lockAnswer);
  $('n-next').addEventListener('click', nextStep);
  $('n-report').addEventListener('click', copyReport);
  $('n-revive-ad').addEventListener('click', tryRevive);
  $('n-input').addEventListener('input', onInput);
  $('n-tip-btn').addEventListener('click', () => {
    const tip = $('n-tip');
    tip.classList.toggle('hidden');
    $('n-tip-btn').setAttribute('aria-expanded', String(!tip.classList.contains('hidden')));
  });
  $('n-draft-btn').addEventListener('click', () => {
    const d = $('n-draft');
    d.classList.toggle('hidden');
    $('n-draft-btn').setAttribute('aria-expanded', String(!d.classList.contains('hidden')));
    if (!d.classList.contains('hidden')) d.focus();
  });
  document.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => onChip(btn.dataset.m));
  });
  // P0-4：切回前台立即按时间戳重算，超时则补判
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (session && session.mode === 'survival' && !session.locked) checkTimeout();
  });
}

/** opts: daily → {question, dateKey}；practice → {questions}；survival → {pool} */
export function startNumeric(mode, opts = {}) {
  stopTimer();
  session = {
    mode,
    idx: 0,
    questions: [],
    current: null,
    life: SURVIVAL.initLife,
    answered: 0,
    scores: [],
    playedIds: new Set(),
    timer: makeTimer(SURVIVAL.timeSec * 1000),
    totalMs: SURVIVAL.timeSec * 1000,
    locked: false,
    dateKey: opts.dateKey || null,
    timedOut: false,
    revived: false,
    reviveInFlight: false,
    reviveAttemptId: null,
  };

  $('n-survival-head').classList.toggle('hidden', mode !== 'survival');
  $('n-draft').value = '';
  $('n-draft').classList.add('hidden');

  if (mode === 'daily') {
    session.questions = [opts.question];
    $('n-tag').textContent = `📅 每日一题${opts.dateKey ? ' · ' + fmtDateCN(opts.dateKey) : ''}`;
    showHint('n-hintbar', '每日一题：凭直觉估，今天的答案明天也能复盘。', 'daily_tip_v1', ctx.store);
  } else if (mode === 'practice') {
    session.questions = opts.questions;
    $('n-tag').textContent = '🎯 练习模式 · 不计时';
    showHint('n-hintbar', '练习模式：随便试，答错不扣任何东西。', 'practice_tip_v1', ctx.store);
  } else {
    session.pool = opts.pool;
    $('n-tag').textContent = '💀 生存模式 · 15 秒一题';
    showHint('n-hintbar', '答错扣血、答对不加血、极准回血 +1；超时扣 3。', 'survival_tip_v1', ctx.store);
  }
  $('n-revive-ad').classList.add('hidden');
  $('n-next').disabled = false;
  loadRound();
}

function loadRound() {
  if (session.mode === 'survival') {
    session.current = pickSurvivalQuestion(session.pool, session.playedIds);
    session.playedIds.add(session.current.id || session.current.q);
  } else {
    session.current = session.questions[session.idx];
  }

  const q = session.current;
  $('n-text').textContent = q.q;
  $('n-unit').textContent = q.u || '';
  $('n-input').value = '';
  $('n-error').textContent = '';
  $('n-norm').classList.add('hidden');
  $('n-tip').textContent = q.hint || GENERIC_TIP;
  $('n-tip').classList.add('hidden');
  $('n-tip-btn').setAttribute('aria-expanded', 'false');
  $('n-reveal').classList.add('hidden');
  $('n-lock').classList.remove('hidden');
  $('n-lock').disabled = false;
  session.locked = false;
  session.timedOut = false;

  syncReviveButton();
  if (session.mode === 'survival') {
    $('n-life').textContent = String(session.life);
    $('n-hearts').textContent = '❤️'.repeat(session.life) + '🖤'.repeat(SURVIVAL.maxLife - session.life);
    $('n-count').textContent = `已答 ${session.answered} 题`;
    session.timer.start();
    startTimer();
  }
}

// ---------- 生存计时（deadline 时间戳，节流免疫） ----------

function startTimer() {
  stopTimer();
  tickHandle = setInterval(tickTimer, 120);
  tickTimer();
}

function stopTimer() {
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
}

function tickTimer() {
  if (!session || session.mode !== 'survival' || session.locked) return;
  const remain = session.timer.remainingMs();
  const bar = $('n-timer');
  const pct = Math.max(0, Math.min(100, (remain / session.totalMs) * 100));
  // 剩余比例改用 transform 缩放，语义不变（从左往右收窄）
  bar.style.transform = 'scaleX(' + pct / 100 + ')';
  bar.style.background =
    timerColor(remain, session.totalMs) === 'green'
      ? 'var(--green)'
      : timerColor(remain, session.totalMs) === 'orange'
        ? 'var(--orange-deep)'
        : 'var(--red)';
  if (remain <= 0) checkTimeout();
}

function checkTimeout() {
  if (!session || session.locked || session.mode !== 'survival') return;
  if (session.timer.remainingMs() > 0) return;
  stopTimer();
  session.locked = true;
  session.timedOut = true;
  session.timer.stop();
  session.answered += 1;

  const res = applyTimeout(session.life);
  session.life = res.life;
  session.scores.push(0);

  const q = session.current;
  const ansTip =
    q.answerType === 'range' && q.answerRange
      ? `参考范围 <b>${fmtCN(q.answerRange.min)} ~ ${fmtCN(q.answerRange.max)} ${q.u || ''}</b>（口径见下方说明）`
      : `真实答案 <b>${fmtCN(q.a)} ${q.u || ''}</b>`;
  // 先显示容器再写入播报文本，保证超时结果也能被朗读
  $('n-reveal').classList.remove('hidden');
  $('n-verdict').textContent = '⏰ 超时了';
  $('n-detail').innerHTML = `本题超时扣 <b>${-res.delta}</b> 点生命。${q.answerType === 'range' ? '本题' + ansTip + '。' : ansTip + '。'}`;
  setNote(q);
  $('n-scoreline').innerHTML = '生存扣血 <b style="color:var(--red-text)">' + res.delta + '</b>';
  $('n-lock').classList.add('hidden');
  $('n-next').textContent = session.life <= 0 ? '查看结算 →' : '继续 →';
  feedbackForScore(0);
  updateLifeUI();
  // 超时揭晓同样把焦点交给继续按钮
  syncReviveButton();
  $('n-next').disabled = Boolean(session.reviveInFlight);
  $('n-next').focus();
  ctx.emit('numeric_answered', { mode: 'survival', score: 0, timeout: true });
}

function updateLifeUI() {
  $('n-life').textContent = String(session.life);
  $('n-hearts').textContent = '❤️'.repeat(session.life) + '🖤'.repeat(SURVIVAL.maxLife - session.life);
  $('n-count').textContent = `已答 ${session.answered} 题`;
  syncReviveButton();
}

// ---------- TapTap 激励视频复活 ----------

function syncReviveButton() {
  const button = $('n-revive-ad');
  if (!button) return;
  const canOffer = !!session
    && session.mode === 'survival'
    && session.life <= 0
    && !session.revived
    && rewardedVideoAd.isConfigured();
  button.classList.toggle('hidden', !canOffer);
  button.disabled = !canOffer || Boolean(session && session.reviveInFlight);
  $('n-next').disabled = Boolean(session && session.reviveInFlight);
  button.textContent = session && session.reviveInFlight
    ? '广告处理中…'
    : '观看广告 · 复活一次（恢复3点生命）';
}

function storeRewardAttempt(targetSession, status) {
  if (!ctx?.store) return;
  const key = 'bsz_reward_attempt_pending';
  if (status === 'clear') {
    ctx.store.removeItem(key);
    return;
  }
  ctx.store.setItem(key, JSON.stringify({
    id: targetSession.reviveAttemptId,
    type: 'survival-revive',
    status,
    createdAt: targetSession.reviveAttemptCreatedAt,
  }));
}

async function tryRevive() {
  if (!session || session.mode !== 'survival' || session.life > 0 || session.revived || session.reviveInFlight) return;
  if (!rewardedVideoAd.isConfigured()) {
    ctx.toast('当前平台广告能力或广告位尚未配置，不能发放复活奖励。');
    return;
  }

  const targetSession = session;
  targetSession.reviveInFlight = true;
  targetSession.reviveAttemptId = `revive-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  targetSession.reviveAttemptCreatedAt = Date.now();
  storeRewardAttempt(targetSession, 'playing');
  syncReviveButton();

  let result;
  try {
    result = await rewardedVideoAd.showRewarded();
  } catch {
    result = { status: 'error' };
  }

  targetSession.reviveInFlight = false;
  // 不能把已离开的旧局奖励加到另一局，也不能据迟到回调发奖。
  if (session !== targetSession) return;
  storeRewardAttempt(targetSession, 'clear');

  if (result.status === 'completed' && targetSession.life <= 0 && !targetSession.revived) {
    targetSession.revived = true;
    targetSession.life = Math.min(3, SURVIVAL.maxLife);
    targetSession.locked = true;
    updateLifeUI();
    $('n-reveal').classList.remove('hidden');
    $('n-next').textContent = '继续 →';
    $('n-next').disabled = false;
    $('n-verdict').textContent = '💚 复活成功';
    ctx.toast('广告观看完成，已恢复3点生命。本局已标记为复活局。');
    syncReviveButton();
    $('n-next').focus();
    return;
  }

  const message = result.status === 'cancelled'
    ? '你提前关闭了广告，本次没有获得复活。'
    : result.status === 'unavailable'
      ? '当前环境未提供可用广告，未发放复活。'
      : '广告未能完成或奖励未确认，本次未复活；本局成绩已保留。';
  ctx.toast(message);
  syncReviveButton();
}

// ---------- 输入 ----------

function onInput() {
  const raw = $('n-input').value;
  const v = parseNumericInput(raw);
  const norm = $('n-norm');
  if (v != null) {
    const disp = normalizeForDisplay(v);
    norm.textContent = '将提交：' + disp + (session.current && session.current.u ? ' ' + session.current.u : '');
    norm.classList.remove('hidden');
    $('n-error').textContent = ''; // 输入已可解析，撤掉内联错误
  } else {
    norm.classList.add('hidden');
  }
}

function onChip(m) {
  const input = $('n-input');
  if (m === 'clear') {
    input.value = '';
    onInput();
    return;
  }
  const cur = parseNumericInput(input.value);
  const next = cur != null ? cur * Number(m) : Number(m);
  input.value = normalizeForDisplay(next);
  onInput();
}

// ---------- 揭晓 ----------

function setNote(q) {
  const note = $('n-note');
  if (q.note) {
    note.textContent = '💡 ' + q.note;
    note.classList.remove('hidden');
  } else {
    note.textContent = '';
    note.classList.add('hidden');
  }
}

function lockAnswer() {
  if (!session || session.locked) return;
  const q = session.current;
  const x = parseNumericInput($('n-input').value);
  if (x == null) {
    // 解析失败：输入框旁内联错误（aria-live 播报）+ 焦点回到出错输入框，toast 保留
    const msg = $('n-input').value.trim()
      ? '这个数字看不懂——支持 1200000000 / 1.2e9 / 12亿 这几种写法'
      : '先输入你的估测再锁定（支持 1200000000 / 1.2e9 / 12亿）';
    $('n-error').textContent = msg;
    ctx.toast(msg);
    $('n-input').focus();
    return;
  }
  $('n-error').textContent = '';

  session.locked = true;
  $('n-lock').classList.add('hidden');
  SFX.lock();

  const d = numericError(x, q);
  const score = numericScore(x, q);
  const type = q.answerType || 'point';
  session.lastGuess = x;
  session.lastD = d;

  if (session.mode === 'survival') {
    stopTimer();
    session.timer.stop();
    session.answered += 1;
    const res = applyAnswer(session.life, d);
    session.life = res.life;
    updateLifeUI();
    session.scores.push(score);
    if (res.type === 'heal') $('n-scoreline').innerHTML = '极准回血 <b style="color:var(--green-text)">+' + res.delta + '</b>';
    else if (res.delta < 0)
      $('n-scoreline').innerHTML = '扣血 <b style="color:var(--red-text)">' + res.delta + '</b>　得分 <b id="n-score">' + score + '</b>';
    else $('n-scoreline').innerHTML = '得分 <b id="n-score">' + score + '</b>';
  } else {
    session.scores.push(score);
    $('n-scoreline').innerHTML = '得分 <b id="n-score">0</b>';
  }

  // 揭晓主口径：数量级关系 + 倍数关系（与计分同源）
  let verdict;
  if (score >= 100) verdict = type === 'range' ? '🎯 命中区间！' : '🎯 完全命中数量级！';
  else if (score >= 60) verdict = '👍 方向对了';
  else if (score >= 30) verdict = '🤔 差了几个零';
  else verdict = '😅 偏得有点远';

  let detail = '';
  if (type === 'range') {
    const { min, max } = q.answerRange;
    if (d === 0) {
      detail = `你的答案 <b>${fmtCN(x)} ${q.u || ''}</b> 落在参考范围 <b>${fmtCN(min)} ~ ${fmtCN(max)}</b> 内；区间口径与不确定性原因见下方说明。`;
    } else {
      detail =
        `你的答案 <b>${fmtCN(x)} ${q.u || ''}</b> 超出参考范围 <b>${fmtCN(min)} ~ ${fmtCN(max)}</b>，` +
        `离最近边界差 <b>${ordersAway(d)}</b> 个数量级（${ratioSentence(x, x < min ? min : max)}）；区间口径见下方说明。`;
    }
  } else {
    const pct = linearDeviationPct(x, q.a);
    detail =
      `真实答案约 <b>${fmtCN(q.a)} ${q.u || ''}</b>，你的答案相当于真实值的 <b>${ratioSentence(x, q.a)}</b>，` +
      `差 <b>${ordersAway(d)}</b> 个数量级，与真实值相差 <b>${pct}%</b>。`;
  }
  $('n-detail').innerHTML = detail;
  setNote(q);

  // 先显示容器再写入播报文本（同帧完成），保证 status 区首次可朗读
  $('n-reveal').classList.remove('hidden');
  $('n-verdict').textContent = verdict;
  const scoreEl = $('n-score');
  if (scoreEl) rollCount(scoreEl, score, 600);
  feedbackForScore(score);
  if (score === 100) confetti();

  $('n-next').textContent =
    session.mode === 'daily'
      ? '完成今日挑战 →'
      : session.mode === 'survival'
        ? session.life <= 0 ? '查看结算 →' : '继续 →'
        : session.idx + 1 >= session.questions.length ? '查看结算 →' : '下一题 →';
  // 揭晓完成，焦点交给「下一题 / 继续」（按钮文案就绪后再移交）
  $('n-next').focus();

  ctx.emit('numeric_answered', { mode: session.mode, score, d, question: q });
}

function nextStep() {
  if (!session || session.reviveInFlight) return;
  SFX.lock();
  if (session.mode === 'daily') {
    const s = finishPayload();
    reset();
    ctx.onNumericEnd(s);
    return;
  }
  if (session.mode === 'practice') {
    session.idx += 1;
    if (session.idx >= session.questions.length) {
      const s = finishPayload();
      reset();
      ctx.onNumericEnd(s);
      return;
    }
    loadRound();
    return;
  }
  // survival：先判断生死，再进下一题
  if (session.life <= 0) {
    const s = finishPayload();
    reset();
    ctx.onNumericEnd(s);
    return;
  }
  session.idx += 1;
  loadRound();
}

function finishPayload() {
  return {
    type: session.mode,
    mode: session.mode,
    scores: session.scores.slice(),
    answered: session.answered,
    total: session.scores.reduce((a, b) => a + b, 0),
    question: session.questions[0] || session.current,
    dateKey: session.dateKey,
    guess: session.lastGuess,
    d: session.lastD,
    packVersion: (ctx.getPack() && ctx.getPack().version) || null,
    revived: Boolean(session.revived),
  };
}

function reset() {
  stopTimer();
  session = null;
  $('n-revive-ad').classList.add('hidden');
  $('n-next').disabled = false;
}

// ---------- 纠错复制报告 ----------

function copyReport() {
  if (!session || !session.current) return;
  const q = session.current;
  const x = parseNumericInput($('n-input').value);
  const lines = [
    '【比大小 · 反馈报告】',
    `模式：${session.mode}${session.dateKey ? '　日期：' + session.dateKey : ''}`,
    `题目：${q.q}`,
    x != null
      ? `估测：${normalizeForDisplay(x)} ${q.u || ''}　数量级差 d = ${q.answerType === 'range' ? '(区间题)' : numericError(x, q).toFixed(3)}`
      : '估测：（未提交可解析的数值）',
    `题库版本：${(ctx.getPack() && ctx.getPack().version) || '?'}　页面：index.html v1.2.0`,
    '如答案或冷知识有误，请附上本报告反馈。',
  ];
  const text = lines.join('\n');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => ctx.toast('反馈报告已复制，可直接粘贴发送'),
      () => ctx.toast('复制失败，请手动截图反馈')
    );
  } else {
    ctx.toast('复制失败，请手动截图反馈');
  }
}

export function _debugState() {
  return { session };
}
