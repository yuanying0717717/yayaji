/* 应用主控：路由 / 弹层 / 全局操作 / 计时器 / 本地提醒 */
let sheetState = null;
let sheetEditingId = null;
let tplEditingId = null;

/* ============ 路由 ============ */
function go(page, param) {
  location.hash = '#/' + (param ? page + '/' + param : page);
}

function route() {
  const h = location.hash || '#/home';
  const parts = h.replace(/^#\//, '').split('/');
  const page = parts[0] || 'home';
  const mainEl = document.getElementById('main');
  if (page === 'records') viewRecords();
  else if (page === 'list') viewList(parts[1] || 'feed');
  else if (page === 'stats') viewStats();
  else if (page === 'settings') viewSettings();
  else viewHome();
  const tabP = page === 'list' ? 'records' : page;
  renderTab(['home', 'records', 'stats', 'settings'].includes(tabP) ? tabP : 'home');
  mainEl.scrollTop = 0;
}

function renderTab(page) {
  const TABS = [
    { p: 'home', l: '首页', svg: '<svg viewBox="0 0 24 24"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>' },
    { p: 'records', l: '记录', svg: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>' },
    { p: 'stats', l: '统计', svg: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-8"/><path d="M2 20h20"/></svg>' },
    { p: 'settings', l: '设置', svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg>' }
  ];
  document.getElementById('tabbar').innerHTML = TABS.map(t =>
    `<div class="tab ${t.p === page ? 'on' : ''}" onclick="go('${t.p}')">${t.svg}<div>${t.l}</div></div>`).join('');
}

function renderHeader() {
  const baby = Store.baby();
  const el = document.getElementById('header');
  el.innerHTML = `<div class="hd">
    <div class="hd-left" onclick="switchBabySheet()">
      <div class="baby-av">${baby ? baby.avatar : '👶'}</div>
      <div><div class="baby-name">${baby ? U.esc(baby.name) : '新建宝宝档案'}<span class="baby-age">${baby ? U.ageText(baby) : ''}</span></div></div>
    </div>
    <button class="hd-btn" onclick="go('settings')">⚙️</button>
  </div>`;
}

function refresh() {
  renderHeader();
  route();
}

/* ============ Toast ============ */
function toast(msg) {
  const box = document.getElementById('toasts');
  const d = document.createElement('div');
  d.className = 'toast';
  d.textContent = msg;
  box.appendChild(d);
  setTimeout(() => d.remove(), 2300);
}

/* ============ 弹层 ============ */
function showSheet() {
  document.getElementById('sheet').classList.add('show');
  document.getElementById('overlay').classList.add('show');
}
function closeSheet() {
  document.getElementById('sheet').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
}
function copySheetText() {
  const ta = document.getElementById('copy-ta');
  if (!ta) return;
  const txt = ta.value;
  const done = () => toast('已复制，可粘贴到 Excel / 记事本');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(done).catch(() => { ta.select(); document.execCommand('copy'); done(); });
  } else { ta.select(); document.execCommand('copy'); done(); }
}

function openSheetRaw(title, bodyHtml, opts) {
  opts = opts || {};
  document.getElementById('sheet').innerHTML = `
    <div class="sheet-card">
      <div class="sheet-head"><span>${title}</span><button class="sx" id="sx">✕</button></div>
      <div class="sheet-body">${bodyHtml}${datalists()}</div>
      <div class="sheet-foot">${opts.del ? '<button class="btn danger" id="sdel">删除</button>' : ''}
        <button class="btn primary" id="ssave">${opts.saveLabel || '保存'}</button></div>
    </div>`;
  document.getElementById('sx').onclick = closeSheet;
  if (opts.del) document.getElementById('sdel').onclick = opts.del;
  document.getElementById('ssave').onclick = () => { if (opts.save) opts.save(); };
  // 通用单选切换：为简单弹层中无自定义 onclick 的选择按钮绑定互斥选中
  document.querySelectorAll('#sheet .chips .chip:not([onclick])').forEach(c => {
    c.onclick = () => {
      const wrap = c.closest('.chips');
      wrap.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c));
    };
  });
  showSheet();
}

function openFormSheet(title, defsFn, state, opts) {
  opts = opts || {};
  sheetState = Object.assign({}, state);
  const render = () => {
    const defs = defsFn(sheetState);
    document.getElementById('sheet').innerHTML = `
      <div class="sheet-card">
        <div class="sheet-head"><span>${title}</span><button class="sx" id="sx">✕</button></div>
        <div class="sheet-body" id="sbody">${defs.map(f => fieldHTML(f, sheetState)).join('')}${datalists()}</div>
        <div class="sheet-foot">${opts.onDelete ? '<button class="btn danger" id="sdel">删除</button>' : ''}
          <button class="btn primary" id="ssave">${opts.saveLabel || '保存'}</button></div>
      </div>`;
    bindFields(defs, render);
    document.getElementById('sx').onclick = closeSheet;
    if (opts.onDelete) document.getElementById('sdel').onclick = () => opts.onDelete();
    document.getElementById('ssave').onclick = () => opts.onSave(sheetState);
    showSheet();
  };
  render();
}

function datalists() {
  return `<datalist id="dl-drugs">${DRUGS.map(d => `<option value="${U.esc(d)}">`).join('')}</datalist>
  <datalist id="dl-vaccines">${VACCINES.map(v => `<option value="${U.esc(v)}">`).join('')}</datalist>`;
}

/* ---------- 表单字段渲染与绑定 ---------- */
function fieldHTML(f, state) {
  let val = state[f.key];
  if (val === undefined || val === null) val = f.def !== undefined ? f.def : (f.type === 'multi' ? [] : null);
  let ctrl = '';
  if (f.type === 'seg' || f.type === 'multi') {
    const multi = f.type === 'multi';
    const sel = multi ? (Array.isArray(val) ? val : []) : val;
    ctrl = `<div class="chips" data-k="${f.key}" data-multi="${multi ? '1' : '0'}">${f.options.map(o => {
      const ov = typeof o === 'string' ? o : o.v;
      const on = multi ? sel.includes(ov) : sel === ov;
      return `<button type="button" class="chip ${on ? 'on' : ''}" data-v="${U.esc(ov)}">${typeof o === 'string' ? U.esc(o) : U.esc(o.l)}</button>`;
    }).join('')}</div>`;
  } else if (f.type === 'time') {
    const cur = val || Date.now();
    ctrl = `<div class="chips" style="margin-bottom:8px" data-k="${f.key}" data-time="1">${[[0, '现在'], [-15, '15分钟前'], [-30, '30分钟前'], [-60, '1小时前']].map(([d, l]) => `<button type="button" class="chip" data-d="${d}">${l}</button>`).join('')}</div>
    <input type="datetime-local" class="inp" data-k="${f.key}" value="${U.isoLocal(cur).slice(0, 16)}">`;
  } else if (f.type === 'number') {
    ctrl = `<div class="num"><input type="number" inputmode="decimal" min="0" class="inp" data-k="${f.key}" value="${val != null ? val : ''}" placeholder="选填"><span class="unit">${f.unit || ''}</span></div>`;
  } else if (f.type === 'text') {
    ctrl = `<input type="text" class="inp" data-k="${f.key}" value="${U.esc(val || '')}" placeholder="${U.esc(f.placeholder || '')}" ${f.datalist ? `list="dl-${f.datalist}"` : ''}>`;
  } else if (f.type === 'note') {
    ctrl = `<textarea class="inp" rows="2" data-k="${f.key}" placeholder="选填">${U.esc(val || '')}</textarea>`;
  }
  return `<div class="fld"><div class="fld-label">${f.label}${f.required ? '<i> *</i>' : ''}</div>${ctrl}</div>`;
}

function bindFields(defs, render) {
  const body = document.getElementById('sbody');
  body.querySelectorAll('.chips[data-k]').forEach(wrap => {
    const k = wrap.getAttribute('data-k');
    if (wrap.hasAttribute('data-time')) {
      const inp = body.querySelector('input[data-k="' + k + '"]');
      wrap.querySelectorAll('.chip').forEach(c => c.onclick = () => {
        sheetState[k] = Date.now() + (+c.getAttribute('data-d')) * 60000;
        if (inp) inp.value = U.isoLocal(sheetState[k]).slice(0, 16);
      });
      return;
    }
    const multi = wrap.getAttribute('data-multi') === '1';
    const f = defs.find(x => x.key === k);
    wrap.querySelectorAll('.chip').forEach(c => c.onclick = () => {
      const v = c.getAttribute('data-v');
      if (multi) {
        const arr = (Array.isArray(sheetState[k]) ? sheetState[k] : []).slice();
        const i = arr.indexOf(v);
        if (i >= 0) arr.splice(i, 1); else arr.push(v);
        sheetState[k] = arr;
        c.classList.toggle('on', arr.includes(v));
      } else {
        sheetState[k] = v;
        wrap.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c));
        if (f && f.bind) render();
      }
    });
  });
  body.querySelectorAll('input[data-k], textarea[data-k]').forEach(inp => {
    const k = inp.getAttribute('data-k');
    const isNum = inp.type === 'number';
    const isDT = inp.type === 'datetime-local';
    inp.addEventListener(isNum ? 'input' : 'change', () => {
      if (isNum) sheetState[k] = inp.value !== '' ? parseFloat(inp.value) : null;
      else if (isDT) sheetState[k] = U.parseLocal(inp.value);
      else sheetState[k] = inp.value;
    });
  });
}

