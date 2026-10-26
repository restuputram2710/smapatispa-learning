'use strict';
/* ============================================================
   SMAPATISPA LEARNING — Frontend (GitHub Pages) · js/core.js
   Arsitektur gas-pro-api: halaman statis di GitHub Pages, Google Apps Script = REST API JSON.
   Prinsip instant UX (gas-instant-ux-pro):
   1) SPA: semua halaman dirender di klien (0 ms), tombol Kembali HP berfungsi (history API).
   2) Optimistic UI + localStorage: perubahan tampil seketika, sinkron server di latar.
   3) Login & boot = satu panggilan; data per halaman memakai cache stale-while-revalidate.
   4) fetch() dengan timeout, retry baca, reqId untuk tulis (aman diulang), pemanasan server.
   ============================================================ */

// ════════════════════════════════════════════════════════
// BAGIAN 1: UTILITAS
// ════════════════════════════════════════════════════════
let CFG0 = window.__CFG__ || {};
const SPC = window.SP_CONFIG || {};
/** URL Web App Apps Script (berakhiran /exec) dari js/config.js */
const GAS_URL = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]{20,}\/exec$/.test(String(SPC.GAS_URL || '').trim()) || /^http:\/\/localhost/.test(String(SPC.GAS_URL || '')) ? String(SPC.GAS_URL).trim() : '';
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = (v) => (v === null || v === undefined ? '' : String(v)).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const I = (n, c) => `<svg class="ic ${c || ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* abaikan */ } }
};
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const uidc = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v, d) => { const n = Number(v); return (v === '' || v === null || v === undefined || !isFinite(n)) ? (d === undefined ? 0 : d) : n; };
const fmtN = (v, d) => (v === null || v === undefined || v === '' || isNaN(v)) ? '-' : Number(v).toLocaleString('id-ID', { maximumFractionDigits: d === undefined ? 1 : d });
const pad = (n) => String(n).padStart(2, '0');
const sum = (a) => a.reduce((x, y) => x + (Number(y) || 0), 0);
const avg = (a) => { const l = a.filter((x) => x !== null && x !== undefined && !isNaN(x)); return l.length ? sum(l) / l.length : null; };
const by = (k, dir) => (a, b) => { const x = typeof k === 'function' ? k(a) : a[k], y = typeof k === 'function' ? k(b) : b[k]; return (x > y ? 1 : x < y ? -1 : 0) * (dir || 1); };
const plural = (n, w) => `${fmtN(n, 0)} ${w}`;
const initials = (n) => String(n || '?').replace(/^(drs?|dr|hj?|ir)\.?\s+/i, '').split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
const hashN = (s) => { let h = 0; s = String(s || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
const firstName = (n) => { const w = String(n || '').replace(/^(drs?|dr|hj?|ir)\.?\s+/i, '').replace(/,.*$/, '').trim().split(/\s+/); return w[0] === 'H.' ? w[1] : w[0]; };

// ── Tanggal & waktu (format Indonesia) ──
const TZL = (() => { const o = -new Date().getTimezoneOffset(); return o === 420 ? 'WIB' : o === 480 ? 'WITA' : o === 540 ? 'WIT' : ''; })();
const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'], HARI_P = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const now = () => Date.now() + (S.off || 0);
const D = {
  d: (ms) => { if (!ms) return '-'; const x = new Date(ms); return `${x.getDate()} ${BLN[x.getMonth()]} ${x.getFullYear()}`; },
  t: (ms) => { if (!ms) return '-'; const x = new Date(ms); return `${pad(x.getHours())}.${pad(x.getMinutes())}`; },
  dt: (ms) => ms ? `${D.d(ms)}, ${D.t(ms)}${TZL ? ' ' + TZL : ''}` : '-',
  dd: (ms) => { const x = new Date(ms); return `${HARI[x.getDay()]}, ${x.getDate()} ${BLN[x.getMonth()]}`; },
  day0: (ms) => { const x = new Date(ms); x.setHours(0, 0, 0, 0); return x.getTime(); },
  rel(ms) {
    if (!ms) return '-';
    const d = Math.round((D.day0(ms) - D.day0(now())) / 864e5), t = D.t(ms) + (TZL ? ' ' + TZL : '');
    if (d === 0) return 'Hari ini, ' + t; if (d === 1) return 'Besok, ' + t; if (d === -1) return 'Kemarin, ' + t;
    return `${D.dd(ms)}, ${t}`;
  },
  ago(ms) {
    if (!ms) return '-'; const s = (now() - ms) / 1000;
    if (s < 60) return 'baru saja'; if (s < 3600) return Math.floor(s / 60) + ' menit lalu'; if (s < 86400) return Math.floor(s / 3600) + ' jam lalu';
    if (s < 7 * 86400) return Math.floor(s / 86400) + ' hari lalu'; return D.d(ms);
  },
  left(ms) {
    const s = (ms - now()) / 1000; if (s <= 0) return 'lewat';
    if (s < 3600) return Math.ceil(s / 60) + ' menit lagi'; if (s < 86400) return Math.floor(s / 3600) + ' jam lagi'; return Math.floor(s / 86400) + ' hari lagi';
  },
  ymd: (ms) => { const x = new Date(ms); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; },
  local: (ms) => { if (!ms) return ''; const x = new Date(ms); return `${D.ymd(ms)}T${pad(x.getHours())}:${pad(x.getMinutes())}`; },
  fromLocal: (s) => s ? new Date(s).getTime() : 0,
  clock: (ms) => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`; },
  greet: () => { const h = new Date().getHours(); return h < 11 ? 'Selamat Pagi' : h < 15 ? 'Selamat Siang' : h < 18 ? 'Selamat Sore' : 'Selamat Malam'; }
};

