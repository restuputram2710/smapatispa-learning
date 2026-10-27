'use strict';
// ════════════════════════════════════════════════════════
// BAGIAN 8: LOOKUP DATA MASTER
// ════════════════════════════════════════════════════════
const mapelBy = (id) => (B().mapel || []).find((m) => m.mapel_id === id) || { nama_mapel: '-', ikon: 'book', kode: '' };
const kelasBy = (id) => (B().kelas || []).find((k) => k.kelas_id === id) || { nama_kelas: '-' };
const kelasNm = (id) => kelasBy(id).nama_kelas;
const mapelNm = (id) => mapelBy(id).nama_mapel;
const kelasShort = (id) => { const k = kelasBy(id); return k.jenis === 'ESKUL' || k.jenis === 'PENGAYAAN' ? String(k.nama_kelas) : String(k.nama_kelas).split(' ')[0]; };
const siswaBy = (id) => (G().siswa || []).find((s) => s.user_id === id) || { nama: '-' };
const MAPEL_ICONS = ['calc', 'atom', 'leaf', 'flask', 'book', 'globe', 'landmark', 'terminal', 'chart', 'palette', 'music', 'dumbbell', 'scale', 'compass', 'languages', 'moon'];
const mapelTone = (id) => 'ico-t' + ((hashN(id) % 8) + 1);
const mapelIcon = (id, cls) => `<div class="tile ${cls || ''} ${mapelTone(id)}">${I(mapelBy(id).ikon || 'book')}</div>`;
const penLabel = (p) => `${mapelNm(p.mapel_id)} · ${kelasShort(p.kelas_id)}`;
const JENIS_UL = { UH: 'UH', UTS: 'UTS', UAS: 'UAS', LATIHAN: 'Latihan' };
const TIPE_SOAL = { PG: 'Pilihan Ganda', MCMA: 'PG Kompleks MCMA', KATEGORI: 'PG Kompleks Kategori', ESAI: 'Esai' };
const TIPE_IC = { PG: 'radio', MCMA: 'checkbox', KATEGORI: 'table', ESAI: 'pen' };
function ulStatus(u) {
  const t = now();
  if (u.status && u.status !== 'TERBIT') return { k: 'DRAF', l: 'Draf', c: 'neu' };   // data siswa hanya berisi ujian terbit
  if (t < u.buka) return { k: 'JADWAL', l: 'Terjadwal', c: 'info' };
  if (t <= u.tutup) return { k: 'AKTIF', l: 'Berlangsung', c: 'ok' };
  return { k: 'SELESAI', l: 'Selesai', c: 'neu' };
}