/* ============ 记录操作 ============ */
function startQuick(kind) {
  if (kind === 'feed') openRecordSheet('feed');
  if (kind === 'diaper') openRecordSheet('diaper');
  if (kind === 'sleep') {
    const now = Date.now();
    const h = new Date().getHours();
    Store.addRecord({ type: 'sleep', time: now, data: { startTime: now, endTime: null, durationMin: null, env: (h >= 20 || h < 8) ? 'night' : 'nap', state: [] } });
    toast('已记录入睡，点顶部计时卡结束');
    refresh();
  }
}

function endTimer(id) {
  const r = Store.getRecord(id);
  if (!r) return;
  if (r.type === 'feed') openRecordSheet('feed', id, true);
  if (r.type === 'sleep') openRecordSheet('sleep', id, true);
}

function openRecordSheet(type, id, endNow) {
  const record = id ? Store.getRecord(id) : null;
  const state = record ? Forms.recordToState(type, record) : Forms.defaultState(type);
  if (endNow) {
    if (type === 'feed') state.end = Date.now();
    if (type === 'sleep') state.end = Date.now();
  }
  const meta = Forms.meta[type] || Forms.meta.custom;
  openFormSheet(meta.l + '记录', defs => Forms.defs[type](defs), state, {
    saveLabel: (type === 'feed' && !record && state.mode === 'breast') ? '开始喂奶并计时' : '保存',
    onSave: s => {
      const built = Forms.buildRecord(type, s);
      if (record) Store.updateRecord(record.id, built);
      else Store.addRecord(built);
      closeSheet();
      toast(record ? '已更新' : '已记录');
      refresh();
    },
    onDelete: record ? () => { Store.deleteRecord(record.id); closeSheet(); toast('已删除'); refresh(); } : null
  });
}

