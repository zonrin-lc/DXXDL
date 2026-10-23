// 应用主装配：题库三级加载、屏幕切换、模式编排、连胜/成就/设置、首局引导、结算与分享。
import { getJSON, setJSON, createStorage, migrateSave, dailyRecordKey } from '../core/storage.js';
import { validatePack, isPackApplicable, arrangeRound } from '../core/question.js';
import { dateKey, resolveDailyQuestion } from '../core/daily.js';
import { applyDailyCompletion, streakDisplay } from '../core/streak.js';
import { ACHIEVEMENTS, ACH_MAP, evaluateAchievements, reduceStats } from '../core/achievements.js';
import { squareFor } from '../core/constants.js';
import { setPrefs, SFX } from './audio.js';
import { setReducedMotion } from './effects.js';
import { initVisual, startVisual } from './visual.js';
import { initNumeric, startNumeric } from './numeric.js';

const $ = (id) => document.getElementById(id);
// 内置兜底题库：构建时由 build.mjs 以 window.__BSZ_BASE_PACK__ 注入
const BASE_PACK = (typeof window !== 'undefined' && window.__BSZ_BASE_PACK__) || null;
const FETCH_TIMEOUT_MS = 2500;

// ---------- 全局上下文 ----------
const store = createStorage(window);
migrateSave(store);

let pack = null;
let packSource = '内置';
let ach = getJSON(store, 'bsz_ach', { unlocked: {}, stats: {} });
let lastRun = null; // 用于「再来一局」

const ctx = {
  store,
  getPack: () => pack,
  toast,
  emit,
  onVisualEnd,
  onNumericEnd,
};

// ---------- 题库三级加载（GDD 9.2）：远程 data/pools.json → 本地缓存 bsz_pack → 内置兜底 ----------
async function loadPack() {
  const cached = getJSON(store, 'bsz_pack', null);
  const res = await fetchWithTimeout('./data/pools.json', FETCH_TIMEOUT_MS);
  if (res && validatePack(res).length === 0) {
    // 远程包校验通过才应用；版本有变化时写入缓存（校验失败绝不覆盖缓存）
    if (isPackApplicable(res, cached && cached.version)) setJSON(store, 'bsz_pack', res);
    pack = res;
    packSource = '远程热更';
    return;
  }
  if (cached && validatePack(cached).length === 0) {
    pack = cached;
    packSource = '本地缓存';
    return;
  }
  pack = BASE_PACK;
  packSource = '内置';
}

/** 题目结构归一：兼容 v2 reference/target 与旧 ref/tgt 两种字段 */
function toVisual(item) {
  const r = item.reference || item.ref || {};
  const t = item.target || item.tgt || {};
  return {
    id: item.id,
    ref: { e: r.emoji || r.e || '🧍', n: r.name || r.n || '', s: r.size || r.s || 1, assetId: r.assetId || null },
    tgt: { e: t.emoji || t.e || '❓', n: t.name || t.n || '', s: t.size || t.s || 1, assetId: t.assetId || null },
    note: item.note,
    dimension: item.dimension,
  };
}

async function fetchWithTimeout(url, ms) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

// ---------- 轻提示 ----------
let toastTimer = null;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2400);
}

// ---------- 事件 → 统计 / 成就 ----------
function emit(name, payload) {
  if (name === 'numeric_answered') {
    if (!payload.timeout) {
      ach.stats = reduceStats(ach.stats, { type: 'numeric_done', mode: payload.mode });
      unlockBatch(evaluateAchievements(ach, { type: 'numeric_done', mode: payload.mode }));
    }
    return;
  }
}

function unlockBatch(ids) {
  if (!ids || !ids.length) return;
  const now = Date.now();
  ids.forEach((id) => {
    ach.unlocked[id] = now;
    const a = ACH_MAP[id];
    showAchToast(a);
  });
  setJSON(store, 'bsz_ach', ach);
}

function showAchToast(a) {
  if (!a) return;
  SFX.achievement();
  const el = $('ach-toast');
  $('ach-icon').textContent = a.icon;
  $('ach-text').textContent = `成就达成「${a.name}」`;
  el.classList.remove('hidden');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add('hidden'), 3000);
}

function modeSeen(mode) {
  ach.stats = reduceStats(ach.stats, { type: 'mode_seen', mode });
  unlockBatch(evaluateAchievements(ach, { type: 'mode_seen', mode }));
  setJSON(store, 'bsz_ach', ach);
}

