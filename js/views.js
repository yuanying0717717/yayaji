/* 视图渲染：首页 / 记录 / 列表 / 统计 / 设置 */
let curRange = 30, curModule = 'feed';
let listType = 'feed', listFilter = 0, listKw = '';

const shortDay = t => {
  const now = Date.now();
  if (U.dayKey(t) === U.dayKey(now)) return '今天';
  if (U.dayKey(t) === U.dayKey(now - 86400000)) return '昨天';
  const d = new Date(t);
  return (d.getMonth() + 1) + '/' + d.getDate();
};

/* ---------- 首页 ---------- */
function viewHome() {
  const baby = Store.baby();
  if (!baby) { document.getElementById('main').innerHTML = '<div class="empty">请先创建宝宝档案</div>'; return; }
  const today = U.todayStart();
  const recs = Store.recordsOf(baby.id);
  const tRecs = recs.filter(r => r.time >= today).sort((a, b) => b.time - a.time);
  const st = calcToday(tRecs);
  const ongoing = recs.filter(r => (r.type === 'feed' && r.data.mode === 'breast' && !r.data.endTime) || (r.type === 'sleep' && !r.data.endTime))
    .sort((a, b) => b.time - a.time)[0];
  const tpls = Store.templatesOf(baby.id).filter(t => t.onHome).slice(0, 2);
  const homeRecs = tRecs.slice(0, 20);

  document.getElementById('main').innerHTML = `
    ${ongoing ? timerBanner(ongoing) : ''}
    ${backupTip()}
    <div class="minis">
      <div class="mini"><div class="v">${st.feedCount}</div><div class="k">喂奶(次)</div></div>
      <div class="mini"><div class="v">${st.milkMl}ml</div><div class="k">奶量</div></div>
      <div class="mini"><div class="v">${st.diaperCount}</div><div class="k">排便</div></div>
      <div class="mini"><div class="v">${durShort(st.sleepMin)}</div><div class="k">睡眠</div></div>
    </div>
    <div class="qcard qfeed" onclick="startQuick('feed')">
      <div class="ico">🍼</div>
      <div><div class="t">记喂奶</div><div class="s">母乳 · 开始即计时</div></div>
    </div>
    <div class="qcard qdiaper" onclick="startQuick('diaper')">
      <div class="ico">🧷</div>
      <div><div class="t">记尿布</div><div class="s">小便 / 大便 / 性状颜色</div></div>
    </div>
    <div class="qcard qsleep" onclick="startQuick('sleep')">
      <div class="ico">🌙</div>
      <div><div class="t">记睡眠</div><div class="s">点一下入睡 · 再点醒来</div></div>
    </div>
    ${tpls.map(t => `<div class="qcard qcustom" onclick="openTemplateSheet('${t.id}')">
      <div class="ico">⭐</div><div><div class="t">${U.esc(t.name)}</div><div class="s">自定义记录</div></div></div>`).join('')}
    <div class="sec-title">今日时间线 <span class="more" onclick="go('records')">全部 ›</span></div>
    ${homeRecs.length ? `<div class="tl">${homeRecs.map(tlItem).join('')}</div>`
      : '<div class="empty">今天还没有记录<br>点上方卡片，3 秒记一笔</div>'}
  `;
}

/* 每周备份提醒：距上次导出超过 7 天且未手动关闭过，首页显示提示条 */
function backupTip() {
  const s = Store.db.settings || {};
  const now = Date.now();
  const WEEK = 7 * 86400000;
  const lastAt = s.lastBackupAt || 0;
  const lastDim = s.lastBackupDismiss || 0;
  if (lastAt && now - lastAt < WEEK) return '';
  if (lastDim && now - lastDim < WEEK) return '';
  const days = lastAt ? Math.max(1, Math.floor((now - lastAt) / 86400000)) : 0;
  const msg = lastAt ? '距上次备份已 ' + days + ' 天，建议每周导出一次' : '数据仅存本机，建议定期导出备份';
  return `<div class="bk-tip">💾<div class="bk-msg">${msg}</div>
    <button class="bk-btn" onclick="go('settings')">去备份</button>
    <button class="bk-x" onclick="dismissBackupTip()">知道了</button></div>`;
}

