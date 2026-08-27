/* 数据导出：Excel(CSV) / JSON 备份 / 就医报告（打印版） */
const Export = {
  download(name, content, mime) {
    const type = mime || 'text/csv;charset=utf-8';
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    const revoke = ms => setTimeout(() => URL.revokeObjectURL(url), ms);
    // 内嵌/沙箱环境（如 IDE 预览）会静默拦截 a[download]：尝试新窗口，仍失败则给出可复制内容
    if (window.self !== window.top) {
      let win = null;
      try { win = window.open(url, '_blank'); } catch (e) { win = null; }
      if (!win) {
        this._showCopy(name, content);
        revoke(60000);
      } else {
        revoke(10000);
        setTimeout(() => { try { if (win.closed) this._showCopy(name, content); } catch (e) { this._showCopy(name, content); } }, 1500);
      }
    } else {
      revoke(800);
    }
  },

  _showCopy(name, content) {
    const body = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    document.getElementById('sheet').innerHTML = `
      <div class="sheet-card">
        <div class="sheet-head"><span>下载未完成 · 手动复制</span><button class="sx" onclick="closeSheet()">✕</button></div>
        <div class="sheet-body"><div class="about-t">当前环境拦截了自动下载（常见于内嵌预览）。两种办法：① 在新标签页打开本应用后重新导出；② 点击下方按钮复制全部内容，粘贴保存为文件（扩展名 ${name.split('.').pop()}）即可用 Excel 打开。</div>
        <textarea id="copy-ta" readonly rows="12" style="width:100%;box-sizing:border-box;font-size:12px">${U.esc(body.slice(0, 500000))}</textarea></div>
        <div class="sheet-foot"><button class="btn primary" onclick="copySheetText()">复制全部内容</button></div>
      </div>`;
    showSheet();
  },

  csv() {
    const baby = Store.baby();
    if (!baby) return;
    const recs = Store.recordsOf(baby.id);
    let out = '\uFEFF';
    const add = (title, headers, rows) => {
      if (!rows.length) return;
      out += '\n【' + title + '】\n' + headers.join(',') + '\n';
      out += rows.map(r => r.map(v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"').join(',')).join('\n') + '\n';
    };
    const t = ts => U.fmtMDHM(ts);
    const side = s => ({ left: '左侧', right: '右侧', both: '双侧' }[s] || '');
    const consis = a => (a || []).map(c => ({ thin: '稀水便', paste: '糊状便', paste2: '膏状便', formed: '成型便' }[c] || c)).join('+');
    const color = c => ({ gold: '金黄', yellowgreen: '黄绿', green: '绿色', black: '黑色', blood: '带血丝' }[c] || c || '');
    const red = r => ({ none: '无', mild: '轻度', obvious: '明显' }[r] || '');
    const spirit = s => ({ good: '良好', ok: '一般', sleepy: '嗜睡', irrit: '烦躁', weak: '萎靡' }[s] || '');
    const ecz = e => ({ none: '无', mild: '轻', mid: '中', severe: '重' }[e] || '');
    const jau = j => ({ none: '无', face: '轻度(面部)', trunk: '中度(躯干)', limb: '重度(四肢)' }[j] || '');
    const care = a => (a || []).map(c => ({ cord: '脐部护理', touch: '抚触', bath: '洗澡' }[c] || c)).join('+');
    const react = a => (a || []).map(x => ({ none: '无', fever: '发热', red: '红肿', cry: '哭闹', rash: '皮疹' }[x] || x)).join('+');

    const feeds = recs.filter(r => r.type === 'feed');
    add('喂养记录', ['时间', '类型', '哪侧', '时长(分)', '奶量(ml)', '剩余(ml)', '品牌', '水温(℃)', '拍嗝', '备注'],
      feeds.map(r => {
        const d = r.data;
        return d.mode === 'breast'
          ? [t(r.time), '母乳', side(d.side), d.durationMin || '', '', '', '', '', d.burp === 'yes' ? '是' : '', r.note]
          : d.mode === 'bottle'
            ? [t(r.time), '瓶喂', '', '', d.amount || '', d.leftover || '', d.brand || '', d.waterTemp || '', '', r.note]
            : [t(r.time), '挤奶', side(d.side), '', (d.leftMl || 0) + (d.rightMl || 0), '', '', '', '', r.note];
      }));

    const diapers = recs.filter(r => r.type === 'diaper');
    add('排便与尿布', ['时间', '类型', '性状', '颜色', '红屁股', '尿布重量(g)', '备注'],
      diapers.map(r => {
        const d = r.data;
        return [t(r.time), { pee: '小便', poop: '大便', both: '大小便' }[d.kind] || d.kind, consis(d.consis), color(d.color), red(d.red), d.weight || '', r.note];
      }));

    const sleeps = recs.filter(r => r.type === 'sleep');
    add('睡眠记录', ['入睡时间', '醒来时间', '时长(分)', '环境', '状态', '备注'],
      sleeps.map(r => {
        const d = r.data;
        return [t(d.startTime || r.time), d.endTime ? t(d.endTime) : '', d.durationMin || '', d.env === 'night' ? '夜间睡眠' : '白天小睡', (d.state || []).join('+'), r.note];
      }));

    const vitals = recs.filter(r => r.type === 'vital');
    add('身体体征', ['时间', '体温(℃)', '部位', '体重(g)', '身长(cm)', '头围(cm)', '皮肤', '黄疸', '精神', '湿疹', '备注'],
      vitals.map(r => {
        const d = r.data;
        return [t(r.time), d.temp || '', d.tempPart || '', d.weight || '', d.height || '', d.head || '', (d.skin || []).join('+'), jau(d.jaundice), spirit(d.spirit), ecz(d.eczema), r.note];
      }));

    const meds = recs.filter(r => r.type === 'med');
    add('用药与护理', ['时间', '药品', '剂量', '方式', '维D/AD', '护理', '洗澡水温(℃)', '备注'],
      meds.map(r => {
        const d = r.data;
        return [t(r.time), d.name || '', d.dose || '', { oral: '口服', topical: '外涂', drop: '滴剂', other: '其他' }[d.method] || d.method || '', d.vit === 'yes' ? '是' : '', care(d.care), d.bathTemp || '', r.note];
      }));

    const checks = recs.filter(r => r.type === 'checkup');
    add('儿保与疫苗', ['时间', '类型', '体重(g)', '身长(cm)', '头围(cm)', '疫苗', '剂次', '反应', '机构', '医生评语/备注'],
      checks.map(r => {
        const d = r.data;
        return d.kind === 'check'
          ? [t(r.time), '体检', d.weight || '', d.height || '', d.head || '', '', '', '', '', d.comment || r.note]
          : [t(r.time), '疫苗', '', '', '', d.vax || '', d.dose || 1, react(d.reaction), d.place || '', r.note];
      }));

    const customs = recs.filter(r => r.type === 'custom');
    add('自定义记录', ['时间', '指标', '数值', '备注'],
      customs.map(r => {
        const tpl = Store.db.templates.find(x => x.id === r.data.templateId);
        const vals = Object.entries(r.data.values || {}).map(([k, v]) => {
          const f = (tpl ? tpl.fields : []).find(x => x.id === k);
          return (f ? f.label : k) + ':' + v + (f && f.unit ? f.unit : '');
        }).join(' / ');
        return [t(r.time), tpl ? tpl.name : '', vals, r.note];
      }));

    this.download('芽芽记_' + baby.name + '_全部记录.csv', out);
    Store.db.settings.lastBackupAt = Date.now();
    Store.save();
    toast('已导出 CSV，可用 Excel 打开');
  },

  backup() {
    this.download('芽芽记_备份_' + U.isoDate(Date.now()) + '.json',
      JSON.stringify({ app: 'yayaji', version: 1, exportedAt: Date.now(), db: Store.db }, null, 2),
      'application/json;charset=utf-8');
    Store.db.settings.lastBackupAt = Date.now();
    Store.save();
    toast('备份文件已导出（含全部数据）');
  },

  importFile(file, cb) {
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const data = JSON.parse(rd.result);
        if (data && data.db && Array.isArray(data.db.records)) {
          Store.db = Object.assign(Store.defaults(), data.db);
          Store.save();
          cb(true);
        } else cb(false);
      } catch (e) { cb(false); }
    };
    rd.readAsText(file);
  }
};

