'use strict';
// ════════════════════════════════════════════════════════
// BAGIAN 17: ADMIN — dashboard, pengguna, data akademik, pengaturan
// ════════════════════════════════════════════════════════
const isTrue = (v) => v === true || String(v).toUpperCase() === 'TRUE';
const rolesOf = (u) => u.roles || String(u.role || '').toUpperCase().split(',').filter(Boolean);
const usersData = () => S.c.users && S.c.users.d;

route('a-dash', {
  title: 'Dashboard Admin', roles: ['ADMIN'],
  render() {
    const d = need('adash', 'admin.dash', {}, 60000), c = cfg(), s = (B().admin || {}).settings || {};
    if (!d) return skelPage();
    const st = d.stats, q = d.quota, active = d.login.length ? d.login[d.login.length - 1].n : 0;
    return `<div class="page"><div class="page-hd"><div><h1>Dashboard Admin</h1><p class="sub">${esc(c.nama_sekolah || '')}${B().ta ? ' · Tahun Ajaran ' + esc(B().ta.nama) + ' Semester ' + esc(B().ta.semester) : ' · Tahun ajaran belum diatur'}</p></div>
        <div class="flex g8 wrap"><button class="btn btn-secondary" onclick="go('a-settings')">${I('sliders')}Pengaturan</button><button class="btn btn-primary" onclick="go('a-users');setTimeout(()=>openUserForm(null),40)">${I('user-plus')}Tambah Pengguna</button></div></div>
      ${!B().ta ? `<div class="banner banner-warn mb16">${I('alert')}<div class="f1">Tahun ajaran aktif belum diatur. Atur di Data Akademik agar kelas dan penugasan tercatat per semester.</div><button class="btn btn-sm btn-primary" onclick="go('a-akademik',{tab:'ta'})">Atur</button></div>` : ''}
      <div class="grid gc5">${statCard('Siswa aktif', fmtN(st.siswa, 0), 'siswa', '', 'users', 'p', "go('a-users',{tab:'siswa'})")}${statCard('Guru aktif', fmtN(st.guru, 0), 'guru', '', 'user', '', "go('a-users',{tab:'guru'})")}${statCard('Rombel', st.kelas, 'kelas', '', 'door', '', "go('a-akademik',{tab:'kelas'})")}${statCard('Pendaftaran', st.pending, 'menunggu', st.pending ? 'Perlu persetujuan' : 'Tidak ada antrean', 'user-plus', st.pending ? 'warn' : '', "go('a-users',{tab:'daftar'})")}${statCard('Ujian 7 hari', st.ujianMinggu, 'sesi', 'Terbit & terjadwal', 'exam', st.ujianMinggu ? 'ok' : '', "go('g-ujian')")}</div>
      <div class="split mt16"><div class="col g16"><div class="card card-p"><div class="flex items-c jc-b wrap g8"><div><h3>Pengguna Aktif Harian</h3><p class="small muted">Jumlah akun unik yang masuk per hari (30 hari terakhir)</p></div>${pill(active + ' hari ini', 'info', 'activity')}</div>
            <div class="mt12">${CH.line(d.login.map((x) => ({ l: x.tanggal.slice(8) + '/' + x.tanggal.slice(5, 7), v: x.n })), { min: 0, label: 'Pengguna aktif harian' })}</div></div>
          <div class="card"><div class="card-hd"><div><h3>Pendaftaran Menunggu Persetujuan</h3><p class="small muted">Pendaftar lewat akun Google</p></div><a href="javascript:void(0)" class="small bold" onclick="go('a-users',{tab:'daftar'})">Semua ${I('chev-r', 'ic-sm')}</a></div>
            ${d.pending.length ? d.pending.map((r) => regRow(r)).join('') : `<div class="card-bd">${emptyState('check-c', 'Tidak ada antrean pendaftaran', '')}</div>`}</div></div>
        <div class="col g16"><div class="card card-p"><h3>Status Sistem</h3><div class="col g12 mt12">
            <div class="flex items-c g12"><div class="tile sm ${c.email_aktif ? 'ok' : ''}">${I('mail')}</div><div class="f1"><div class="bold small">Email pengingat ${c.email_aktif ? 'aktif' : 'nonaktif'}</div><div class="xs muted">Terkirim hari ini ${q.emailSent}${q.emailLeft !== null ? ' · sisa kuota ' + fmtN(q.emailLeft, 0) : ''}</div></div></div>
            <div class="flex items-c g12"><div class="tile sm ${c.wa_aktif ? 'ok' : ''}">${I('wa')}</div><div class="f1"><div class="bold small">WhatsApp ${c.wa_aktif ? 'aktif (' + esc(s.wa_provider || 'FONNTE') + ')' : 'nonaktif'}</div><div class="xs muted">Terkirim hari ini ${q.waSent}${c.wa_aktif && !s.wa_api_key_mask ? ' · <span class="ink-err">API key kosong</span>' : ''}</div></div></div>
            <div class="flex items-c g12"><div class="tile sm ${c.google_login ? 'ok' : ''}">${I('g')}</div><div class="f1"><div class="bold small">Login Google ${c.google_login ? 'aktif' : 'belum diatur'}</div><div class="xs muted">${c.google_login ? 'Pendaftaran mandiri tersedia' : 'Atur URL deployment kedua di Pengaturan'}</div></div></div>
            <div class="flex items-c g12"><div class="tile sm ${d.backup && now() - num(d.backup) < 8 * 864e5 ? 'ok' : 'warn'}">${I('database')}</div><div class="f1"><div class="bold small">Cadangan data</div><div class="xs muted">${d.backup ? 'Terakhir ' + D.ago(num(d.backup)) : 'Belum pernah'} · otomatis mingguan</div></div><button class="btn btn-secondary btn-sm" onclick="doBackup(this)">Cadangkan</button></div></div></div>
          <div class="card"><div class="card-hd"><h3>Aktivitas Terbaru</h3><a href="javascript:void(0)" class="small bold" onclick="go('a-settings',{tab:'cadangan'})">Log ${I('chev-r', 'ic-sm')}</a></div>${d.recent.map((l) => `<div class="row-item"><div class="tile sm">${I(/LOGIN/.test(l.aksi) ? 'logout' : /UJIAN|ULANGAN/.test(l.aksi) ? 'exam' : /PENGGUNA|SANDI|DAFTAR/.test(l.aksi) ? 'user' : 'activity')}</div><div class="f1" style="min-width:0"><div class="small"><b>${esc(l.nama || '-')}</b> · ${esc(String(l.aksi).replace(/_/g, ' ').toLowerCase())}</div><div class="xs muted truncate">${esc(l.detail || '')} · ${D.ago(num(l.waktu))}</div></div></div>`).join('') || `<div class="card-bd small muted">Belum ada aktivitas.</div>`}</div></div></div></div>`;
  }
});
function regRow(r) {
  return `<div class="row-item" style="flex-wrap:wrap">${avatar(r.nama)}<div class="f1" style="min-width:160px"><div class="bold">${esc(r.nama)} ${pill(r.role_diminta === 'GURU' ? 'Guru' : 'Siswa', r.role_diminta === 'GURU' ? 'p' : 'info')}</div><div class="xs muted truncate">${esc(r.email_google)}${r.kelas_diminta ? ' · Kelas ' + esc(r.kelas_diminta) : ''}${r.no_wa ? ' · ' + esc(r.no_wa) : ''} · ${D.ago(num(r.waktu))}</div></div>
    ${r.status === 'MENUNGGU' ? `<div class="flex g8"><button class="btn btn-sm btn-danger-o" onclick="regDecide('${r.daftar_id}',false)">${I('x', 'ic-sm')}Tolak</button><button class="btn btn-sm btn-ok" onclick="regDecide('${r.daftar_id}',true)">${I('check', 'ic-sm')}Setujui</button></div>` : pill(r.status === 'DISETUJUI' ? 'Disetujui' : 'Ditolak', r.status === 'DISETUJUI' ? 'ok' : 'err')}</div>`;
}
function regFind(id) { const a = S.c.adash && S.c.adash.d && S.c.adash.d.pending.find((x) => x.daftar_id === id); const u = usersData(); return a || (u && u.pendaftaran.find((x) => x.daftar_id === id)); }
function regDecide(id, approve, kelasId) {
  const r = regFind(id); if (!r) return;
  if (approve && r.role_diminta !== 'GURU' && !kelasId) {
    const want = String(r.kelas_diminta || '').toLowerCase().replace(/\s+/g, ''), k = (B().kelas || []).find((x) => String(x.nama_kelas).toLowerCase().replace(/\s+/g, '') === want);
    if (!k) {
      sheet({ title: 'Pilih kelas untuk ' + esc(r.nama), icon: 'door', body: `<p class="small tx2">Kelas yang diminta: <b>${esc(r.kelas_diminta || '-')}</b> tidak ditemukan. Pilih kelas siswa ini.</p><select class="select mt12" id="regK">${(B().kelas || []).map((x) => `<option value="${x.kelas_id}">${esc(x.nama_kelas)}</option>`).join('')}</select>`,
        foot: `<button class="btn btn-primary" id="regKOk">${I('check')}Setujui</button>`, mount: (el, close) => { $('#regKOk', el).onclick = () => { const v = $('#regK', el).value; close(); regDecide(id, true, v); }; } });
      return;
    }
    kelasId = k.kelas_id;
  }
  const go2 = () => {
    // Optimistic: keluarkan dari antrean seketika
    const prevSt = r.status; r.status = approve ? 'DISETUJUI' : 'DITOLAK';
    const ad = S.c.adash && S.c.adash.d, bakP = ad ? ad.pending.slice() : null;
    if (ad) { ad.pending = ad.pending.filter((x) => x.daftar_id !== id); ad.stats.pending = Math.max(0, ad.stats.pending - 1); }
    if (B().admin) B().admin.pendingReg = Math.max(0, (B().admin.pendingReg || 1) - 1);
    renderChrome(); rerender(); toast(approve ? `${r.nama} disetujui. Email pemberitahuan dikirim.` : `Pendaftaran ${r.nama} ditolak.`, approve ? 'ok' : 'info');
    call('reg.decide', { daftar_id: id, approve, kelas_id: kelasId }, { silent: true }).then((x) => { const u = usersData(); if (u && x.user) u.users.push(x.user); if (x.user && rolesOf(x.user).indexOf('SISWA') >= 0) G().siswa.push({ user_id: x.user.user_id, nama: x.user.nama, nis_nip: '', kelas_id: x.user.kelas_id, foto: '' }); saveSnap(); rerender(); })
      .catch((e) => { r.status = prevSt; if (ad) { ad.pending = bakP; ad.stats.pending++; } if (B().admin) B().admin.pendingReg++; renderChrome(); rerender(); failToast(e); });
  };
  if (approve) go2(); else confirmBox(`Tolak pendaftaran <b>${esc(r.nama)}</b> (${esc(r.email_google)})?`, { danger: true, yes: 'Tolak' }).then((ok) => { if (ok) go2(); });
}
function doBackup(btn) {
  btnBusy(btn, true, 'Mencadangkan…');
  call('settings.backup', {}).then((r) => { btnBusy(btn, false); const s = (B().admin || {}).settings; if (s) s.cadangan_terakhir = String(r.waktu); if (S.c.adash && S.c.adash.d) S.c.adash.d.backup = r.waktu; toast('Cadangan dibuat: ' + r.files.length + ' spreadsheet disalin ke folder Cadangan.', 'ok', 6000); rerender(); }).catch((e) => { btnBusy(btn, false); failToast(e); });
}