function calcToday(recs) {
  const feeds = recs.filter(r => r.type === 'feed');
  const milkMl = feeds.filter(r => r.data.mode === 'bottle').reduce((s, r) => s + (r.data.amount || 0), 0)
    + feeds.filter(r => r.data.mode === 'pump').reduce((s, r) => s + (r.data.leftMl || 0) + (r.data.rightMl || 0), 0);
  const diapers = recs.filter(r => r.type === 'diaper');
  const sleepMin = recs.filter(r => r.type === 'sleep' && r.data.durationMin).reduce((s, r) => s + (r.data.durationMin || 0), 0);
  return { feedCount: feeds.length, milkMl: Math.round(milkMl), diaperCount: diapers.length, sleepMin };
}

function durShort(min) {
  min = Math.round(min || 0);
  const h = Math.floor(min / 60), m = min % 60;
  return h ? h + 'h' + U.pad(m) + 'm' : m + 'm';
}

function timerBanner(r) {
  const isFeed = r.type === 'feed';
  const start = r.data.startTime || r.time;
  return `<div class="timer-banner" onclick="endTimer('${r.id}')">
    <div class="tt">${isFeed ? '🍼 喂奶中' : '🌙 睡眠中'} · 已<b id="timerTxt" data-id="${r.id}">${U.fmtClock(Date.now() - start)}</b></div>
    <div class="go">点击结束</div></div>`;
}

function tlItem(r) {
  const s = Forms.summary(r);
  const dataT = U.esc((s.text + ' ' + s.note).toLowerCase());
  const onClick = r.type === 'custom'
    ? `openTemplateSheet('${r.data.templateId}','${r.id}')`
    : `openRecordSheet('${r.type}','${r.id}')`;
  return `<div class="tl-item" data-t="${dataT}" onclick="${onClick}">
    <div class="tl-ico">${s.ico}</div>
    <div class="tl-mid">
      <div class="tl-time">${U.fmtHM(r.time)}</div>
      <div class="tl-sum">${U.esc(s.text)}</div>
      ${s.note ? `<div class="tl-note">${U.esc(s.note)}</div>` : ''}
    </div>
  </div>`;
}

/* ---------- 记录宫格 ---------- */
function viewRecords() {
  const baby = Store.baby();
  if (!baby) return;
  const tpls = Store.templatesOf(baby.id);
  document.getElementById('main').innerHTML = `
    <div class="page-title">记录</div>
    <div class="mod-grid">
      ${['feed', 'diaper', 'sleep', 'vital', 'med', 'checkup'].map(k => {
        const m = Forms.meta[k];
        return `<div class="mod-card" onclick="go('list','${k}')">
          <div class="mico" style="background:${m.color}">${m.ico}</div>
          <div><div class="mt">${m.l}</div><div class="ms">${m.desc}</div></div>
        </div>`;
      }).join('')}
    </div>
    <div class="sec-title">自定义指标</div>
    ${tpls.length ? tpls.map(t => `
      <div class="tpl-row">
        <div class="t">⭐ ${U.esc(t.name)}<div class="ms">${t.fields.length} 个字段</div></div>
        <button class="mini-btn" onclick="openTemplateSheet('${t.id}')">记录</button>
      </div>`).join('')
      : '<div class="empty">可自定义生理指标<br>在「设置 → 自定义记录项」中创建</div>'}
  `;
}

/* ---------- 记录列表 ---------- */
function viewList(type) {
  listType = type;
  listFilter = 0;
  listKw = '';
  renderList();
}