function openTemplateSheet(tid, id) {
  const tpl = Store.db.templates.find(t => t.id === tid);
  if (!tpl) return;
  const record = id ? Store.getRecord(id) : null;
  const state = { time: record ? record.time : Date.now(), note: record ? (record.note || '') : '', templateId: tid };
  (tpl.fields || []).forEach(f => { if (record && record.data.values && record.data.values[f.id] !== undefined) state[f.id] = record.data.values[f.id]; });
  openFormSheet(tpl.name, defs => Forms.defs.custom(tpl, defs), state, {
    onSave: s => {
      const values = {};
      (tpl.fields || []).forEach(f => { if (s[f.id] !== undefined) values[f.id] = s[f.id]; });
      const built = { time: s.time, data: { templateId: tid, values }, note: s.note || '' };
      if (record) Store.updateRecord(record.id, built);
      else Store.addRecord(built);
      closeSheet();
      toast('已记录');
      refresh();
    },
    onDelete: record ? () => { Store.deleteRecord(record.id); closeSheet(); toast('已删除'); refresh(); } : null
  });
}

/* ============ 宝宝档案 ============ */
function openBabySheet(id) {
  sheetEditingId = id || null;
  const b = id ? Store.db.babies.find(x => x.id === id) : null;
  openSheetRaw(b ? '编辑宝宝档案' : '新建宝宝档案', `
    <div class="fld"><div class="fld-label">头像</div>
      <div class="chips" id="bf-a">${['👶', '🐣', '🍼', '🌱', '🐰', '🌟'].map(a => `<button type="button" class="chip ${b && b.avatar === a ? 'on' : (!b && a === '👶' ? 'on' : '')}" data-av="${a}">${a}</button>`).join('')}</div></div>
    <div class="fld"><div class="fld-label">宝宝昵称 <i>*</i></div><input class="inp" id="bf-name" value="${U.esc(b ? b.name : '')}" placeholder="如：小芽"></div>
    <div class="fld"><div class="fld-label">出生日期 <i>*</i></div><input type="date" class="inp" id="bf-bd" value="${b ? b.birthday : U.isoDate(Date.now())}"></div>
    <div class="fld"><div class="fld-label">性别</div>
      <div class="chips" id="bf-g">${[['boy', '👦 男孩'], ['girl', '👧 女孩'], ['secret', '保密']].map(g => `<button type="button" class="chip ${(b ? b.gender : 'secret') === g[0] ? 'on' : ''}" data-g="${g[0]}">${g[1]}</button>`).join('')}</div></div>`,
    { del: b ? () => delBaby(b.id) : null, save: saveBabySheet });
}