// ---------- 屏幕切换 ----------
function showScreen(name) {
  ['home', 'visual', 'numeric', 'end'].forEach((s) => {
    $('screen-' + s).classList.toggle('hidden', s !== name);
  });
  $('back-row').style.display = name === 'home' ? 'none' : 'block';
  window.scrollTo(0, 0);
}

// ---------- 主页 ----------
const MODES = [
  { id: 'everyday', icon: '🏙️', title: '日常挑战', desc: '身边事物的真实比例 · 5 题一局', type: 'visual', pool: 'everyday' },
  { id: 'pop', icon: '🎬', title: '脑洞影视', desc: '芽芽豆、银岩机甲到底有多大？', type: 'visual', pool: 'pop' },
  { id: 'geo', icon: '🌍', title: '地理地标', desc: '从楼房到珠峰的尺度感', type: 'visual', pool: 'geo' },
  { id: 'daily', icon: '📅', title: '每日一题', desc: '每天一道数量级 · 靠累积', type: 'numeric', tag: 'daily' },
  { id: 'survival', icon: '💀', title: '生存模式', desc: '15 秒一题 · 答错扣血', type: 'numeric' },
  { id: 'practice', icon: '🎯', title: '练习模式', desc: '不计时不限次 · 随便试', type: 'numeric', tag: 'practice' },
];

function renderHome() {
  const list = $('mode-list');
  list.innerHTML = '';
  const today = dateKey();
  const streakState = getJSON(store, 'bsz_streak', { lastCompletedDate: null, currentStreak: 0, bestStreak: 0 });
  const sd = streakDisplay(streakState, today);

  MODES.forEach((m) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'mode-card';
    const best = getJSON(store, 'bsz_best_' + m.id, null);
    let right = '';
    if (m.id === 'daily') {
      right = sd.todayDone
        ? `<span class="best">✓ 今日已完成</span>`
        : `<span class="best">${sd.display > 0 ? '🔥 连胜 ' + sd.display + ' 天' : '今天还没打卡'}</span>`;
    } else if (best != null) {
      right = `<span class="best">最佳 ${m.id === 'survival' ? best + ' 题' : best + ' 分'}</span>`;
    }
    const tag = m.tag ? `<span class="tag ${m.tag}">${m.tag === 'daily' ? '每日' : '练习'}</span>` : '';
    card.innerHTML =
      `<div class="ic">${m.icon}</div>` +
      `<div class="tx"><span class="ttl">${m.title}${tag}</span><p>${m.desc}</p></div>${right}`;
    card.addEventListener('click', () => startMode(m.id));
    list.appendChild(card);
  });

  const packInfo = $('pack-info');
  const errs = validatePack(pack);
  packInfo.textContent = `内容包 v${(pack && pack.version) || '?'} · ${packSource}` + (errs.length ? ` · ⚠️ ${errs.length} 处校验问题` : '');
  if (!store.persistent) packInfo.textContent += ' · ⚠️ 本次记录不会持久保存';

  const row = $('home-streak');
  if (sd.display > 0 || sd.todayDone) {
    row.classList.remove('hidden');
    row.textContent = `🔥 连胜 ${sd.display} 天${sd.todayDone ? ' · 今日已打卡' : ''}`;
  } else {
    row.classList.add('hidden');
  }
}

// ---------- 模式启动 ----------
function startMode(id) {
  if (!pack) return;
  const meta = MODES.find((m) => m.id === id);
  modeSeen(id);

  if (meta.type === 'visual') {
    const questions = arrangeRound(pack[meta.pool] || [], 5).map(toVisual);
    lastRun = { id, questions };
    startVisual(id, questions);
    showScreen('visual');
    if (!store.getItem('bsz_guide_done')) startGuide();
    return;
  }

  if (id === 'daily') {
    const today = dateKey();
    const resolved = resolveDailyQuestion(today, pack, {});
    if (!resolved.question) {
      toast('今日题目缺失，已反馈题库问题——先去练习模式热热身');
      return;
    }
    lastRun = { id };
    startNumeric('daily', { question: resolved.question, dateKey: today, meta: resolved.meta });
    showScreen('numeric');
    return;
  }

  if (id === 'survival') {
    const numericPool = (pack.numeric || []).filter((q) => q.status !== 'retired' && q.status !== 'draft');
    if (!numericPool.length) {
      toast('题库还没有可用的数量级题');
      return;
    }
    lastRun = { id };
    const go = () => {
      startNumeric('survival', { pool: numericPool });
      showScreen('numeric');
    };
    if (!store.getItem('bsz_seen_survival_rules')) {
      openInfo(
        '💀 生存模式规则',
        `<div class="modal-note">❤️ 初始 10 点生命，上限 10。<br>
         ⏰ 每题 15 秒，超时 <b>-3</b>。<br>
         💔 答错按数量级差扣血：每差 1 个零扣 1（四舍五入）。<br>
         💚 偏差小于满分区（约 6%）触发<b>极准回血 +1</b>。<br>
         揭晓后需手动点「继续」，后台切走时计时按真实时间继续走。</div>`,
        '开始挑战',
        () => {
          store.setItem('bsz_seen_survival_rules', '1');
          go();
        }
      );
      return;
    }
    go();
    return;
  }

  // practice
  const numericPool = (pack.numeric || []).filter((q) => q.status !== 'retired' && q.status !== 'draft');
  if (!numericPool.length) {
    toast('题库还没有可用的数量级题');
    return;
  }
  lastRun = { id };
  const shuffled = numericPool.slice().sort(() => Math.random() - 0.5).slice(0, 5);
  startNumeric('practice', { questions: shuffled });
  showScreen('numeric');
}