function renderList() {
  const baby = Store.baby();
  const meta = Forms.meta[listType] || Forms.meta.custom;
  let recs = Store.recordsOf(baby.id).filter(r => r.type === listType).sort((a, b) => b.time - a.time);
  const now = Date.now();
  if (listFilter === 7) recs = recs.filter(r => r.time >= now - 7 * 86400000);
  if (listFilter === 30) recs = recs.filter(r => r.time >= now - 30 * 86400000);
  document.getElementById('main').innerHTML = `
    <div class="back-row"><button onclick="go('records')">‹ 返回</button></div>
    <div class="page-title">${meta.ico} ${meta.l} <span style="font-size:13px;color:var(--t2);font-weight:400">${recs.length} 条</span></div>
    <input class="search" placeholder="搜索备注 / 关键词" value="${U.esc(listKw)}" oninput="searchList(this.value)">
    <div class="chips" style="margin-bottom:12px">
      <button class="chip ${listFilter === 0 ? 'on' : ''}" onclick="filterList(0)">全部</button>
      <button class="chip ${listFilter === 7 ? 'on' : ''}" onclick="filterList(7)">近7天</button>
      <button class="chip ${listFilter === 30 ? 'on' : ''}" onclick="filterList(30)">近30天</button>
    </div>
    ${recs.length ? `<div class="tl">${recs.map(tlItem).join('')}</div>` : '<div class="empty">暂无记录</div>'}
    <div class="fab" onclick="openRecordSheet('${listType}')">＋</div>
  `;
}

window.filterList = n => { listFilter = n; renderList(); };
window.searchList = v => {
  listKw = v.toLowerCase();
  document.querySelectorAll('#main .tl-item').forEach(el => {
    const t = el.getAttribute('data-t') || '';
    el.style.display = (listKw && !t.includes(listKw)) ? 'none' : '';
  });
};

/* ---------- 统计 ---------- */
function viewStats() {
  document.getElementById('main').innerHTML = `
    <div class="page-title">统计</div>
    <div class="range-chips">
      <button class="chip ${curRange === 7 ? 'on' : ''}" onclick="setRange(7)">近7天</button>
      <button class="chip ${curRange === 30 ? 'on' : ''}" onclick="setRange(30)">近30天</button>
      <button class="chip ${curRange === 90 ? 'on' : ''}" onclick="setRange(90)">近90天</button>
    </div>
    <div class="chips" style="margin-bottom:12px">
      ${['feed', 'diaper', 'sleep', 'vital', 'med'].map(m => `<button class="chip ${curModule === m ? 'on' : ''}" onclick="setModule('${m}')">${Forms.meta[m].l}</button>`).join('')}
    </div>
    <div id="stats-body"></div>
    <button class="btn primary" style="margin-top:4px" onclick="openReport(${curRange})">📋 一键生成【就医报告】</button>
  `;
  renderStatsBody();
}

window.setRange = n => { curRange = n; renderStatsBody(); };
window.setModule = m => { curModule = m; renderStatsBody(); };

function renderStatsBody() {
  if (!Store.baby()) return;
  if (curModule === 'feed') feedStats(curRange);
  else if (curModule === 'diaper') diaperStats(curRange);
  else if (curModule === 'sleep') sleepStats(curRange);
  else if (curModule === 'vital') vitalStats(curRange);
  else medStats(curRange);
}

function statByDay(recs, days) {
  const arr = [];
  for (let i = days - 1; i >= 0; i--) {
    const t = U.startOfDay(Date.now()) - i * 86400000;
    arr.push({ t, key: U.dayKey(t), items: [] });
  }
  const map = {};
  arr.forEach(d => map[d.key] = d);
  recs.forEach(r => { const d = map[U.dayKey(r.time)]; if (d) d.items.push(r); });
  return arr;
}

const milkOf = fs => fs.filter(r => r.data.mode !== 'breast').reduce((s, r) => s + (r.data.mode === 'bottle' ? (r.data.amount || 0) : (r.data.leftMl || 0) + (r.data.rightMl || 0)), 0);
const breastMinOf = fs => fs.filter(r => r.data.mode === 'breast').reduce((s, r) => s + (r.data.durationMin || 0), 0);