function saveBabySheet() {
  const name = (document.getElementById('bf-name').value || '').trim() || '宝宝';
  const birthday = document.getElementById('bf-bd').value || U.isoDate(Date.now());
  const genEl = document.querySelector('#bf-g .chip.on');
  const gender = genEl ? genEl.getAttribute('data-g') : 'secret';
  const avEl = document.querySelector('#bf-a .chip.on');
  const avatar = avEl ? avEl.getAttribute('data-av') : '👶';
  if (sheetEditingId) Store.updateBaby(sheetEditingId, { name, birthday, gender, avatar });
  else Store.addBaby({ name, birthday, gender, avatar });
  sheetEditingId = null;
  closeSheet();
  toast('宝宝档案已保存');
  refresh();
}

function delBaby(id) {
  if (!confirm('删除该宝宝档案？其全部记录、提醒、自定义指标将一并删除。')) return;
  Store.deleteBaby(id);
  sheetEditingId = null;
  closeSheet();
  toast('已删除');
  refresh();
}

function switchBaby(id) {
  Store.setCurrent(id);
  closeSheet();
  refresh();
}

function switchBabySheet() {
  const babies = Store.db.babies;
  if (!babies.length) { openBabySheet(); return; }
  openSheetRaw('切换宝宝',
    babies.map(b => `
      <div class="row" onclick="switchBaby('${b.id}')">
        <div class="av" style="width:40px;height:40px;border-radius:50%;background:#F3EDE3;display:flex;align-items:center;justify-content:center;font-size:20px">${b.avatar}</div>
        <div class="rt">${U.esc(b.name)}<div class="rs">${b.birthday} · ${U.ageText(b)}</div></div>
        ${b.id === Store.db.currentBabyId ? '<span class="cur">当前</span>' : ''}
      </div>`).join('')
    + (babies.length < 3 ? '<div class="row" onclick="openBabySheet()"><div class="rt" style="color:var(--pd)">＋ 新增宝宝</div></div>' : ''),
    { saveLabel: '关闭', save: closeSheet });
}