// ---------- 结算 ----------
function onVisualEnd(payload) {
  const best = getJSON(store, 'bsz_best_' + payload.mode, 0);
  if (payload.total > best) setJSON(store, 'bsz_best_' + payload.mode, payload.total);

  ach.stats = reduceStats(ach.stats, { type: 'round_end', mode: payload.mode });
  unlockBatch(evaluateAchievements(ach, { type: 'round_end', ...payload }));
  setJSON(store, 'bsz_ach', ach);

  const pct = payload.total / (payload.rounds * 100);
  const comment =
    pct === 1 ? '满分！你的眼睛就是尺 📏' : pct >= 0.8 ? '量级直觉相当准！' : pct >= 0.5 ? '方向对了，再练两局' : '别急，尺度感是练出来的';

  const items = payload.scores.map((s, i) => {
    const q = (lastRun && lastRun.questions && lastRun.questions[i]) || null;
    const name = q ? (q.tgt ? q.tgt.n : (q.target && q.target.name) || '目标') : `第 ${i + 1} 题`;
    return `<div>${squareFor(s)} <b>${name}</b> · ${s} 分</div>`;
  }).join('');

  showEnd({
    big: `${payload.total}<small> / ${payload.rounds * 100}</small>`,
    comment,
    squares: payload.scores.map(squareFor).join(''),
    list: items,
    shareText: `【比大小 · ${payload.mode}】${payload.total}/${payload.rounds * 100} 分　${payload.scores.map(squareFor).join('')}　来试试你的眼力！`,
    replay: () => {
      startMode(payload.mode);
    },
  });
  lastRun = null;
}

function onNumericEnd(payload) {
  const today = dateKey();

  if (payload.type === 'daily') {
    const score = payload.scores[0] || 0;
    const streakState = getJSON(store, 'bsz_streak', { lastCompletedDate: null, currentStreak: 0, bestStreak: 0 });
    const next = applyDailyCompletion(streakState, payload.dateKey || today);
    delete next.changed;
    setJSON(store, 'bsz_streak', next);
    // 每日成绩快照：日期 / 题目 id / 题库版本 / 排期版本 / 得分（GDD 4.1 第 6 条）
    setJSON(store, dailyRecordKey(payload.dateKey || today), {
      date: payload.dateKey || today,
      questionId: (payload.question && payload.question.id) || null,
      packVersion: payload.packVersion,
      score,
      answerType: (payload.question && payload.question.answerType) || 'point',
      d: payload.d,
      at: Date.now(),
    });
    const best = getJSON(store, 'bsz_best_daily', 0);
    if (score > best) setJSON(store, 'bsz_best_daily', score);
    unlockBatch(evaluateAchievements(ach, { type: 'daily_complete', score, streak: next.currentStreak }));
    setJSON(store, 'bsz_ach', ach);

    showEnd({
      big: `${score}<small> / 100</small>`,
      comment:
        score >= 90
          ? `今日命中！🔥 连胜 ${next.currentStreak} 天`
          : `今日完成 · 🔥 连胜 ${next.currentStreak} 天（最佳 ${next.bestStreak}）`,
      squares: squareFor(score),
      list: `<div>题目：<b>${(payload.question && payload.question.q) || ''}</b></div>`,
      shareText: `【比大小 · 每日一题】${payload.dateKey || today} 得 ${score} 分 ${squareFor(score)}　连胜 ${next.currentStreak} 天`,
      replay: null,
    });
    return;
  }

  if (payload.type === 'survival') {
    const best = getJSON(store, 'bsz_best_survival', 0);
    if (payload.answered > best) setJSON(store, 'bsz_best_survival', payload.answered);
    unlockBatch(evaluateAchievements(ach, { type: 'survival_end', answered: payload.answered }));
    ach.stats = reduceStats(ach.stats, { type: 'survival_end', answered: payload.answered });
    setJSON(store, 'bsz_ach', ach);
    showEnd({
      big: `${payload.answered}<small> 题</small>`,
      comment: payload.answered >= 30 ? '生存大师！' : '生命耗尽——下次先估数量级再下手',
      squares: payload.scores.slice(-10).map(squareFor).join(''),
      list: `<div>本局答题 <b>${payload.answered}</b> 题 · 最佳 <b>${Math.max(best, payload.answered)}</b> 题</div>`,
      shareText: `【比大小 · 生存模式】答对 ${payload.answered} 题，你能撑几题？`,
      replay: () => startMode('survival'),
    });
    return;
  }

  // practice
  showEnd({
    big: `${payload.total}<small> / ${payload.scores.length * 100}</small>`,
    comment: '练得越多，量级直觉越准',
    squares: payload.scores.map(squareFor).join(''),
    list: '',
    shareText: `【比大小 · 练习模式】${payload.total}/${payload.scores.length * 100} 分`,
    replay: () => startMode('practice'),
  });
}

