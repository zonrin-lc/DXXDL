import { describe, it, expect } from 'vitest';
import { damageFor, applyAnswer, applyTimeout, makeTimer, timerColor, pickSurvivalQuestion } from '../src/core/survival.js';
import { SURVIVAL } from '../src/core/constants.js';

describe('生存扣血与回血（GDD 5.2）', () => {
  it('答错扣 max(1, round(d))', () => {
    expect(damageFor(0.06)).toBe(1);
    expect(damageFor(0.5)).toBe(1);
    expect(damageFor(1.4)).toBe(1);
    expect(damageFor(1.5)).toBe(2);
    expect(damageFor(2.5)).toBe(3); // JS round(2.5)=3
    expect(damageFor(3.2)).toBe(3);
    expect(damageFor(4.6)).toBe(5);
  });
  it('极准回血 +1（d < 0.06），上限 10', () => {
    expect(applyAnswer(5, 0.01)).toEqual({ life: 6, delta: 1, type: 'heal' });
    expect(applyAnswer(10, 0.01)).toEqual({ life: 10, delta: 0, type: 'heal' });
  });
  it('扣血与回血互斥，单题只发生其一', () => {
    const heal = applyAnswer(7, 0.03);
    expect(heal.delta).toBeGreaterThanOrEqual(0);
    const dmg = applyAnswer(7, 2);
    expect(dmg.delta).toBeLessThan(0);
    expect(dmg.type).toBe('damage');
  });
  it('超时直接扣 3，生命不为负', () => {
    expect(applyTimeout(10)).toEqual({ life: 7, delta: -3, type: 'timeout' });
    expect(applyTimeout(2)).toEqual({ life: 0, delta: -2, type: 'timeout' });
    expect(SURVIVAL.timeoutDamage).toBe(3);
  });
  it('生命归零即结束条件', () => {
    expect(applyAnswer(1, 4).life).toBe(0);
  });
});

describe('基于时间戳的计时（GDD 5.3 后台节流修复）', () => {
  it('不依赖 tick 累减：真实时间推进即正确扣减', () => {
    let now = 1000;
    const t = makeTimer(15000, () => now);
    t.start();
    expect(t.remainingMs()).toBe(15000);
    now += 4000;
    expect(t.remainingMs()).toBe(11000);
    now += 100000; // 后台节流 100 秒：恢复后按时间戳一次算清
    expect(t.remainingMs()).toBe(0);
  });
  it('切后台 30 秒后恢复，剩余时间与规则一致', () => {
    let now = 0;
    const t = makeTimer(15000, () => now);
    t.start();
    now += 30000;
    expect(t.remainingMs()).toBe(0);
    expect(t.running()).toBe(false);
  });
  it('stop 返回已用时间且不可再变化', () => {
    let now = 0;
    const t = makeTimer(15000, () => now);
    t.start();
    now += 5000;
    const used = t.stop();
    expect(used).toBe(5000);
    now += 10000;
    expect(t.remainingMs()).toBe(15000); // 已停止：重置展示值，不继续扣减
  });
  it('进度条配色 绿→橙→红', () => {
    expect(timerColor(12000, 15000)).toBe('green');
    expect(timerColor(6000, 15000)).toBe('orange');
    expect(timerColor(3000, 15000)).toBe('red');
    expect(timerColor(0, 15000)).toBe('red');
  });
});

describe('生存抽题（GDD 5.3）', () => {
  const pool = [
    { id: 'a', difficulty: 1 },
    { id: 'b', difficulty: 2 },
    { id: 'c', difficulty: 3 },
  ];
  it('优先抽未答过的题', () => {
    const q = pickSurvivalQuestion(pool, new Set(['a', 'b']), () => 0);
    expect(q.id).toBe('c');
  });
  it('全部答过后可重复', () => {
    const q = pickSurvivalQuestion(pool, new Set(['a', 'b', 'c']), () => 0.9);
    expect(q).toBeTruthy();
  });
});
