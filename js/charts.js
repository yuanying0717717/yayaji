/* 轻量图表（CSS 柱状 + SVG 折线），无第三方依赖 */
const Charts = {
  /* 分组柱状图：items = [{label, a, b}] */
  groupBars(el, items, opt) {
    const max = Math.max(1, ...items.map(i => Math.max(i.a || 0, i.b || 0)));
    el.innerHTML = `
      <div class="legend"><span><i style="background:${opt.aColor || 'var(--primary)'}"></i>${opt.aName || 'A'}</span>
      <span><i style="background:${opt.bColor || 'var(--feed)'}"></i>${opt.bName || 'B'}</span></div>
      <div class="bars">${items.map(i => `
        <div class="bar" title="${U.esc(i.label)}：${opt.aName || ''}${U.fmtNum(i.a, 0)}${opt.unit || ''} / ${opt.bName || ''}${U.fmtNum(i.b, 0)}${opt.unit || ''}">
          <div class="b" style="height:${Math.max((i.a || 0) / max * 100, i.a ? 2 : 0)}%;background:${opt.aColor || 'var(--primary)'}"></div>
          <div class="b" style="height:${Math.max((i.b || 0) / max * 100, i.b ? 2 : 0)}%;background:${opt.bColor || 'var(--feed)'}"></div>
          ${items.length <= 8 ? `<div class="l">${U.esc(i.label)}</div>` : ''}
        </div>`).join('')}</div>`;
  },

  /* 堆叠柱状图：items = [{label, parts:[{value,color}]}] */
  stackBars(el, items, opt) {
    const max = Math.max(1, ...items.map(i => i.parts.reduce((s, p) => s + (p.value || 0), 0)));
    el.innerHTML = `
      <div class="legend">${(opt.legend || []).map(l => `<span><i style="background:${l.color}"></i>${l.name}</span>`).join('')}</div>
      <div class="bars">${items.map(i => `
        <div class="bar" title="${U.esc(i.label)}：${i.parts.map(p => p.name + (p.value || 0)).join(' / ')}${opt.unit || ''}">
          <div style="height:${Math.max(i.parts.reduce((s, p) => s + (p.value || 0), 0) / max * 100, i.parts.some(p => p.value) ? 2 : 0)}%;width:100%;max-width:26px;display:flex;flex-direction:column;justify-content:flex-end;border-radius:5px;overflow:hidden">
            ${i.parts.map(p => p.value > 0 ? `<div style="flex:${p.value};background:${p.color}"></div>` : '').join('')}
          </div>
          ${items.length <= 8 ? `<div class="l">${U.esc(i.label)}</div>` : ''}
        </div>`).join('')}</div>`;
  },

  /* 折线图：points = [{x, y}]，opt.ref=[{v,label,color}] 参考线 */
  line(el, points, opt) {
    opt = opt || {};
    const w = el.clientWidth || 320, h = opt.h || 150, pad = 30;
    if (!points.length) { el.innerHTML = '<div class="empty" style="padding:30px 0">暂无数据</div>'; return; }
    const ys = points.map(p => p.y);
    const min = opt.min != null ? opt.min : Math.min(...ys, 0);
    const max = opt.max != null ? opt.max : Math.max(...ys, 1);
    const X = i => points.length === 1 ? w / 2 : pad + (w - 2 * pad) * i / (points.length - 1);
    const Y = v => h - pad - ((v - min) / ((max - min) || 1)) * (h - 2 * pad);
    const color = opt.color || '#6E93AC';
    const pts = points.map((p, i) => X(i).toFixed(1) + ',' + Y(p.y).toFixed(1)).join(' ');
    const refs = (opt.ref || []).map(r => {
      const y = Y(r.v);
      return `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="${r.color || '#D9A0A0'}" stroke-width="1" stroke-dasharray="4 4"/>
        <text x="${w - pad}" y="${y - 3}" text-anchor="end" font-size="9" fill="${r.color || '#D9A0A0'}">${r.label || r.v}</text>`;
    }).join('');
    const ticks = [0, .5, 1].map(f => {
      const v = min + (max - min) * f, y = Y(v);
      return `<line x1="${pad}" y1="${y}" x2="${w - pad}" y2="${y}" stroke="#EFEAE2" stroke-dasharray="3 4"/>
        <text x="2" y="${y + 3}" font-size="9" fill="#9A9A9A">${U.fmtNum(v, 1)}</text>`;
    }).join('');
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}">
      ${ticks}${refs}
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      ${points.map((p, i) => `<circle cx="${X(i)}" cy="${Y(p.y)}" r="3.2" fill="#fff" stroke="${color}" stroke-width="1.8"/>
        <text x="${X(i)}" y="${Y(p.y) - 8}" text-anchor="middle" font-size="9" fill="#6E93AC">${U.fmtNum(p.y, 1)}</text>`).join('')}
    </svg>`;
  }
};