function feedStats(days) {
  const recs = Store.recordsOf(Store.baby().id);
  const body = document.getElementById('stats-body');
  const byDay = statByDay(recs, days);
  const items = byDay.map(d => {
    const fs = d.items.filter(r => r.type === 'feed');
    return { label: shortDay(d.t), a: milkOf(fs), b: breastMinOf(fs) };
  });
  const todayFeeds = byDay[byDay.length - 1].items.filter(r => r.type === 'feed');
  const range = recs.filter(r => r.time >= U.startOfDay(Date.now()) - (days - 1) * 86400000);
  const rangeFeeds = range.filter(r => r.type === 'feed');
  const totalMilk = milkOf(rangeFeeds);
  body.innerHTML = `
    <div class="metric-row">
      <div class="metric"><div class="v">${todayFeeds.length}</div><div class="k">今日喂奶(次)</div></div>
      <div class="metric"><div class="v">${Math.round(milkOf(todayFeeds))}ml</div><div class="k">今日奶量</div></div>
      <div class="metric"><div class="v">${Math.round(totalMilk / days)}ml</div><div class="k">日均奶量</div></div>
    </div>
    <div class="stat-card"><div class="stat-title">每日奶量 & 母乳时长</div><div id="c-feed"></div></div>
    <div class="stat-card"><div class="stat-title">喂养构成</div><div class="dist-row">
      <span class="dist-chip">母乳 ${rangeFeeds.filter(r => r.data.mode === 'breast').length} 次</span>
      <span class="dist-chip">瓶喂 ${rangeFeeds.filter(r => r.data.mode === 'bottle').length} 次</span>
      <span class="dist-chip">挤奶 ${rangeFeeds.filter(r => r.data.mode === 'pump').length} 次</span>
    </div></div>`;
  Charts.groupBars(document.getElementById('c-feed'), items, { aName: '奶量(ml)', bName: '母乳(分)', aColor: 'var(--pd)', bColor: 'var(--feed)', unit: '' });
}

function diaperStats(days) {
  const recs = Store.recordsOf(Store.baby().id);
  const body = document.getElementById('stats-body');
  const byDay = statByDay(recs, days);
  const items = byDay.map(d => {
    const ds = d.items.filter(r => r.type === 'diaper');
    return { label: shortDay(d.t), a: ds.filter(r => r.data.kind !== 'pee').length, b: ds.filter(r => r.data.kind !== 'poop').length };
  });
  const range = recs.filter(r => r.time >= U.startOfDay(Date.now()) - (days - 1) * 86400000);
  const diapers = range.filter(r => r.type === 'diaper');
  const poops = diapers.filter(r => r.data.kind !== 'pee');
  const consis = {}, colors = {};
  poops.forEach(r => (r.data.consis || []).forEach(c => consis[c] = (consis[c] || 0) + 1));
  poops.forEach(r => { if (r.data.color) colors[r.data.color] = (colors[r.data.color] || 0) + 1; });
  const cls = { thin: '稀水便', paste: '糊状便', paste2: '膏状便', formed: '成型便' };
  const colL = { gold: '金黄', yellowgreen: '黄绿', green: '绿色', black: '黑色', blood: '带血丝' };
  const today = diapers.filter(r => U.dayKey(r.time) === U.dayKey(Date.now()));
  body.innerHTML = `
    <div class="metric-row">
      <div class="metric"><div class="v">${today.length}</div><div class="k">今日排便</div></div>
      <div class="metric"><div class="v">${poops.length}</div><div class="k">近${days}天大便</div></div>
      <div class="metric"><div class="v">${consis['thin'] || 0}</div><div class="k">稀水便次数</div></div>
    </div>
    <div class="stat-card"><div class="stat-title">每日排便（大便 vs 小便）</div><div id="c-diaper"></div></div>
    ${Object.keys(consis).length ? `<div class="stat-card"><div class="stat-title">大便性状分布</div><div class="dist-row">${Object.entries(consis).map(([k, v]) => `<span class="dist-chip">${cls[k] || k} ${v}次</span>`).join('')}</div></div>` : ''}
    ${Object.keys(colors).length ? `<div class="stat-card"><div class="stat-title">大便颜色</div><div class="dist-row">${Object.entries(colors).map(([k, v]) => `<span class="dist-chip">${colL[k] || k} ${v}次</span>`).join('')}</div></div>` : ''}
  `;
  Charts.groupBars(document.getElementById('c-diaper'), items, { aName: '大便', bName: '小便', aColor: 'var(--pd)', bColor: 'var(--diaper)' });
}

