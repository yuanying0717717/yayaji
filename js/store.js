/* 数据层：本地优先存储（localStorage），隐私默认不上传任何数据 */
const Store = {
  KEY: 'yayaji_db_v1',
  db: null,

  defaults() {
    return { babies: [], currentBabyId: null, records: [], reminders: [], templates: [], tags: [], settings: { creator: '妈妈', lastBackupAt: 0, lastBackupDismiss: 0 } };
  },
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this.db = raw ? Object.assign(this.defaults(), JSON.parse(raw)) : this.defaults();
    } catch (e) { this.db = this.defaults(); }
    if (!this.db.settings) this.db.settings = { creator: '妈妈' };
    return this.db;
  },
  save() { try { localStorage.setItem(this.KEY, JSON.stringify(this.db)); } catch (e) { console.error('保存失败', e); } },
  reset() { this.db = this.defaults(); this.save(); },

  baby() { return this.db.babies.find(b => b.id === this.db.currentBabyId) || this.db.babies[0] || null; },
  setCurrent(id) { this.db.currentBabyId = id; this.save(); },

  addBaby(b) {
    const nb = Object.assign({ id: U.uid(), name: '宝宝', birthday: U.isoDate(Date.now()), gender: 'secret', avatar: '👶', createdAt: Date.now() }, b);
    this.db.babies.push(nb);
    if (!this.db.currentBabyId) this.db.currentBabyId = nb.id;
    this.save();
    return nb;
  },
  updateBaby(id, patch) {
    const b = this.db.babies.find(x => x.id === id);
    if (b) { Object.assign(b, patch); this.save(); }
  },
  deleteBaby(id) {
    this.db.babies = this.db.babies.filter(b => b.id !== id);
    this.db.records = this.db.records.filter(r => r.babyId !== id);
    this.db.reminders = this.db.reminders.filter(r => r.babyId !== id);
    this.db.templates = this.db.templates.filter(t => t.babyId !== id);
    if (this.db.currentBabyId === id) this.db.currentBabyId = this.db.babies[0] ? this.db.babies[0].id : null;
    this.save();
  },

  recordsOf(babyId) { return this.db.records.filter(r => r.babyId === babyId); },
  getRecord(id) { return this.db.records.find(r => r.id === id); },
  addRecord(r) {
    const nr = Object.assign({ id: U.uid(), babyId: this.db.currentBabyId, createdAt: Date.now(), tags: [], note: '' }, r);
    this.db.records.push(nr);
    this.save();
    return nr;
  },
  updateRecord(id, patch) {
    const r = this.db.records.find(x => x.id === id);
    if (r) { Object.assign(r, patch); this.save(); }
    return r;
  },
  deleteRecord(id) { this.db.records = this.db.records.filter(r => r.id !== id); this.save(); },

  templatesOf(babyId) { return this.db.templates.filter(t => t.babyId === babyId); },
  addTemplate(t) {
    const nt = Object.assign({ id: U.uid(), babyId: this.db.currentBabyId, name: '新指标', onHome: false, fields: [{ label: '数值', type: 'number', unit: '' }] }, t);
    this.db.templates.push(nt);
    this.save();
    return nt;
  },
  updateTemplate(id, patch) {
    const t = this.db.templates.find(x => x.id === id);
    if (t) { Object.assign(t, patch); this.save(); }
  },
  deleteTemplate(id) { this.db.templates = this.db.templates.filter(t => t.id !== id); this.save(); },

  remindersOf(babyId) { return this.db.reminders.filter(r => r.babyId === babyId); },
  addReminder(r) {
    const nr = Object.assign({ id: U.uid(), babyId: this.db.currentBabyId, label: '提醒', time: '09:00', enabled: false, last: '' }, r);
    this.db.reminders.push(nr);
    this.save();
    return nr;
  },
  updateReminder(id, patch) {
    const r = this.db.reminders.find(x => x.id === id);
    if (r) { Object.assign(r, patch); this.save(); }
  },
  deleteReminder(id) { this.db.reminders = this.db.reminders.filter(r => r.id !== id); this.save(); }
};
