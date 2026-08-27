/* 记录模块：字段定义 / 状态构建 / 摘要展示（对照 PRD 第五章字段细节） */
const Forms = {
  meta: {
    feed: { l: '喂养', ico: '🍼', color: '#F2C4B0', desc: '母乳 / 瓶喂 / 挤奶' },
    diaper: { l: '排便尿布', ico: '🧷', color: '#D9E6F0', desc: '小便 / 大便 / 红屁股' },
    sleep: { l: '睡眠', ico: '🌙', color: '#B5CFA8', desc: '小睡 / 夜间 / 时长' },
    vital: { l: '身体体征', ico: '🌡️', color: '#F3E3C8', desc: '体温 / 体重 / 黄疸' },
    med: { l: '用药护理', ico: '💊', color: '#E6DCF0', desc: '药品 / 维D / 洗澡' },
    checkup: { l: '儿保疫苗', ico: '🩺', color: '#D9E7DB', desc: '体检 / 接种' },
    custom: { l: '自定义', ico: '⭐', color: '#F0E6D9', desc: '自定义指标' }
  },
  O: (v, l) => ({ v, l }),

  defs: {
    feed(state) {
      return [
        { key: 'mode', label: '喂养方式', type: 'seg', bind: true, options: [Forms.O('breast', '🍼 母乳'), Forms.O('bottle', '🥛 瓶喂'), Forms.O('pump', '💧 挤奶')] },
        ...(state.mode === 'breast' ? [
          { key: 'time', label: '喂奶开始时间', type: 'time' },
          { key: 'end', label: '喂奶结束时间', type: 'time', optional: true },
          { key: 'side', label: '哪侧乳房', type: 'seg', options: [Forms.O('left', '左侧'), Forms.O('right', '右侧'), Forms.O('both', '双侧')] },
          { key: 'burp', label: '奶后拍嗝', type: 'seg', def: 'no', options: [Forms.O('yes', '是'), Forms.O('no', '否')] }
        ] : []),
        ...(state.mode === 'bottle' ? [
          { key: 'time', label: '喂奶时间', type: 'time' },
          { key: 'amount', label: '总奶量', type: 'number', unit: 'ml', required: true },
          { key: 'leftover', label: '剩余奶量', type: 'number', unit: 'ml' },
          { key: 'brand', label: '奶粉品牌', type: 'text', placeholder: '选填' },
          { key: 'waterTemp', label: '水温', type: 'number', unit: '℃' }
        ] : []),
        ...(state.mode === 'pump' ? [
          { key: 'time', label: '挤奶时间', type: 'time' },
          { key: 'side', label: '哪侧', type: 'seg', options: [Forms.O('left', '左侧'), Forms.O('right', '右侧'), Forms.O('both', '双侧')] },
          { key: 'leftMl', label: '左侧奶量', type: 'number', unit: 'ml' },
          { key: 'rightMl', label: '右侧奶量', type: 'number', unit: 'ml' }
        ] : []),
        { key: 'note', label: '备注', type: 'note' }
      ];
    },
    sleep() {
      return [
        { key: 'start', label: '入睡时间', type: 'time' },
        { key: 'end', label: '醒来时间', type: 'time', optional: true },
        { key: 'duration', label: '睡眠时长', type: 'number', unit: '分钟' },
        { key: 'env', label: '睡眠环境', type: 'seg', options: [Forms.O('nap', '白天小睡'), Forms.O('night', '夜间睡眠')] },
        { key: 'state', label: '睡眠状态', type: 'multi', options: [Forms.O('calm', '安稳'), Forms.O('wake', '易醒'), Forms.O('cry', '哭闹')] },
        { key: 'note', label: '备注', type: 'note' }
      ];
    },
    diaper(state) {
      return [
        { key: 'time', label: '时间', type: 'time' },
        { key: 'kind', label: '类型', type: 'seg', bind: true, options: [Forms.O('pee', '小便'), Forms.O('poop', '大便'), Forms.O('both', '大小便都有')] },
        ...(state.kind !== 'pee' ? [
          { key: 'consis', label: '大便性状', type: 'multi', options: [Forms.O('thin', '稀水便'), Forms.O('paste', '糊状便'), Forms.O('paste2', '膏状便'), Forms.O('formed', '成型便')] },
          { key: 'color', label: '大便颜色', type: 'seg', options: [Forms.O('gold', '金黄'), Forms.O('yellowgreen', '黄绿'), Forms.O('green', '绿色'), Forms.O('black', '黑色'), Forms.O('blood', '带血丝')] }
        ] : []),
        { key: 'red', label: '红屁股', type: 'seg', def: 'none', options: [Forms.O('none', '无'), Forms.O('mild', '轻度'), Forms.O('obvious', '明显')] },
        { key: 'weight', label: '尿布重量', type: 'number', unit: 'g' },
        { key: 'note', label: '备注', type: 'note' }
      ];
    },
    vital() {
      return [
        { key: 'time', label: '记录时间', type: 'time' },
        { key: 'temp', label: '体温', type: 'number', unit: '℃' },
        { key: 'tempPart', label: '测量部位', type: 'seg', options: [Forms.O('axil', '腋下'), Forms.O('ear', '耳温'), Forms.O('forehead', '额头'), Forms.O('rectal', '肛温')] },
        { key: 'weight', label: '体重', type: 'number', unit: 'g' },
        { key: 'height', label: '身长', type: 'number', unit: 'cm' },
        { key: 'head', label: '头围', type: 'number', unit: 'cm' },
        { key: 'skin', label: '皮肤情况', type: 'multi', options: [Forms.O('normal', '正常'), Forms.O('dry', '干燥'), Forms.O('peel', '脱皮'), Forms.O('red', '泛红')] },
        { key: 'jaundice', label: '黄疸观察', type: 'seg', def: 'none', options: [Forms.O('none', '无'), Forms.O('face', '轻度(面部)'), Forms.O('trunk', '中度(躯干)'), Forms.O('limb', '重度(四肢)')] },
        { key: 'spirit', label: '精神状态', type: 'seg', def: 'good', options: [Forms.O('good', '良好'), Forms.O('ok', '一般'), Forms.O('sleepy', '嗜睡'), Forms.O('irrit', '烦躁'), Forms.O('weak', '萎靡')] },
        { key: 'eczema', label: '湿疹/皮疹', type: 'seg', def: 'none', options: [Forms.O('none', '无'), Forms.O('mild', '轻度'), Forms.O('mid', '中度'), Forms.O('severe', '重度')] },
        { key: 'note', label: '备注', type: 'note' }
      ];
    },
    med() {
      return [
        { key: 'time', label: '给药时间', type: 'time' },
        { key: 'name', label: '药品名称', type: 'text', datalist: 'drugs', required: true, placeholder: '选择或输入' },
        { key: 'dose', label: '剂量', type: 'text', placeholder: '如 1滴 / 0.5ml' },
        { key: 'method', label: '给药方式', type: 'seg', def: 'oral', options: [Forms.O('oral', '口服'), Forms.O('topical', '外涂'), Forms.O('drop', '滴剂'), Forms.O('other', '其他')] },
        { key: 'vit', label: '维生素D / AD', type: 'seg', def: 'no', options: [Forms.O('yes', '是'), Forms.O('no', '否')] },
        { key: 'care', label: '护理项目', type: 'multi', options: [Forms.O('cord', '脐部护理'), Forms.O('touch', '抚触'), Forms.O('bath', '洗澡')] },
        { key: 'bathTemp', label: '洗澡水温', type: 'number', unit: '℃' },
        { key: 'note', label: '备注', type: 'note' }
      ];
    },
    checkup(state) {
      return [
        { key: 'time', label: '时间', type: 'time' },
        { key: 'kind', label: '类型', type: 'seg', bind: true, options: [Forms.O('check', '儿保体检'), Forms.O('vax', '疫苗接种')] },
        ...(state.kind === 'check' ? [
          { key: 'weight', label: '体重(医生测量)', type: 'number', unit: 'g' },
          { key: 'height', label: '身长', type: 'number', unit: 'cm' },
          { key: 'head', label: '头围', type: 'number', unit: 'cm' },
          { key: 'comment', label: '医生评语', type: 'note' }
        ] : [
          { key: 'vax', label: '疫苗名称', type: 'text', datalist: 'vaccines', required: true, placeholder: '选择或输入' },
          { key: 'dose', label: '第几剂', type: 'number' },
          { key: 'reaction', label: '接种后反应', type: 'multi', options: [Forms.O('none', '无'), Forms.O('fever', '发热'), Forms.O('red', '红肿'), Forms.O('cry', '哭闹'), Forms.O('rash', '皮疹')] },
          { key: 'place', label: '接种机构', type: 'text', placeholder: '选填' }
        ]),
        { key: 'note', label: '备注', type: 'note' }
      ];
    },
    custom(tpl) {
      return [
        { key: 'time', label: '记录时间', type: 'time' },
        ...(tpl.fields || []).map(f => ({
          key: f.id,
          label: f.label,
          required: f.type === 'number',
          type: f.type === 'number' ? 'number' : (f.type === 'select' ? 'seg' : (f.type === 'bool' ? 'seg' : 'text')),
          unit: f.unit,
          options: f.type === 'select'
            ? String(f.options || '').split(/[,，]/).map(s => s.trim()).filter(Boolean).map(s => Forms.O(s, s))
            : f.type === 'bool' ? [Forms.O('1', '是'), Forms.O('0', '否')] : undefined
        })),
        { key: 'note', label: '备注', type: 'note' }
      ];
    }
  },

  defaultState(type) {
    const now = Date.now();
    const h = new Date().getHours();
    switch (type) {
      case 'feed': return { mode: 'breast', time: now, end: null, side: null, burp: 'no', amount: null, leftover: null, brand: '', waterTemp: null, leftMl: null, rightMl: null, note: '' };
      case 'sleep': return { start: now, end: null, duration: null, env: (h >= 20 || h < 8) ? 'night' : 'nap', state: [], note: '' };
      case 'diaper': return { time: now, kind: 'poop', consis: [], color: null, red: 'none', weight: null, note: '' };
      case 'vital': return { time: now, temp: null, tempPart: null, weight: null, height: null, head: null, skin: [], jaundice: 'none', spirit: 'good', eczema: 'none', note: '' };
      case 'med': return { time: now, name: '', dose: '', method: 'oral', vit: 'no', care: [], bathTemp: null, note: '' };
      case 'checkup': return { time: now, kind: 'check', weight: null, height: null, head: null, comment: '', vax: '', dose: 1, reaction: [], place: '', note: '' };
      case 'custom': return { time: now, values: {}, note: '' };
    }
  },

  recordToState(type, r) {
    const s = Object.assign(Forms.defaultState(type), r.data || {}, { note: r.note || '' });
    if (type === 'feed') { s.time = r.data.startTime || r.time; s.end = r.data.endTime || null; }
    if (type === 'sleep') { s.start = r.data.startTime || r.time; s.end = r.data.endTime || null; s.duration = r.data.durationMin; }
    return s;
  },

  buildRecord(type, s) {
    const ret = { time: s.time, data: {}, note: s.note || '' };
    if (type === 'feed') {
      if (s.mode === 'breast') {
        ret.time = s.time;
        ret.data = { mode: 'breast', startTime: s.time, endTime: s.end || null, durationMin: s.end ? Math.max(1, Math.round((s.end - s.time) / 60000)) : null, side: s.side || null, burp: s.burp || 'no' };
      } else if (s.mode === 'bottle') {
        ret.time = s.time;
        ret.data = { mode: 'bottle', startTime: s.time, endTime: s.time, amount: s.amount || null, leftover: s.leftover || null, brand: s.brand || '', waterTemp: s.waterTemp || null };
      } else {
        ret.time = s.time;
        ret.data = { mode: 'pump', startTime: s.time, endTime: s.time, side: s.side || null, leftMl: s.leftMl || null, rightMl: s.rightMl || null };
      }
    }
    if (type === 'sleep') {
      ret.time = s.start;
      const dur = s.duration != null ? Math.round(s.duration) : (s.end ? Math.max(1, Math.round((s.end - s.start) / 60000)) : null);
      ret.data = { startTime: s.start, endTime: s.end || null, durationMin: dur, env: s.env || 'nap', state: s.state || [] };
    }
    if (type === 'diaper') ret.data = { kind: s.kind, consis: s.consis || [], color: s.color || null, red: s.red || 'none', weight: s.weight || null };
    if (type === 'vital') ret.data = { temp: s.temp || null, tempPart: s.tempPart || null, weight: s.weight || null, height: s.height || null, head: s.head || null, skin: s.skin || [], jaundice: s.jaundice || 'none', spirit: s.spirit || 'good', eczema: s.eczema || 'none' };
    if (type === 'med') ret.data = { name: s.name || '', dose: s.dose || '', method: s.method || 'oral', vit: s.vit || 'no', care: s.care || [], bathTemp: s.bathTemp || null };
    if (type === 'checkup') {
      if (s.kind === 'check') ret.data = { kind: 'check', weight: s.weight || null, height: s.height || null, head: s.head || null, comment: s.comment || '' };
      else ret.data = { kind: 'vax', vax: s.vax || '', dose: s.dose || 1, reaction: s.reaction || [], place: s.place || '' };
    }
    if (type === 'custom') ret.data = { templateId: s.templateId, values: s.values || {} };
    return ret;
  },

  sideL(s) { return { left: '左侧', right: '右侧', both: '双侧' }[s] || ''; },

  summary(r) {
    const d = r.data;
    const note = r.note || '';
    if (r.type === 'feed') {
      if (d.mode === 'breast') {
        let t = '母乳' + (d.side ? ' · ' + Forms.sideL(d.side) : '');
        if (d.durationMin) t += ' · ' + U.fmtDur(d.durationMin);
        if (d.burp === 'yes') t += ' · 已拍嗝';
        if (!d.endTime) t += ' · 进行中';
        return { ico: '🍼', text: t, note };
      }
      if (d.mode === 'bottle') return { ico: '🥛', text: '瓶喂 ' + (d.amount || 0) + 'ml' + (d.leftover ? '（剩' + d.leftover + 'ml）' : '') + (d.brand ? ' · ' + d.brand : ''), note };
      return { ico: '💧', text: '挤奶 ' + ((d.leftMl || 0) + (d.rightMl || 0)) + 'ml' + (d.side ? ' · ' + Forms.sideL(d.side) : ''), note };
    }
    if (r.type === 'diaper') {
      const kind = { pee: '小便', poop: '大便', both: '大小便' }[d.kind] || '';
      let t = kind;
      if (d.kind !== 'pee') {
        const cs = (d.consis || []).map(c => ({ thin: '稀水便', paste: '糊状便', paste2: '膏状便', formed: '成型便' }[c] || c)).join('+');
        const co = { gold: '金黄', yellowgreen: '黄绿', green: '绿色', black: '黑色', blood: '带血丝' }[d.color] || '';
        t += (cs ? ' · ' + cs : '') + (co ? ' · ' + co : '');
      }
      if (d.red && d.red !== 'none') t += ' · 红屁股' + ({ mild: '轻度', obvious: '明显' }[d.red] || '');
      return { ico: '🧷', text: t, note };
    }
    if (r.type === 'sleep') {
      let t = (d.env === 'night' ? '夜间睡眠' : '白天小睡') + ' ' + U.fmtDur(d.durationMin || 0);
      if (!d.endTime) t = '睡眠中…';
      if (d.state && d.state.length) t += ' · ' + d.state.map(s => ({ calm: '安稳', wake: '易醒', cry: '哭闹' }[s] || s)).join('+');
      return { ico: '🌙', text: t, note };
    }
    if (r.type === 'vital') {
      const parts = [];
      if (d.temp != null) parts.push('体温 ' + d.temp + '℃');
      if (d.weight != null) parts.push('体重 ' + U.fmtKg(d.weight));
      if (d.height != null) parts.push('身长 ' + d.height + 'cm');
      if (d.head != null) parts.push('头围 ' + d.head + 'cm');
      if (d.jaundice && d.jaundice !== 'none') parts.push('黄疸 ' + ({ face: '轻度', trunk: '中度', limb: '重度' }[d.jaundice]));
      if (d.eczema && d.eczema !== 'none') parts.push('湿疹' + ({ mild: '轻', mid: '中', severe: '重' }[d.eczema]));
      return { ico: '🌡️', text: parts.join(' · ') || '体征记录', note };
    }
    if (r.type === 'med') {
      let t = (d.name || '用药') + (d.dose ? ' ' + d.dose : '');
      t += ' · ' + ({ oral: '口服', topical: '外涂', drop: '滴剂', other: '其他' }[d.method] || '');
      if (d.care && d.care.length) t += ' · ' + d.care.map(c => ({ cord: '脐部护理', touch: '抚触', bath: '洗澡' }[c] || c)).join('+');
      return { ico: '💊', text: t, note };
    }
    if (r.type === 'checkup') {
      if (d.kind === 'check') {
        const parts = [];
        if (d.weight != null) parts.push(U.fmtKg(d.weight));
        if (d.height != null) parts.push('身长' + d.height + 'cm');
        if (d.head != null) parts.push('头围' + d.head + 'cm');
        return { ico: '🩺', text: '儿保体检' + (parts.length ? ' · ' + parts.join(' / ') : ''), note: d.comment || note };
      }
      return { ico: '💉', text: (d.vax || '疫苗') + ' 第' + (d.dose || 1) + '剂' + (d.reaction && d.reaction.length ? ' · ' + d.reaction.map(x => ({ none: '无', fever: '发热', red: '红肿', cry: '哭闹', rash: '皮疹' }[x] || x)).join('+') : ''), note };
    }
    if (r.type === 'custom') {
      const tpl = Store.db.templates.find(t => t.id === d.templateId);
      const vals = Object.entries(d.values || {}).map(([k, v]) => {
        const f = tpl ? (tpl.fields || []).find(x => x.id === k) : null;
        return (f ? f.label : k) + ':' + v + (f && f.unit ? f.unit : '');
      }).join(' / ');
      return { ico: '⭐', text: (tpl ? tpl.name : '自定义') + (vals ? ' · ' + vals : ''), note };
    }
    return { ico: '📝', text: '记录', note };
  }
};

/* 常用药 / 疫苗 联想库 */
const DRUGS = ['维生素D', '维生素AD滴剂', '益生菌', '乳果糖', '布洛芬混悬液', '对乙酰氨基酚滴剂', '蒙脱石散', '生理盐水滴鼻剂', '氧化锌软膏'];
const VACCINES = ['乙肝疫苗', '卡介苗', '脊灰疫苗(IPV)', '百白破疫苗', '13价肺炎球菌疫苗', '五联疫苗', '轮状病毒疫苗', '流脑AC结合疫苗', '麻腮风疫苗', '乙脑疫苗', '甲肝疫苗'];