// ════════════════════════════════════════════════════════
// BAGIAN 2: TEMA (warna dari Pengaturan Identitas + mode gelap)
// ════════════════════════════════════════════════════════
const hex2rgb = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
const rgb2hex = (r) => '#' + r.map((v) => pad(Math.round(clamp(v, 0, 255)).toString(16))).join('').replace(/(..)/g, (m) => m.slice(-2));
const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x.map((v, i) => v + (y[i] - v) * t)); };
const lum = (h) => { const [r, g, b] = hex2rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
function applyTheme(cfg) {
  cfg = cfg || {};
  const ok = (c) => /^#[0-9a-f]{6}$/i.test(c || '');
  const p = ok(cfg.warna_primer) ? cfg.warna_primer.toUpperCase() : '#1D4ED8', a = ok(cfg.warna_sekunder) ? cfg.warna_sekunder : '#38BDF8';
  const st = document.documentElement.style, dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const set = (k, v) => st.setProperty(k, v);
  if (p === '#1D4ED8') {
    ['--p50', '--p100', '--p300', '--p500', '--p600', '--p700', '--p900', '--grad'].forEach((k) => st.removeProperty(k));
  } else {
    set('--p50', mix(p, '#FFFFFF', 0.92)); set('--p100', mix(p, '#FFFFFF', 0.84)); set('--p300', mix(p, '#FFFFFF', 0.5));
    set('--p500', mix(p, '#FFFFFF', 0.1)); set('--p600', p); set('--p700', mix(p, '#000000', 0.18)); set('--p900', mix(p, '#020617', 0.62));
    set('--grad', `linear-gradient(160deg, ${mix(p, '#FFFFFF', 0.2)} 0%, ${p} 50%, ${mix(p, '#020617', 0.6)} 100%)`);
  }
  if (dark) { set('--p50', 'rgba(59,130,246,.12)'); set('--p100', 'rgba(59,130,246,.22)'); } else if (p === '#1D4ED8') { st.removeProperty('--p50'); st.removeProperty('--p100'); }
  set('--acc', a); set('--acc-ink', lum(a) > 0.45 ? mix(p, '#020617', 0.55) : '#FFFFFF');
  const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', p);
  if (cfg.nama_aplikasi) document.title = cfg.nama_aplikasi;
}
function setDark(on) {
  document.documentElement.setAttribute('data-theme', on ? 'dark' : 'light');
  LS.set('sp_theme', on ? 'dark' : 'light'); try { localStorage.setItem('sp_theme', on ? 'dark' : 'light'); } catch (e) { /* abaikan */ }
  applyTheme(cfg());
}
const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
function logoHTML(cls) { const c = cfg(); return `<div class="logo ${cls || ''}">${c.logo ? `<img src="${esc(c.logo)}" alt="Logo" onerror="this.remove()">` : I('cap', 'ic-lg')}</div>`; }

// ════════════════════════════════════════════════════════
// BAGIAN 3: STATE & API (satu pintu: google.script.run.api)
// ════════════════════════════════════════════════════════
const S = { tok: null, boot: null, off: 0, c: {}, route: null, params: {}, hist: [], rk: '', pending: 0, readSet: {}, busy: {} };
try { S.tok = localStorage.getItem('sp_tok'); } catch (e) { S.tok = null; }
const cfg = () => (S.boot && S.boot.cfg) || CFG0;
const me = () => (S.boot && S.boot.user) || {};
const hasRole = (r) => (me().roles || []).indexOf(r) >= 0;
const isGuru = () => hasRole('GURU') || hasRole('ADMIN');
const B = () => S.boot || {};
const G = () => (S.boot && S.boot.guru) || { tugas: [], materi: [], ulangan: [], penugasan: [], siswa: [], stats: {} };
const SW = () => (S.boot && S.boot.siswa) || { tugas: [], materi: [], ulangan: [], penugasan: [] };

let loaderT = null;
function loader(d, silent) {
  if (silent) return;
  S.pending = Math.max(0, S.pending + d);
  clearTimeout(loaderT);
  const el = $('#topLoader'); if (!el) return;
  if (S.pending > 0) loaderT = setTimeout(() => el.classList.add('on'), 180); else el.classList.remove('on');
}
/** Aksi baca (aman diulang tanpa reqId). Aksi lain = tulis → membawa reqId sehingga retry tidak menyimpan dobel. */
const API_READ = /^(app\.boot|auth\.login|auth\.googlePoll|auth\.googleToken|tugas\.(detail|mine)|siswa\.rekap|soal\.list|sheet\.read|ulangan\.(detail|monitor|results|essays)|absensi\.get|wali\.recap|laporan\.data|admin\.dash|users\.list|settings\.logs|file\.get)$/;
/** Pengukur kinerja: ketik Perf.table() di Console untuk melihat waktu total vs waktu server. */
const Perf = {
  rows: [],
  add(action, total, server) { this.rows.push({ action, total, server: server === undefined ? null : server, net: server === undefined ? null : total - server, at: new Date().toLocaleTimeString() }); if (this.rows.length > 200) this.rows.shift(); },
  table() { console.table(this.rows.slice(-30)); }
};
window.Perf = Perf;
function waitOnline(ms) { return new Promise((r) => { if (navigator.onLine !== false) { r(); return; } const t = setTimeout(done, ms); function done() { clearTimeout(t); window.removeEventListener('online', done); r(); } window.addEventListener('online', done); }); }
/** Satu permintaan POST ke GAS. text/plain → tanpa CORS preflight; credentials omit → tanpa cookie akun Google. */
async function apiOnce(action, payload, timeout, reqId) {
  const ctrl = window.AbortController ? new AbortController() : null, timer = ctrl ? setTimeout(() => ctrl.abort(), timeout) : null, t0 = performance.now();
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST', redirect: 'follow', cache: 'no-store', credentials: 'omit', signal: ctrl ? ctrl.signal : undefined,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: S.tok || '', reqId: reqId || '', data: payload || {} })
    });
    const text = await res.text();
    let j;
    try { j = JSON.parse(text); } catch (e) { return { success: false, code: 'NET', retryable: res.status >= 500 || res.status === 429, message: 'Server membalas halaman tak terduga (HTTP ' + res.status + '). Periksa GAS_URL di js/config.js.' }; }
    Perf.add(action, Math.round(performance.now() - t0), j.ms);
    return j;
  } catch (err) {
    return { success: false, code: 'NET', retryable: true, message: err && err.name === 'AbortError' ? 'Server terlalu lama merespons.' : 'Koneksi terputus.' };
  } finally { if (timer) clearTimeout(timer); }
}
/**
 * Panggil API server. Retry otomatis bila server padat (BUSY) atau koneksi putus (baca: selalu; tulis: dengan reqId yang sama).
 * @return {Promise<*>} data
 */