/* ============ 提醒 ============ */
function newReminder() {
  openSheetRaw('添加提醒', `
    <div class="fld"><div class="fld-label">提醒类型</div>
      <div class="chips" id="rm-type">
        ${[['喂奶提醒', '喂奶提醒'], ['维D提醒', '吃维生素D'], ['体温提醒', '测体温'], ['疫苗提醒', '疫苗/体检'], ['custom', '自定义']].map(([v, l], i) => `<button type="button" class="chip ${i === 0 ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}
      </div></div>
    <div class="fld"><div class="fld-label">名称</div><input class="inp" id="rm-name" placeholder="自定义时填写，如：晚上喂奶"></div>
    <div class="fld"><div class="fld-label">时间</div><input type="time" class="inp" id="rm-time" value="09:00"></div>
    <div class="fld"><div class="fld-label" style="color:var(--t2)">提醒使用系统本地通知，不经过任何服务器</div></div>`,
    { save() {
      const el = document.querySelector('#rm-type .chip.on');
      const type = el ? el.getAttribute('data-v') : '喂奶提醒';
      const label = type === 'custom' ? (document.getElementById('rm-name').value.trim() || '自定义提醒') : type;
      const time = document.getElementById('rm-time').value || '09:00';
      Store.addReminder({ label, time, enabled: true });
      closeSheet();
      toast('提醒已添加');
      refresh();
    } });
}

function toggleReminder(id) {
  const r = Store.db.reminders.find(x => x.id === id);
  if (!r) return;
  r.enabled = !r.enabled;
  if (r.enabled && 'Notification' in window && Notification.permission !== 'granted') Notification.requestPermission();
  Store.save();
  refresh();
}

function delReminder(id) {
  if (!confirm('删除该提醒？')) return;
  Store.deleteReminder(id);
  refresh();
}

function checkReminders() {
  const baby = Store.baby();
  if (!baby) return;
  const now = new Date();
  const hm = U.pad(now.getHours()) + ':' + U.pad(now.getMinutes());
  const key = U.dayKey(now.getTime());
  Store.db.reminders.filter(r => r.babyId === baby.id && r.enabled).forEach(r => {
    if (r.time === hm && r.last !== key) {
      r.last = key;
      Store.save();
      if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification('芽芽记提醒', { body: r.label + ' · ' + baby.name }); } catch (e) { toast('⏰ ' + r.label); }
      } else toast('⏰ ' + r.label);
    }
  });
}

/* ============ 自定义记录项 ============ */
function newTemplate() { editTemplate(null); }

function editTemplate(id) {
  tplEditingId = id || null;
  const t = id ? Store.db.templates.find(x => x.id === id) : null;
  const fields = t && t.fields.length ? t.fields : [{ id: U.uid(), label: '数值', type: 'number', unit: '', options: '' }];
  openSheetRaw(t ? '编辑自定义指标' : '新建自定义指标', `
    <div class="fld"><div class="fld-label">指标名称 <i>*</i></div><input class="inp" id="tp-name" value="${U.esc(t ? t.name : '')}" placeholder="如：吐奶量、脐带渗液"></div>
    <div class="fld"><div class="fld-label">是否显示在首页快捷区</div>
      <div class="chips">${[['1', '是'], ['0', '否']].map(([v, l]) => `<button type="button" class="chip ${(t && t.onHome) === (v === '1') ? 'on' : (!t && v === '0' ? 'on' : '')}" data-tphome="${v}" onclick="togTpH(this)">${l}</button>`).join('')}</div></div>
    <div class="fld"><div class="fld-label">字段定义</div><div id="tp-fields">${fields.map((f, i) => tplFieldHTML(f, i)).join('')}</div></div>
    <button type="button" class="btn ghost" onclick="addTplField()" style="margin-bottom:4px">＋ 添加字段</button>`,
    { del: t ? () => { if (confirm('删除该指标？历史记录仍会保留。')) { Store.deleteTemplate(t.id); tplEditingId = null; closeSheet(); toast('已删除'); refresh(); } } : null,
      save: saveTemplate });
}

function tplFieldHTML(f, i) {
  return `<div class="fld" style="background:#FAF7F1;border-radius:12px;padding:10px;margin-bottom:8px">
    <div style="display:flex;gap:8px;margin-bottom:6px">
      <input class="inp" data-tp-label="${i}" value="${U.esc(f.label)}" placeholder="字段名">
      <select class="inp" data-tp-type="${i}" style="max-width:120px;flex:none">
        ${[['number', '数字'], ['text', '文本'], ['select', '单选'], ['bool', '是否']].map(([v, l]) => `<option value="${v}" ${f.type === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <input class="inp" data-tp-unit="${i}" value="${U.esc(f.unit || '')}" placeholder="单位(如ml)">
      <input class="inp" data-tp-options="${i}" value="${U.esc(f.options || '')}" placeholder="选项(逗号分隔,单选时)">
      <button type="button" class="chip" style="border-color:var(--warn);color:var(--warn);flex:none" onclick="delTpField(this)">删</button>
    </div></div>`;
}

window.addTplField = function () {
  const wrap = document.getElementById('tp-fields');
  wrap.insertAdjacentHTML('beforeend', tplFieldHTML({ label: '', type: 'number', unit: '', options: '' }, wrap.children.length));
};
window.togTpH = function (el) {
  document.querySelectorAll('[data-tphome]').forEach(x => x.classList.toggle('on', x === el));
};
window.delTpField = function (el) { el.closest('.fld').remove(); };

function saveTemplate() {
  const name = (document.getElementById('tp-name').value || '').trim();
  if (!name) { toast('请填写指标名称'); return; }
  const homeEl = document.querySelector('[data-tphome].on');
  const onHome = homeEl ? homeEl.getAttribute('data-tphome') === '1' : false;
  const fields = [];
  document.querySelectorAll('#tp-fields > div').forEach(div => {
    const label = div.querySelector('[data-tp-label]').value.trim() || '字段';
    const type = div.querySelector('[data-tp-type]').value;
    const unit = div.querySelector('[data-tp-unit]').value.trim() || '';
    const options = div.querySelector('[data-tp-options]').value.trim() || '';
    fields.push({ id: U.uid(), label, type, unit, options });
  });
  if (tplEditingId) Store.updateTemplate(tplEditingId, { name, onHome, fields });
  else Store.addTemplate({ name, onHome, fields });
  tplEditingId = null;
  closeSheet();
  toast('已保存');
  refresh();
}

function delTemplate(id) {
  if (!confirm('删除该自定义指标？历史记录仍会保留。')) return;
  Store.deleteTemplate(id);
  refresh();
}

/* ============ 数据与导出 ============ */
function exportCSV() { Export.csv(); }
function exportBackup() { Export.backup(); }

window.importBackup = function (input) {
  const file = input.files[0];
  if (!file) return;
  Export.importFile(file, ok => {
    if (ok) { toast('导入成功，已恢复数据'); refresh(); }
    else toast('导入失败，文件格式不正确');
    input.value = '';
  });
};

function confirmClear() {
  if (!confirm('确定清空全部数据？此操作不可恢复（建议先导出备份）。')) return;
  Store.reset();
  location.hash = '#/home';
  refresh();
  toast('已清空全部数据');
}

window.setCreator = function (v) {
  Store.db.settings.creator = (v || '').trim() || '家长';
  Store.save();
};

/* ============ 启动 ============ */
function App() { }

App.init = function () {
  document.getElementById('overlay').onclick = closeSheet;
  window.addEventListener('hashchange', route);
  refresh();
  if (!Store.db.babies.length) setTimeout(() => openBabySheet(), 400);
  setInterval(checkReminders, 30000);
  setInterval(() => {
    const el = document.getElementById('timerTxt');
    if (!el) return;
    const r = Store.getRecord(el.getAttribute('data-id'));
    if (r && !r.data.endTime) el.textContent = U.fmtClock(Date.now() - (r.data.startTime || r.time));
  }, 1000);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Store.load();
  App.init();
});