/* 就医报告：生成可打印报告（window.print() 可存为 PDF） */
function openReport(days) {
  const baby = Store.baby();
  if (!baby) return;
  const recs = Store.recordsOf(baby.id);
  const start = U.startOfDay(Date.now()) - (days - 1) * 86400000;
  const range = recs.filter(r => r.time >= start);
  const dayKeys = [];
  for (let i = days - 1; i >= 0; i--) dayKeys.push(U.dayKey(Date.now() - i * 86400000));
  const sum = arr => arr.reduce((s, r) => s + r, 0);

  const feeds = range.filter(r => r.type === 'feed');
  const breastMin = sum(feeds.filter(r => r.data.mode === 'breast').map(r => r.data.durationMin || 0));
  const milkMl = sum(feeds.filter(r => r.data.mode === 'bottle').map(r => r.data.amount || 0)) + sum(feeds.filter(r => r.data.mode === 'pump').map(r => (r.data.leftMl || 0) + (r.data.rightMl || 0)));
  const diapers = range.filter(r => r.type === 'diaper');
  const poops = diapers.filter(r => r.data.kind !== 'pee');
  const sleeps = range.filter(r => r.type === 'sleep' && r.data.durationMin);
  const sleepMin = sum(sleeps.map(r => r.data.durationMin));
  const nightMin = sum(sleeps.filter(r => r.data.env === 'night').map(r => r.data.durationMin));
  const vitals = range.filter(r => r.type === 'vital');
  const temps = vitals.filter(r => r.data.temp != null).map(r => ({ x: U.fmtMD(r.time), y: r.data.temp }));
  const weights = recs.filter(r => (r.type === 'vital' || r.type === 'checkup') && r.data.weight != null).map(r => ({ x: U.fmtMD(r.time), y: U.kg(r.data.weight) }));
  const meds = range.filter(r => r.type === 'med');
  const vaxs = range.filter(r => r.type === 'checkup' && r.data.kind === 'vax');
  const checks = range.filter(r => r.type === 'checkup' && r.data.kind === 'check');

  const lineSVG = (points, color, ref) => {
    if (!points.length) return '<p style="color:#999;font-size:12px">暂无数据</p>';
    const w = 420, h = 150, pad = 30;
    const ys = points.map(p => p.y);
    const min = Math.min(...ys, 0), max = Math.max(...ys, 1);
    const X = i => points.length === 1 ? w / 2 : pad + (w - 2 * pad) * i / (points.length - 1);
    const Y = v => h - pad - ((v - min) / ((max - min) || 1)) * (h - 2 * pad);
    const pts = points.map((p, i) => X(i).toFixed(1) + ',' + Y(p.y).toFixed(1)).join(' ');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%">'
      + (ref ? '<line x1="' + pad + '" y1="' + Y(ref.v) + '" x2="' + (w - pad) + '" y2="' + Y(ref.v) + '" stroke="#D9A0A0" stroke-dasharray="4 4"/><text x="' + (w - pad) + '" y="' + (Y(ref.v) - 3) + '" text-anchor="end" font-size="10" fill="#D9A0A0">' + ref.label + '</text>' : '')
      + '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2"/>'
      + points.map(p => '<circle cx="' + X(p.i) + '" cy="' + Y(p.y) + '" r="3" fill="#fff" stroke="' + color + '"/>').join('')
      + '</svg>';
  };
  // 修正 points 带 index
  const wtPts = weights.map((p, i) => Object.assign({ i }, p));
  const tpPts = temps.map((p, i) => Object.assign({ i }, p));

  const barHTML = (items, color) => {
    const max = Math.max(1, ...items.map(i => i.v));
    return '<div class="bwrap">' + items.map(i => '<div class="bb" title="' + i.k + '" style="height:' + (i.v / max * 100) + '%;background:' + color + '"></div>').join('') + '</div>';
  };
  const milkByDay = dayKeys.map(k => ({ k, v: sum(range.filter(r => r.type === 'feed' && U.dayKey(r.time) === k && (r.data.mode === 'bottle' || r.data.mode === 'pump')).map(r => r.data.mode === 'bottle' ? r.data.amount || 0 : (r.data.leftMl || 0) + (r.data.rightMl || 0))) }));
  const sleepByDay = dayKeys.map(k => ({ k, v: sum(range.filter(r => r.type === 'sleep' && U.dayKey(r.time) === k).map(r => r.data.durationMin || 0)) }));
  const jauList = vitals.filter(r => r.data.jaundice && r.data.jaundice !== 'none');

  const html = '<div class="report-view">'
    + '<h1>宝宝健康记录报告</h1>'
    + '<div class="meta">宝宝：' + U.esc(baby.name) + '（' + U.ageText(baby) + '） · 出生日期 ' + baby.birthday + '<br>统计周期：近 ' + days + ' 天（' + U.fmtMD(start) + ' ~ ' + U.fmtMD(Date.now()) + '） · 生成时间 ' + U.fmtMDHM(Date.now()) + '</div>'
    + '<h2>一、周期汇总</h2>'
    + '<table><tr><th>指标</th><th>数值</th><th>指标</th><th>数值</th></tr>'
    + '<tr><td>喂奶总次数</td><td>' + feeds.length + ' 次</td><td>母乳总时长</td><td>' + U.fmtDur(breastMin) + '</td></tr>'
    + '<tr><td>奶量合计(瓶喂+挤奶)</td><td>' + milkMl + ' ml</td><td>日均奶量</td><td>' + Math.round(milkMl / days) + ' ml</td></tr>'
    + '<tr><td>排便次数</td><td>' + diapers.length + ' 次</td><td>大便次数</td><td>' + poops.length + ' 次</td></tr>'
    + '<tr><td>睡眠总时长</td><td>' + U.fmtDur(sleepMin) + '</td><td>夜间睡眠</td><td>' + U.fmtDur(nightMin) + '</td></tr>'
    + '<tr><td>体温记录</td><td>' + temps.length + ' 次</td><td>用药记录</td><td>' + meds.length + ' 次</td></tr>'
    + '<tr><td>疫苗接种</td><td>' + vaxs.length + ' 次</td><td>儿保体检</td><td>' + checks.length + ' 次</td></tr></table>'
    + '<h2>二、体重变化曲线</h2>' + lineSVG(wtPts, '#6E93AC')
    + '<div class="meta">体重单位 kg（含日常记录与儿保测量）</div>'
    + '<h2>三、体温趋势</h2>' + lineSVG(tpPts, '#D9A0A0', { v: 37.5, label: '37.5℃ 参考线' })
    + '<h2>四、每日奶量</h2>' + barHTML(milkByDay, '#6E93AC')
    + '<h2>五、每日睡眠</h2>' + barHTML(sleepByDay, '#B5CFA8')
    + (vaxs.length ? '<h2>六、疫苗接种</h2><table><tr><th>时间</th><th>疫苗</th><th>剂次</th><th>反应</th></tr>'
      + vaxs.map(r => '<tr><td>' + U.fmtMD(r.time) + '</td><td>' + U.esc(r.data.vax || '') + '</td><td>第' + (r.data.dose || 1) + '剂</td><td>' + (r.data.reaction || []).map(x => ({ none: '无', fever: '发热', red: '红肿', cry: '哭闹', rash: '皮疹' }[x] || x)).join('+') + '</td></tr>').join('') + '</table>' : '')
    + (meds.length ? '<h2>七、用药记录</h2><table><tr><th>时间</th><th>药品</th><th>剂量</th><th>方式</th></tr>'
      + meds.map(r => '<tr><td>' + U.fmtMD(r.time) + '</td><td>' + U.esc(r.data.name || '') + '</td><td>' + U.esc(r.data.dose || '') + '</td><td>' + ({ oral: '口服', topical: '外涂', drop: '滴剂', other: '其他' }[r.data.method] || '') + '</td></tr>').join('') + '</table>' : '')
    + (jauList.length ? '<h2>八、黄疸观察记录</h2><table><tr><th>时间</th><th>程度</th><th>体温</th></tr>'
      + jauList.map(r => '<tr><td>' + U.fmtMD(r.time) + '</td><td>' + ({ face: '轻度(面部)', trunk: '中度(躯干)', limb: '重度(四肢)' }[r.data.jaundice]) + '</td><td>' + (r.data.temp != null ? r.data.temp + '℃' : '—') + '</td></tr>').join('') + '</table>' : '')
    + '<div class="note">温馨提示：本报告由家长使用「芽芽记」自主记录生成，仅供参考，不构成医疗诊断。如宝宝出现精神萎靡、持续高热、呼吸异常等情况，请及时就医。记录人：' + U.esc(Store.db.settings.creator || '家长') + '。</div>'
    + '<div class="rbtn no-print"><button class="btn ghost" onclick="closeReport()">关闭</button><button class="btn primary" onclick="window.print()">打印 / 存为PDF</button></div>'
    + '</div>';

  document.body.insertAdjacentHTML('beforeend', html);
}

function closeReport() {
  const rv = document.querySelector('.report-view');
  if (rv) rv.remove();
}