// ── Manajemen pengguna ──
route('a-users', {
  title: 'Pengguna', roles: ['ADMIN'],
  render(p) {
    const d = need('users', 'users.list', {}, 60000), tab = p.tab || 'siswa';
    const pend = d ? d.pendaftaran.filter((r) => r.status === 'MENUNGGU').length : ((B().admin || {}).pendingReg || 0);
    const head = `<div class="page-hd"><div><h1>Manajemen Pengguna</h1><p class="sub">Akun siswa, guru, dan persetujuan pendaftaran Google.</p></div><div class="flex g8 wrap"><button class="btn btn-secondary" onclick="openImportUsers()">${I('upload')}Import Excel</button><button class="btn btn-primary" onclick="openUserForm(null,{role:'${tab === 'guru' ? 'GURU' : 'SISWA'}'})">${I('user-plus')}Tambah ${tab === 'guru' ? 'Guru' : 'Siswa'}</button></div></div>
      <div class="tabs">${[['siswa', 'Siswa', d ? d.users.filter((u) => rolesOf(u).indexOf('SISWA') >= 0).length : ''], ['guru', 'Guru & Admin', d ? d.users.filter((u) => rolesOf(u).indexOf('SISWA') < 0).length : ''], ['daftar', 'Pendaftaran', pend]].map((t) => `<button class="tab ${tab === t[0] ? 'on' : ''}" onclick="go('a-users',{tab:'${t[0]}'},{replace:true})">${t[1]} ${t[2] !== '' ? `<span class="badge ${t[0] === 'daftar' && t[2] ? 'p' : 'neu'}">${t[2]}</span>` : ''}</button>`).join('')}</div>`;
    if (!d) return `<div class="page">${head}<div class="mt16">${skelCards(3, 80)}</div></div>`;
    const F = S.c.usrF || (S.c.usrF = { kelas: '', status: 'AKTIF' }), sel = S.c.uSel || (S.c.uSel = {});
    if (tab === 'daftar') {
      const wait = d.pendaftaran.filter((r) => r.status === 'MENUNGGU'), done = d.pendaftaran.filter((r) => r.status !== 'MENUNGGU');
      return `<div class="page">${head}<div class="card mt16"><div class="card-hd"><h3>Menunggu Persetujuan</h3>${pill(wait.length + ' pendaftar', wait.length ? 'warn' : 'neu')}</div>${wait.length ? wait.map(regRow).join('') : `<div class="card-bd">${emptyState('check-c', 'Tidak ada pendaftar baru', cfg().google_login ? 'Pendaftar lewat tombol "Daftar dengan Google" akan muncul di sini.' : 'Aktifkan Login Google di Pengaturan agar siswa dan guru bisa mendaftar mandiri.')}</div>`}</div>
        ${done.length ? `<div class="card mt16"><div class="card-hd"><h3>Riwayat</h3></div>${done.slice(0, 50).map(regRow).join('')}</div>` : ''}</div>`;
    }
    const isS = tab === 'siswa';
    const rows = d.users.filter((u) => (isS ? rolesOf(u).indexOf('SISWA') >= 0 : rolesOf(u).indexOf('SISWA') < 0) && (!F.status || u.status === F.status) && (!isS || !F.kelas || u.kelas_id === F.kelas));
    const nSel = Object.keys(sel).filter((k) => sel[k]).length;
    const waliOf = (uid) => (B().kelas || []).filter((k) => k.wali_kelas_id === uid).map((k) => k.nama_kelas);
    const penCnt = {}; G().penugasan.forEach((x) => { penCnt[x.guru_id] = (penCnt[x.guru_id] || 0) + 1; });
    const cols = [{ h: '', sort: false, search: false, w: '36px', r: (u) => `<input type="checkbox" style="width:18px;height:18px;accent-color:var(--p600)" ${sel[u.user_id] ? 'checked' : ''} ${u.user_id === me().user_id ? 'disabled' : ''} onclick="event.stopPropagation();uSelect('${u.user_id}',this.checked)">` },
      { h: 'Nama', k: 'nama', r: (u) => `<div class="flex items-c g8">${avatar(u.nama, u.foto, 'sm')}<div style="min-width:0"><div class="bold small truncate">${esc(u.nama)}</div><div class="mono xs muted">@${esc(u.username)}${u.wajib_ganti ? ' · <span class="ink-warn">sandi awal</span>' : ''}</div></div></div>` },
      { h: isS ? 'NIS' : 'NIP', k: 'nis_nip', r: (u) => `<span class="mono small">${esc(u.nis_nip || '-')}</span>` }];
    if (isS) cols.push({ h: 'Kelas', k: 'kelas', r: (u) => esc(u.kelas || '-') });
    else cols.push({ h: 'Peran', k: 'role', r: (u) => rolesOf(u).map((r) => pill(r === 'ADMIN' ? 'Admin' : 'Guru', r === 'ADMIN' ? 'dark' : 'p')).join(' ') + (waliOf(u.user_id).length ? ' ' + pill('Wali ' + waliOf(u.user_id).join(', '), 'ok') : '') }, { h: 'Mengajar', k: 'user_id', n: true, search: false, v: (u) => penCnt[u.user_id] || 0, r: (u) => `<span class="mono small">${penCnt[u.user_id] || 0}</span>` });
    cols.push({ h: 'Kontak', k: 'email_google', r: (u) => `<div class="flex g4">${u.email_google ? `<span title="${esc(u.email_google)}" class="ink-ok">${I('g', 'ic-sm')}</span>` : ''}${u.no_wa ? `<span title="${esc(u.no_wa)}" class="ink-ok">${I('wa', 'ic-sm')}</span>` : ''}${!u.email_google && !u.no_wa ? '<span class="xs muted">-</span>' : ''}</div>` },
      { h: 'Login terakhir', k: 'login_terakhir', search: false, r: (u) => `<span class="small ${u.login_terakhir ? '' : 'muted'}">${u.login_terakhir ? D.ago(num(u.login_terakhir)) : 'Belum pernah'}</span>` },
      { h: 'Status', k: 'status', r: (u) => u.status === 'AKTIF' ? pill('Aktif', 'ok') : pill('Nonaktif', 'neu') },
      { h: '', sort: false, search: false, r: (u) => `<div class="flex g4 jc-e"><button class="icon-btn" title="Ubah" onclick="event.stopPropagation();openUserForm('${u.user_id}')">${I('edit')}</button><button class="icon-btn" title="Lainnya" onclick="event.stopPropagation();userMenu(this,'${u.user_id}')">${I('more')}</button></div>` });
    const tools = `${isS ? `<select class="select input-sm" style="width:160px" onchange="S.c.usrF.kelas=this.value;rerender()"><option value="">Semua kelas</option>${(B().kelas || []).map((k) => `<option value="${k.kelas_id}" ${F.kelas === k.kelas_id ? 'selected' : ''}>${esc(k.nama_kelas)}</option>`).join('')}</select>` : ''}
      <div class="seg">${[['AKTIF', 'Aktif'], ['NONAKTIF', 'Nonaktif'], ['', 'Semua']].map((x) => `<button class="${F.status === x[0] ? 'on' : ''}" onclick="S.c.usrF.status='${x[0]}';rerender()">${x[1]}</button>`).join('')}</div>
      <button class="btn btn-ghost btn-sm" onclick='uSelectAll(${JSON.stringify(rows.filter((u) => u.user_id !== me().user_id).map((u) => u.user_id))})'>${I('checkbox', 'ic-sm')}Pilih ${rows.length}</button>`;
    return `<div class="page">${head}
      ${nSel ? `<div class="card mt16 flex items-c g8 wrap" style="padding:10px 14px;background:var(--p50);border-color:var(--p100)"><b class="small">${nSel} dipilih</b><div class="f1"></div><button class="btn btn-sm btn-secondary" onclick="uBulk('AKTIF')">${I('check-c', 'ic-sm')}Aktifkan</button><button class="btn btn-sm btn-secondary" onclick="uBulk('NONAKTIF')">${I('lock', 'ic-sm')}Nonaktifkan</button>${isS ? `<button class="btn btn-sm btn-secondary" onclick="uBulkKelas(this)">${I('door', 'ic-sm')}Pindah kelas</button>` : ''}<button class="btn btn-sm btn-ghost" onclick="S.c.uSel={};rerender()">Batal</button></div>` : ''}
      <div class="card mt16">${dataTable('users_' + tab, rows, cols, { ph: 'Cari nama, username, NIS/NIP…', tools, per: 25, onRow: (u) => `openUserForm('${u.user_id}')`, rowCls: (u) => u.status !== 'AKTIF' ? 'muted' : '', emptyT: 'Tidak ada pengguna', emptyD: 'Ubah filter atau tambah pengguna baru.' })}</div></div>`;
  },
  mount() { ROUTES['a-users'].leave = () => { S.c.uSel = {}; }; }
});
function uSelect(id, on) { S.c.uSel[id] = on; rerender(); }
function uSelectAll(ids) { const s = S.c.uSel, all = ids.every((i) => s[i]); ids.forEach((i) => { s[i] = !all; }); rerender(); }
function uBulk(act, kelasId) {
  const ids = Object.keys(S.c.uSel).filter((k) => S.c.uSel[k]), d = usersData(); if (!ids.length || !d) return;
  const bak = d.users.map((u) => Object.assign({}, u));
  d.users.forEach((u) => { if (ids.indexOf(u.user_id) >= 0) { if (act === 'KELAS') { u.kelas_id = kelasId; u.kelas = kelasNm(kelasId); } else u.status = act; } });
  S.c.uSel = {}; rerender(); toast(`${ids.length} akun ${act === 'AKTIF' ? 'diaktifkan' : act === 'NONAKTIF' ? 'dinonaktifkan' : 'dipindah ke ' + kelasNm(kelasId)}.`, 'ok');
  call('users.bulk', { ids, act, kelas_id: kelasId }, { silent: true }).then(() => { drop('wr_'); drop('lap_'); refreshBoot(true).catch(() => {}); }).catch((e) => { d.users = bak; rerender(); failToast(e); });
}
function uBulkKelas(el) { menuAt(el, (B().kelas || []).map((k) => ({ icon: 'door', label: k.nama_kelas, run: () => uBulk('KELAS', k.kelas_id) }))); }
function userMenu(el, id) {
  const u = usersData().users.find((x) => x.user_id === id); if (!u) return;
  menuAt(el, [{ icon: 'edit', label: 'Ubah data', run: () => openUserForm(id) }, { icon: 'key', label: 'Reset kata sandi', run: () => resetPw(id, u.nama) },
    '-', u.user_id === me().user_id ? { icon: 'info', label: 'Akun Anda sendiri', run: () => {} } : { icon: u.status === 'AKTIF' ? 'lock' : 'unlock', label: u.status === 'AKTIF' ? 'Nonaktifkan akun' : 'Aktifkan kembali', danger: u.status === 'AKTIF', run: () => userStatus(id) }]);
}
function userStatus(id) {
  const u = usersData().users.find((x) => x.user_id === id), old = u.status, nw = old === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
  const run = () => { u.status = nw; rerender(); toast(`${u.nama} ${nw === 'AKTIF' ? 'diaktifkan' : 'dinonaktifkan'}.`, 'ok'); call('users.status', { user_id: id, status: nw }, { silent: true }).catch((e) => { u.status = old; rerender(); failToast(e); }); };
  if (nw === 'NONAKTIF') confirmBox(`Nonaktifkan akun <b>${esc(u.nama)}</b>? Pengguna tidak bisa masuk sampai diaktifkan kembali.`, { danger: true, yes: 'Nonaktifkan' }).then((ok) => { if (ok) run(); }); else run();
}
/** Cari data pengguna lokal (daftar admin atau rekap wali kelas). */
function findUserLocal(id) {
  const d = usersData(); let u = d && d.users.find((x) => x.user_id === id);
  if (!u) Object.keys(S.c).forEach((k) => { if (!u && k.indexOf('wr_') === 0 && S.c[k].d) u = S.c[k].d.rows.find((x) => x.user_id === id); });
  return u ? Object.assign({ roles: rolesOf(u) }, u) : null;
}
/**
 * Form tambah/ubah pengguna. opt.wali = mode wali kelas (hanya siswa di kelasnya).
 * @param {string|null} id user_id
 * @param {{wali?:boolean, kelas?:string, role?:string}} opt
 */