function sleepStats(days) {
  const recs = Store.recordsOf(Store.baby().id);
  const body = document.getElementById('stats-body');
  const byDay = statByDay(recs, days);
  const items = byDay.map(d => {
    const ss = d.items.filter(r => r.type === 'sleep' && r.data.durationMin);
    const night = ss.filter(r => r.data.env === 'night').reduce((s, r) => s + r.data.durationMin, 0);
    const nap = ss.filter(r => r.data.env !== 'night').reduce((s, r) => s + r.data.durationMin, 0);
    return { label: shortDay(d.t), parts: [{ name: '夜间', value: night, color: 'var(--pd)' }, { name: '小睡', value: nap, color: 'var(--sleep)' }] };
  });
  const sleepsAll = recs.filter(r => r.type === 'sleep' && r.data.durationMin);
  const todaySleep = sleepsAll.filter(r => U.dayKey(r.time) === U.dayKey(Date.now())).reduce((s, r) => s + r.data.durationMin, 0);
  const rangeSleeps = sleepsAll.filter(r => r.time >= U.startOfDay(Date.now()) - (days - 1) * 86400000);
  const avg = rangeSleeps.reduce((s, r) => s + r.data.durationMin, 0) / days;
  const nightRecs = rangeSleeps.filter(r => r.data.env === 'night');
  const nightDays = new Set(nightRecs.map(r => U.dayKey(r.time))).size;
  const nightAvg = nightDays ? nightRecs.reduce((s, r) => s + r.data.durationMin, 0) / nightDays : 0;
  body.innerHTML = `
    <div class="metric-row">
      <div class="metric"><div class="v">${U.fmtDur(todaySleep)}</div><div class="k">今日睡眠</div></div>
      <div class="metric"><div class="v">${U.fmtDur(Math.round(avg))}</div><div class="k">日均睡眠</div></div>
      <div class="metric"><div class="v">${U.fmtDur(Math.round(nightAvg))}</div><div class="k">夜间均值</div></div>
    </div>
    <div class="stat-card"><div class="stat-title">每日睡眠（夜间 vs 小睡）</div><div id="c-sleep"></div></div>`;
  Charts.stackBars(document.getElementById('c-sleep'), items, { legend: [{ name: '夜间睡眠', color: 'var(--pd)' }, { name: '白天小睡', color: 'var(--sleep)' }], unit: '分' });
}

