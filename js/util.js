/* 通用工具函数 */
const U = {
  esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },
  pad(n) { return (n < 10 ? '0' : '') + n; },
  isoLocal(ts) { const d = new Date(ts); return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()) + 'T' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()); },
  isoDate(ts) { const d = new Date(ts); return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()); },
  parseLocal(s) { return new Date(s).getTime(); },
  fmtHM(ts) { const d = new Date(ts); return U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()); },
  fmtMD(ts) { const d = new Date(ts); return (d.getMonth() + 1) + '月' + d.getDate() + '日'; },
  fmtMDHM(ts) { return U.fmtMD(ts) + ' ' + U.fmtHM(ts); },
  todayStart() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); },
  dayKey(ts) { const d = new Date(ts); return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()); },
  startOfDay(ts) { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); },
  addDays(ts, n) { return ts + n * 86400000; },
  fmtDur(min) {
    min = Math.round(min || 0);
    const h = Math.floor(min / 60), m = min % 60;
    return h ? h + '小时' + (m ? m + '分' : '') : m + '分钟';
  },
  fmtClock(ms) { // 毫秒 → 1:23:45
    const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (h ? h + ':' : '') + U.pad(m) + ':' + U.pad(sec);
  },
  ageText(baby) {
    if (!baby || !baby.birthday) return '';
    const d = Math.floor((Date.now() - new Date(baby.birthday).getTime()) / 86400000);
    if (d < 0) return '未出生';
    if (d < 30) return '第' + (d + 1) + '天';
    const m = Math.floor(d / 30);
    return m + '个月' + (d % 30) + '天';
  },
  fmtKg(g) { return g == null ? '' : (Math.round(g) / 1000).toFixed(2) + 'kg'; },
  fmtNum(v, d) { return v == null ? '' : (typeof d === 'number' ? v.toFixed(d) : String(Math.round(v))); }
};