function openUserForm(id, opt) {
  opt = opt || {};
  const u = id ? findUserLocal(id) : null; if (id && !u) { toast('Data pengguna belum dimuat.', 'warn'); return; }
  const wali = !!opt.wali, roles = u ? rolesOf(u) : [opt.role || 'SISWA'];
  const E = { roles: roles.slice() };
  sheet({ title: u ? 'Ubah ' + esc(u.nama) : wali ? 'Tambah Siswa ' + esc(kelasShort(opt.kelas)) : 'Tambah Pengguna', icon: u ? 'edit' : 'user-plus', size: 'drawer', body: `<form id="ufForm" class="col g16" onsubmit="return false">
      ${wali ? '' : `<div class="field"><label class="label">Peran</label><div class="chips" id="ufRoles">${[['SISWA', 'Siswa'], ['GURU', 'Guru'], ['ADMIN', 'Admin']].map((r) => `<button type="button" class="chip ${E.roles.indexOf(r[0]) >= 0 ? 'sel-o' : ''}" data-r="${r[0]}">${E.roles.indexOf(r[0]) >= 0 ? I('check', 'ic-sm') : ''}${r[1]}</button>`).join('')}</div><div class="help">Guru bisa sekaligus Admin. Wali kelas ditetapkan di Data Akademik → Kelas.</div></div>`}
      <div class="field"><label class="label">Nama lengkap <span class="req">*</span></label><input class="input" name="nama" value="${esc(u ? u.nama : '')}" autofocus></div>
      <div class="form-grid c2"><div class="field"><label class="label" id="ufNisL">NIS / NIP</label><input class="input mono" name="nis_nip" value="${esc(u ? u.nis_nip || '' : '')}" inputmode="numeric" oninput="const n=$('#ufForm [name=username]');if(n&&!n.dataset.touched)n.value=this.value.toLowerCase().replace(/[^a-z0-9._-]/g,'')"></div>
        <div class="field"><label class="label">Username <span class="req">*</span></label><input class="input mono" name="username" value="${esc(u ? u.username || '' : '')}" autocapitalize="off" oninput="this.dataset.touched=1"><div class="help">Huruf kecil/angka, min 3 karakter</div></div></div>
      <div class="field" id="ufKelas"><label class="label">Kelas <span class="req">*</span></label><select class="select" name="kelas_id" ${wali ? 'disabled' : ''}><option value="">Pilih kelas</option>${(B().kelas || []).map((k) => `<option value="${k.kelas_id}" ${(u ? u.kelas_id : opt.kelas) === k.kelas_id ? 'selected' : ''}>${esc(k.nama_kelas)}</option>`).join('')}</select></div>
      <div class="form-grid c2"><div class="field"><label class="label">Email Google</label><input class="input" type="email" name="email_google" value="${esc(u ? u.email_google || '' : '')}" placeholder="nama@gmail.com"><div class="help">Untuk masuk dengan Google & email pengingat</div></div>
        <div class="field"><label class="label">No. WhatsApp</label><input class="input" name="no_wa" inputmode="tel" value="${esc(u ? u.no_wa || '' : '')}" placeholder="08xxxxxxxxxx"></div></div>
      ${u ? `<div class="banner banner-info">${I('key')}<div class="f1">Lupa kata sandi? <a href="javascript:void(0)" class="bold" onclick="closeAllSheets();resetPw('${u.user_id}',${jsq(u.nama)})">Reset kata sandi</a> untuk membuat sandi sementara baru.</div></div>`
        : `<div class="field"><label class="label">Kata sandi awal</label><input class="input mono" name="password" placeholder="Kosongkan untuk dibuat otomatis" autocomplete="new-password"><div class="help">Pengguna wajib menggantinya saat pertama masuk.</div></div>`}</form>`,
  foot: `<button class="btn btn-secondary" data-x2>Batal</button><button class="btn btn-primary" id="ufSave">${I('check')}${u ? 'Simpan Perubahan' : 'Buat Akun'}</button>`,
  mount: (el, close) => {
    el.querySelector('[data-x2]').onclick = close;
    const syncK = () => { $('#ufKelas', el).hidden = E.roles.indexOf('SISWA') < 0; $('#ufNisL', el).textContent = E.roles.indexOf('SISWA') >= 0 ? 'NIS' : 'NIP'; };
    syncK();
    if (u) $('[name=username]', el).dataset.touched = 1;
    const rb = $('#ufRoles', el);
    if (rb) rb.onclick = (e) => {
      const b = e.target.closest('[data-r]'); if (!b) return; const r = b.dataset.r;
      if (r === 'SISWA') E.roles = ['SISWA']; else { E.roles = E.roles.filter((x) => x !== 'SISWA'); const i = E.roles.indexOf(r); if (i >= 0) E.roles.splice(i, 1); else E.roles.push(r); if (!E.roles.length) E.roles = [r]; }
      $$('[data-r]', rb).forEach((x) => { const on = E.roles.indexOf(x.dataset.r) >= 0; x.classList.toggle('sel-o', on); x.innerHTML = (on ? I('check', 'ic-sm') : '') + ({ SISWA: 'Siswa', GURU: 'Guru', ADMIN: 'Admin' })[x.dataset.r]; });
      syncK();
    };
    $('#ufSave', el).onclick = () => {
      const f = formData($('#ufForm', el)), btn = $('#ufSave', el);
      const p = { user_id: u ? u.user_id : '', nama: f.nama.trim(), username: f.username.trim().toLowerCase(), nis_nip: f.nis_nip.trim(), role: wali ? 'SISWA' : E.roles.join(','), kelas_id: wali ? opt.kelas : f.kelas_id, email_google: f.email_google.trim(), no_wa: f.no_wa.trim(), password: f.password || '' };
      if (!p.nama) { toast('Nama wajib diisi.', 'warn'); return; }
      if (!/^[a-z0-9._-]{3,60}$/.test(p.username)) { toast('Username minimal 3 karakter: huruf kecil, angka, titik, garis bawah, atau strip.', 'warn'); return; }
      if (p.role.indexOf('SISWA') >= 0 && !p.kelas_id) { toast('Pilih kelas siswa.', 'warn'); return; }
      btnBusy(btn, true, 'Menyimpan…');
      call('users.save', p).then((r) => {
        const d = usersData();
        if (d) { const i = d.users.findIndex((x) => x.user_id === r.user.user_id); if (i >= 0) d.users[i] = r.user; else d.users.push(r.user); }
        if (rolesOf(r.user).indexOf('SISWA') >= 0) { const gs = G().siswa, j = gs.findIndex((x) => x.user_id === r.user.user_id), lite = { user_id: r.user.user_id, nama: r.user.nama, nis_nip: r.user.nis_nip, kelas_id: r.user.kelas_id, foto: r.user.foto }; if (j >= 0) gs[j] = lite; else gs.push(lite); }
        if (r.user.user_id === me().user_id) { Object.assign(S.boot.user, { nama: r.user.nama, no_wa: r.user.no_wa, email_google: r.user.email_google, nis_nip: r.user.nis_nip }); renderChrome(); }
        drop('wr_'); saveSnap(); close(); rerender();
        if (r.password) showCreds([{ nama: r.user.nama, username: r.user.username, kelas: r.user.kelas || '', password: r.password }], 'Akun berhasil dibuat');
        else toast('Data ' + r.user.nama + ' disimpan.', 'ok');
      }).catch((e) => { btnBusy(btn, false); failToast(e); });
    };
  } });
}
function resetPw(id, nama) {
  confirmBox(`Buat kata sandi sementara baru untuk <b>${esc(nama)}</b>? Kata sandi lama tidak berlaku lagi dan pengguna wajib menggantinya saat masuk.`, { yes: 'Reset Kata Sandi', icon: 'key' }).then((ok) => {
    if (!ok) return;
    call('users.reset', { user_id: id }).then((r) => { const u = findUserLocal(id); showCreds([{ nama: r.nama, username: r.username, kelas: u ? u.kelas || kelasNm(u.kelas_id) : '', password: r.password }], 'Kata sandi direset'); const d = usersData(); const x = d && d.users.find((y) => y.user_id === id); if (x) x.wajib_ganti = true; }).catch(failToast);
  });
}
/** Tampilkan kredensial (hanya sekali) + salin & unduh. */
function showCreds(list, title) {
  const txt = list.map((c) => `${c.nama}${c.kelas ? ' (' + c.kelas + ')' : ''}\nUsername: ${c.username}\nKata sandi: ${c.password}`).join('\n\n');
  S.c.credTxt = txt; S.c.credList = list;
  sheet({ title: esc(title || 'Kredensial Akun'), icon: 'key', size: list.length > 3 ? 'wide' : '', body: `<div class="banner banner-warn">${I('alert')}<div>Catat atau bagikan sekarang. Demi keamanan, kata sandi <b>tidak dapat dilihat lagi</b> setelah jendela ini ditutup.</div></div>
    ${list.length === 1 ? `<div class="code-box mt16" style="line-height:2"><div class="small muted">${esc(list[0].nama)}${list[0].kelas ? ' · ' + esc(list[0].kelas) : ''}</div><div>Username: <b class="mono">${esc(list[0].username)}</b></div><div>Kata sandi: <b class="mono" style="font-size:18px;letter-spacing:.06em">${esc(list[0].password)}</b></div></div>`
      : `<div class="tbl-wrap mt16" style="max-height:50vh"><table class="tbl compact"><thead><tr><th>Nama</th><th>Kelas</th><th>Username</th><th>Kata sandi</th></tr></thead><tbody>${list.map((c) => `<tr><td class="small">${esc(c.nama)}</td><td class="small">${esc(c.kelas || '-')}</td><td class="mono small">${esc(c.username)}</td><td class="mono bold">${esc(c.password)}</td></tr>`).join('')}</tbody></table></div>`}`,
  foot: `<button class="btn btn-secondary" onclick="copyText(S.c.credTxt)">${I('copy')}Salin</button><button class="btn btn-primary" onclick="exportXlsx('kredensial_akun_${D.ymd(now())}',[{name:'Akun',rows:[['Nama','Kelas','Username','Kata Sandi']].concat(S.c.credList.map(c=>[c.nama,c.kelas,c.username,c.password]))}])">${I('download')}Unduh Excel</button>` });
}
function openImportUsers() {
  const W = { rows: null, res: null };
  const s = sheet({ title: 'Import Akun dari Excel', icon: 'upload', size: 'wide', body: `<div id="iuBody"></div>`, foot: `<button class="btn btn-secondary" id="iuTpl">${I('download')}Unduh Template</button><button class="btn btn-primary" id="iuGo" disabled>${I('cloud-ok')}Import</button>`,
    mount: (el) => {
      const draw = () => {
        const r = W.res;
        $('#iuBody', el).innerHTML = `<p class="small tx2">Kolom: <span class="mono xs">nama, role, nis_nip, kelas, username, email_google, no_wa</span>. <b>role</b> diisi SISWA/GURU/ADMIN; <b>kelas</b> sesuai nama kelas (mis. XI-2). Username kosong → memakai NIS/NIP.</p>
          <label class="upload mt12">${I('file-text', 'ic-lg')}<div class="bold mt8">${W.file ? esc(W.file) : 'Pilih berkas .xlsx atau .csv'}</div><div class="small muted">Maksimal 1.000 baris per import</div><input type="file" hidden accept=".xlsx,.xls,.csv" id="iuFile"></label>
          ${r ? `<div class="flex g8 mt16 wrap">${pill(r.valid.length + ' siap dibuat', 'ok', 'check')}${r.errors.length ? pill(r.errors.length + ' baris bermasalah (dilewati)', 'err', 'alert') : ''}</div>
            <div class="tbl-wrap mt12" style="max-height:44vh"><table class="tbl compact"><thead><tr><th>Baris</th><th>Nama</th><th>Peran</th><th>Kelas</th><th>Username</th><th>Status</th></tr></thead><tbody>${r.all.map((x) => x.err ? `<tr class="row-err"><td class="mono">#${x.i + 2}</td><td colspan="4" class="small">${esc((W.rows[x.i] || {}).nama || '-')}</td><td class="small ink-err">${esc(x.err)}</td></tr>` : `<tr><td class="mono">#${x.i + 2}</td><td class="small">${esc(x.nama)}</td><td class="small">${esc(x.role)}</td><td class="small">${esc(kelasNm(x.kelas_id) === '-' ? '' : kelasNm(x.kelas_id))}</td><td class="mono small">${esc(x.username)}</td><td>${pill('Valid', 'ok')}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
        $('#iuFile', el).onchange = (e) => { const f = e.target.files[0]; if (!f) return; W.file = f.name; readSheetFile(f).then((rows) => { W.rows = rowsToObjs(rows); if (!W.rows.length) throw new Error('Berkas kosong atau header tidak sesuai template.'); return call('users.import', { rows: W.rows, dry: true }); }).then((r2) => { W.res = { valid: r2.valid, errors: r2.errors, all: r2.valid.concat(r2.errors.map((x) => ({ i: x.i, err: x.msg }))).sort(by('i')) }; $('#iuGo', el).disabled = !r2.valid.length; $('#iuGo', el).innerHTML = `${I('cloud-ok')}Buat ${r2.valid.length} Akun`; draw(); }).catch(failToast); };
      };
      draw();
      $('#iuTpl', el).onclick = () => exportXlsx('template_akun_smapatispa', [{ name: 'Akun', rows: [['nama', 'role', 'nis_nip', 'kelas', 'username', 'email_google', 'no_wa'], ['Rina Lestari', 'SISWA', '222310148', 'XI-2', '', 'rina@gmail.com', '081234567890'], ['Budi Santoso, S.Pd.', 'GURU', '198702122010011003', '', 'budi.santoso', '', '']] }]);
      $('#iuGo', el).onclick = () => {
        const btn = $('#iuGo', el), ok = {}; W.res.valid.forEach((v) => { ok[v.i] = 1; }); btnBusy(btn, true, 'Membuat akun…');
        call('users.import', { rows: W.rows.filter((r, i) => ok[i]) }).then((r) => { s.close(); drop('users'); refreshBoot(true).catch(() => {}); rerender(); toast(r.inserted + ' akun dibuat.', 'ok'); if (r.credentials.length) showCreds(r.credentials, r.inserted + ' Akun Berhasil Dibuat'); }).catch((e) => { btnBusy(btn, false); failToast(e); });
      };
    } });
}

// ── Data akademik ──
route('a-akademik', {
  title: 'Data Akademik', roles: ['ADMIN'],
  render(p) {
    const tab = p.tab || 'kelas', ad = B().admin || {}, kelas = (B().kelas || []).slice().sort(by('nama_kelas')), mapel = (B().mapel || []).slice().sort(by('nama_mapel'));
    const nS = {}; G().siswa.forEach((s) => { nS[s.kelas_id] = (nS[s.kelas_id] || 0) + 1; });
    const tabs = [['ta', 'Tahun Ajaran', (ad.tas || []).length], ['kelas', 'Kelas & Wali', kelas.length], ['mapel', 'Mata Pelajaran', mapel.length], ['penugasan', 'Penugasan Mengajar', G().penugasan.length]];
    let body = '';
    if (tab === 'ta') body = `<div class="flex jc-e mb12"><button class="btn btn-primary" onclick="openTaForm(null)">${I('plus')}Tahun Ajaran Baru</button></div><div class="grid gc3">${(ad.tas || []).slice().sort(by((t) => t.nama + t.semester, -1)).map((t) => `<div class="card card-p ${t.aktif ? 'sel' : ''}"><div class="flex items-c g8"><div class="tile ${t.aktif ? 'ok' : ''}">${I('calendar')}</div><div class="f1"><h3>${esc(t.nama)}</h3><div class="small muted">Semester ${esc(t.semester)}</div></div>${t.aktif ? pill('Aktif', 'ok', 'check') : ''}</div>
        <p class="small tx2 mt12">${t.tgl_mulai ? D.d(num(t.tgl_mulai)) + ' – ' + D.d(num(t.tgl_selesai)) : 'Tanggal belum diatur'}</p><div class="flex g8 mt12"><button class="btn btn-ghost btn-sm" onclick="openTaForm('${t.ta_id}')">${I('edit', 'ic-sm')}Ubah</button>${t.aktif ? '' : `<button class="btn btn-secondary btn-sm ml-a" onclick="taActivate('${t.ta_id}')">${I('check-c', 'ic-sm')}Jadikan Aktif</button>`}</div></div>`).join('') || `<div class="card" style="grid-column:1/-1">${emptyState('calendar', 'Belum ada tahun ajaran', 'Tambahkan tahun ajaran, lalu jadikan aktif.')}</div>`}</div>`;
    else if (tab === 'kelas') body = `<div class="card">${dataTable('akKelas', kelas, [
        { h: 'Kelas', k: 'nama_kelas', r: (k) => `<div class="flex items-c g8"><div class="tile sm">${I('door')}</div><div><div class="bold">${esc(k.nama_kelas)}</div><div class="xs muted">Tingkat ${esc(k.tingkat || '-')}</div></div></div>` },
        { h: 'Wali kelas', k: 'wali', r: (k) => k.wali ? `<div class="flex items-c g8">${avatar(k.wali, '', 'sm')}<span class="small bold">${esc(k.wali)}</span></div>` : `<button class="btn btn-ghost btn-sm ink-warn" onclick="event.stopPropagation();openKelasForm('${k.kelas_id}')">${I('plus', 'ic-sm')}Tetapkan wali</button>` },
        { h: 'Siswa', k: 'kelas_id', n: true, search: false, v: (k) => nS[k.kelas_id] || 0, r: (k) => `<span class="mono">${nS[k.kelas_id] || 0}</span>` },
        { h: 'Mapel diajar', k: 'tingkat', n: true, search: false, v: (k) => G().penugasan.filter((x) => x.kelas_id === k.kelas_id).length, r: (k) => `<span class="mono">${G().penugasan.filter((x) => x.kelas_id === k.kelas_id).length}</span>` },
        { h: '', sort: false, search: false, r: (k) => `<div class="flex g4 jc-e"><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();go('w-kelas',{kelas_id:'${k.kelas_id}'})">${I('chart', 'ic-sm')}Rekap</button><button class="icon-btn" onclick="event.stopPropagation();openKelasForm('${k.kelas_id}')" title="Ubah">${I('edit')}</button><button class="icon-btn ink-err" onclick="event.stopPropagation();delMaster('kelas','${k.kelas_id}')" title="Hapus">${I('trash')}</button></div>` }
      ], { ph: 'Cari kelas atau wali…', per: 40, onRow: (k) => `openKelasForm('${k.kelas_id}')`, tools: `<button class="btn btn-primary btn-sm" onclick="openKelasForm(null)">${I('plus', 'ic-sm')}Tambah Kelas</button>` })}</div>`;
    else if (tab === 'mapel') body = `<div class="flex jc-e mb12"><button class="btn btn-primary" onclick="openMapelForm(null)">${I('plus')}Tambah Mapel</button></div><div class="mapel-grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${mapel.map((m) => `<button class="mapel-tile" onclick="openMapelForm('${m.mapel_id}')">${mapelIcon(m.mapel_id)}<span class="nm">${esc(m.nama_mapel)}</span><span class="gr mono">${esc(m.kode || '-')} · ${G().penugasan.filter((x) => x.mapel_id === m.mapel_id).length} kelas</span></button>`).join('') || emptyState('book', 'Belum ada mapel', '')}</div>`;
    else {
      const gurus = (B().gurus || []).slice().sort(by('nama')), byG = {}; G().penugasan.forEach((x) => { (byG[x.guru_id] = byG[x.guru_id] || []).push(x); });
      body = `<div class="flex jc-b items-c mb12 wrap g8"><p class="small muted">Penugasan menentukan kelas & mapel yang bisa dikelola guru (materi, tugas, ujian, presensi).</p><button class="btn btn-primary" onclick="openPenForm('')">${I('plus')}Tambah Penugasan</button></div>
        <div class="grid gc2">${gurus.map((g) => { const l = (byG[g.user_id] || []).sort(by((x) => mapelNm(x.mapel_id) + kelasNm(x.kelas_id))); return `<div class="card card-p"><div class="flex items-c g12">${avatar(g.nama, '', 'sm')}<div class="f1" style="min-width:0"><div class="bold truncate">${esc(g.nama)}</div><div class="xs muted mono">${esc(g.nis_nip || '')} · ${l.length} penugasan</div></div><button class="btn btn-ghost btn-sm" onclick="openPenForm('${g.user_id}')">${I('plus', 'ic-sm')}</button></div>
          <div class="chips mt12">${l.map((x) => `<span class="chip">${esc(mapelNm(x.mapel_id))} · <b>${esc(kelasShort(x.kelas_id))}</b><button class="icon-btn" style="width:22px;height:22px;margin-right:-6px" title="Hapus" onclick="delMaster('penugasan','${x.penugasan_id}')">${I('x', 'ic-sm')}</button></span>`).join('') || '<span class="small muted">Belum ada penugasan.</span>'}</div></div>`; }).join('') || `<div class="card" style="grid-column:1/-1">${emptyState('users', 'Belum ada akun guru', 'Tambahkan guru di menu Pengguna.')}</div>`}</div>`;
    }
    return `<div class="page"><div class="page-hd"><div><h1>Data Akademik</h1><p class="sub">Tahun ajaran, rombel & wali kelas, mata pelajaran, dan penugasan mengajar.</p></div></div>
      <div class="tabs scroll">${tabs.map((t) => `<button class="tab ${tab === t[0] ? 'on' : ''}" onclick="go('a-akademik',{tab:'${t[0]}'},{replace:true})">${t[1]} <span class="badge neu">${t[2]}</span></button>`).join('')}</div><div class="mt16">${body}</div></div>`;
  }
});
function openTaForm(id) {
  const t = id ? (B().admin.tas || []).find((x) => x.ta_id === id) : null, y = new Date(now()).getFullYear();
  sheet({ title: t ? 'Ubah Tahun Ajaran' : 'Tahun Ajaran Baru', icon: 'calendar', body: `<form id="taF" class="col g16" onsubmit="return false"><div class="form-grid c2"><div class="field"><label class="label">Tahun ajaran <span class="req">*</span></label><input class="input mono" name="nama" value="${esc(t ? t.nama : y + '/' + (y + 1))}" placeholder="2026/2027"></div>
      <div class="field"><label class="label">Semester</label><select class="select" name="semester"><option value="GANJIL" ${t && /genap/i.test(t.semester) ? '' : 'selected'}>Ganjil</option><option value="GENAP" ${t && /genap/i.test(t.semester) ? 'selected' : ''}>Genap</option></select></div></div>
      <div class="form-grid c2"><div class="field"><label class="label">Tanggal mulai</label><input class="input" type="date" name="tgl_mulai" value="${t && t.tgl_mulai ? D.ymd(num(t.tgl_mulai)) : ''}"></div><div class="field"><label class="label">Tanggal selesai</label><input class="input" type="date" name="tgl_selesai" value="${t && t.tgl_selesai ? D.ymd(num(t.tgl_selesai)) : ''}"></div></div></form>`,
  foot: `<button class="btn btn-primary" id="taOk">${I('check')}Simpan</button>`, mount: (el, close) => { $('#taOk', el).onclick = () => {
    const f = formData($('#taF', el)), btn = $('#taOk', el); if (!f.nama.trim()) { toast('Isi tahun ajaran.', 'warn'); return; }
    btnBusy(btn, true, 'Menyimpan…');
    call('ta.save', { ta_id: id || '', nama: f.nama.trim(), semester: f.semester, tgl_mulai: f.tgl_mulai ? new Date(f.tgl_mulai + 'T00:00:00').getTime() : '', tgl_selesai: f.tgl_selesai ? new Date(f.tgl_selesai + 'T00:00:00').getTime() : '' }).then((r) => {
      const l = B().admin.tas = B().admin.tas || [], o = { ta_id: r.ta_id, nama: r.nama, semester: r.semester, tgl_mulai: r.tgl_mulai, tgl_selesai: r.tgl_selesai, aktif: isTrue(r.aktif) }, i = l.findIndex((x) => x.ta_id === r.ta_id);
      if (i >= 0) l[i] = o; else l.push(o); saveSnap(); close(); rerender(); toast('Tahun ajaran disimpan.', 'ok'); if (o.aktif) refreshBoot(true).catch(() => {});
    }).catch((e) => { btnBusy(btn, false); failToast(e); }); }; } });
}
function taActivate(id) {
  const t = B().admin.tas.find((x) => x.ta_id === id);
  confirmBox(`Jadikan <b>${esc(t.nama)} Semester ${esc(t.semester)}</b> sebagai tahun ajaran aktif?`, { yes: 'Aktifkan' }).then((ok) => {
    if (!ok) return; const bak = B().admin.tas.map((x) => Object.assign({}, x)); B().admin.tas.forEach((x) => { x.aktif = x.ta_id === id; }); B().ta = { ta_id: t.ta_id, nama: t.nama, semester: t.semester }; rerender(); toast('Tahun ajaran aktif diperbarui.', 'ok');
    call('ta.activate', { ta_id: id }, { silent: true }).then(() => refreshBoot(true)).catch((e) => { B().admin.tas = bak; rerender(); failToast(e); });
  });
}
function openKelasForm(id) {
  const k = id ? (B().kelas || []).find((x) => x.kelas_id === id) : null, waliOf = {}; (B().kelas || []).forEach((x) => { if (x.wali_kelas_id) waliOf[x.wali_kelas_id] = x.nama_kelas; });
  sheet({ title: k ? 'Ubah Kelas ' + esc(k.nama_kelas) : 'Tambah Kelas', icon: 'door', body: `<form id="kF" class="col g16" onsubmit="return false"><div class="form-grid c2"><div class="field"><label class="label">Nama kelas <span class="req">*</span></label><input class="input" name="nama_kelas" value="${esc(k ? k.nama_kelas : '')}" placeholder="XI-2 atau XI MIPA 2" autofocus></div>
      <div class="field"><label class="label">Tingkat</label><select class="select" name="tingkat">${['X', 'XI', 'XII'].map((t) => `<option ${k && k.tingkat === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div></div>
      <div class="field"><label class="label">Wali kelas</label><select class="select" name="wali_kelas_id"><option value="">— Belum ada wali —</option>${(B().gurus || []).slice().sort(by('nama')).map((g) => `<option value="${g.user_id}" ${k && k.wali_kelas_id === g.user_id ? 'selected' : ''} ${waliOf[g.user_id] && (!k || k.wali_kelas_id !== g.user_id) ? 'disabled' : ''}>${esc(g.nama)}${waliOf[g.user_id] && (!k || k.wali_kelas_id !== g.user_id) ? ' (wali ' + esc(waliOf[g.user_id]) + ')' : ''}</option>`).join('')}</select>
        <div class="help">Guru yang ditetapkan otomatis mendapat menu Wali Kelas (rekap presensi, leger nilai, tunggakan). Satu guru hanya untuk satu kelas.</div></div></form>`,
  foot: `${k ? `<button class="btn btn-danger-o" onclick="closeAllSheets();delMaster('kelas','${k.kelas_id}')">${I('trash')}</button>` : ''}<button class="btn btn-primary" id="kOk">${I('check')}Simpan Kelas</button>`, mount: (el, close) => { $('#kOk', el).onclick = () => {
    const f = formData($('#kF', el)), btn = $('#kOk', el); if (!f.nama_kelas.trim()) { toast('Isi nama kelas.', 'warn'); return; }
    btnBusy(btn, true, 'Menyimpan…');
    call('kelas.save', { kelas_id: id || '', nama_kelas: f.nama_kelas.trim(), tingkat: f.tingkat, wali_kelas_id: f.wali_kelas_id }).then((r) => {
      const l = B().kelas, o = { kelas_id: r.kelas_id, nama_kelas: r.nama_kelas, tingkat: r.tingkat, wali_kelas_id: r.wali_kelas_id, wali: r.wali }, i = l.findIndex((x) => x.kelas_id === r.kelas_id);
      if (i >= 0) l[i] = o; else l.push(o); saveSnap(); close(); renderChrome(); rerender(); toast('Kelas ' + r.nama_kelas + ' disimpan.', 'ok');
      refreshBoot(true).catch(() => {});   // peran wali kelas ikut diperbarui
    }).catch((e) => { btnBusy(btn, false); failToast(e); }); }; } });
}
function openMapelForm(id) {
  const m = id ? (B().mapel || []).find((x) => x.mapel_id === id) : null; let ikon = m ? m.ikon || 'book' : 'book';
  sheet({ title: m ? 'Ubah Mata Pelajaran' : 'Tambah Mata Pelajaran', icon: 'book', body: `<form id="mF" class="col g16" onsubmit="return false"><div class="form-grid c2"><div class="field"><label class="label">Nama mapel <span class="req">*</span></label><input class="input" name="nama_mapel" value="${esc(m ? m.nama_mapel : '')}" autofocus></div><div class="field"><label class="label">Kode</label><input class="input mono" name="kode" value="${esc(m ? m.kode : '')}" maxlength="12" placeholder="FIS" style="text-transform:uppercase"></div></div>
      <div class="field"><label class="label">Ikon</label><div class="grid" id="mIk" style="grid-template-columns:repeat(8,1fr);gap:8px">${MAPEL_ICONS.map((ic) => `<button type="button" class="tile ${ic === ikon ? '' : 'neu'}" data-ic="${ic}" style="width:100%;aspect-ratio:1;height:auto;${ic === ikon ? 'box-shadow:0 0 0 2px var(--p600)' : 'background:var(--subtle);color:var(--tx2)'}">${I(ic)}</button>`).join('')}</div></div></form>`,
  foot: `${m ? `<button class="btn btn-danger-o" onclick="closeAllSheets();delMaster('mapel','${m.mapel_id}')">${I('trash')}</button>` : ''}<button class="btn btn-primary" id="mOk">${I('check')}Simpan</button>`, mount: (el, close) => {
    $('#mIk', el).onclick = (e) => { const b = e.target.closest('[data-ic]'); if (!b) return; ikon = b.dataset.ic; $$('[data-ic]', el).forEach((x) => { const on = x === b; x.style.boxShadow = on ? '0 0 0 2px var(--p600)' : ''; x.style.background = on ? '' : 'var(--subtle)'; x.style.color = on ? '' : 'var(--tx2)'; }); };
    $('#mOk', el).onclick = () => {
      const f = formData($('#mF', el)), btn = $('#mOk', el); if (!f.nama_mapel.trim()) { toast('Isi nama mapel.', 'warn'); return; }
      btnBusy(btn, true, 'Menyimpan…');
      call('mapel.save', { mapel_id: id || '', nama_mapel: f.nama_mapel.trim(), kode: f.kode, ikon }).then((r) => { const l = B().mapel, i = l.findIndex((x) => x.mapel_id === r.mapel_id), o = { mapel_id: r.mapel_id, nama_mapel: r.nama_mapel, kode: r.kode, ikon: r.ikon }; if (i >= 0) l[i] = o; else l.push(o); saveSnap(); close(); rerender(); toast('Mapel disimpan.', 'ok'); }).catch((e) => { btnBusy(btn, false); failToast(e); });
    }; } });
}
function openPenForm(guruId) {
  const E = { kelas: [] };
  sheet({ title: 'Tambah Penugasan Mengajar', icon: 'door', body: `<form id="pF" class="col g16" onsubmit="return false"><div class="field"><label class="label">Guru <span class="req">*</span></label><select class="select" name="guru_id"><option value="">Pilih guru</option>${(B().gurus || []).slice().sort(by('nama')).map((g) => `<option value="${g.user_id}" ${g.user_id === guruId ? 'selected' : ''}>${esc(g.nama)}</option>`).join('')}</select></div>
      <div class="field"><label class="label">Mata pelajaran <span class="req">*</span></label><select class="select" name="mapel_id"><option value="">Pilih mapel</option>${(B().mapel || []).slice().sort(by('nama_mapel')).map((m) => `<option value="${m.mapel_id}">${esc(m.nama_mapel)}</option>`).join('')}</select></div>
      <div class="field"><label class="label">Kelas <span class="req">*</span> <span class="xs muted">(boleh lebih dari satu)</span></label><div class="chips" id="pK">${(B().kelas || []).slice().sort(by('nama_kelas')).map((k) => `<button type="button" class="chip" data-k="${k.kelas_id}">${esc(k.nama_kelas)}</button>`).join('')}</div></div></form>`,
  foot: `<button class="btn btn-primary" id="pOk">${I('check')}Simpan Penugasan</button>`, mount: (el, close) => {
    $('#pK', el).onclick = (e) => { const b = e.target.closest('[data-k]'); if (!b) return; const i = E.kelas.indexOf(b.dataset.k); if (i >= 0) E.kelas.splice(i, 1); else E.kelas.push(b.dataset.k); b.classList.toggle('sel-o', i < 0); };
    $('#pOk', el).onclick = () => {
      const f = formData($('#pF', el)), btn = $('#pOk', el);
      if (!f.guru_id || !f.mapel_id || !E.kelas.length) { toast('Pilih guru, mapel, dan minimal satu kelas.', 'warn'); return; }
      btnBusy(btn, true, 'Menyimpan…');
      call('penugasan.save', { guru_id: f.guru_id, mapel_id: f.mapel_id, kelas_ids: E.kelas }).then((rows) => {
        const g = (B().gurus || []).find((x) => x.user_id === f.guru_id) || {};
        rows.forEach((r) => G().penugasan.push({ penugasan_id: r.penugasan_id, mapel_id: r.mapel_id, kelas_id: r.kelas_id, guru_id: r.guru_id, guru: g.nama }));
        saveSnap(); close(); rerender(); toast(rows.length ? rows.length + ' penugasan ditambahkan.' : 'Penugasan sudah ada sebelumnya.', rows.length ? 'ok' : 'info');
      }).catch((e) => { btnBusy(btn, false); failToast(e); });
    }; } });
}
function delMaster(kind, id) {
  const lbl = { kelas: 'kelas', mapel: 'mata pelajaran', penugasan: 'penugasan mengajar' }[kind];
  confirmBox(`Hapus ${lbl} ini? Tindakan ini tidak dapat dibatalkan.`, { danger: true, yes: 'Hapus' }).then((ok) => {
    if (!ok) return;
    const store = kind === 'penugasan' ? G() : B(), key = kind === 'penugasan' ? 'penugasan' : kind, idk = kind + '_id', bak = store[key].slice();
    store[key] = store[key].filter((x) => x[idk] !== id); rerender();
    call(kind + '.delete', { [idk]: id }, { silent: true }).then(() => { saveSnap(); toast('Data dihapus.', 'ok'); }).catch((e) => { store[key] = bak; rerender(); failToast(e); });
  });
}

// ── Pengaturan aplikasi ──
const SET_TABS = [['identitas', 'Identitas & Tampilan', 'palette'], ['ujian', 'Ujian CBT', 'exam'], ['notif', 'Notifikasi & Pengingat', 'bell'], ['akses', 'Login & Akses', 'shield'], ['cadangan', 'Cadangan & Log', 'database']];
const SWATCH = ['#1D4ED8', '#0F766E', '#7C3AED', '#BE123C', '#C2410C', '#15803D', '#0369A1', '#334155'];
const SWATCH2 = ['#38BDF8', '#FBBF24', '#34D399', '#F472B6', '#A78BFA', '#FB923C', '#22D3EE', '#E2E8F0'];
function cfgFromSettings(s) {
  return Object.assign({}, cfg(), { nama_aplikasi: s.nama_aplikasi, nama_sekolah: s.nama_sekolah, warna_primer: s.warna_primer, warna_sekunder: s.warna_sekunder, kkm: num(s.kkm, 75), jam_pengingat: num(s.jam_pengingat, 16), email_aktif: isTrue(s.email_aktif), wa_aktif: isTrue(s.wa_aktif), absensi_harian: isTrue(s.absensi_harian_aktif), google_login_url: s.google_login_url, google_client_id: s.google_client_id || '', url_aplikasi: s.url_aplikasi || '', google_login: !!(s.google_login_url || s.google_client_id) });
}
route('a-settings', {
  title: 'Pengaturan', roles: ['ADMIN'], form: true,
  render(p) {
    const tab = p.tab || 'identitas', base = (B().admin || {}).settings || {};
    if (!S.c.setE || S.c.setE._src !== base) S.c.setE = Object.assign({ _src: base }, base);
    const E = S.c.setE, c = cfg();
    const dirty = Object.keys(base).some((k) => k !== '_src' && String(E[k] === undefined ? '' : E[k]) !== String(base[k] === undefined ? '' : base[k])) || !!S.c.setKey || (S.c.setCid !== undefined && S.c.setCid !== (base.google_client_id || ''));
    const sw = (k, t, sub, ic) => `<div class="toggle-row"><div class="tile sm">${I(ic)}</div><div class="f1"><b>${t}</b><div class="small muted">${sub}</div></div><label class="switch"><input type="checkbox" data-s="${k}" data-bool="1" ${isTrue(E[k]) ? 'checked' : ''}><span></span></label></div>`;
    const inp = (k, l, attrs, help) => `<div class="field"><label class="label">${l}</label><input class="input" data-s="${k}" value="${esc(E[k] === undefined ? '' : E[k])}" ${attrs || ''}>${help ? `<div class="help">${help}</div>` : ''}</div>`;
    let body = '';
    if (tab === 'identitas') body = `<div class="split"><div class="col g16"><div class="card card-p"><h3>Identitas Aplikasi</h3><div class="col g16 mt16">${inp('nama_aplikasi', 'Nama aplikasi <span class="req">*</span>', 'maxlength="60"', 'Tampil di header, halaman login, dan judul tab browser.')}${inp('nama_sekolah', 'Nama sekolah', 'maxlength="100"')}</div></div>
        <div class="card card-p"><h3>Logo Sekolah</h3><p class="small muted mt4">Unggah gambar lalu atur potongan persegi. Sistem membuat thumbnail 512, 192, dan 64 px otomatis.</p>
          <div class="flex items-c g16 mt16 wrap"><div style="width:96px;height:96px;border-radius:24px;background:var(--subtle);color:var(--tx3);display:grid;place-items:center;overflow:hidden;border:1px solid var(--border);flex:none">${c.logo ? `<img src="${esc(c.logo_full || c.logo)}" alt="Logo" style="width:100%;height:100%;object-fit:contain">` : I('cap', 'ic-xl')}</div>
            <div class="col g8"><label class="btn btn-secondary">${I('upload')}${c.logo ? 'Ganti Logo' : 'Unggah Logo'}<input type="file" hidden accept="image/png,image/jpeg,image/webp" onchange="openLogoCrop(this.files[0]);this.value=''"></label><span class="xs muted">PNG transparan disarankan, maks 10 MB</span></div></div></div>
        <div class="card card-p"><h3>Warna Tema</h3><div class="form-grid c2 mt16">${[['warna_primer', 'Warna utama', SWATCH], ['warna_sekunder', 'Warna aksen', SWATCH2]].map((x) => `<div class="field"><label class="label">${x[1]}</label><div class="color-in"><span class="mono bold f1" id="hx_${x[0]}">${esc(E[x[0]])}</span><input type="color" data-color="${x[0]}" value="${esc(E[x[0]])}"></div><div class="swatches mt8">${x[2].map((h) => `<button type="button" style="background:${h}" title="${h}" onclick="setColor('${x[0]}','${h}')"></button>`).join('')}</div></div>`).join('')}</div>
          <div class="flex g8 mt16"><button class="btn btn-ghost btn-sm" onclick="resetTheme()">${I('refresh', 'ic-sm')}Kembalikan tampilan bawaan</button></div></div></div>
        <div><div class="card card-p" style="position:sticky;top:84px"><h3 class="tc">Pratinjau Langsung</h3><p class="small muted tc mt4">Perubahan warna langsung terlihat di seluruh aplikasi</p>
          <div class="preview-phone mt16"><div class="grad grad-pattern" style="padding:18px 16px 26px;color:#fff"><div class="flex items-c g8">${logoHTML('sm')}<b class="truncate" id="pvName" style="font-family:var(--f-head)">${esc(E.nama_aplikasi)}</b></div><div class="small mt16" style="opacity:.85">Selamat Pagi,</div><div class="b7" style="font-family:var(--f-head);font-size:18px">Halo, Rina Lestari</div></div>
            <div style="padding:14px;margin-top:-14px" class="col g8"><div class="card" style="padding:12px"><div class="flex items-c g8"><div class="tile sm">${I('exam')}</div><div class="f1"><div class="small bold">Ujian Aktif</div><div class="xs muted">PH Dinamika Gerak</div></div></div><button class="btn btn-primary btn-sm btn-block mt8">Kerjakan</button></div>
              <div class="flex g8"><span class="pill pill-p">Fisika</span><span class="pill" style="background:var(--acc);color:var(--acc-ink)">Aksen</span></div></div></div></div></div></div>`;
    else if (tab === 'ujian') body = `<div class="card card-p" style="max-width:760px"><h3>Aturan Bawaan Ujian CBT</h3><p class="small muted mt4">Berlaku untuk ujian yang memakai pengaturan "Ikuti global". Guru masih bisa mengubah per ujian.</p>
        <div class="mt12">${sw('wajib_token', 'Wajibkan token untuk ujian baru', 'Peserta memasukkan token dari pengawas sebelum mulai', 'key')}${sw('tampilkan_nilai', 'Tampilkan nilai setelah selesai', 'Nilai pilihan ganda langsung tampil ke siswa', 'eye')}</div>
        <div class="form-grid c2 mt16">${inp('batas_pelanggaran', 'Batas pelanggaran sebelum terkunci', 'type="number" min="1" max="20"', 'Pindah tab / keluar layar penuh dihitung satu pelanggaran.')}${inp('kkm', 'KKM / KKTP', 'type="number" min="0" max="100"', 'Dipakai di hasil ujian, leger, dan laporan.')}${inp('jam_buka_default', 'Jam buka bawaan', 'type="time"')}${inp('jam_tutup_default', 'Jam tutup bawaan', 'type="time"')}</div></div>`;
    else if (tab === 'notif') body = `<div class="grid gc2"><div class="card card-p"><h3>Pengingat Otomatis</h3><p class="small muted mt4">Dikirim setiap hari ke siswa yang belum mengumpulkan tugas (tenggat ≤ 2 hari) atau ujian yang akan dibuka.</p>
          <div class="field mt16"><label class="label">Jam pengiriman (${TZL || 'WIB'})</label><select class="select" data-s="jam_pengingat">${Array.from({ length: 24 }).map((x, h) => `<option value="${h}" ${String(E.jam_pengingat) === String(h) ? 'selected' : ''}>${pad(h)}.00</option>`).join('')}</select></div>
          <div class="mt12">${sw('email_aktif', 'Email', 'Lewat Gmail akun pemilik skrip (kuota harian Google berlaku)', 'mail')}${sw('wa_aktif', 'WhatsApp', 'Lewat layanan gateway Fonnte atau Wablas', 'wa')}</div></div>
        <div class="card card-p"><h3>Gateway WhatsApp</h3><div class="field mt16"><label class="label">Penyedia</label><div class="seg w100">${['FONNTE', 'WABLAS'].map((v) => `<button type="button" class="${String(E.wa_provider || 'FONNTE') === v ? 'on' : ''}" onclick="setVal('wa_provider','${v}');rerender()">${v === 'FONNTE' ? 'Fonnte' : 'Wablas'}</button>`).join('')}</div></div>
          ${String(E.wa_provider) === 'WABLAS' ? `<div class="mt12">${inp('wa_host', 'Host API Wablas', 'placeholder="https://solo.wablas.com"')}</div>` : ''}
          <div class="field mt12"><label class="label">API key / token</label><input class="input mono" type="password" id="waKey" placeholder="${esc(base.wa_api_key_mask || 'Tempel token dari dashboard penyedia')}" autocomplete="off" oninput="S.c.setKey=this.value;setMark()"><div class="help">Disimpan aman di Script Properties, tidak tampil ke pengguna lain.</div></div>
          <div class="divider"></div><label class="label">Uji kirim</label><div class="flex g8 mt8"><input class="input f1" id="waTest" inputmode="tel" placeholder="08xxxxxxxxxx" value="${esc(me().no_wa || '')}"><button class="btn btn-secondary" onclick="testWA(this)">${I('send')}Kirim Uji</button></div><p class="help mt8">Simpan pengaturan dulu sebelum menguji.</p></div>
        <div class="card card-p"><h3>Wali Kelas & Absensi</h3><div class="mt12">${sw('absensi_harian_aktif', 'Absensi harian wali kelas', 'Selain absensi per pertemuan mapel', 'user-plus')}</div>
          <div class="form-grid c2 mt12">${inp('ambang_alpa', 'Ambang alpa / bulan', 'type="number" min="1"', 'Masuk daftar Perlu Perhatian')}${inp('ambang_tunggakan', 'Ambang tugas tertunggak', 'type="number" min="1"')}</div></div></div>`;
    else if (tab === 'akses') body = `<div class="col g16" style="max-width:860px"><div class="card card-p"><h3>${I('link')} Alamat aplikasi (GitHub Pages)</h3><p class="small tx2 mt8">Alamat yang dibuka siswa dan guru. Dipakai untuk tautan di email & WhatsApp pengingat.</p>
          <div class="mt12">${inp('url_aplikasi', 'Alamat aplikasi', 'placeholder="https://namaanda.github.io/smapatispa-learning/"', 'Salin dari GitHub → Settings → Pages ("Your site is live at …").')}</div></div>
        <div class="card card-p"><h3>${I('g')} Masuk & daftar dengan Google</h3><p class="small tx2 mt8">Opsional. Tanpa ini, pengguna tetap bisa masuk dengan username & kata sandi.</p>
          <ol class="small tx2 mt12" style="padding-left:18px;line-height:1.9"><li>Buka <b>console.cloud.google.com</b> → buat/pilih project → <b>Google Auth Platform</b> (OAuth consent screen): isi nama aplikasi & email dukungan, Audience <b>External</b>, lalu <b>Publish app</b> (In production).</li>
            <li><b>Clients → Create client → Web application</b>. Pada <b>Authorized JavaScript origins</b> isi <span class="mono">https://NAMAANDA.github.io</span> (tanpa nama repo, tanpa garis miring di akhir).</li>
            <li>Salin <b>Client ID</b> lalu tempel di bawah, kemudian Simpan.</li></ol>
          <div class="field mt12"><label class="label">Client ID Google</label><input class="input mono" id="gcid" value="${esc(S.c.setCid !== undefined ? S.c.setCid : (base.google_client_id || ''))}" placeholder="123456789-xxxx.apps.googleusercontent.com" oninput="S.c.setCid=this.value.trim();setMark()"><div class="help">Client ID bersifat publik (bukan rahasia) dan disimpan di Script Properties.</div></div>
          <div class="banner ${(S.c.setCid !== undefined ? S.c.setCid : base.google_client_id) ? 'banner-ok' : 'banner-info'} mt12">${I((S.c.setCid !== undefined ? S.c.setCid : base.google_client_id) ? 'check-c' : 'info')}<div>${(S.c.setCid !== undefined ? S.c.setCid : base.google_client_id) ? 'Login Google aktif. Pendaftar baru masuk antrean persetujuan di Pengguna → Pendaftaran.' : 'Login Google belum aktif.'}</div></div>
          <details class="mt16"><summary class="small bold" style="cursor:pointer">Cara lama: popup deployment kedua Apps Script</summary><div class="mt12">${inp('google_login_url', 'URL deployment Login Google (opsional)', 'placeholder="https://script.google.com/macros/s/.../exec"', 'Dipakai hanya bila Client ID kosong. Deployment kedua: Jalankan sebagai "Pengguna yang mengakses", akses "Siapa saja yang memiliki Akun Google".')}</div></details></div></div>`;
    else {
      const logs = need('logs', 'settings.logs', {}, 30000);
      body = `<div class="split s-r"><div class="card">${logs ? dataTable('logs', logs, [{ h: 'Waktu', k: 'waktu', search: false, r: (l) => `<span class="small mono">${D.dt(num(l.waktu))}</span>` }, { h: 'Pengguna', k: 'nama', r: (l) => `<span class="small bold">${esc(l.nama)}</span>` }, { h: 'Aksi', k: 'aksi', r: (l) => pill(String(l.aksi).replace(/_/g, ' '), /GAGAL|HAPUS|KUNCI/.test(l.aksi) ? 'err' : /LOGIN/.test(l.aksi) ? 'info' : 'neu') }, { h: 'Detail', k: 'detail', r: (l) => `<span class="small tx2">${esc(l.detail || '')}</span>` }], { ph: 'Cari log…', per: 25 }) : `<div class="card-bd">${skel(240)}</div>`}</div>
        <div class="card card-p"><h3>${I('database', 'ink-p')} Cadangan Data</h3><p class="small tx2 mt8">Sistem menyalin ketiga spreadsheet database ke folder <b>Cadangan</b> di Google Drive secara otomatis setiap minggu dan menyimpan 8 salinan terakhir.</p>
          <div class="info-tile mt16"><div class="tile sm ${base.cadangan_terakhir ? 'ok' : 'warn'}">${I('history')}</div><div><div class="xs muted">Cadangan terakhir</div><div class="bold small">${base.cadangan_terakhir ? D.dt(num(base.cadangan_terakhir)) : 'Belum pernah'}</div></div></div>
          <button class="btn btn-primary btn-block mt16" onclick="doBackup(this)">${I('cloud-ok')}Cadangkan Sekarang</button></div></div>`;
    }
    return `<div class="page"><div class="page-hd"><div><h1>Pengaturan</h1><p class="sub">Identitas aplikasi, aturan ujian, pengingat, dan keamanan.</p></div></div>
      <div class="tabs scroll">${SET_TABS.map((t) => `<button class="tab ${tab === t[0] ? 'on' : ''}" onclick="go('a-settings',{tab:'${t[0]}'},{replace:true})">${I(t[2], 'ic-sm')} ${t[1]}</button>`).join('')}</div>
      <div class="mt16" id="setBox">${body}</div>
      ${tab === 'cadangan' ? '' : `<div class="sticky-bar"><span class="small f1" id="setState">${dirty ? `${I('alert', 'ic-sm ink-warn')} Ada perubahan belum disimpan` : `${I('check-c', 'ic-sm ink-ok')} Semua pengaturan tersimpan`}</span><button class="btn btn-ghost" onclick="discardSettings()" ${dirty ? '' : 'disabled'}>Batalkan</button><button class="btn btn-primary" id="setSave" onclick="saveSettings()" ${dirty ? '' : 'disabled'}>${I('check')}Simpan Pengaturan</button></div>`}</div>`;
  },
  mount() {
    const box = $('#setBox'); if (!box) return; const E = S.c.setE;
    $$('[data-s]', box).forEach((el) => { el.addEventListener(el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input', () => { E[el.dataset.s] = el.dataset.bool ? (el.checked ? 'TRUE' : 'FALSE') : el.value; if (el.dataset.s === 'nama_aplikasi') { const n = $('#pvName'); if (n) n.textContent = el.value; } setMark(); }); });
    $$('[data-color]', box).forEach((el) => { el.oninput = () => setColor(el.dataset.color, el.value, true); });
    ROUTES['a-settings'].leave = () => { applyTheme(cfg()); };
  }
});
function setVal(k, v) { S.c.setE[k] = v; setMark(); }
function setMark() {
  const E = S.c.setE, base = E._src, dirty = Object.keys(base).some((k) => String(E[k] === undefined ? '' : E[k]) !== String(base[k] === undefined ? '' : base[k])) || !!S.c.setKey || (S.c.setCid !== undefined && S.c.setCid !== (base.google_client_id || ''));
  const st = $('#setState'); if (st) st.innerHTML = dirty ? `${I('alert', 'ic-sm ink-warn')} Ada perubahan belum disimpan` : `${I('check-c', 'ic-sm ink-ok')} Semua pengaturan tersimpan`;
  const b = $('#setSave'); if (b) { b.disabled = !dirty; b.previousElementSibling.disabled = !dirty; }
}
function setColor(k, v, fromPicker) {
  const E = S.c.setE; E[k] = v.toUpperCase();
  applyTheme(Object.assign({}, cfg(), { warna_primer: E.warna_primer, warna_sekunder: E.warna_sekunder }));   // pratinjau langsung
  const hx = $('#hx_' + k); if (hx) hx.textContent = E[k];
  if (!fromPicker) { const inp = $(`[data-color="${k}"]`); if (inp) inp.value = v; }
  setMark();
}
function discardSettings() { S.c.setE = null; S.c.setKey = ''; S.c.setCid = undefined; applyTheme(cfg()); rerender(); }
function saveSettings() {
  const E = S.c.setE, base = E._src, values = {};
  Object.keys(base).forEach((k) => { if (k === '_src' || k === 'google_client_id' || /^logo_|_url$|_mask$/.test(k) && k !== 'google_login_url') return; if (String(E[k] === undefined ? '' : E[k]) !== String(base[k] === undefined ? '' : base[k])) values[k] = E[k]; });
  if (values.nama_aplikasi !== undefined && !String(values.nama_aplikasi).trim()) { toast('Nama aplikasi tidak boleh kosong.', 'warn'); return; }
  if (values.google_login_url && !/^https:\/\/script\.google\.com\/.+\/exec$/.test(values.google_login_url.trim())) { toast('URL Login Google harus URL Apps Script yang berakhiran /exec.', 'warn'); return; }
  if (values.url_aplikasi && !/^https:\/\/\S+$/.test(values.url_aplikasi.trim())) { toast('Alamat aplikasi harus diawali https://', 'warn'); return; }
  const key = S.c.setKey || undefined, cid = S.c.setCid, oldCfg = B().cfg, oldSet = B().admin.settings;
  if (cid && !/^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$/.test(cid)) { toast('Client ID Google tidak valid. Bentuknya: 123456789-xxxx.apps.googleusercontent.com', 'warn'); return; }
  // Optimistic: terapkan seketika
  const ns = Object.assign({}, oldSet, values, cid !== undefined ? { google_client_id: cid } : {}); B().admin.settings = ns; B().cfg = cfgFromSettings(ns); S.c.setE = null; S.c.setKey = ''; S.c.setCid = undefined;
  applyTheme(B().cfg); renderChrome(); rerender(); toast('Pengaturan disimpan.', 'ok');
  call('settings.save', Object.assign({ values, wa_api_key: key }, cid !== undefined ? { google_client_id: cid } : {}), { silent: true }).then((r) => { B().admin.settings = r.settings; B().cfg = Object.assign({}, B().cfg, r.cfg); applyTheme(B().cfg); saveSnap(); if (S.route === 'a-settings') { S.c.setE = null; rerender(); } })
    .catch((e) => { B().admin.settings = oldSet; B().cfg = oldCfg; applyTheme(oldCfg); renderChrome(); S.c.setE = null; rerender(); toast('Pengaturan gagal disimpan: ' + e.message, 'err', 8000); });
}
function resetTheme() {
  confirmBox('Kembalikan logo dan warna ke tampilan bawaan SMAPATISPA LEARNING?', { yes: 'Kembalikan', icon: 'refresh' }).then((ok) => {
    if (!ok) return;
    call('settings.resetTheme', {}).then((r) => { B().admin.settings = r.settings; B().cfg = Object.assign({}, B().cfg, r.cfg); S.c.setE = null; applyTheme(B().cfg); renderChrome(); saveSnap(); rerender(); toast('Tampilan bawaan dipulihkan.', 'ok'); }).catch(failToast);
  });
}
function testWA(btn) {
  const no = $('#waTest').value.trim(); if (!no) { toast('Isi nomor tujuan.', 'warn'); return; }
  btnBusy(btn, true, 'Mengirim…');
  call('settings.testWA', { no }).then(() => { btnBusy(btn, false); toast('Pesan uji terkirim ke ' + no + '. Periksa WhatsApp.', 'ok', 6000); }).catch((e) => { btnBusy(btn, false); failToast(e); });
}
/** Potong logo persegi di perangkat (geser + perbesar), lalu buat 512/192/64 px. */
function openLogoCrop(file) {
  if (!file) return;
  if (!/^image[/]/.test(file.type)) { toast('Pilih berkas gambar (PNG/JPG/WebP).', 'warn'); return; }
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => {
    const BOX = 240, s0 = Math.max(BOX / img.width, BOX / img.height), P = { z: 1, x: 0, y: 0 };
    const sc = () => s0 * P.z;
    P.x = (BOX - img.width * s0) / 2; P.y = (BOX - img.height * s0) / 2;
    const out = (N) => { const cv = document.createElement('canvas'); cv.width = cv.height = N; const cx = cv.getContext('2d'); cx.imageSmoothingQuality = 'high'; const s = sc(); cx.drawImage(img, -P.x / s, -P.y / s, BOX / s, BOX / s, 0, 0, N, N); return cv; };
    sheet({ title: 'Atur Potongan Logo', icon: 'image', onClose: () => URL.revokeObjectURL(url), body: `<p class="small muted tc">Geser gambar untuk memposisikan. Gunakan penggeser untuk memperbesar.</p>
        <div class="crop-box mt12" id="cropBox"><img id="cropImg" src="${url}" alt="" draggable="false"></div>
        <div class="flex items-c g8 mt16" style="max-width:280px;margin:16px auto 0">${I('minus', 'muted')}<input type="range" id="cropZ" min="1" max="4" step="0.01" value="1" class="f1" aria-label="Perbesar">${I('plus', 'muted')}</div>
        <div class="flex jc-c items-e g16 mt16" id="cropPrev"></div>`,
      foot: `<button class="btn btn-secondary" data-x2>Batal</button><button class="btn btn-primary" id="cropOk">${I('check')}Gunakan Logo</button>`,
      mount: (el, close) => {
        el.querySelector('[data-x2]').onclick = close;
        const im = $('#cropImg', el), box = $('#cropBox', el), prev = $('#cropPrev', el);
        let raf = 0;
        const clampP = () => { const w = img.width * sc(), h = img.height * sc(); P.x = clamp(P.x, BOX - w, 0); P.y = clamp(P.y, BOX - h, 0); };
        const draw = () => {
          clampP(); im.style.width = img.width * sc() + 'px'; im.style.height = img.height * sc() + 'px'; im.style.left = P.x + 'px'; im.style.top = P.y + 'px';
          cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { prev.innerHTML = ''; [[72, 'Login'], [40, 'Menu'], [24, 'Tab']].forEach((x) => { const cv = out(x[0] * 2); cv.style.cssText = `width:${x[0]}px;height:${x[0]}px;border-radius:${x[0] / 4}px;border:1px solid var(--border);background:var(--subtle)`; const w = document.createElement('div'); w.className = 'tc'; w.appendChild(cv); w.insertAdjacentHTML('beforeend', `<div class="xs muted mt4">${x[1]}</div>`); prev.appendChild(w); }); });
        };
        draw();
        $('#cropZ', el).oninput = (e) => { const s1 = sc(), c0 = BOX / 2; P.z = +e.target.value; const s2 = sc(); P.x = c0 - (c0 - P.x) * (s2 / s1); P.y = c0 - (c0 - P.y) * (s2 / s1); draw(); };
        let drag = null;
        box.onpointerdown = (e) => { drag = { x: e.clientX, y: e.clientY, px: P.x, py: P.y }; box.setPointerCapture(e.pointerId); };
        box.onpointermove = (e) => { if (!drag) return; P.x = drag.px + e.clientX - drag.x; P.y = drag.py + e.clientY - drag.y; draw(); };
        box.onpointerup = box.onpointercancel = () => { drag = null; };
        box.onwheel = (e) => { e.preventDefault(); const z = $('#cropZ', el); z.value = clamp(+z.value - e.deltaY * 0.002, 1, 4); z.oninput({ target: z }); };
        $('#cropOk', el).onclick = () => {
          const b64 = (N) => out(N).toDataURL('image/png').split(',')[1], full = b64(512), thumb = b64(192), icon = b64(64);
          const oldCfg = B().cfg; B().cfg = Object.assign({}, cfg(), { logo: 'data:image/png;base64,' + thumb, logo_full: 'data:image/png;base64,' + full });   // tampil seketika
          close(); renderChrome(); rerender(); toast('Logo sedang diunggah…', 'info');
          call('settings.logo', { full, thumb, icon }, { silent: true, retries: 2 }).then((r) => { B().admin.settings = r.settings; B().cfg = Object.assign({}, B().cfg, r.cfg, { logo: B().cfg.logo, logo_full: B().cfg.logo_full }); S.c.setE = null; saveSnapLogo(r.cfg); toast('Logo baru tersimpan.', 'ok'); })
            .catch((e) => { B().cfg = oldCfg; renderChrome(); rerender(); failToast(e); });
        };
      } });
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('Gambar tidak dapat dibaca.', 'err'); };
  img.src = url;
}
/** Snapshot perangkat memakai URL Drive (bukan data base64 besar). */
function saveSnapLogo(rc) { const c = B().cfg, keep = { logo: c.logo, logo_full: c.logo_full }; c.logo = rc.logo; c.logo_full = rc.logo_full; saveSnap(); setTimeout(() => { if (B().cfg === c) Object.assign(c, keep); }, 800); }
(window.__SP_F__ = window.__SP_F__ || {}).admin = 1;