function call(action, payload, opt) {
  opt = opt || {};
  if (!GAS_URL) return Promise.reject(Object.assign(new Error('Alamat server belum diatur di js/config.js.'), { code: 'NET' }));
  const isRead = API_READ.test(action), reqId = isRead ? '' : (opt.reqId || uidc());
  const maxBusy = opt.retries === undefined ? 4 : opt.retries, maxNet = opt.netRetries === undefined ? 2 : opt.netRetries;
  const tmo = opt.timeout || (action === 'file.upload' ? 120000 : isRead ? 25000 : 60000);
  let busyN = 0, netN = 0;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      if (netN && navigator.onLine === false) await waitOnline(15000);
      loader(1, opt.silent);
      const res = await apiOnce(action, payload, netN ? Math.round(tmo * 1.6) : tmo, reqId);
      loader(-1, opt.silent);
      if (res.success) { resolve(res.data); return; }
      if (res.code === 'BUSY' && busyN < maxBusy) { const n = busyN++; setTimeout(attempt, 500 * Math.pow(2, n) + Math.random() * 500); return; }
      if (res.code === 'NET' && res.retryable !== false && netN < maxNet) { const n = netN++; setTimeout(attempt, 900 * Math.pow(2, n)); return; }
      if (res.code === 'AUTH' && !opt.noAuth) setTimeout(() => logoutLocal(res.message), 10);
      if (res.code === 'MUSTCHANGE') setTimeout(() => showChangePassword(true), 10);
      let msg = res.message || 'Terjadi kesalahan.';
      if (res.code === 'NET' && res.retryable !== false) msg = navigator.onLine === false ? 'Koneksi internet terputus. Periksa jaringan Anda.' : 'Tidak dapat menghubungi server aplikasi. Periksa koneksi; bila koneksi normal, Admin perlu memeriksa GAS_URL dan akses deployment "Siapa saja".';
      reject(Object.assign(new Error(msg), { code: res.code }));
    };
    attempt();
  });
}
/** Pemanasan server (mengurangi cold start) — dipanggil saat app dibuka & kembali dari latar belakang. */
function warmUp() { if (GAS_URL && !/^http:\/\/localhost/.test(GAS_URL)) fetch(GAS_URL + '?ping=1&t=' + Date.now(), { mode: 'no-cors', cache: 'no-store', credentials: 'omit' }).catch(() => { /* abaikan */ }); }
/** Ambil identitas & warna aplikasi (GET publik), simpan di perangkat agar kunjungan berikutnya langsung bermerek. */
function loadConfig() {
  if (!GAS_URL) return Promise.resolve(null);
  const ctrl = window.AbortController ? new AbortController() : null, tm = ctrl ? setTimeout(() => ctrl.abort(), 20000) : null;
  return fetch(GAS_URL + (GAS_URL.indexOf('?') >= 0 ? '&' : '?') + 'action=config&t=' + Date.now(), { cache: 'no-store', credentials: 'omit', redirect: 'follow', signal: ctrl ? ctrl.signal : undefined })
    .then((r) => r.json()).then((j) => {
      if (tm) clearTimeout(tm);
      if (j.success) { CFG0 = j.data; LS.set('sp_cfg', j.data); return j.data; }
      if (j.code === 'SETUP') { CFG0 = Object.assign({}, CFG0, { notSetup: true, error: j.message }); return CFG0; }
      return null;
    }).catch(() => { if (tm) clearTimeout(tm); return null; });
}
const failToast = (e) => toast(e && e.message ? e.message : String(e), 'err');

/** Cache data per halaman (stale-while-revalidate): tampilkan cache seketika, segarkan di latar. */
function need(key, action, payload, maxAge) {
  const ent = S.c[key], t = Date.now();
  const fresh = ent && ent.d !== undefined && t - ent.t < (maxAge === undefined ? 30000 : maxAge);
  const cooling = ent && ent.errT && t - ent.errT < 15000;
  if (!fresh && !(ent && ent.loading) && !cooling) {
    const rk = S.rk;
    S.c[key] = Object.assign(ent || {}, { loading: true });
    call(action, payload, { silent: !!(ent && ent.d !== undefined) }).then((d) => {
      S.c[key] = { t: Date.now(), d: d };
      if (S.rk === rk) rerender();
    }).catch((e) => {
      S.c[key] = Object.assign(S.c[key] || {}, { loading: false, err: e, errT: Date.now() });
      failToast(e);
      if (S.rk === rk) rerender();
    });
  }
  return ent ? ent.d : undefined;
}
const drop = (prefix) => Object.keys(S.c).forEach((k) => { if (k.indexOf(prefix) === 0) delete S.c[k]; });

function tokUid(tok) { try { const p = (tok || S.tok || '').split('.')[0].replace(/-/g, '+').replace(/_/g, '/'); return JSON.parse(atob(p + '==='.slice((p.length + 3) % 4))).u; } catch (e) { return ''; } }
function setBoot(b, fromSnap) {
  S.boot = b;
  if (!fromSnap) {
    S.off = num(b.serverNow) ? b.serverNow - Date.now() : 0;
    if (b.renew) { S.tok = b.renew; try { localStorage.setItem('sp_tok', S.tok); } catch (e) { /* abaikan */ } delete b.renew; }
  }
  S.readSet = LS.get('sp_read_' + b.user.user_id, {});
  applyTheme(b.cfg);
  saveSnap();
}
const saveSnap = debounce(() => { if (S.boot && S.boot.user) { const ok = LS.set('sp_boot_' + S.boot.user.user_id, Object.assign({}, S.boot, { _snap: Date.now() })); if (!ok) LS.del('sp_boot_' + S.boot.user.user_id); } }, 400);
function refreshBoot(silent) {
  return call('app.boot', {}, { silent: silent !== false }).then((b) => { setBoot(b); renderChrome(); rerender(); return b; });
}

