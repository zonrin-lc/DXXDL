import { describe, it, expect } from 'vitest';
import { fmtCN, fmtSize, fmtRatio, fmtInput, parseNumericInput, normalizeForDisplay } from '../src/core/format.js';

describe('中文大数格式化（GDD 9.6 / 12.2）', () => {
  it('万/亿/万亿/亿亿 单位换算含义一致', () => {
    expect(fmtCN(12345)).toBe('1.2 万');
    expect(fmtCN(123456789)).toBe('1.2 亿');
    expect(fmtCN(1.2e8)).toBe('1.2 亿');
    expect(fmtCN(3e12)).toBe('3 万亿'); // 不足 1 亿亿时用万亿
    expect(fmtCN(8e14)).toBe('800 万亿');
    expect(fmtCN(2e16)).toBe('2 亿亿');
    expect(fmtCN(1e4)).toBe('1 万');
    expect(fmtCN(9999)).toBe('9,999');
    expect(fmtCN(499)).toBe('499');
  });
  it('极大值与非有限值安全', () => {
    expect(fmtCN(Infinity)).toBe('—');
    expect(fmtCN(NaN)).toBe('—');
    expect(fmtCN(1e30)).toContain('亿亿');
  });
  it('科学计数法 ↔ 中文大数互转（parse 往返）', () => {
    for (const v of [8e14, 5.9e6, 7.35e22, 2e3, 1.08e6, 499]) {
      const cn = fmtCN(v);
      const back = parseNumericInput(cn.replace(/,/g, ''));
      // 互转误差不超过显示精度（一位小数）
      expect(back).not.toBeNull();
      expect(Math.abs(Math.log10(back / v))).toBeLessThan(0.05);
    }
    expect(parseNumericInput('1.2e5')).toBe(120000);
    expect(parseNumericInput('1.2E+5')).toBe(120000);
    expect(parseNumericInput('3e-3')).toBeCloseTo(0.003, 10);
  });
  it('中文单位后缀输入', () => {
    expect(parseNumericInput('12万')).toBe(120000);
    expect(parseNumericInput('1.5亿')).toBe(1.5e8);
    expect(parseNumericInput('2万亿')).toBe(2e12);
    expect(parseNumericInput('3亿亿')).toBe(3e16);
    expect(parseNumericInput('800 万亿'.replace(/\s/g, ''))).toBe(8e14);
  });
});

describe('输入解析（GDD 4.1 输入规范 / 12.2 非法输入）', () => {
  it('只接受有效正数', () => {
    expect(parseNumericInput('42')).toBe(42);
    expect(parseNumericInput('  42  ')).toBe(42);
    expect(parseNumericInput('1,234,567')).toBe(1234567);
    expect(parseNumericInput('1，234')).toBe(1234); // 中文逗号
  });
  it('非法、空值、负数、零、非有限值一律拒收', () => {
    for (const bad of ['', '   ', 'abc', '-5', '0', '-0', 'NaN', 'Infinity', null, undefined, '1.2.3', '--4']) {
      expect(parseNumericInput(bad)).toBeNull();
    }
  });
  it('提交前标准化显示保持数值含义', () => {
    expect(normalizeForDisplay(1234.5)).toBe('1,234.5');
    expect(normalizeForDisplay(1.5e20)).toMatch(/e\+20$/i);
  });
});

describe('尺寸与比例展示', () => {
  it('公制尺寸格式化', () => {
    expect(fmtSize(1.7)).toBe('1.7 米');
    expect(fmtSize(0.25)).toBe('25 厘米');
    expect(fmtSize(8849)).toBe('8,849 米');
  });
  it('比例格式化', () => {
    expect(fmtRatio(2)).toBe('2.0 倍');
    expect(fmtRatio(0.5)).toBe('50%');
    expect(fmtRatio(2000)).toContain('倍');
  });
  it('fmtInput 千分位', () => {
    expect(fmtInput(1234567.891234)).toBe('1,234,567.8912');
  });
});