// ════════════════════════════════════════════════════════
// BAGIAN 9: SHELL — sidebar, topbar, navigasi bawah, cari, notifikasi
// ════════════════════════════════════════════════════════
function navConfig() {
  const g = G(), b = B(), groups = [];
  if (hasRole('SISWA')) {
    const sw = SW(), belum = sw.tugas.filter((t) => !t.my).length, uj = sw.ulangan.filter((u) => ulStatus(u).k === 'AKTIF' && (!u.my || u.my.status === 'MENGERJAKAN')).length;
    groups.push({ items: [
      { r: 's-home', ic: 'home', l: 'Beranda', bn: 'Beranda' }, { r: 's-mapel', ic: 'book', l: 'Mata Pelajaran', bn: 'Mapel' },
      { r: 's-tugas', ic: 'clipboard', l: 'Tugas', bn: 'Tugas', badge: belum }, { r: 's-ujian', ic: 'exam', l: 'Ujian', bn: 'Ujian', badge: uj, bp: true },
      { r: 'jadwal', ic: 'clock', l: 'Jadwal Pelajaran' }, { r: 's-nilai', ic: 'chart', l: 'Nilai & Kehadiran' }, { r: 'agenda', ic: 'calendar', l: 'Agenda Sekolah' }, { r: 'akun', ic: 'user', l: 'Akun Saya', bn: 'Akun' }] });
    return { groups, bottom: ['s-home', 's-mapel', 's-tugas', 's-ujian', 'akun'] };
  }
  const koreksi = (g.ulangan || []).reduce((n, u) => n + (u.koreksi || 0), 0);
  if (hasRole('ADMIN')) groups.push({ t: 'Admin', items: [
    { r: 'a-dash', ic: 'dash', l: 'Dashboard Admin', bn: 'Beranda' }, { r: 'a-users', ic: 'users', l: 'Pengguna', bn: 'Pengguna', badge: (b.admin || {}).pendingReg },
    { r: 'a-akademik', ic: 'door', l: 'Data Akademik' }, { r: 'a-jadwal', ic: 'clock', l: 'Jadwal Pelajaran' }, { r: 'a-settings', ic: 'sliders', l: 'Pengaturan', bn: 'Atur' }] });
  if (hasRole('GURU')) groups.push({ t: 'Guru', items: [
    { r: 'g-dash', ic: 'dash', l: 'Dashboard', bn: 'Beranda' }, { r: 'g-konten', ic: 'clipboard', l: 'Materi & Tugas', bn: 'Tugas', badge: g.stats.perluDinilai },
    { r: 'jadwal', ic: 'clock', l: 'Jadwal Mengajar' }, { r: 'g-bank', ic: 'list-check', l: 'Bank Soal' }, { r: 'g-ujian', ic: 'exam', l: 'Ujian CBT', bn: 'Ujian', badge: koreksi }, { r: 'g-absensi', ic: 'user-plus', l: 'Presensi Siswa', bn: 'Absensi' }] });
  else if (hasRole('ADMIN')) groups.push({ t: 'Akademik', items: [{ r: 'g-ujian', ic: 'exam', l: 'Ujian CBT', bn: 'Ujian', badge: koreksi }, { r: 'g-bank', ic: 'list-check', l: 'Bank Soal' }] });
  if (hasRole('WALI')) groups.push({ t: 'Wali Kelas', items: (me().waliKelas || []).map((k) => ({ r: 'w-kelas', p: { kelas_id: k }, ic: 'users', l: 'Kelas ' + kelasShort(k), meta: plural(jmlSiswaKelas(k), 'siswa') })) });
  groups.push({ t: 'Umum', items: [{ r: 'agenda', ic: 'calendar', l: 'Agenda Sekolah' }, { r: 'laporan', ic: 'trending', l: 'Laporan & Grafik' }, { r: 'akun', ic: 'user', l: 'Akun Saya' }] });
  const bottom = hasRole('GURU') ? ['g-dash', 'g-konten', 'g-ujian', 'g-absensi', '@menu'] : ['a-dash', 'a-users', 'g-ujian', 'a-settings', '@menu'];
  return { groups, bottom };
}
function allNavItems() { const out = []; navConfig().groups.forEach((g) => g.items.forEach((i) => out.push(i))); return out; }
function renderChrome() {
  const u = me(), c = cfg(), nav = navConfig();
  const roleLbl = hasRole('SISWA') ? `${kelasNm(u.kelas_id)}` : [hasRole('ADMIN') ? 'Admin' : '', hasRole('GURU') ? 'Guru' : '', hasRole('WALI') ? 'Wali Kelas' : ''].filter(Boolean).join(' · ');
  $('#sidebar').innerHTML = `<div class="brand">${logoHTML()}<div class="f1" style="min-width:0"><div class="nm truncate">${esc(shortName(c.nama_aplikasi))}</div><div class="sub">LMS &amp; CBT</div></div></div>
    <nav class="side-nav">${nav.groups.map((g) => `${g.t ? `<div class="nav-grp">${esc(g.t)}</div>` : '<div style="height:8px"></div>'}${g.items.map((i) => `<button class="nav-a" data-r="${i.r}" data-p='${esc(JSON.stringify(i.p || {}))}' onclick='go("${i.r}", ${JSON.stringify(i.p || {})})'>${I(i.ic)}<span class="truncate">${esc(i.l)}</span>${i.badge ? `<span class="badge ${i.bp ? 'p' : 'p'}">${i.badge}</span>` : i.meta ? `<span class="meta">${esc(i.meta)}</span>` : ''}</button>`).join('')}`).join('')}</nav>
    <div class="side-user">${avatar(u.nama, u.foto, 'sm')}<div class="f1" style="min-width:0"><div class="bold truncate small">${esc(u.nama)}</div><div class="mono xs muted truncate">${esc(u.nis_nip || roleLbl)}</div></div><button class="icon-btn" title="Keluar" onclick="doLogout()">${I('logout')}</button></div>`;
  const items = allNavItems();
  $('#bnav').innerHTML = nav.bottom.map((r) => {
    if (r === '@menu') return `<button onclick="openNavSheet()" data-r="@menu">${I('menu')}<span>Menu</span></button>`;
    const it = items.find((i) => i.r === r) || { r, ic: 'user', l: 'Akun', bn: 'Akun' };
    return `<button data-r="${r}" onclick="go('${r}')">${I(it.ic)}<span>${esc(it.bn || it.l)}</span>${it.badge ? `<span class="badge ${it.bp ? 'p' : ''}">${it.badge}</span>` : ''}</button>`;
  }).join('');
  markNav();
}
const shortName = (n) => { n = String(n || 'SMAPATISPA'); return n.length > 22 ? n.split(' ')[0] : n; };
function markNav() {
  const r = S.route, p = JSON.stringify(S.params || {});
  const def = ROUTES[r] || {}, navKey = def.nav || r;
  $$('#sidebar .nav-a').forEach((a) => a.classList.toggle('on', a.dataset.r === navKey && (a.dataset.r !== 'w-kelas' || a.dataset.p === p || JSON.parse(a.dataset.p).kelas_id === (S.params || {}).kelas_id)));
  $$('#bnav button').forEach((a) => a.classList.toggle('on', a.dataset.r === navKey || (a.dataset.r === '@menu' && !nav0().bottom.includes(navKey))));
}
const nav0 = () => navConfig();
function openNavSheet() {
  const nav = navConfig();
  sheet({ title: 'Menu', body: nav.groups.map((g) => `${g.t ? `<div class="nav-grp" style="padding-left:4px">${esc(g.t)}</div>` : ''}<div class="col g4">${g.items.map((i) => `<button class="nav-a" onclick='closeAllSheets();go("${i.r}", ${JSON.stringify(i.p || {})})'>${I(i.ic)}<span>${esc(i.l)}</span>${i.badge ? `<span class="badge">${i.badge}</span>` : ''}</button>`).join('')}</div>`).join('') + `<div class="divider"></div><button class="nav-a" onclick="closeAllSheets();doLogout()" style="color:var(--err-x)">${I('logout')}<span>Keluar</span></button>` });
}
function unreadCount() {
  const n = B().notif || { items: [], lastRead: 0 };
  return n.items.filter((x) => x.waktu > n.lastRead && !S.readSet[x.notif_id]).length;
}
function renderTopbar() {
  const def = ROUTES[S.route] || {}, u = me(), unread = unreadCount();
  const title = typeof def.title === 'function' ? def.title(S.params) : (def.title || '');
  const desk = window.innerWidth >= 1024;
  const crumbRole = hasRole('SISWA') ? 'Siswa' : hasRole('GURU') ? 'Guru' : 'Admin';
  const showBack = def.back && S.hist.length >= 0 && def.back !== false;
  $('#topbar').hidden = !!(def.bare && !desk);
  $('#topbar').innerHTML = `${!desk && showBack ? `<button class="icon-btn" onclick="back('${def.back === true ? homeRoute() : def.back}')" aria-label="Kembali">${I('arrow-l')}</button>` : (!desk ? logoHTML('sm') : '')}
    ${desk ? `<div class="crumb">${I('home', 'ic-sm')}<span>${crumbRole}</span>${I('chev-r', 'ic-sm')}<b class="truncate">${esc(title)}</b></div>` : `<div class="ttl truncate f1">${esc(title)}</div>`}
    ${desk ? `<div class="top-search rel"><div class="input-ic">${I('search')}<input id="gSearch" class="input input-sm" placeholder="${hasRole('SISWA') ? 'Cari materi, tugas, atau ujian…' : 'Cari siswa, tugas, ujian…'}" autocomplete="off" oninput="globalSearch(this.value)" onfocus="globalSearch(this.value)"></div></div><div class="f1"></div>` : ''}
    ${isGuru() && desk ? `<button class="btn btn-primary" onclick="openCreateMenu(this)">${I('plus')}Buat ${I('chev-d', 'ic-sm')}</button>` : ''}
    <button class="icon-btn" onclick="openNotif(this)" aria-label="Notifikasi">${I('bell')}${unread ? `<span class="badge">${unread > 9 ? '9+' : unread}</span>` : ''}</button>
    ${desk ? `<button class="flex items-c g8" style="padding:4px 6px;border-radius:12px" onclick="openUserMenu(this)">${avatar(u.nama, u.foto, 'sm')}<div class="tl" style="text-align:left;line-height:1.25"><div class="bold small truncate" style="max-width:180px">${esc(u.nama)}</div><div class="xs muted">${esc(hasRole('SISWA') ? kelasNm(u.kelas_id) : [hasRole('ADMIN') ? 'Admin' : '', hasRole('GURU') ? 'Guru' : '', hasRole('WALI') ? 'Wali Kelas' : ''].filter(Boolean).join(' · '))}</div></div>${I('chev-d', 'ic-sm')}</button>` : `<button onclick="go('akun')" style="border-radius:50%">${avatar(u.nama, u.foto, 'sm')}</button>`}`;
}
function openUserMenu(el) {
  menuAt(el, [{ icon: 'user', label: 'Akun Saya', run: () => go('akun') }, { icon: isDark() ? 'sun' : 'moon', label: isDark() ? 'Mode terang' : 'Mode gelap', run: () => { setDark(!isDark()); rerender(); } }, '-', { icon: 'logout', label: 'Keluar', danger: true, run: doLogout }]);
}
function openCreateMenu(el) {
  menuAt(el, [
    { icon: 'book', label: 'Materi baru', run: () => go('g-konten', { form: 'materi' }) },
    { icon: 'clipboard', label: 'Tugas baru', run: () => go('g-konten', { form: 'tugas' }) },
    { icon: 'exam', label: 'Ujian CBT baru', run: () => go('g-ujian-form', {}) },
    { icon: 'list-check', label: 'Soal baru', run: () => { go('g-bank'); setTimeout(() => openSoalEditor(null), 50); } },
    { icon: 'calendar', label: 'Agenda baru', run: () => { go('agenda'); setTimeout(() => openAgendaForm(null), 50); } }
  ]);
}
/** Pencarian global instan dari data lokal (tanpa panggilan server). */
function globalSearch(q) {
  const old = $('#searchPop'); if (old) old.remove();
  q = String(q || '').trim().toLowerCase(); if (q.length < 2) return;
  const res = [];
  const add = (ic, t, sub, run) => { if (res.length < 14) res.push({ ic, t, sub, run }); };
  const m = (s) => String(s || '').toLowerCase().indexOf(q) >= 0;
  if (hasRole('SISWA')) {
    const sw = SW();
    sw.tugas.filter((t) => m(t.judul)).forEach((t) => add('clipboard', t.judul, 'Tugas · ' + mapelNm(t.mapel_id), `go('s-tugas-d',{id:'${t.tugas_id}'})`));
    sw.ulangan.filter((u) => m(u.judul)).forEach((u) => add('exam', u.judul, 'Ujian · ' + mapelNm(u.mapel_id), `go('s-ujian')`));
    sw.materi.filter((x) => m(x.judul)).forEach((x) => add('book', x.judul, 'Materi · ' + mapelNm(x.mapel_id), `go('s-mapel-d',{mapel_id:'${x.mapel_id}',tab:'materi'})`));
    (B().mapel || []).filter((x) => m(x.nama_mapel)).forEach((x) => add('book', x.nama_mapel, 'Mata pelajaran', `go('s-mapel-d',{mapel_id:'${x.mapel_id}'})`));
  } else {
    const g = G();
    g.siswa.filter((s) => m(s.nama) || m(s.nis_nip)).forEach((s) => add('user', s.nama, 'Siswa · ' + kelasNm(s.kelas_id) + ' · ' + (s.nis_nip || ''), hasRole('WALI') && me().waliKelas.indexOf(s.kelas_id) >= 0 ? `go('w-kelas',{kelas_id:'${s.kelas_id}',tab:'siswa'})` : `go('laporan')`));
    g.tugas.filter((t) => m(t.judul)).forEach((t) => add('clipboard', t.judul, 'Tugas · ' + kelasNm(t.kelas_id), `go('g-tugas',{id:'${t.tugas_id}'})`));
    g.ulangan.filter((u) => m(u.judul)).forEach((u) => add('exam', u.judul, 'Ujian · ' + mapelNm(u.mapel_id), `go('g-ujian-form',{id:'${u.ulangan_id}'})`));
    g.materi.filter((x) => m(x.judul)).forEach((x) => add('book', x.judul, 'Materi · ' + kelasNm(x.kelas_id), `go('g-konten',{tab:'materi'})`));
  }
  const host = $('#gSearch') ? $('#gSearch').closest('.top-search') : null; if (!host) return;
  const pop = document.createElement('div'); pop.className = 'search-pop'; pop.id = 'searchPop';
  pop.innerHTML = res.length ? res.map((r) => `<div class="row-item click" onmousedown="${r.run};closeMenus()">${`<div class="tile sm">${I(r.ic)}</div>`}<div class="f1" style="min-width:0"><div class="bold truncate">${esc(r.t)}</div><div class="small muted truncate">${esc(r.sub)}</div></div></div>`).join('') : `<div class="empty small" style="padding:20px">Tidak ada hasil untuk "${esc(q)}"</div>`;
  host.appendChild(pop);
  $('#gSearch').onblur = () => setTimeout(closeMenus, 150);
}
function notifTarget(n) {
  const t = n.tipe, ref = n.ref_id;
  if (hasRole('SISWA')) {
    if ((t === 'TUGAS' || t === 'NILAI') && SW().tugas.some((x) => x.tugas_id === ref)) return () => go('s-tugas-d', { id: ref });
    if (t === 'UJIAN' || (t === 'NILAI' && SW().ulangan.some((x) => x.ulangan_id === ref))) return () => go('s-ujian');
    if (t === 'MATERI') { const m = SW().materi.find((x) => x.materi_id === ref); if (m) return () => go('s-mapel-d', { mapel_id: m.mapel_id, tab: 'materi' }); }
    if (t === 'PENGINGAT') return () => go('s-tugas');
  } else {
    if (t === 'DAFTAR') return () => go('a-users', { tab: 'daftar' });
    if (t === 'ABSENSI' && hasRole('WALI')) return () => go('w-kelas', { kelas_id: me().waliKelas[0], tab: 'presensi' });
  }
  if (t === 'AGENDA') return () => go('agenda');
  return null;
}
function openNotif() {
  const n = B().notif || { items: [], lastRead: 0 };
  const icon = { TUGAS: 'clipboard', UJIAN: 'exam', NILAI: 'star', AGENDA: 'calendar', MATERI: 'book', PENGINGAT: 'bell', DAFTAR: 'user-plus', ABSENSI: 'user-plus' };
  const tone = { TUGAS: 'warn', UJIAN: '', NILAI: 'ok', AGENDA: 'sky', MATERI: 'vio', PENGINGAT: 'err', DAFTAR: 'sky', ABSENSI: 'warn' };
  const today = D.day0(now()), groups = { 'Hari ini': [], 'Kemarin': [], 'Sebelumnya': [] };
  n.items.forEach((x) => { const d = D.day0(x.waktu); (d === today ? groups['Hari ini'] : d === today - 864e5 ? groups.Kemarin : groups.Sebelumnya).push(x); });
  const body = n.items.length ? Object.keys(groups).filter((k) => groups[k].length).map((k) => `<div class="nav-grp" style="padding-left:0">${k}</div>${groups[k].map((x) => {
    const unread = x.waktu > n.lastRead && !S.readSet[x.notif_id];
    return `<div class="row-item click" style="border-radius:12px;padding:12px 8px" onclick="openNotifItem('${x.notif_id}')"><div class="tile sm ${tone[x.tipe] || ''}">${I(icon[x.tipe] || 'bell')}</div><div class="f1" style="min-width:0"><div class="${unread ? 'bold' : ''}">${esc(x.judul)}</div><div class="small muted pre clamp2">${esc(x.pesan)}</div><div class="xs muted mt4">${D.ago(x.waktu)}</div></div>${unread ? '<span style="width:9px;height:9px;border-radius:50%;background:var(--p600);flex:none"></span>' : ''}</div>`;
  }).join('')}`).join('') : emptyState('bell', 'Belum ada notifikasi', 'Notifikasi tugas, ujian, nilai, dan agenda akan muncul di sini.');
  sheet({ title: 'Notifikasi', icon: 'bell', size: 'drawer', body, foot: n.items.length ? `<button class="btn btn-secondary btn-sm" onclick="markAllRead()">${I('check')}Tandai semua dibaca</button>` : '' });
}
function openNotifItem(id) {
  const x = (B().notif.items || []).find((n) => n.notif_id === id); if (!x) return;
  S.readSet[id] = 1; LS.set('sp_read_' + me().user_id, S.readSet);
  renderTopbar();
  const go2 = notifTarget(x);
  closeAllSheets();
  if (go2) go2(); else sheet({ title: esc(x.judul), body: `<p class="pre">${esc(x.pesan)}</p><p class="small muted mt12">${D.dt(x.waktu)}</p>` });
}
function markAllRead() {
  const n = B().notif; n.lastRead = now(); S.readSet = {}; LS.set('sp_read_' + me().user_id, {});
  saveSnap(); closeAllSheets(); renderTopbar(); toast('Semua notifikasi ditandai dibaca.', 'ok');
  call('notif.read', { all: true }, { silent: true }).catch(() => { /* tidak kritis */ });
}