function showEnd(opts) {
  $('end-body').innerHTML =
    `<div class="big">${opts.big}</div>` +
    `<div class="comment">${opts.comment}</div>` +
    (opts.squares ? `<div class="squares">${opts.squares}</div>` : '') +
    `<div class="roundlist">${opts.list || ''}</div>` +
    `<button class="btn green" data-act="replay">🔄 再来一局</button>` +
    `<button class="btn sub" data-act="share">📤 分享成绩</button>` +
    `<div class="back-row"><button data-act="home">← 返回主页</button></div>`;
  showScreen('end');
  SFX.end();

  $('end-body').querySelector('[data-act="replay"]').addEventListener('click', () => {
    if (opts.replay) opts.replay();
    else renderHome(), showScreen('home');
  });
  $('end-body').querySelector('[data-act="share"]').addEventListener('click', () => shareText(opts.shareText));
  $('end-body').querySelector('[data-act="home"]').addEventListener('click', () => {
    renderHome();
    showScreen('home');
  });
}

// 分享：优先系统分享，降级复制文本（GDD P1-4 的分享图片在无 canvas 场景降级）
function shareText(text) {
  if (navigator.share) {
    navigator.share({ title: '比大小', text }).catch(() => copyToClipboard(text));
    return;
  }
  copyToClipboard(text);
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => toast('成绩已复制，去粘贴给好友吧'),
      () => toast('复制失败，可手动截图分享')
    );
  } else {
    toast('复制失败，可手动截图分享');
  }
}

// ---------- 设置 ----------
function applySettings() {
  const sfx = store.getItem('bsz_set_sfx') !== '0';
  const vib = store.getItem('bsz_set_vibrate') !== '0';
  // 减少动态效果：三态——未设置(null)跟随系统 prefers-reduced-motion，不再强制覆盖为开
  const storedMotion = store.getItem('bsz_set_motion');
  const motion = storedMotion == null ? null : storedMotion === '1';
  const sysReduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  setPrefs({ sfx, vibrate: vib });
  setReducedMotion(motion);
  $('set-sfx').setAttribute('aria-checked', String(sfx));
  $('set-vibrate').setAttribute('aria-checked', String(vib));
  $('set-motion').setAttribute('aria-checked', String(motion == null ? sysReduce : motion));
  $('set-storage').textContent = store.persistent
    ? '设置与成绩保存在本机浏览器中。'
    : '⚠️ 浏览器禁用了本地存储：本次记录不会持久保存。';
}

function bindSettings() {
  const bindToggle = (id, key) => {
    $(id).addEventListener('click', () => {
      const on = $(id).getAttribute('aria-checked') !== 'true';
      $(id).setAttribute('aria-checked', String(on));
      store.setItem(key, on ? '1' : '0');
      applySettings();
      if (key === 'bsz_set_sfx' && on) SFX.tick();
    });
  };
  bindToggle('set-sfx', 'bsz_set_sfx');
  bindToggle('set-vibrate', 'bsz_set_vibrate');
  bindToggle('set-motion', 'bsz_set_motion');
  // 弹层焦点管理：打开时把焦点移入弹层，关闭时还给触发元素，避免焦点停在遮罩下
  let modalReturnFocus = null;
  $('settings-btn').addEventListener('click', () => {
    modalReturnFocus = document.activeElement;
    $('settings-modal').classList.remove('hidden');
    $('set-close').focus();
  });
  $('set-close').addEventListener('click', () => {
    $('settings-modal').classList.add('hidden');
    if (modalReturnFocus && modalReturnFocus.focus) modalReturnFocus.focus();
  });
}

