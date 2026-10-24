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
import { initNumeric, startNumeric, fmtDateCN } from './numeric.js';

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
  // 先清空并显示、再于下一帧写入文本：live region 已渲染，首次出现才能被播报
  el.textContent = '';
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2400);
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
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
let currentScreen = 'home';

function showScreen(name) {
  // 离开数值屏前确认草稿去向：返回主页可取消；进入结算为局终流程，仅提示不拦截
  if (currentScreen === 'numeric' && name !== 'numeric') {
    const d = $('n-draft');
    if (d && d.value.trim()) {
      if (name === 'home' && !confirm('草稿还没有用完，离开将丢弃，确定返回主页？')) return false;
      d.value = '';
    }
  }
  currentScreen = name;
  ['home', 'visual', 'numeric', 'end'].forEach((s) => {
    $('screen-' + s).classList.toggle('hidden', s !== name);
  });
  $('back-row').style.display = name === 'home' ? 'none' : 'block';
  window.scrollTo(0, 0);
  // URL hash 反映当前屏（不做 hashchange 监听，仅初始状态展示）
  if (location.hash !== '#' + name) location.hash = name;
  // 焦点移到新屏标题，避免落回 body
  const heading = $('screen-' + name).querySelector('.sr-only');
  if (heading) heading.focus();
  return true;
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
      `<div class="ic" aria-hidden="true">${m.icon}</div>` +
      `<div class="tx"><span class="ttl">${m.title}${tag}</span><span class="desc">${m.desc}</span></div>${right}`;
    card.addEventListener('click', () => startMode(m.id));
    list.appendChild(card);
  });
  list.setAttribute('aria-busy', 'false'); // 骨架已被真实卡片替换，退出载入态

  const packInfo = $('pack-info');
  const errs = validatePack(pack);
  // 告警与常规信息分层：<b class="warn"> 走醒目色（≥4.5:1）
  packInfo.innerHTML = `内容包 v${(pack && pack.version) || '?'} · ${packSource}` +
    (errs.length ? ` · <b class="warn">⚠️ ${errs.length} 处校验问题</b>` : '');
  if (!store.persistent) packInfo.innerHTML += ' · <b class="warn">⚠️ 本次记录不会持久保存</b>';

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
    return `<li>${squareFor(s)} <b>${name}</b> · ${s} 分</li>`;
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
      list: `<li>题目：<b>${(payload.question && payload.question.q) || ''}</b></li>`,
      shareText: `【比大小 · 每日一题】${fmtDateCN(payload.dateKey || today, true)} 得 ${score} 分 ${squareFor(score)}　连胜 ${next.currentStreak} 天`,
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
      list: `<li>本局答题 <b>${payload.answered}</b> 题 · 最佳 <b>${Math.max(best, payload.answered)}</b> 题</li>`,
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
    `<ul class="roundlist">${opts.list || ''}</ul>` +
    `<button class="btn green" data-act="replay"><span aria-hidden="true">🔄</span> 再来一局</button>` +
    `<button class="btn sub" data-act="share"><span aria-hidden="true">📤</span> 分享成绩</button>` +
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
  // aria-checked 表示有效状态；「跟随系统」态由标签文案单独表达
  $('set-motion').setAttribute('aria-checked', String(motion == null ? sysReduce : motion));
  $('set-motion-label').textContent =
    '🎬 减少动态效果 · ' + (motion == null ? '跟随系统' : motion ? '已减少' : '已开启动效');
  $('set-storage').innerHTML = store.persistent
    ? '设置与成绩保存在本机浏览器中。'
    : '<b class="warn">⚠️ 浏览器禁用了本地存储：本次记录不会持久保存。</b>';
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
  // 三态循环：跟随系统(null) → 强制减少('1') → 强制开启('0') → 跟随系统
  $('set-motion').addEventListener('click', () => {
    const cur = store.getItem('bsz_set_motion');
    const next = cur == null ? '1' : cur === '1' ? '0' : null;
    if (next == null) store.removeItem('bsz_set_motion');
    else store.setItem('bsz_set_motion', next);
    applySettings();
  });
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
    `<h2 class="modal-title" id="info-title">${title}</h2>${html}` +
    `<button class="btn gap-top" id="info-ok">${btnText || '知道了'}</button>`;
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
      return `<li class="setting-row"><span>${got ? a.icon : '🔒'} ${a.name}${got ? '' : ' <small style="color:var(--sub)">（未解锁）</small>'}</span><span style="font-size:var(--fs-11);color:var(--sub)">${a.desc}</span></li>`;
    }).join('');
    openInfo('🏆 成就', `<ul class="ach-list">${rows}</ul>`);
  });
  $('back-btn').addEventListener('click', () => {
    // showScreen 内含草稿确认，被取消时不切换
    if (showScreen('home') === false) return;
    renderHome();
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
  $('guide-next').focus(); // 焦点进入引导层
}

function renderGuideStep() {
  const step = GUIDE_STEPS[guideIdx];
  const target = step.el === 'v-fine-group' ? document.querySelector('.fine-row') : $(step.el);
  if (!target) return endGuide();
  const r = target.getBoundingClientRect();
  const spot = $('guide-spot');
  spot.style.width = Math.min(window.innerWidth - 12, r.width + 12) + 'px';
  spot.style.height = r.height + 12 + 'px';
  // 位移走 transform（不触发布局），尺寸直设（三步尺寸接近，无过场也自然）
  spot.style.transform = `translate(${Math.max(6, r.left - 6)}px, ${Math.max(6, r.top - 6)}px)`;
  $('guide-text').textContent = step.text;
  $('guide-next').textContent = guideIdx >= GUIDE_STEPS.length - 1 ? '开始！' : '下一步';
}

function endGuide() {
  $('guide-layer').classList.add('hidden');
  store.setItem('bsz_guide_done', '1');
  // 焦点从已隐藏的按钮移回当前屏首个输入，避免落回 body
  if (!$('screen-visual').classList.contains('hidden')) $('v-slider').focus();
}

function bindGuide() {
  $('guide-next').addEventListener('click', () => {
    guideIdx += 1;
    if (guideIdx >= GUIDE_STEPS.length) endGuide();
    else renderGuideStep();
  });
  $('guide-skip').addEventListener('click', endGuide);
  // 点遮罩（气泡以外区域）跳过引导
  $('guide-layer').addEventListener('click', (e) => {
    if (!$('guide-bubble').contains(e.target)) endGuide();
  });
  window.addEventListener('resize', () => {
    if (!$('guide-layer').classList.contains('hidden')) renderGuideStep();
  });
}

// ---------- 模态层焦点陷阱（设置 / 说明 / 引导通用） ----------
const FOCUSABLE_SEL =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** 当前应模态化的层及其关闭方式（Esc 走同一路径，保证焦点还原一致） */
function activeLayer() {
  if (!$('settings-modal').classList.contains('hidden')) {
    return { el: $('settings-modal'), close: () => $('set-close').click() };
  }
  if (!$('info-modal').classList.contains('hidden')) {
    return {
      el: $('info-modal'),
      close: () => {
        const ok = $('info-ok');
        if (ok) ok.click(); // 说明弹层 = 点确认关闭
      },
    };
  }
  if (!$('guide-layer').classList.contains('hidden')) {
    return { el: $('guide-layer'), close: endGuide };
  }
  return null;
}

function bindLayerTrap() {
  document.addEventListener('keydown', (e) => {
    const layer = activeLayer();
    if (!layer) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      layer.close();
      return;
    }
    if (e.key !== 'Tab') return;
    // 捕获 Tab：焦点在层内首尾循环
    const nodes = Array.from(layer.el.querySelectorAll(FOCUSABLE_SEL)).filter((n) => n.offsetParent !== null);
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement;
    const inside = nodes.indexOf(active) >= 0;
    if (e.shiftKey) {
      if (!inside || active === first) {
        e.preventDefault();
        last.focus();
      }
    } else if (!inside || active === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

// ---------- 启动 ----------
async function boot() {
  applySettings();
  bindSettings();
  bindHomeActions();
  bindGuide();
  bindLayerTrap();
  initVisual(ctx);
  initNumeric(ctx);

  await loadPack();
  renderHome();
  // 初始 hash：#home 可直接落地；模式/结算屏没有可恢复的会话（打开即为死屏），
  // 故统一回首页，showScreen 会把 hash 规范为 #home（详见交付报告「可跳过项」）
  showScreen('home');
}

boot();
