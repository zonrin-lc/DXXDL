// AudioFeedback：音效、震动与各自独立开关（GDD 8.3【本版确定】：音效与震动分离）
// 震动在不支持的设备上安静降级；不支持音频权限时静默处理不阻塞流程。

let ctx = null;
let prefs = { sfx: true, vibrate: true };

export function setPrefs(p) {
  prefs = { ...prefs, ...p };
}
export function getPrefs() {
  return { ...prefs };
}
export function toggleSfx() {
  prefs.sfx = !prefs.sfx;
  return prefs.sfx;
}
export function toggleVibrate() {
  prefs.vibrate = !prefs.vibrate;
  return prefs.vibrate;
}

function beep(freq, dur, type, vol, when) {
  if (!prefs.sfx) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    const t0 = ctx.currentTime + (when || 0);
    g.gain.setValueAtTime(vol || 0.15, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  } catch (e) {
    /* 音频权限限制：静默降级 */
  }
}

export const SFX = {
  lock: () => beep(220, 0.08, 'square', 0.07),
  good: () => {
    beep(523, 0.12, 'sine', 0.14);
    beep(784, 0.18, 'sine', 0.14, 0.1);
  },
  mid: () => beep(392, 0.15, 'sine', 0.11),
  bad: () => beep(180, 0.22, 'sawtooth', 0.09),
  perfect: () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.16, 'sine', 0.14, i * 0.09)),
  end: () => [392, 494, 587, 784].forEach((f, i) => beep(f, 0.2, 'triangle', 0.11, i * 0.12)),
  tick: () => beep(880, 0.04, 'square', 0.05),
  achievement: () => [659, 880, 1175].forEach((f, i) => beep(f, 0.18, 'triangle', 0.13, i * 0.1)),
};

export function buzz(p) {
  if (!prefs.vibrate) return;
  try {
    navigator.vibrate && navigator.vibrate(p);
  } catch (e) {
    /* 不支持震动的设备安静降级 */
  }
}

export function feedbackForScore(score) {
  if (score === 100) {
    SFX.perfect();
    buzz([15, 40, 15]);
  } else if (score >= 90) {
    SFX.good();
    buzz(20);
  } else if (score >= 60) {
    SFX.mid();
    buzz(12);
  } else {
    SFX.bad();
    buzz([30, 30, 30]);
  }
}