// ════════════════════════════════════════════════════════
// BAGIAN 4: ROUTER SPA (tanpa reload & tanpa URL)
// ════════════════════════════════════════════════════════
const ROUTES = {};
const route = (name, def) => { ROUTES[name] = def; };
function homeRoute() { return hasRole('SISWA') ? 's-home' : hasRole('ADMIN') && !hasRole('GURU') ? 'a-dash' : 'g-dash'; }
function go(name, params, opt) {
  opt = opt || {};
  const r = ROUTES[name];
  if (!r) { go(homeRoute(), {}, { replace: true }); return; }
  if (r.roles && !r.roles.some(hasRole)) { toast('Halaman ini tidak tersedia untuk peran Anda.', 'warn'); return; }
  if (S.route && !opt.replace && !opt.back) { S.hist.push({ name: S.route, params: S.params, y: window.scrollY }); if (S.hist.length > 40) S.hist.shift(); }
  if (S.route && ROUTES[S.route] && ROUTES[S.route].leave) ROUTES[S.route].leave();
  S.route = name; S.params = params || {}; S.rk = name + '|' + JSON.stringify(S.params) + '|' + Date.now();
  try {   // riwayat browser: tombol Kembali HP berpindah halaman di dalam aplikasi, bukan keluar
    const st = { r: name, p: S.params, i: S.hist.length }, url = '#/' + name;
    if (!opt.back) { if (opt.replace || !history.state || !history.state.r) history.replaceState(st, '', url); else history.pushState(st, '', url); }
  } catch (e) { /* abaikan */ }
  closeMenus();
  render();
  window.scrollTo(0, opt.y || 0);
  LS.set('sp_last', { name, params: S.params, u: me().user_id });
}
function back(fallback) {
  if (S.hist.length && history.state && history.state.r) { history.back(); return; }   // diproses oleh popstate
  const p = S.hist.pop();
  if (p) go(p.name, p.params, { back: true, y: p.y }); else go(fallback || homeRoute(), {}, { replace: true });
}
/** Tombol Kembali browser/HP: tutup jendela dulu, jaga sesi ujian, lalu pindah halaman. */
window.addEventListener('popstate', (e) => {
  if (!S.boot || !S.route || $('#shell').hidden) return;
  const cur = { r: S.route, p: S.params, i: S.hist.length };
  if (typeof X !== 'undefined' && X && X.active) { history.pushState(cur, '', '#/' + S.route); toast('Selesaikan dan kirim ujian terlebih dahulu.', 'warn'); return; }
  if (SHEETS.length) { closeSheet(); history.pushState(cur, '', '#/' + S.route); return; }
  const st = e.state;
  if (!st || !st.r || !ROUTES[st.r]) { S.hist = []; go(homeRoute(), {}, { back: true }); return; }
  const idx = Math.max(0, num(st.i, 0)), prev = S.hist[idx];
  S.hist.length = Math.min(S.hist.length, idx);
  go(st.r, st.p || {}, { back: true, y: prev ? prev.y : 0 });
});
function render() {
  const r = ROUTES[S.route]; if (!r) return;
  const box = $('#app-container');
  let html;
  try { html = r.render(S.params || {}); } catch (e) { console.error(e); html = `<div class="page">${emptyState('alert', 'Halaman gagal ditampilkan', esc(e.message))}</div>`; }
  box.innerHTML = html;
  renderTopbar(); markNav();
  document.body.classList.toggle('bare', !!r.bare);
  if (r.mount) { try { r.mount(S.params || {}); } catch (e) { console.error(e); } }
}
/** Render ulang halaman aktif tanpa memindah posisi gulir (dipakai saat data segar tiba). */
function rerender() {
  if (!S.route || $('#shell').hidden) return;
  const r = ROUTES[S.route]; if (!r) return;
  const a = document.activeElement;
  if (a && a.closest && a.closest('#app-container') && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && r.form) return;   // jangan ganggu pengguna yang sedang mengetik
  const y = window.scrollY; render(); window.scrollTo(0, y);
}

// ════════════════════════════════════════════════════════
// BAGIAN 5: KOMPONEN UI (toast, sheet, menu, konfirmasi, kosong, skeleton)
// ════════════════════════════════════════════════════════
function toast(msg, type, ms) {
  type = type || 'info';
  const icon = { ok: 'check-c', err: 'alert-c', warn: 'alert', info: 'info' }[type];
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `${I(icon)}<div class="f1">${esc(msg)}</div><button class="tclose" aria-label="Tutup">${I('x', 'ic-sm')}</button>`;
  const box = $('#toasts'); box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  const kill = () => { el.classList.add('out'); setTimeout(() => el.remove(), 200); };
  el.querySelector('.tclose').onclick = kill;
  setTimeout(kill, ms || (type === 'err' ? 6000 : 3500));
}
const SHEETS = [];
/**
 * Buka bottom-sheet (HP) / modal (desktop).
 * @param {{title:string, body:string, foot?:string, size?:string, onClose?:Function, mount?:Function, id?:string}} o
 */
