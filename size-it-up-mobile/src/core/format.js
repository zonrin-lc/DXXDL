// ResultPresenter 的数值格式化部分（GDD 9.4 / 9.6 要求策略模块化，与计分解耦）

export function fmtSize(m) {
  return m >= 1
    ? (m >= 1000 ? Math.round(m).toLocaleString('zh-CN') : trimNum(m)) + ' 米'
    : Math.round(m * 100) + ' 厘米';
}

function trimNum(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function fmtRatio(r) {
  if (r >= 1000) return Math.round(r).toLocaleString('zh-CN') + ' 倍';
  if (r >= 1) return r.toFixed(1) + ' 倍';
  if (r >= 0.0001) return (r * 100).toFixed(r >= 0.01 ? 0 : 2) + '%';
  return r.toExponential(1) + ' 倍';
}

/** 中文大数格式化（万/亿/万亿/亿亿），玩法本体的一部分（GDD 9.6） */
export function fmtCN(n) {
  if (!isFinite(n)) return '—';
  const t = (x) => (x >= 10 ? Math.round(x).toLocaleString('zh-CN') : String(Math.round(x * 10) / 10));
  const abs = Math.abs(n);
  if (abs >= 1e16) return t(n / 1e16) + ' 亿亿';
  if (abs >= 1e12) return t(n / 1e12) + ' 万亿';
  if (abs >= 1e8) return t(n / 1e8) + ' 亿';
  if (abs >= 1e4) return t(n / 1e4) + ' 万';
  return Math.round(n).toLocaleString('zh-CN');
}

export function fmtInput(n) {
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 4 });
}

/**
 * 解析玩家输入（GDD 4.1 输入规范 / 12.2 测试项）。
 * 支持：纯数字、千分位逗号、科学计数法（1.2e5 / 1.2E+5）、中文大数单位（12万 / 3.5万亿 / 2亿亿）。
 * 返回正有限数，否则 null（非法、空、负、0、NaN、Infinity 一律拒收）。
 */
export function parseNumericInput(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().replace(/[,，\s]/g, '');
  if (!s) return null;
  // 中文大数单位后缀（12万 / 1.5亿 / 2万亿 / 3亿亿）
  const u = s.match(/^(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)(万亿|亿亿|万|亿)$/);
  if (u) {
    const mult = { 万: 1e4, 亿: 1e8, 万亿: 1e12, 亿亿: 1e16 }[u[2]];
    const v = Number(u[1]) * mult;
    return isFinite(v) && v > 0 ? v : null;
  }
  // 纯数字 / 千分位已去除 / 科学计数法
  if (!/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(s)) return null;
  const v = Number(s);
  return isFinite(v) && v > 0 ? v : null;
}

/** 提交前标准化显示（GDD 4.1：提交前显示标准化后的数值） */
export function normalizeForDisplay(v) {
  if (!isFinite(v)) return '';
  return v >= 1e15 ? v.toExponential(3) : fmtInput(v);
}