// ---------- 玩法说明 / 成就列表（通用弹层） ----------
function openInfo(title, html, btnText, onOk) {
  $('info-card').innerHTML =
    `<div class="modal-title">${title}</div>${html}` +
    `<button class="btn" id="info-ok" style="margin-top:14px">${btnText || '知道了'}</button>`;
  const returnFocus = document.activeElement;
  $('info-modal').classList.remove('hidden');
  $('info-ok').focus();
  $('info-ok').addEventListener('click', () => {
    $('info-modal').classList.add('hidden');
    if (returnFocus && returnFocus.focus) returnFocus.focus();
    if (onOk) onOk();
  });
}

function bindHomeActions() {
  $('home-howto').addEventListener('click', () => {
    openInfo(
      '📖 玩法说明',
      `<div class="modal-note">
       <b>视觉比例</b>：滑块 / 拖拽 / ±1% 微调 / 方向键（Shift=10%）都能改估测，量程固定 10⁻⁶~10⁶，刻度不会泄题。<br>
       <b>计分</b>：看对数误差——比例差 6% 以内满分，差约 5 倍归零；揭晓按「倍数关系」表达。<br>
       <b>每日一题</b>：按固定排期出题，同天重复打卡不重复计数，断签从 1 重来。<br>
       <b>生存</b>：15 秒/题，超时 -3，答错每差 1 个零扣 1 血，极准回血 +1。<br>
       <b>数量级</b>：支持 12亿、1.2e9、1,200,000,000 三种写法。</div>`
    );
  });
  $('home-achievements').addEventListener('click', () => {
    const rows = ACHIEVEMENTS.map((a) => {
      const got = ach.unlocked[a.id];
      return `<div class="setting-row"><span>${got ? a.icon : '🔒'} ${a.name}${got ? '' : ' <small style="color:var(--sub)">（未解锁）</small>'}</span><span style="font-size:11px;color:var(--sub)">${a.desc}</span></div>`;
    }).join('');
    openInfo('🏆 成就', rows);
  });
  $('back-btn').addEventListener('click', () => {
    renderHome();
    showScreen('home');
  });
}

// ---------- 首局互动引导（GDD P1-3） ----------
const GUIDE_STEPS = [
  { el: 'v-slider', text: '拖动这条滑块，把目标物调到你认为的真实比例——刻度是固定的，不会泄题。' },
  { el: 'v-fine-group', text: '觉得差一点？按住 ±1% 微调慢慢挪；方向键也行（按住 Shift 是 10%）。' },
  { el: 'v-lock', text: '调好了就点「锁定答案」，看看真实比例和你的估测差多少。' },
];
let guideIdx = 0;

function startGuide() {
  guideIdx = 0;
  $('guide-layer').classList.remove('hidden');
  renderGuideStep();
}

function renderGuideStep() {
  const step = GUIDE_STEPS[guideIdx];
  const target = step.el === 'v-fine-group' ? document.querySelector('.fine-row') : $(step.el);
  if (!target) return endGuide();
  const r = target.getBoundingClientRect();
  const spot = $('guide-spot');
  spot.style.left = Math.max(6, r.left - 6) + 'px';
  spot.style.top = Math.max(6, r.top - 6) + 'px';
  spot.style.width = Math.min(window.innerWidth - 12, r.width + 12) + 'px';
  spot.style.height = r.height + 12 + 'px';
  $('guide-text').textContent = step.text;
  $('guide-next').textContent = guideIdx >= GUIDE_STEPS.length - 1 ? '开始！' : '下一步';
}

function endGuide() {
  $('guide-layer').classList.add('hidden');
  store.setItem('bsz_guide_done', '1');
}

function bindGuide() {
  $('guide-next').addEventListener('click', () => {
    guideIdx += 1;
    if (guideIdx >= GUIDE_STEPS.length) endGuide();
    else renderGuideStep();
  });
  $('guide-skip').addEventListener('click', endGuide);
  window.addEventListener('resize', () => {
    if (!$('guide-layer').classList.contains('hidden')) renderGuideStep();
  });
}

// ---------- 启动 ----------
async function boot() {
  applySettings();
  bindSettings();
  bindHomeActions();
  bindGuide();
  initVisual(ctx);
  initNumeric(ctx);

  await loadPack();
  renderHome();
  showScreen('home');
}

boot();