function vitalStats(days) {
  const recs = Store.recordsOf(Store.baby().id);
  const body = document.getElementById('stats-body');
  const range = recs.filter(r => r.time >= U.startOfDay(Date.now()) - (days - 1) * 86400000);
  const vitals = range.filter(r => r.type === 'vital');
  const temps = vitals.filter(r => r.data.temp != null).map(r => ({ x: U.fmtMD(r.time), y: r.data.temp }));
  const weights = recs.filter(r => (r.type === 'vital' || r.type === 'checkup') && r.data.weight != null).map(r => ({ x: U.fmtMD(r.time), y: U.kg(r.data.weight) }));
  const lastTemp = temps.length ? temps[temps.length - 1].y : null;
  const lastWeight = weights.length ? weights[weights.length - 1].y : null;
  const jauRecs = vitals.filter(r => r.data.jaundice && r.data.jaundice !== 'none');
  const eczCount = vitals.filter(r => r.data.eczema && r.data.eczema !== 'none').length;
  body.innerHTML = `
    <div class="metric-row">
      <div class="metric"><div class="v">${lastTemp != null ? lastTemp + '℃' : '—'}</div><div class="k">最近体温</div></div>
      <div class="metric"><div class="v">${lastWeight != null ? lastWeight.toFixed(2) + 'kg' : '—'}</div><div class="k">最新体重</div></div>
      <div class="metric"><div class="v">${vitals.length}</div><div class="k">体征记录</div></div>
    </div>
    <div class="stat-card"><div class="stat-title">体温趋势（红线为 37.5℃ 参考）</div><div id="c-temp"></div></div>
    <div class="stat-card"><div class="stat-title">体重曲线</div><div id="c-w"></div></div>
    ${jauRecs.length ? `<div class="stat-card"><div class="stat-title">黄疸观察（近${days}天）</div><div class="dist-row">${jauRecs.slice(-7).map(r => `<span class="dist-chip">${U.fmtMD(r.time)} ${({ face: '轻度', trunk: '中度', limb: '重度' }[r.data.jaundice])}${r.data.temp != null ? ' · ' + r.data.temp + '℃' : ''}</span>`).join('')}</div></div>` : ''}
    ${eczCount ? `<div class="stat-card"><div class="stat-title">湿疹/皮疹</div><div class="dist-row"><span class="dist-chip">近${days}天记录 ${eczCount} 次</span></div></div>` : ''}
  `;
  Charts.line(document.getElementById('c-temp'), temps, { color: '#D9A0A0', ref: [{ v: 37.5, label: '37.5℃' }] });
  Charts.line(document.getElementById('c-w'), weights, { color: '#6E93AC' });
}

function medStats(days) {
  const recs = Store.recordsOf(Store.baby().id);
  const body = document.getElementById('stats-body');
  const range = recs.filter(r => r.time >= U.startOfDay(Date.now()) - (days - 1) * 86400000);
  const meds = range.filter(r => r.type === 'med');
  const cells = [];
  let streak = 0;
  for (let i = 29; i >= 0; i--) {
    const dayT = U.startOfDay(Date.now()) - i * 86400000;
    cells.push({ day: dayT, has: meds.some(r => U.startOfDay(r.time) === dayT && r.data.vit === 'yes') });
  }
  for (let i = cells.length - 1; i >= 0; i--) {
    if (cells[i].has) streak++;
    else if (i < cells.length - 1) break;
  }
  body.innerHTML = `
    <div class="metric-row">
      <div class="metric"><div class="v">${streak}天</div><div class="k">维D连续打卡</div></div>
      <div class="metric"><div class="v">${meds.length}</div><div class="k">近${days}天用药</div></div>
      <div class="metric"><div class="v">${meds.filter(r => r.data.vit === 'yes').length}</div><div class="k">维D次数</div></div>
    </div>
    <div class="stat-card"><div class="stat-title">维D/AD 近30天打卡</div>
      <div class="vit-grid">${cells.map(c => `<div class="vit-cell ${c.has ? 'on' : ''}" title="${U.fmtMD(c.day)}">${new Date(c.day).getDate()}</div>`).join('')}</div>
      <div class="legend" style="margin-top:8px"><span><i style="background:var(--sleep)"></i>已打卡</span><span><i style="background:#F0EBE2"></i>未打卡</span></div>
    </div>`;
}

