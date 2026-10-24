// 动画与庆祝层（GDD 8.2）：数字滚动、彩带、提示条。
// 所有动画尊重「减少动态效果」偏好（prefers-reduced-motion 或用户设置）。

let reducedMotion = null;

export function setReducedMotion(v) {
  reducedMotion = v;
  // 同步 CSS 侧：reduce-motion=强制减少；motion-forced=强制开启（覆盖系统 reduce 媒体查询）
  // v=null 表示跟随系统，两者都不加，由媒体查询接管
  if (typeof document !== 'undefined' && document.body) {
    document.body.classList.toggle('reduce-motion', v === true);
    document.body.classList.toggle('motion-forced', v === false);
  }
}
export function prefersReduced() {
  if (reducedMotion != null) return reducedMotion;
  try {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    return false;
  }
}

export function rollCount(el, to, ms) {
  if (!el) return;
  if (prefersReduced()) {
    el.textContent = String(to);
    return;
  }
  const t0 = performance.now();
  const dur = ms || 600;
  const step = (t) => {
    if (!document.body.contains(el)) return;
    const k = Math.min(1, (t - t0) / dur);
    el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function confetti() {
  if (prefersReduced()) return;
  try {
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99';
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    // 深橙与站点 token 同值；读不到（极端环境）时回退字面量
    const orangeDeep =
      (getComputedStyle(document.documentElement).getPropertyValue('--orange-deep') || '').trim() || '#f0a02f';
    const colors = ['#2f6bff', '#e5484d', '#2f9e63', orangeDeep, '#7048e8'];
    const ps = Array.from({ length: 90 }, () => ({
      x: Math.random() * cv.width,
      y: -20 - Math.random() * cv.height * 0.3,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      s: 4 + Math.random() * 6,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
    const t0 = performance.now();
    const frame = (t) => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
        ctx.restore();
      });
      if (t - t0 < 2500 && document.body.contains(cv)) requestAnimationFrame(frame);
      else cv.remove();
    };
    requestAnimationFrame(frame);
  } catch (e) {
    /* canvas 不可用时静默跳过，不影响结算 */
  }
}

/** 顶部提示条；seenKey 存在时只提示一次 */
export function showHint(barId, text, seenKey, store) {
  const bar = document.getElementById(barId);
  if (!bar) return;
  if (seenKey && store && store.getItem('seen_' + seenKey)) return;
  if (seenKey && store) store.setItem('seen_' + seenKey, '1');
  // 先清空、显示，再于下一帧写入文本：live region 已渲染，首次出现才能被播报
  bar.textContent = '';
  bar.classList.remove('hidden');
  clearTimeout(bar._t);
  bar._t = setTimeout(() => bar.classList.add('hidden'), 6000);
  requestAnimationFrame(() => {
    bar.textContent = text;
  });
}