// ════════════════════════════════════════════════════════
// BAGIAN 10: AUTENTIKASI — login, Google, daftar, ganti sandi
// ════════════════════════════════════════════════════════
function hideSplash() { const s = $('#splash'); if (s && !s.classList.contains('hide')) { s.classList.add('hide'); setTimeout(() => s.remove(), 400); } }
function showAuth(html, mount) {
  closeAllSheets();
  $('#shell').hidden = true; $('#exam').hidden = true;
  const a = $('#auth'); a.hidden = false; a.innerHTML = html;
  if (mount) mount(a);
  hideSplash(); window.scrollTo(0, 0);
}
function authFrame(inner, heroSub) {
  const c = cfg();
  return `<div class="auth"><div class="auth-hero grad grad-pattern">${logoHTML('lg')}<h1>${esc(c.nama_aplikasi || 'SMAPATISPA LEARNING')}</h1><p>${esc(heroSub || c.nama_sekolah || 'Belajar, tugas, dan ujian dalam satu aplikasi')}</p>
    <div class="only-lg" style="margin-top:20px">${[['clipboard', 'Tugas & pengingat otomatis'], ['exam', 'Ujian CBT dengan pengawasan pelanggaran'], ['chart', 'Nilai, absensi, dan rekap wali kelas']].map((f) => `<div class="feat-li">${I(f[0])}<span>${f[1]}</span></div>`).join('')}</div></div>
    <div class="auth-side"><div class="card auth-card">${inner}</div></div></div>`;
}
function showLogin(msg) {
  const c = cfg();
  showAuth(authFrame(`<h2>Masuk ke Akun</h2><p class="muted mt4">Gunakan akun dari sekolah atau akun Google.</p>
    ${msg ? `<div class="banner banner-err mt16" id="loginErr">${I('alert-c')}<div>${esc(msg)}</div></div>` : '<div id="loginErr"></div>'}
    <form id="loginForm" class="col g16 mt16" autocomplete="on">
      <div class="field"><label class="label" for="lu">Username / NIS / NIP</label><div class="input-ic">${I('user')}<input class="input" id="lu" name="username" autocomplete="username" required autofocus placeholder="contoh: 222310148" value="${esc(LS.get('sp_lastuser', ''))}"></div></div>
      <div class="field"><label class="label" for="lp">Kata sandi</label><div class="input-ic">${I('lock')}<input class="input" id="lp" type="password" name="password" autocomplete="current-password" required placeholder="Masukkan kata sandi"><button type="button" class="trail icon-btn" style="width:36px;height:36px" onclick="const i=$('#lp');i.type=i.type==='password'?'text':'password'" aria-label="Lihat kata sandi">${I('eye')}</button></div>
        <div class="help">Lupa kata sandi? Hubungi Admin atau Wali Kelas.</div></div>
      <button class="btn btn-primary btn-lg btn-block" type="submit" id="loginBtn">${I('arrow-r')}Masuk</button>
    </form>
    ${c.google_login ? `<div class="or">atau</div>
    <button class="btn btn-google btn-lg btn-block" onclick="googleLogin('login')">${I('g')}Masuk dengan Google</button>
    <p class="tc small mt16 muted">Belum punya akun? <a href="javascript:void(0)" onclick="googleLogin('login')" class="bold">Daftar dengan Google</a></p>` : `<p class="tc small mt16 muted">Belum punya akun? Hubungi Admin atau Wali Kelas.</p>`}<p class="tc xs muted mt24">${esc(c.nama_sekolah || '')} · v${esc(c.version || '1.0')}</p>`), (a) => {
    $('#loginForm', a).onsubmit = (e) => {
      e.preventDefault();
      const f = formData(e.target), btn = $('#loginBtn');
      if (!f.username || !f.password) return;
      btnBusy(btn, true, 'Memeriksa…');
      call('auth.login', { username: f.username.trim(), password: f.password, device: navigator.userAgent.slice(0, 140) }, { noAuth: true, retries: 3 })
        .then((r) => { LS.set('sp_lastuser', f.username.trim()); afterLogin(r); })
        .catch((err) => { btnBusy(btn, false); $('#loginErr').outerHTML = `<div class="banner banner-err mt16" id="loginErr">${I(err.code === 'LOCKED' ? 'lock' : 'alert-c')}<div>${esc(err.message)}</div></div>`; $('#lp').value = ''; $('#lp').focus(); });
    };
  });
}
function afterLogin(r) {
  S.tok = r.token; try { localStorage.setItem('sp_tok', r.token); } catch (e) { /* abaikan */ }
  if (r.mustChange || !r.boot) { showChangePassword(true); return; }
  setBoot(r.boot); enterShell(true);
  toast(`Selamat datang, ${firstName(r.boot.user.nama)}!`, 'ok');
}
/** Pustaka "Sign in with Google" dimuat hanya saat dibutuhkan. */
let GSI_P = null;
function loadGSI() {
  if (window.google && google.accounts && google.accounts.id) return Promise.resolve();
  if (GSI_P) return GSI_P;
  GSI_P = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = () => res(); s.onerror = () => { GSI_P = null; rej(new Error('Layanan Google tidak dapat dimuat. Periksa koneksi internet.')); }; document.head.appendChild(s); });
  return GSI_P;
}
/** Hasil login/tautan Google dari server (dipakai kedua cara). */
function onGoogleResult(mode, r) {
  if (mode === 'link') { S.boot.user = r.user; saveSnap(); rerender(); toast('Akun Google tertaut: ' + r.user.email_google, 'ok'); return; }
  if (r.token) afterLogin(r);
  else if (r.status === 'MENUNGGU') showPending(r.email);
  else if (r.needRegister) showRegister(r);
}
/** Masuk dengan Google: Google Identity Services bila Admin mengisi Client ID, selain itu cara lama (popup Apps Script). */
function googleLogin(mode) {
  const c = cfg();
  if (c.google_client_id) { googleLoginGSI(mode, c.google_client_id); return; }
  if (!c.google_login_url) { toast('Login Google belum diaktifkan Admin sekolah. Gunakan username dan kata sandi.', 'warn'); return; }
  const nonce = uidc();
  const w = window.open(c.google_login_url + '?glogin=1&n=' + nonce, 'glogin', 'width=480,height=640');
  let stop = false, tries = 0;
  const s = sheet({ title: 'Masuk dengan Google', icon: 'g', locked: false, body: `<div class="tc" style="padding:12px 0"><div class="ring" style="border-color:var(--p100);border-top-color:var(--p600);margin:0 auto"></div><h3 class="mt16">Menunggu verifikasi Google…</h3><p class="muted small mt8">Selesaikan langkah di jendela kecil yang terbuka. ${w ? '' : '<br><b>Jendela diblokir browser.</b> Izinkan pop-up lalu coba lagi.'}</p></div>`,
    foot: `<button class="btn btn-secondary btn-block" data-c>Batal</button>`, onClose: () => { stop = true; window.removeEventListener('message', onMsg); },
    mount: (el, close) => { el.querySelector('[data-c]').onclick = close; } });
  const onMsg = (e) => { if (e.data && e.data.type === 'glogin' && e.data.nonce === nonce) poll(); };
  window.addEventListener('message', onMsg);
  const action = mode === 'link' ? 'profil.linkGoogle' : 'auth.googlePoll';
  function poll() {
    if (stop) return;
    tries++;
    call(action, { nonce, device: navigator.userAgent.slice(0, 140) }, { noAuth: mode !== 'link', silent: true, netRetries: 0 }).then((r) => {
      if (stop) return;
      if (r && r.pending) { if (tries < 90) setTimeout(poll, 2000); else { s.close(); toast('Waktu verifikasi habis. Coba lagi.', 'warn'); } return; }
      stop = true; s.close();
      onGoogleResult(mode, r);
    }).catch((e) => { if (!stop) { if (tries < 90 && e.code === 'NET') setTimeout(poll, 3000); else { stop = true; s.close(); failToast(e); } } });
  }
  setTimeout(poll, 2500);
}
function googleLoginGSI(mode, cid) {
  const s = sheet({ title: mode === 'link' ? 'Tautkan Akun Google' : 'Masuk dengan Google', icon: 'g', body: `<div class="tc"><p class="muted small">Pilih akun Google Anda. Verifikasi dilakukan langsung oleh Google; kata sandi Google tidak pernah dikirim ke aplikasi sekolah.</p>
    <div id="gsiBtn" style="display:flex;justify-content:center;min-height:44px;margin-top:16px">${skel(44, '260px')}</div>
    <p class="xs muted mt16">Tombol tidak muncul? Pastikan koneksi internet stabil dan browser tidak memblokir pop-up dari accounts.google.com.</p></div>` });
  loadGSI().then(() => {
    google.accounts.id.initialize({ client_id: cid, ux_mode: 'popup', auto_select: false, cancel_on_tap_outside: true, callback: (resp) => onCred(resp && resp.credential) });
    const el = s.el.querySelector('#gsiBtn'); if (!el) return; el.innerHTML = '';
    google.accounts.id.renderButton(el, { theme: isDark() ? 'filled_black' : 'outline', size: 'large', shape: 'pill', text: mode === 'link' ? 'continue_with' : 'signin_with', locale: 'id', width: 280 });
  }).catch((e) => { s.close(); failToast(e); });
  function onCred(credential) {
    if (!credential) return;
    s.close();
    const box = sheet({ title: 'Memverifikasi akun Google…', locked: true, body: `<div class="tc" style="padding:16px"><div class="ring" style="border-color:var(--p100);border-top-color:var(--p600);margin:0 auto"></div></div>` });
    call(mode === 'link' ? 'profil.linkGoogleToken' : 'auth.googleToken', { credential, device: navigator.userAgent.slice(0, 140) }, { noAuth: mode !== 'link' })
      .then((r) => { box.close(); onGoogleResult(mode, r); }).catch((e) => { box.close(); failToast(e); });
  }
}
function showRegister(r) {
  showAuth(authFrame(`<button class="back-link" onclick="showLogin()">${I('arrow-l', 'ic-sm')}Kembali</button><h2>Daftar dengan Google</h2>
    ${r.ditolak ? `<div class="banner banner-warn mt12">${I('alert')}<div>Pendaftaran sebelumnya ditolak. Pastikan data benar sebelum mengirim ulang.</div></div>` : ''}
    <form id="regForm" class="col g16 mt16">
      <div class="flex items-c g12 card" style="padding:12px;background:var(--subtle)">${avatar(r.email)}<div class="f1" style="min-width:0"><div class="small muted">Akun Google</div><div class="bold truncate">${esc(r.email)}</div></div>${I('check-c', 'ink-ok')}</div>
      <div class="field"><label class="label">Nama lengkap <span class="req">*</span></label><input class="input" name="nama" required placeholder="Sesuai data sekolah"></div>
      <div class="field"><label class="label">Saya mendaftar sebagai</label><div class="seg w100" id="regRole"><button type="button" class="on" data-v="SISWA">Siswa</button><button type="button" data-v="GURU">Guru</button></div></div>
      <div class="field" id="regKelas"><label class="label">Kelas <span class="req">*</span></label><select class="select" name="kelas_diminta"><option value="">Pilih kelas</option>${(r.kelas || []).map((k) => `<option>${esc(k)}</option>`).join('')}</select></div>
      <div class="field"><label class="label">Nomor WhatsApp <span class="req">*</span></label><div class="input-ic">${I('phone')}<input class="input" name="no_wa" inputmode="tel" required placeholder="08xxxxxxxxxx"></div><div class="help">Dipakai untuk pengingat tugas dan ujian.</div></div>
      <button class="btn btn-primary btn-lg btn-block" id="regBtn">${I('send')}Kirim Pendaftaran</button></form>`), (a) => {
    let role = 'SISWA';
    $('#regRole', a).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; role = b.dataset.v; $$('#regRole button').forEach((x) => x.classList.toggle('on', x === b)); $('#regKelas').hidden = role !== 'SISWA'; };
    $('#regForm', a).onsubmit = (e) => {
      e.preventDefault(); const f = formData(e.target), btn = $('#regBtn');
      if (role === 'SISWA' && !f.kelas_diminta) { toast('Pilih kelas.', 'warn'); return; }
      btnBusy(btn, true, 'Mengirim…');
      call('auth.register', { ticket: r.ticket, nama: f.nama, role_diminta: role, kelas_diminta: f.kelas_diminta, no_wa: f.no_wa }, { noAuth: true }).then((x) => showPending(x.email)).catch((err) => { btnBusy(btn, false); failToast(err); });
    };
  });
}
function showPending(email) {
  showAuth(authFrame(`<div class="tc"><div class="tile lg warn" style="margin:0 auto;width:72px;height:72px">${I('hourglass', 'ic-xl')}</div><h2 class="mt16">Pendaftaran Menunggu Persetujuan</h2>
    <p class="muted mt8">Admin akan memeriksa data Anda. Pemberitahuan dikirim ke <b>${esc(email)}</b>.</p><div class="mt16">${pill('MENUNGGU', 'warn', 'clock')}</div>
    <button class="btn btn-secondary btn-block mt24" onclick="showLogin()">${I('arrow-l')}Kembali ke Login</button></div>`));
}
function pwStrength(p) { let s = 0; if (p.length >= 6) s++; if (p.length >= 10) s++; if (/[0-9]/.test(p) && /[a-zA-Z]/.test(p)) s++; if (/[^a-zA-Z0-9]/.test(p) || /[A-Z]/.test(p)) s++; return s; }
function changePwForm(forced) {
  return `<form id="pwForm" class="col g16 ${forced ? 'mt16' : ''}">
    <div class="field"><label class="label">Kata sandi saat ini</label><input class="input" type="password" name="old" required autocomplete="current-password"></div>
    <div class="field"><label class="label">Kata sandi baru</label><input class="input" type="password" name="baru" id="pwNew" required minlength="6" autocomplete="new-password"><div class="meter mt8"><i id="pwMeter" style="width:0"></i></div><div class="help" id="pwHint">Minimal 6 karakter, kombinasi huruf dan angka.</div></div>
    <div class="field"><label class="label">Ulangi kata sandi baru</label><input class="input" type="password" name="ulang" required autocomplete="new-password"></div>
    <button class="btn btn-primary btn-lg btn-block" id="pwBtn">${I('shield')}${forced ? 'Simpan & Lanjutkan' : 'Simpan Kata Sandi'}</button></form>`;
}
function bindPwForm(root, onDone) {
  const nw = $('#pwNew', root);
  nw.oninput = () => { const s = pwStrength(nw.value), m = $('#pwMeter', root); m.style.width = (s * 25) + '%'; m.parentNode.className = 'meter mt8 ' + (s <= 1 ? 'err' : s === 2 ? 'warn' : 'ok'); $('#pwHint', root).textContent = ['Terlalu pendek', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'][s]; };
  $('#pwForm', root).onsubmit = (e) => {
    e.preventDefault(); const f = formData(e.target), btn = $('#pwBtn', root);
    if (f.baru !== f.ulang) { toast('Ulangan kata sandi tidak sama.', 'warn'); return; }
    btnBusy(btn, true, 'Menyimpan…');
    call('auth.changePassword', { old: f.old, baru: f.baru }).then((r) => {
      S.tok = r.token; try { localStorage.setItem('sp_tok', r.token); } catch (x) { /* abaikan */ }
      setBoot(r.boot); toast('Kata sandi berhasil diganti.', 'ok'); onDone();
    }).catch((err) => { btnBusy(btn, false); failToast(err); });
  };
}
function showChangePassword(forced) {
  if (!forced) { sheet({ title: 'Ubah kata sandi', icon: 'shield', body: changePwForm(false), mount: (el, close) => bindPwForm(el, close) }); return; }
  showAuth(authFrame(`<div class="tile lg" style="width:64px;height:64px">${I('shield', 'ic-xl')}</div><h2 class="mt16">Buat Kata Sandi Baru</h2><p class="muted mt4">Demi keamanan, ganti kata sandi awal Anda sebelum melanjutkan.</p>${changePwForm(true)}
    <button class="btn btn-ghost btn-block mt12" onclick="doLogout()">Keluar</button>`), (a) => bindPwForm(a, () => enterShell(true)));
}
function logoutLocal(msg) {
  const uid = me().user_id;
  S.tok = null; S.boot = null; S.c = {}; S.hist = []; S.route = null;
  try { localStorage.removeItem('sp_tok'); } catch (e) { /* abaikan */ }
  if (uid) LS.del('sp_boot_' + uid);
  if (X && X.active) exitExam(true);
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* abaikan */ }
  showLogin(msg);
}
function doLogout() {
  const tok = S.tok;
  confirmBox('Keluar dari aplikasi di perangkat ini?', { yes: 'Keluar', icon: 'logout' }).then((ok) => {
    if (!ok) return;
    if (tok) call('auth.logout', {}, { silent: true, noAuth: true, netRetries: 0 }).catch(() => { /* tidak kritis */ });
    logoutLocal();
  });
}
function enterShell(fresh) {
  $('#auth').hidden = true; $('#auth').innerHTML = '';
  $('#shell').hidden = false;
  renderChrome();
  const last = LS.get('sp_last', null);
  const start = !fresh && last && last.u === me().user_id && ROUTES[last.name] && !ROUTES[last.name].noRestore ? last : { name: homeRoute(), params: {} };
  S.hist = []; S.route = null;
  go(start.name, start.params, { replace: true });
  hideSplash();
  resumeExamIfAny();
}

// ════════════════════════════════════════════════════════
// BAGIAN 11: INISIALISASI
// ════════════════════════════════════════════════════════
function splashBrand() {
  const c = cfg(), n = $('#splashName'), l = $('#splashLogo');
  if (n && c.nama_aplikasi) n.textContent = c.nama_aplikasi;
  if (l && c.logo) l.innerHTML = `<img src="${esc(c.logo)}" alt="" onerror="this.remove()">`;
  if (c.logo) { const fav = $('link[rel=icon]'); if (fav) fav.href = c.logo; }
}
function showSetupNeeded(title, html) {
  showAuth(`<div class="auth"><div class="auth-side" style="flex:1"><div class="card auth-card tc"><div class="tile lg warn" style="margin:0 auto;width:64px;height:64px">${I('alert', 'ic-xl')}</div><h2 class="mt16">${title}</h2>${html}</div></div></div>`);
}
async function init() {
  if (!GAS_URL) {
    showSetupNeeded('Alamat server belum diatur', `<p class="muted mt8">Buka file <span class="kbd">js/config.js</span>, isi <b>GAS_URL</b> dengan URL Web App Apps Script yang berakhiran <b>/exec</b>, lalu unggah ulang ke GitHub (<span class="kbd">git add .</span> → <span class="kbd">git commit</span> → <span class="kbd">git push</span>).</p>`);
    return;
  }
  warmUp();
  applyTheme(CFG0); splashBrand();
  const hadCfg = !!CFG0.nama_aplikasi;
  const cfgP = loadConfig().then((c) => {
    if (!c) return c;
    if (S.boot) S.boot.cfg = Object.assign({}, S.boot.cfg, c);
    applyTheme(cfg()); splashBrand();
    const lu = $('#lu'), lp = $('#lp');
    if (!S.tok && $('#loginForm') && lu && !lu.value && lp && !lp.value && !c.notSetup) showLogin();   // perbarui merek di layar login
    return c;
  });
  if (!S.tok) {
    if (!hadCfg) await Promise.race([cfgP, new Promise((r) => setTimeout(r, 5000))]);
    if (CFG0.notSetup) { showSetupNeeded('Aplikasi belum di-setup', `<p class="muted mt8">Admin perlu membuka editor Apps Script lalu menjalankan fungsi <span class="kbd">setupAppEnvironment</span> satu kali.</p><p class="small muted mt12">${esc(CFG0.error || '')}</p>`); return; }
    showLogin(); return;
  }
  const snap = LS.get('sp_boot_' + tokUid(), null);
  if (snap && snap.user) { setBoot(snap, true); enterShell(false); }   // tampil seketika dari cache perangkat
  call('app.boot', {}, { silent: !!snap, noAuth: false }).then((b) => {
    setBoot(b);
    if (b.user.wajib_ganti) { showChangePassword(true); return; }
    if ($('#shell').hidden) enterShell(false); else { renderChrome(); rerender(); }
  }).catch((e) => {
    if (e.code === 'AUTH' || e.code === 'MUSTCHANGE') return;
    if (snap) toast('Mode luring: menampilkan data terakhir. ' + e.message, 'warn', 6000);
    else showLogin(e.message);
  });
}
// Segarkan data diam-diam saat aplikasi kembali dibuka setelah > 60 detik
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (X && X.active) return;
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (hiddenAt && Date.now() - hiddenAt > 120000) warmUp();
  if (S.tok && S.boot && hiddenAt && Date.now() - hiddenAt > 60000) refreshBoot(true).catch(() => { /* abaikan */ });
});
window.addEventListener('online', () => { toast('Koneksi kembali tersambung.', 'ok'); if (X && X.active) examSync(true); });
window.addEventListener('offline', () => toast('Koneksi terputus. Perubahan akan dikirim saat tersambung.', 'warn'));
window.addEventListener('resize', debounce(() => { if (!$('#shell').hidden) { renderTopbar(); } }, 200));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if ($('#menuPop')) closeMenus(); else if (SHEETS.length && !(SHEETS[SHEETS.length - 1].o.locked)) closeSheet(); } });
(window.__SP_F__ = window.__SP_F__ || {}).shell = 1;