/* ---------- 设置 ---------- */
function viewSettings() {
  const baby = Store.baby();
  if (!baby) { document.getElementById('main').innerHTML = '<div class="empty">请先创建宝宝档案</div>'; return; }
  const babies = Store.db.babies;
  const tpls = Store.templatesOf(baby.id);
  const rems = Store.remindersOf(baby.id);
  document.getElementById('main').innerHTML = `
    <div class="page-title">设置</div>
    <div class="sec-t">宝宝档案</div>
    <div class="sec">
      ${babies.map(b => `
        <div class="row baby-row" onclick="switchBaby('${b.id}')">
          <div class="av">${b.avatar}</div>
          <div class="rt">${U.esc(b.name)}<div class="rs">${b.birthday} · ${U.ageText(b)}</div></div>
          ${b.id === Store.db.currentBabyId ? '<span class="cur">当前</span>' : ''}
          <span class="rb" onclick="event.stopPropagation();openBabySheet('${b.id}')">编辑</span>
        </div>`).join('')}
      <div class="row" onclick="openBabySheet()"><div class="rt" style="color:var(--pd)">＋ 新增宝宝档案</div></div>
    </div>
    <div class="sec-t">录入人</div>
    <div class="sec"><div class="row">
      <div class="rt">当前录入人<div class="rs">记录将标记为该成员</div></div>
      <input class="inp" style="max-width:130px" value="${U.esc(Store.db.settings.creator)}" onchange="setCreator(this.value)">
    </div></div>
    <div class="sec-t">提醒（本地通知）</div>
    <div class="sec">
      ${rems.length ? rems.map(reminderRow).join('') : '<div class="row"><div class="rt">暂无提醒</div></div>'}
      <div class="row" onclick="newReminder()"><div class="rt" style="color:var(--pd)">＋ 添加提醒（喂奶 / 维D / 体温 / 疫苗）</div></div>
    </div>
    <div class="sec-t">自定义记录项</div>
    <div class="sec">
      ${tpls.length ? tpls.map(t => `
        <div class="row">
          <div class="rt">⭐ ${U.esc(t.name)}<div class="rs">${t.fields.length} 个字段${t.onHome ? ' · 已显示在首页' : ''}</div></div>
          <span class="rb" onclick="editTemplate('${t.id}')">编辑</span>
          <span class="danger-c" onclick="delTemplate('${t.id}')">删除</span>
        </div>`).join('') : ''}
      <div class="row" onclick="newTemplate()"><div class="rt" style="color:var(--pd)">＋ 新建自定义指标</div></div>
    </div>
    <div class="sec-t">数据与导出</div>
    <div class="sec">
      <div class="row" onclick="exportCSV()"><div class="rt">导出全部记录<div class="rs">CSV 格式，可用 Excel 打开</div></div><span class="ra">›</span></div>
      <div class="row" onclick="exportBackup()"><div class="rt">导出备份<div class="rs">JSON 完整备份，可随时导入</div></div><span class="ra">›</span></div>
      <div class="row" onclick="document.getElementById('imp').click()"><div class="rt">导入备份</div><span class="ra">›</span><input type="file" id="imp" accept=".json" style="display:none" onchange="importBackup(this)"></div>
      <div class="row" onclick="confirmClear()"><div class="rt danger-c">清空全部数据</div><span class="ra">›</span></div>
    </div>
    <div class="sec-t">隐私说明</div>
    <div class="sec"><div class="about-t">所有宝宝健康数据仅保存在<b>本机本地</b>（localStorage），不会上传到任何服务器；无广告、无社交、无第三方统计。您可通过「导出备份」自行保管数据，或随时「清空全部数据」。</div></div>
    <div class="sec-t">关于</div>
    <div class="sec"><div class="about-t">芽芽记 v1.0 · 极简新生儿健康记录工具<br>本应用仅为记录与呈现工具，不提供医疗诊断。如宝宝出现异常请及时就医。</div></div>
  `;
}

function reminderRow(r) {
  return `<div class="row">
    <div class="rt">⏰ ${U.esc(r.label)}<div class="rs">每天 ${r.time}</div></div>
    <span class="danger-c" style="font-size:12px" onclick="delReminder('${r.id}')">删除</span>
    <div class="sw ${r.enabled ? 'on' : ''}" onclick="toggleReminder('${r.id}')"></div>
  </div>`;
}