function sheet(o) {
  const lay = $('#layers');
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const el = document.createElement('div'); el.className = 'sheet ' + (o.size || ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  if (o.id) el.id = o.id;
  el.innerHTML = `<div class="grab"></div><div class="sheet-hd">${o.icon ? `<div class="tile sm">${I(o.icon)}</div>` : ''}<h3>${o.title || ''}</h3><button class="icon-btn" data-x aria-label="Tutup">${I('x')}</button></div>
    <div class="sheet-bd">${o.body || ''}</div>${o.foot ? `<div class="sheet-ft">${o.foot}</div>` : ''}`;
  lay.appendChild(scrim); lay.appendChild(el);
  const rec = { el, scrim, o };
  SHEETS.push(rec);
  requestAnimationFrame(() => { scrim.classList.add('show'); el.classList.add('show'); });
  const close = () => closeSheet(rec);
  scrim.onclick = () => { if (!o.locked) close(); };
  el.querySelector('[data-x]').onclick = close;
  if (o.locked) el.querySelector('[data-x]').hidden = true;
  if (o.mount) o.mount(el, close);
  setTimeout(() => { const f = el.querySelector('[autofocus]'); if (f) f.focus(); }, 260);
  return { el, close };
}
function closeSheet(rec) {
  if (!rec) rec = SHEETS[SHEETS.length - 1];
  if (!rec) return;
  const i = SHEETS.indexOf(rec); if (i >= 0) SHEETS.splice(i, 1);
  rec.el.classList.remove('show'); rec.scrim.classList.remove('show');
  setTimeout(() => { rec.el.remove(); rec.scrim.remove(); }, 260);
  if (rec.o.onClose) rec.o.onClose();
}
function closeAllSheets() { while (SHEETS.length) closeSheet(SHEETS[SHEETS.length - 1]); }
function confirmBox(msg, o) {
  o = o || {};
  return new Promise((res) => {
    let done = false;
    const s = sheet({
      title: o.title || 'Konfirmasi', icon: o.icon || (o.danger ? 'alert' : 'info'), body: `<p class="tx2">${msg}</p>${o.extra || ''}`,
      foot: `<button class="btn btn-secondary" data-no>${esc(o.no || 'Batal')}</button><button class="btn ${o.danger ? 'btn-danger' : 'btn-primary'}" data-yes>${esc(o.yes || 'Ya, lanjutkan')}</button>`,
      onClose: () => { if (!done) res(false); },
      mount: (el, close) => {
        el.querySelector('[data-no]').onclick = () => { done = true; res(false); close(); };
        el.querySelector('[data-yes]').onclick = () => { done = true; res(o.collect ? o.collect(el) : true); close(); };
      }
    });
    return s;
  });
}
function menuAt(anchor, items) {
  closeMenus();
  const r = anchor.getBoundingClientRect();
  const m = document.createElement('div'); m.className = 'menu-pop'; m.id = 'menuPop';
  m.innerHTML = items.map((it, i) => it === '-' ? '<div class="sep"></div>' : `<button data-i="${i}" class="${it.danger ? 'danger' : ''}">${it.icon ? I(it.icon) : ''}<span>${esc(it.label)}</span></button>`).join('');
  document.body.appendChild(m);
  const w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = clamp(r.right - w, 8, window.innerWidth - w - 8) + 'px';
  m.style.top = (r.bottom + h + 8 > window.innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6) + 'px';
  m.onclick = (e) => { const b = e.target.closest('[data-i]'); if (!b) return; const it = items[+b.dataset.i]; closeMenus(); it.run(); };
  setTimeout(() => document.addEventListener('click', closeMenus, { once: true }), 0);
}
function closeMenus() { const m = $('#menuPop'); if (m) m.remove(); const sp = $('#searchPop'); if (sp) sp.remove(); }
const emptyState = (icon, title, text, action) => `<div class="empty"><div class="tile">${I(icon, 'ic-xl')}</div><h3>${title}</h3><p class="small">${text || ''}</p>${action ? `<div class="mt16">${action}</div>` : ''}</div>`;
const skel = (h, w, cls) => `<div class="skel ${cls || ''}" style="height:${h || 16}px;width:${w || '100%'}"></div>`;
const skelCards = (n, h) => `<div class="grid">${Array.from({ length: n || 3 }).map(() => `<div class="card card-p">${skel(14, '40%')}<div class="mt12">${skel(h || 40)}</div></div>`).join('')}</div>`;
const skelPage = () => `<div class="page"><div class="mb16">${skel(28, '45%')}</div>${skel(14, '30%')}<div class="grid gc4 mt24">${[1, 2, 3, 4].map(() => `<div class="card card-p">${skel(14, '50%')}<div class="mt12">${skel(28, '40%')}</div></div>`).join('')}</div><div class="mt24">${skelCards(3, 60)}</div></div>`;
function avatar(name, foto, cls) { return `<div class="av c${hashN(name) % 6 + 1} ${cls || ''}">${foto ? `<img src="${esc(foto)}" alt="" loading="lazy" onerror="this.remove()">` : esc(initials(name))}</div>`; }
const pill = (txt, cls, icon) => `<span class="pill pill-${cls}">${icon ? I(icon) : ''}${esc(txt)}</span>`;
function btnBusy(btn, on, label) {
  if (!btn) return;
  if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spin"></span>${esc(label || 'Memproses…')}`; }
  else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; }
}
function copyText(t) {
  const done = () => toast('Disalin: ' + t, 'ok');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done).catch(() => fallback());
  else fallback();
  function fallback() { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) { /* abaikan */ } a.remove(); }
}
function formData(root) {
  const o = {};
  $$('[name]', root).forEach((el) => {
    if (el.type === 'checkbox') { if (el.dataset.multi) { o[el.name] = o[el.name] || []; if (el.checked) o[el.name].push(el.value); } else o[el.name] = el.checked; }
    else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; }
    else o[el.name] = el.value;
  });
  return o;
}
/** Tabel dengan cari, urut, dan halaman — sepenuhnya di klien (instan). */
function dataTable(id, rows, cols, opt) {
  opt = opt || {};
  const st = S.c['tbl_' + id] = S.c['tbl_' + id] || { q: '', sort: opt.sort || null, dir: 1, page: 0 };
  const per = opt.per || 20;
  let list = rows;
  if (st.q) { const q = st.q.toLowerCase(); list = list.filter((r) => cols.some((c) => c.search !== false && String(c.v ? c.v(r) : r[c.k] === undefined ? '' : r[c.k]).toLowerCase().indexOf(q) >= 0)); }
  if (st.sort) { const c = cols.find((x) => x.k === st.sort); if (c) list = list.slice().sort(by(c.v || c.k, st.dir)); }
  const pages = Math.max(1, Math.ceil(list.length / per)); st.page = Math.min(st.page, pages - 1);
  const view = list.slice(st.page * per, st.page * per + per);
  const pgBtns = []; for (let i = 0; i < pages; i++) if (i < 2 || i > pages - 3 || Math.abs(i - st.page) < 2) pgBtns.push(i); else if (pgBtns[pgBtns.length - 1] !== '…') pgBtns.push('…');
  return `${opt.search === false ? '' : `<div class="flex g12 items-c wrap" style="padding:14px 16px;border-bottom:1px solid var(--border)">
      <div class="input-ic f1" style="min-width:200px">${I('search')}<input class="input input-sm" placeholder="${esc(opt.ph || 'Cari…')}" value="${esc(st.q)}" oninput="tblSearch('${id}',this.value)"></div>${opt.tools || ''}</div>`}
    <div class="tbl-wrap"><table class="tbl ${opt.cls || ''}"><thead><tr>${cols.map((c) => `<th class="${c.k && c.sort !== false ? 'sortable' : ''} ${c.n ? 'n' : ''}" ${c.k && c.sort !== false ? `onclick="tblSort('${id}','${c.k}')"` : ''} style="${c.w ? 'width:' + c.w : ''}">${esc(c.h)}${st.sort === c.k ? (st.dir > 0 ? ' ↑' : ' ↓') : ''}</th>`).join('')}</tr></thead>
    <tbody>${view.length ? view.map((r) => `<tr class="${opt.rowCls ? opt.rowCls(r) : ''}" ${opt.onRow ? `onclick="${opt.onRow(r)}" style="cursor:pointer"` : ''}>${cols.map((c) => `<td class="${c.n ? 'n' : ''}">${c.r ? c.r(r) : esc(r[c.k])}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}">${emptyState('inbox', opt.emptyT || 'Belum ada data', opt.emptyD || '')}</td></tr>`}</tbody></table></div>
    ${list.length > per ? `<div class="pager"><span>Menampilkan ${st.page * per + 1}–${Math.min(list.length, st.page * per + per)} dari ${fmtN(list.length, 0)}</span><div class="pg"><button ${st.page === 0 ? 'disabled' : ''} onclick="tblPage('${id}',${st.page - 1})">${I('chev-l', 'ic-sm')}</button>${pgBtns.map((i) => i === '…' ? '<span class="muted" style="padding:6px">…</span>' : `<button class="${i === st.page ? 'on' : ''}" onclick="tblPage('${id}',${i})">${i + 1}</button>`).join('')}<button ${st.page >= pages - 1 ? 'disabled' : ''} onclick="tblPage('${id}',${st.page + 1})">${I('chev-r', 'ic-sm')}</button></div></div>` : (list.length ? `<div class="pager"><span>Menampilkan ${fmtN(list.length, 0)} data</span></div>` : '')}`;
}
const tblSearch = debounce((id, q) => { const st = S.c['tbl_' + id]; st.q = q; st.page = 0; rerenderKeepFocus(); }, 160);
function tblSort(id, k) { const st = S.c['tbl_' + id]; if (st.sort === k) st.dir = -st.dir; else { st.sort = k; st.dir = 1; } rerender(); }
function tblPage(id, p) { S.c['tbl_' + id].page = p; rerender(); }
function rerenderKeepFocus() {
  const a = document.activeElement, sel = a && a.tagName === 'INPUT' ? (a.getAttribute('oninput') || a.id || '') : '';
  const pos = a && a.selectionStart;
  const y = window.scrollY; render(); window.scrollTo(0, y);
  if (sel) { const n = $$('#app-container input').find((x) => (x.getAttribute('oninput') || x.id || '') === sel); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* abaikan */ } } }
}

// ════════════════════════════════════════════════════════
// BAGIAN 6: GRAFIK SVG RINGAN (tanpa pustaka, langsung tampil)
// ════════════════════════════════════════════════════════
const CH = {
  colors: () => { const cs = getComputedStyle(document.documentElement); return { p: cs.getPropertyValue('--p600').trim() || '#1D4ED8', p3: cs.getPropertyValue('--p300').trim() || '#93B4FF', ok: '#16A34A', warn: '#D97706', err: '#DC2626' }; },
  /** Batang vertikal. data: [{l, v, c?}] */
  bars(data, o) {
    o = o || {}; const W = 640, H = o.h || 240, P = { l: 36, r: 12, t: 22, b: 40 };
    if (!data.length) return `<div class="empty small">Belum ada data untuk grafik.</div>`;
    const max = o.max || Math.max(10, ...data.map((d) => d.v || 0)), step = (W - P.l - P.r) / data.length, bw = Math.min(56, step * 0.6);
    const y = (v) => P.t + (H - P.t - P.b) * (1 - v / max), cols = CH.colors();
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'Grafik batang')}">
      ${ticks.map((t) => `<line class="grid-l" x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${P.l - 8}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join('')}
      ${o.ref !== undefined ? `<line x1="${P.l}" x2="${W - P.r}" y1="${y(o.ref)}" y2="${y(o.ref)}" stroke="${cols.err}" stroke-dasharray="5 4" stroke-width="1.5"/><text x="${W - P.r}" y="${y(o.ref) - 6}" text-anchor="end" style="fill:${cols.err};font-weight:600">${esc(o.refLabel || o.ref)}</text>` : ''}
      ${data.map((d, i) => { const x = P.l + step * i + (step - bw) / 2, v = d.v || 0; return `<rect x="${x}" y="${y(v)}" width="${bw}" height="${Math.max(0, H - P.b - y(v))}" rx="6" fill="${d.c || cols.p}"><title>${esc(d.l)}: ${fmtN(v)}</title></rect>
        <text class="lbl-v" x="${x + bw / 2}" y="${y(v) - 6}" text-anchor="middle">${fmtN(v)}${o.unit || ''}</text>
        <text x="${x + bw / 2}" y="${H - P.b + 18}" text-anchor="middle">${esc(String(d.l).slice(0, 12))}</text>`; }).join('')}
    </svg>`;
  },
  /** Garis. data: [{l, v}] */
  line(data, o) {
    o = o || {}; const W = 640, H = o.h || 240, P = { l: 40, r: 16, t: 20, b: 36 };
    if (!data.length) return `<div class="empty small">Belum ada data untuk grafik.</div>`;
    const vals = data.map((d) => d.v), max = o.max || Math.max(...vals, 10), min = o.min !== undefined ? o.min : Math.max(0, Math.floor(Math.min(...vals) / 10) * 10 - 10);
    const x = (i) => P.l + (data.length === 1 ? (W - P.l - P.r) / 2 : (W - P.l - P.r) * i / (data.length - 1)), y = (v) => P.t + (H - P.t - P.b) * (1 - (v - min) / (max - min || 1));
    const pts = data.map((d, i) => `${x(i)},${y(d.v)}`).join(' '), cols = CH.colors();
    const ticks = [0, 0.5, 1].map((f) => Math.round(min + (max - min) * f));
    const every = Math.ceil(data.length / 8);
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || 'Grafik garis')}">
      ${ticks.map((t) => `<line class="grid-l" x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}"/><text x="${P.l - 8}" y="${y(t) + 4}" text-anchor="end">${t}${o.unit || ''}</text>`).join('')}
      <polygon points="${x(0)},${H - P.b} ${pts} ${x(data.length - 1)},${H - P.b}" fill="${cols.p}" opacity=".08"/>
      <polyline points="${pts}" fill="none" stroke="${cols.p}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${data.map((d, i) => `<circle cx="${x(i)}" cy="${y(d.v)}" r="${data.length > 20 ? 2.5 : 4}" fill="var(--surface)" stroke="${cols.p}" stroke-width="2"><title>${esc(d.l)}: ${fmtN(d.v)}${o.unit || ''}</title></circle>
        ${i % every === 0 || i === data.length - 1 ? `<text x="${x(i)}" y="${H - P.b + 18}" text-anchor="middle">${esc(d.l)}</text>` : ''}
        ${data.length <= 12 ? `<text class="lbl-v" x="${x(i)}" y="${y(d.v) - 10}" text-anchor="middle">${fmtN(d.v)}${o.unit || ''}</text>` : ''}`).join('')}
    </svg>`;
  },
  /** Batang horizontal bertumpuk (bagian dari keseluruhan). parts: [{l, v, c}] */
  stack(parts, o) {
    o = o || {}; const tot = sum(parts.map((p) => p.v)) || 1;
    return `<div class="col g12"><div style="display:flex;height:22px;border-radius:99px;overflow:hidden;background:var(--border)">${parts.map((p) => p.v ? `<div title="${esc(p.l)}: ${p.v}" style="width:${p.v / tot * 100}%;background:${p.c}"></div>` : '').join('')}</div>
      <div class="legend-row">${parts.map((p) => `<span><i style="background:${p.c}"></i>${esc(p.l)} <b>${fmtN(p.v, 0)}</b> <span class="muted">(${fmtN(p.v / tot * 100)}%)</span></span>`).join('')}</div></div>`;
  },
  ring(val, max, o) {
    o = o || {}; const r = 64, c = 2 * Math.PI * r, f = clamp((val || 0) / (max || 100), 0, 1), col = o.c || CH.colors().p;
    return `<div class="result-ring"><svg viewBox="0 0 150 150"><circle cx="75" cy="75" r="${r}" fill="none" stroke="var(--border)" stroke-width="12"/><circle cx="75" cy="75" r="${r}" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${c * f} ${c}"/></svg><div class="v">${o.text !== undefined ? o.text : fmtN(val)}</div></div>`;
  }
};

// ════════════════════════════════════════════════════════
// BAGIAN 7: BERKAS (kompres gambar di perangkat, unggah, pratinjau)
// ════════════════════════════════════════════════════════
function readB64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(new Error('Gagal membaca berkas.')); r.readAsDataURL(file); }); }
/** Perkecil gambar: sisi terpanjang 1280 px, JPEG ±80% → hemat kuota siswa. */
function compressImage(file, maxSide, q) {
  maxSide = maxSide || 1280; q = q || 0.8;
  return new Promise((res) => {
    if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) { res(file); return; }
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(1, maxSide / Math.max(img.width, img.height)), cv = document.createElement('canvas');
      cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s);
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      cv.toBlob((b) => { if (!b || b.size >= file.size) res(file); else res(new File([b], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })); }, 'image/jpeg', q);
    };
    img.onerror = () => { URL.revokeObjectURL(url); res(file); };
    img.src = url;
  });
}
async function uploadFile(file, folder, ref) {
  if (file.size > 10 * 1024 * 1024) throw new Error(`"${file.name}" melebihi 10 MB.`);
  const f = await compressImage(file);
  const data = await readB64(f);
  return call('file.upload', { folder, ref, name: f.name, mime: f.type || 'application/octet-stream', data }, { silent: true, retries: 2 });
}
const fileIcon = (name, mime) => /pdf/i.test(mime || name) ? 'file-text' : /image|png|jpe?g|webp/i.test(mime || name) ? 'image' : 'file';
const fmtSize = (b) => b > 1048576 ? fmtN(b / 1048576) + ' MB' : fmtN(b / 1024, 0) + ' KB';
const drivePreview = (id) => `https://drive.google.com/file/d/${id}/preview`;
const driveImg = (id, w) => /^https?:/.test(id || '') ? id : `https://drive.google.com/thumbnail?id=${id}&sz=w${w || 1200}`;
const driveDl = (id) => `https://drive.google.com/uc?export=download&id=${id}`;
function ytId(u) { const m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : ''; }
/** Pratinjau berkas publik (Drive) atau privat (base64 dari server) di dalam modal — bukan tab baru. */
function previewPublic(title, id, kind, url) {
  let body;
  if (kind === 'VIDEO' && ytId(url)) body = `<div style="position:relative;padding-top:56.25%;border-radius:12px;overflow:hidden;background:#000"><iframe src="https://www.youtube-nocookie.com/embed/${ytId(url)}" style="position:absolute;inset:0;width:100%;height:100%;border:0" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
  else if (kind === 'IMG') body = `<img src="${esc(driveImg(id, 1600))}" alt="" style="width:100%;border-radius:12px">`;
  else if (id) body = `<iframe src="${drivePreview(id)}" style="width:100%;height:70vh;border:0;border-radius:12px;background:var(--subtle)"></iframe>`;
  else body = `<div class="banner banner-info">${I('link')}<div>Materi ini berupa tautan eksternal.<div class="mt8"><a href="${esc(url)}" target="_blank" rel="noopener" class="bold">${esc(url)}</a></div></div></div>`;
  sheet({ title: esc(title), size: 'wide', body, foot: `<button class="btn btn-secondary" data-x2>${I('x')}Tutup</button>${id ? `<a class="btn btn-primary" href="${driveDl(id)}" target="_blank" rel="noopener">${I('download')}Unduh</a>` : url ? `<a class="btn btn-primary" href="${esc(url)}" target="_blank" rel="noopener">${I('external')}Buka</a>` : ''}`, mount: (el, close) => { el.querySelector('[data-x2]').onclick = close; } });
}
function previewPrivate(kumpulId, fileId, name) {
  const s = sheet({ title: esc(name || 'Pratinjau berkas'), size: 'wide', body: `<div class="tc" style="padding:40px">${skel(320)}<p class="muted mt12">Memuat berkas…</p></div>` });
  call('file.get', { kumpul_id: kumpulId, file_id: fileId }).then((f) => {
    const bin = atob(f.data), arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    const url = URL.createObjectURL(new Blob([arr], { type: f.mime }));
    const bd = s.el.querySelector('.sheet-bd');
    bd.innerHTML = /^image[/]/.test(f.mime) ? `<img src="${url}" style="width:100%;border-radius:12px">` : /pdf/.test(f.mime) ? `<iframe src="${url}" style="width:100%;height:72vh;border:0;border-radius:12px"></iframe>` : `<div class="banner banner-info">${I('file')}Pratinjau tidak tersedia untuk jenis berkas ini. Gunakan tombol Unduh.</div>`;
    const ft = document.createElement('div'); ft.className = 'sheet-ft';
    ft.innerHTML = `<a class="btn btn-primary" href="${url}" download="${esc(f.name)}">${I('download')}Unduh</a>`;
    s.el.appendChild(ft);
  }).catch((e) => { s.el.querySelector('.sheet-bd').innerHTML = `<div class="banner banner-err">${I('alert-c')}${esc(e.message)}</div>`; });
}
/** Unduh Excel (.xlsx via SheetJS, dimuat saat dibutuhkan) dengan cadangan CSV. */
let XLSXP = null;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (XLSXP) return XLSXP;
  XLSXP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'; s.onload = () => res(window.XLSX); s.onerror = () => { XLSXP = null; rej(new Error('Pustaka Excel gagal dimuat.')); }; document.head.appendChild(s); });
  return XLSXP;
}
function downloadBlob(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
function exportXlsx(name, sheets) {
  // sheets: [{name, rows:[[...]]}]
  loadXLSX().then((X) => {
    const wb = X.utils.book_new();
    sheets.forEach((s) => { const ws = X.utils.aoa_to_sheet(s.rows); ws['!cols'] = (s.rows[0] || []).map((h, i) => ({ wch: Math.min(48, Math.max(8, ...s.rows.slice(0, 200).map((r) => String(r[i] === undefined ? '' : r[i]).length + 2))) })); X.utils.book_append_sheet(wb, ws, s.name.slice(0, 31)); });
    X.writeFile(wb, name + '.xlsx');
    toast('Berkas Excel diunduh.', 'ok');
  }).catch(() => {
    const s = sheets[0], csv = s.rows.map((r) => r.map((v) => { v = v === null || v === undefined ? '' : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\n');
    downloadBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), name + '.csv');
    toast('Excel tidak tersedia, diunduh sebagai CSV.', 'warn');
  });
}
/** Baca .xlsx / .csv menjadi array baris (array of arrays). */
function readSheetFile(file) {
  if (/\.csv$/i.test(file.name) || file.type === 'text/csv') {
    return file.text().then((t) => {
      const sep = (t.split('\n')[0].match(/;/g) || []).length > (t.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
      const rows = []; let row = [], cur = '', q = false;
      for (let i = 0; i < t.length; i++) { const ch = t[i]; if (q) { if (ch === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; } else if (ch === '"') q = true; else if (ch === sep) { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur.replace(/\r$/, '')); rows.push(row); row = []; cur = ''; } else cur += ch; }
      if (cur || row.length) { row.push(cur); rows.push(row); }
      return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
    });
  }
  return loadXLSX().then((X) => file.arrayBuffer().then((buf) => { const wb = X.read(buf, { type: 'array' }); return X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: '' }); }));
}
/** Ubah baris (dengan header) menjadi objek ber-kunci header huruf kecil. */
function rowsToObjs(rows) {
  if (!rows || rows.length < 2) return [];
  const h = rows[0].map((x) => String(x).trim().toLowerCase().replace(/\s+/g, '_'));
  return rows.slice(1).filter((r) => r.some((c) => String(c).trim() !== '')).map((r) => { const o = {}; h.forEach((k, i) => { if (k) o[k] = String(r[i] === undefined ? '' : r[i]).trim(); }); return o; });
}
(window.__SP_F__ = window.__SP_F__ || {}).core = 1;
