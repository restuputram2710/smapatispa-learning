'use strict';
// ════════════════════════════════════════════════════════
// BAGIAN 12: HALAMAN SISWA
// ════════════════════════════════════════════════════════
function tugasState(t) {
  const late = now() > t.tenggat;
  if (t.my && t.my.nilai !== null && t.my.nilai !== undefined) return { k: 'DINILAI', l: 'Dinilai: ' + fmtN(t.my.nilai), c: 'ok', bar: 'b-ok' };
  if (t.my) return { k: 'KUMPUL', l: t.my.terlambat ? 'Terkumpul (terlambat)' : 'Terkumpul', c: t.my.terlambat ? 'warn' : 'info', bar: 'b-neu' };
  if (late) return { k: 'TELAT', l: 'Terlambat', c: 'err-s', bar: 'b-err' };
  return { k: 'BELUM', l: 'Belum', c: 'warn', bar: 'b-warn' };
}
function taskCard(t) {
  const st = tugasState(t), late = st.k === 'TELAT';
  return `<div class="card task ${st.bar} hoverable" onclick="go('s-tugas-d',{id:'${t.tugas_id}'})" style="flex-direction:column;padding:0">
    <div class="flex g12" style="padding:16px 16px 12px">${mapelIcon(t.mapel_id)}<div class="f1" style="min-width:0"><div class="tt clamp2">${esc(t.judul)}</div><div class="small muted mt4 truncate">${esc(mapelNm(t.mapel_id))} · ${esc(t.guru || '')}</div></div></div>
    <div class="task-ft"><span class="flex items-c g6 ${late ? 'ink-err' : ''}">${I(late ? 'alert-c' : 'clock', 'ic-sm')}${D.rel(t.tenggat)}</span>${pill(st.l, st.c)}</div></div>`;
}
function examCard(u) {
  const st = ulStatus(u), my = u.my;
  const done = my && (my.status === 'SELESAI' || my.status === 'TERKUNCI');
  const btn = done ? (u.show && my.nilai !== null && my.nilai !== undefined ? `<div class="tc"><div class="xs muted">Nilai</div><div class="b7" style="font-family:var(--f-head);font-size:24px">${fmtN(my.nilai)}</div></div>` : pill(my.status === 'TERKUNCI' ? 'Terkunci' : 'Selesai', my.status === 'TERKUNCI' ? 'dark' : 'ok', 'check'))
    : st.k === 'AKTIF' ? `<button class="btn btn-primary" onclick="event.stopPropagation();startExamFlow('${u.ulangan_id}')">${my && my.status === 'MENGERJAKAN' ? 'Lanjutkan' : 'Kerjakan Sekarang'}${I('arrow-r')}</button>`
      : st.k === 'JADWAL' ? `<button class="btn btn-secondary" disabled>Belum dibuka</button>` : pill('Ditutup', 'neu');
  return `<div class="card exam-card"><div class="flex items-c g8 wrap"><span class="pill pill-p mono">${esc(JENIS_UL[u.jenis] || u.jenis)} CBT</span><span class="small tx2 truncate f1">${esc(mapelNm(u.mapel_id))}</span>
    ${st.k === 'AKTIF' && !done ? pill(D.day0(u.tutup) === D.day0(now()) ? 'Hari ini' : 's/d ' + D.dd(u.tutup), 'err', 'timer') : st.k === 'JADWAL' ? pill(D.dd(u.buka), 'info', 'calendar') : ''}</div>
    <h3 class="mt12" style="font-size:17px;position:relative">${esc(u.judul)}</h3><p class="small muted mt4">${plural(u.jumlah_soal, 'Soal')} · Alokasi ${u.durasi_menit} menit${st.k === 'JADWAL' ? ' · dibuka ' + D.rel(u.buka) : st.k === 'AKTIF' ? ' · ditutup ' + D.rel(u.tutup) : ''}</p>
    <div class="flex items-c jc-b g12 mt16" style="position:relative;z-index:1"><span class="small flex items-c g6 muted">${I(u.pakai_token ? 'lock' : 'unlock', 'ic-sm')}${u.pakai_token ? 'Perlu token dari pengawas' : 'Tanpa token'}</span>${btn}</div></div>`;
}
function agendaCard(a, wide) {
  const target = a.target_tipe === 'SEMUA' ? 'Semua warga sekolah' : a.target_tipe === 'GURU' ? 'Semua guru' : (a.target_kelas_ids || []).map(kelasShort).join(', ');
  const soon = a.mulai - now() < 864e5 && a.mulai > now();
  return `<div class="card hoverable" style="padding:14px;${wide ? '' : 'width:300px'}" onclick="openAgendaDetail('${a.agenda_id}')"><div class="flex g12 items-c"><div class="date-blk ${soon ? 'err' : ''}"><b>${pad(new Date(a.mulai).getDate())}</b><span>${BLN[new Date(a.mulai).getMonth()].toUpperCase()}</span></div>
    <div class="f1" style="min-width:0"><span class="pill ${a.target_tipe === 'KELAS' ? 'pill-sky' : a.target_tipe === 'GURU' ? 'pill-neu' : 'pill-info'} mono" style="height:20px;font-size:11px">${esc(target)}</span><div class="bold mt4 truncate">${esc(a.judul)}</div>
    <div class="small muted flex items-c g4">${I('clock', 'ic-sm')}${D.t(a.mulai)} – ${D.t(a.selesai)} ${TZL}${a.lokasi ? ' · ' + esc(a.lokasi) : ''}</div></div></div></div>`;
}
function openAgendaDetail(id) {
  const a = (B().agenda || []).find((x) => x.agenda_id === id); if (!a) return;
  const can = hasRole('ADMIN') || a.dibuat_oleh === me().user_id;
  sheet({ title: esc(a.judul), icon: 'calendar', body: `<div class="col g12"><div class="flex g8 items-c">${I('clock', 'ic-sm muted')}<span>${D.dt(a.mulai)} – ${D.t(a.selesai)} ${TZL}</span></div>${a.lokasi ? `<div class="flex g8 items-c">${I('pin', 'ic-sm muted')}<span>${esc(a.lokasi)}</span></div>` : ''}
    <div class="flex g8 items-c">${I('users', 'ic-sm muted')}<span>${a.target_tipe === 'SEMUA' ? 'Semua warga sekolah' : a.target_tipe === 'GURU' ? 'Semua guru' : 'Kelas ' + (a.target_kelas_ids || []).map(kelasNm).join(', ')}</span></div>
    ${a.deskripsi ? `<div class="divider" style="margin:4px 0"></div><p class="pre">${esc(a.deskripsi)}</p>` : ''}${a.lampiran_file_id ? `<button class="file-chip" onclick="previewPublic('Lampiran agenda','${a.lampiran_file_id}')"><div class="tile">${I('clip')}</div><span class="bold">Lihat lampiran</span></button>` : ''}
    <p class="xs muted">Dibuat oleh ${esc(a.pembuat || '-')}</p></div>`, foot: can ? `<button class="btn btn-danger-o" onclick="deleteAgenda('${a.agenda_id}')">${I('trash')}Hapus</button><button class="btn btn-primary" onclick="closeAllSheets();openAgendaForm('${a.agenda_id}')">${I('edit')}Ubah</button>` : '' });
}

route('s-home', {
  title: 'Beranda', roles: ['SISWA'], bare: true,
  mount() { fxMount(); }, leave() { fxStop(); },
  render() {
    const u = me(), sw = SW(), t = now();
    const belum = sw.tugas.filter((x) => !x.my).sort(by('tenggat'));
    const aktif = sw.ulangan.filter((x) => ulStatus(x).k === 'AKTIF' && (!x.my || x.my.status === 'MENGERJAKAN'));
    const soon = sw.ulangan.filter((x) => ulStatus(x).k === 'JADWAL' && x.buka - t < 3 * 864e5);
    const mapels = uniqPen(sw.penugasan);
    const agenda = (B().agenda || []).filter((a) => a.selesai >= t).slice(0, 8);
    const pendingByMapel = {}; belum.forEach((x) => { pendingByMapel[x.mapel_id] = (pendingByMapel[x.mapel_id] || 0) + 1; });
    const desk = window.innerWidth >= 1024;
    const ta = B().ta, fx = fxOn();
    let k = 0; const sec = (html) => html ? `<section class="fx" style="--i:${k++}">${html}</section>` : '';
    return `<div class="s-home${fx} ${desk ? 'page' : ''}" style="${desk ? '' : 'padding:0'}">
      <div class="s-hero grad grad-pattern" style="${desk ? 'border-radius:24px' : ''}"><span class="hero-orb o1"></span><span class="hero-orb o2"></span><span class="hero-orb o3"></span>
        <div class="top">${logoHTML('sm')}<b style="font-family:var(--f-head);font-size:16px" class="f1 truncate">${esc(shortName(cfg().nama_aplikasi).split(' ')[0])}</b>
          <button class="round" onclick="openNotif()" aria-label="Notifikasi">${I('bell')}${unreadCount() ? `<span class="badge">${unreadCount()}</span>` : ''}</button>
          <button onclick="go('akun')" style="border-radius:50%;border:2px solid rgba(255,255,255,.6)">${avatar(u.nama, u.foto)}</button></div>
        <div class="hero-in"><div class="greet">${D.greet()},</div><h1>Halo, ${esc(u.nama)} <span class="wave">${I('sparkles')}</span></h1>
        <div class="meta">${I('door', 'ic-sm')}Kelas ${esc(kelasNm(u.kelas_id))}${(u.kelas_x || []).length ? ' · ' + esc(u.kelas_x.map(kelasNm).join(', ')) : ''}${ta ? ' · Semester ' + esc(ta.semester) + ' ' + esc(ta.nama) : ''}</div>
        <label class="s-search">${I('search')}<input placeholder="Cari materi, tugas, atau ujian…" oninput="homeSearch(this.value)" id="homeQ"></label></div>
      </div>
      <div class="s-stats" style="${desk ? 'margin-left:24px;margin-right:24px' : ''}">
        <button class="card fx tilt" style="--i:0;text-align:left" onclick="go('s-tugas')"><div><div class="small tx2">Tugas Belum</div><div class="flex items-e g6 mt4"><span class="big" data-count="${belum.length}">${belum.length}</span><span class="small bold ink-err">${belum.length ? 'Perlu Aksi' : 'Aman'}</span></div></div><div class="tile warn">${I('clipboard')}</div></button>
        <button class="card fx tilt" style="--i:1;text-align:left" onclick="go('s-ujian')"><div><div class="small tx2">Ujian Aktif</div><div class="flex items-e g6 mt4"><span class="big ink-p" data-count="${aktif.length}">${aktif.length}</span><span class="small bold ink-p">Tersedia</span></div></div><div class="tile">${I('exam')}</div></button>
      </div>
      <div id="homeResults"></div>
      <div style="padding:0 16px 8px;${desk ? 'padding:0' : ''}" id="homeMain">
        ${resumeBanner()}
        ${sec(homeSorotan(sw, belum, aktif, soon, agenda))}
        ${sec(`<div class="qa-row hscroll">${[['clipboard', 'Tugas', belum.length, "go('s-tugas')", 'q-warn'], ['exam', 'Ujian', aktif.length, "go('s-ujian')", 'q-p'], ['book', 'Mapel', 0, "go('s-mapel')", 'q-vio'], ['star', 'Nilai', 0, "go('s-nilai')", 'q-ok'], ['clock', 'Jadwal', 0, "go('jadwal')", 'q-sky'], ['calendar', 'Agenda', 0, "go('agenda')", 'q-pink']]
          .map((q) => `<button class="qa ${q[4]}" onclick="${q[3]}"><span class="qa-ic">${I(q[0])}</span><span>${q[1]}</span>${q[2] ? `<b class="qa-n">${q[2]}</b>` : ''}</button>`).join('')}</div>`)}
        ${sec(homeNilai(sw))}
        ${sec(jadwalStrip('siswa'))}
        ${sec(`<div class="sect-title"><h2>Belum Dikerjakan</h2><a class="ml-a" href="javascript:void(0)" onclick="go('s-tugas')">Lihat Semua ${I('chev-r', 'ic-sm')}</a></div>
        <div class="grid ${desk ? 'gc2' : ''}">${aktif.map(examCard).join('')}${belum.slice(0, desk ? 6 : 4).map(taskCard).join('')}
          ${!aktif.length && !belum.length ? `<div class="card">${emptyState('check-c', 'Semua tugas sudah selesai', 'Tidak ada tugas atau ujian yang menunggu. Pertahankan!')}</div>` : ''}</div>`)}
        ${soon.length ? sec(`<div class="sect-title"><h2>Ujian Akan Datang</h2></div><div class="grid ${desk ? 'gc2' : ''}">${soon.map(examCard).join('')}</div>`) : ''}
        ${sec(`<div class="sect-title"><h2>Mata Pelajaran</h2><a class="ml-a" href="javascript:void(0)" onclick="go('s-mapel')">${esc(kelasNm(u.kelas_id))} ${I('chev-r', 'ic-sm')}</a></div>
        <div class="mp-row">${mapels.map((p) => { const n = pendingByMapel[p.mapel_id] || 0, nm = sw.materi.filter((m) => m.mapel_id === p.mapel_id).length;
          return `<button class="mp-card tilt mp${hashN(p.mapel_id) % 6}" onclick="go('s-mapel-d',{mapel_id:'${p.mapel_id}'})"><span class="mp-blob"></span><span class="mp-ic">${I(mapelBy(p.mapel_id).ikon || 'book')}</span><span class="mp-nm">${esc(mapelNm(p.mapel_id))}</span><span class="mp-gr">${esc(p.guru || '-')}</span><span class="mp-ft"><span class="mp-pill">${n ? n + ' tugas' : nm + ' materi'}</span>${I('arrow-r', 'ic-sm')}</span></button>`; }).join('') || `<div class="muted small">Belum ada mapel.</div>`}</div>`)}
        ${sec(`<div class="sect-title"><h2>Agenda Terdekat</h2><a class="ml-a" href="javascript:void(0)" onclick="go('agenda')">${I('calendar')}</a></div>
        ${agenda.length ? `<div class="hscroll">${agenda.map((a) => agendaCard(a)).join('')}</div>` : `<div class="card">${emptyState('calendar', 'Belum ada agenda', 'Agenda sekolah untuk kelasmu akan tampil di sini.')}</div>`}`)}
        <div style="height:24px"></div>
      </div></div>`;
  }
});
/** Nilai ulangan siswa di beranda: rata-rata, tertinggi, tren, dan daftar ulangan terbaru — penyemangat belajar. */
function homeNilai(sw) {
  const kkm = myKkm();
  const done = sw.ulangan.filter((u) => u.my && (u.my.status === 'SELESAI' || u.my.status === 'TERKUNCI')).sort((a, b) => (num(b.my.selesai) || b.buka) - (num(a.my.selesai) || a.buka));
  if (!done.length) return '';
  const graded = done.filter((u) => u.my.nilai !== null && u.my.nilai !== undefined && u.my.status_nilai !== 'MENUNGGU_KOREKSI');
  const vals = graded.map((u) => num(u.my.nilai)), avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  const best = graded.slice().sort((a, b) => num(b.my.nilai) - num(a.my.nilai))[0], tuntas = vals.filter((v) => v >= kkm).length;
  const tr = vals.length >= 2 ? vals[0] - vals[1] : null;
  const msg = avg === null ? 'Nilaimu sedang dikoreksi guru. Tunggu ya!'
    : avg >= 90 ? 'Luar biasa! Kamu di jalur juara — pertahankan!' : tr !== null && tr > 0 ? `Mantap! Nilai terbarumu naik ${fmtN(tr)} poin. Terus semangat!`
    : avg >= kkm ? `Kamu sudah tuntas KKM ${kkm}. Ayo raih nilai yang lebih tinggi!` : `Semangat! Rata-ratamu ${fmtN(kkm - avg)} poin lagi menuju KKM ${kkm}. Kamu pasti bisa!`;
  const col = avg === null ? 'var(--tx3)' : avg >= kkm ? '#16A34A' : '#D97706', C = 2 * Math.PI * 42, f = avg === null ? 0 : Math.max(0, Math.min(1, avg / 100));
  const row = (u) => { const m = u.my, n = m.nilai, wait = m.status_nilai === 'MENUNGGU_KOREKSI', hid = n === null || n === undefined;
    return `<button class="nl-row" onclick="go('s-nilai')"><span class="nl-mp mp${hashN(u.mapel_id) % 6}">${I(mapelBy(u.mapel_id).ikon || 'book', 'ic-sm')}</span><span class="f1" style="min-width:0"><span class="nl-t truncate">${esc(u.judul)}</span><span class="nl-s">${esc(mapelNm(u.mapel_id))} · ${esc(JENIS_UL[u.jenis] || u.jenis)}</span>
      ${!hid && !wait ? `<span class="nl-bar"><i style="width:${Math.max(0, Math.min(100, n))}%;background:${n >= kkm ? 'var(--ok)' : 'var(--warn)'}"></i></span>` : ''}</span>
      ${wait ? '<span class="pill pill-vio">Dikoreksi</span>' : hid ? '<span class="xs muted">Belum diumumkan</span>' : `<b class="nl-v ${n >= kkm ? 'ok' : 'low'}" ${Number.isInteger(n) ? `data-count="${n}"` : ''}>${fmtN(n)}</b>`}</button>`; };
  return `<div class="sect-title"><h2>Nilai Ulanganmu</h2><a class="ml-a" href="javascript:void(0)" onclick="go('s-nilai')">Semua Nilai ${I('chev-r', 'ic-sm')}</a></div>
    <div class="card nl-card"><div class="nl-hd"><div class="nl-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" stroke-width="9"/>${f > 0 ? `<circle class="nl-arc" cx="50" cy="50" r="42" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C * f} ${C}" transform="rotate(-90 50 50)"/>` : ''}</svg><div class="nl-avg"><b ${avg !== null ? `data-count="${Math.round(avg)}"` : ''}>${avg === null ? '–' : fmtN(Math.round(avg))}</b><span>rata-rata</span></div></div>
      <div class="f1" style="min-width:0"><div class="nl-msg">${I(avg !== null && avg >= kkm ? 'star' : 'sparkles', 'ic-sm')}<span>${esc(msg)}</span></div>
        <div class="nl-chips">${best ? `<span class="nl-chip">${I('trending', 'ic-sm')}Tertinggi <b>${fmtN(best.my.nilai)}</b> ${esc(mapelNm(best.mapel_id))}</span>` : ''}${vals.length ? `<span class="nl-chip">${I('check-c', 'ic-sm')}Tuntas <b>${tuntas}/${vals.length}</b></span>` : ''}${tr !== null ? `<span class="nl-chip ${tr >= 0 ? 'up' : 'down'}">${I(tr >= 0 ? 'chev-u' : 'chev-d', 'ic-sm')}${tr >= 0 ? 'Naik' : 'Turun'} <b>${fmtN(Math.abs(tr))}</b></span>` : ''}</div></div></div>
      <div class="nl-list">${done.slice(0, 5).map(row).join('')}</div></div>`;
}
/** Sorotan beranda siswa: ujian berlangsung, tenggat terdekat, ujian segera, nilai terbaru, agenda — bergeser otomatis. */
function homeSorotan(sw, belum, aktif, soon, agenda) {
  const t = now(), out = [];
  const sl = (tone, ic, over, title, sub, cta, act) => `<div class="hl ${tone}" onclick="${act}" role="button" tabindex="0" onkeydown="if(event.key==='Enter')this.click()"><div class="hl-txt"><span class="hl-over">${over}</span><h3 class="clamp2">${esc(title)}</h3><p class="truncate">${esc(sub)}</p><span class="hl-cta">${cta}${I('arrow-r', 'ic-sm')}</span></div>
    <div class="hl-art" aria-hidden="true"><span class="hl-c c1"></span><span class="hl-c c2"></span><div class="hl-ic">${I(ic)}</div><span class="hl-sp s1"></span><span class="hl-sp s2"></span><span class="hl-sp s3"></span></div></div>`;
  aktif.slice(0, 2).forEach((u) => out.push(sl('hl-1', 'exam', 'Ujian berlangsung', u.judul, mapelNm(u.mapel_id) + ' · ditutup ' + D.rel(u.tutup), u.my && u.my.status === 'MENGERJAKAN' ? 'Lanjutkan' : 'Kerjakan', `event.stopPropagation();startExamFlow('${u.ulangan_id}')`)));
  if (belum[0]) { const x = belum[0]; out.push(sl('hl-3', 'clipboard', t > x.tenggat ? 'Terlambat' : 'Tenggat terdekat', x.judul, mapelNm(x.mapel_id) + ' · ' + D.rel(x.tenggat), 'Kerjakan', `go('s-tugas-d',{id:'${x.tugas_id}'})`)); }
  if (soon[0]) { const x = soon[0]; out.push(sl('hl-2', 'calendar', 'Ujian segera', x.judul, mapelNm(x.mapel_id) + ' · dibuka ' + D.rel(x.buka), 'Lihat', "go('s-ujian')")); }
  const dn = sw.tugas.filter((x) => x.my && x.my.nilai !== null && x.my.nilai !== undefined && x.my.nilai !== '').sort(by('tenggat', -1))[0];
  if (dn) out.push(sl('hl-5', 'star', 'Nilai terbaru', dn.judul, 'Nilai ' + fmtN(dn.my.nilai) + ' · ' + mapelNm(dn.mapel_id), 'Lihat Nilai', "go('s-nilai')"));
  if (agenda[0]) { const a = agenda[0]; out.push(sl('hl-4', 'megaphone', 'Agenda sekolah', a.judul, D.dt(a.mulai) + (a.lokasi ? ' · ' + a.lokasi : ''), 'Detail', `openAgendaDetail('${a.agenda_id}')`)); }
  if (!aktif.length && !belum.length) out.unshift(sl('hl-5', 'sparkles', 'Semangat belajar', 'Semua tugas sudah beres!', 'Cek materi terbaru dari gurumu.', 'Lihat Mapel', "go('s-mapel')"));
  const sls = out.slice(0, 5);
  return `<div class="carousel" data-key="s-home"><div class="car-track">${sls.join('')}</div>${sls.length > 1 ? `<div class="car-dots" role="tablist">${sls.map((x, i) => `<button type="button" aria-label="Sorotan ${i + 1}"><i></i></button>`).join('')}</div>` : ''}</div>`;
}
const shortGuru = (n) => String(n || '').replace(/^(Drs?\.?|Dr\.?|H\.)\s{0,}/g, '').replace(/,.*$/, '').split(' ').slice(0, 2).join(' ');
function uniqPen(pens) { const s = {}; return (pens || []).filter((p) => { if (s[p.mapel_id]) return false; s[p.mapel_id] = 1; return true; }); }
function homeSearch(q) {
  q = q.trim().toLowerCase(); const box = $('#homeResults'), main = $('#homeMain');
  if (q.length < 2) { box.innerHTML = ''; main.hidden = false; return; }
  const sw = SW(), m = (s) => String(s || '').toLowerCase().indexOf(q) >= 0;
  const t = sw.tugas.filter((x) => m(x.judul) || m(mapelNm(x.mapel_id))), mt = sw.materi.filter((x) => m(x.judul) || m(mapelNm(x.mapel_id))), u = sw.ulangan.filter((x) => m(x.judul));
  main.hidden = true;
  box.innerHTML = `<div style="padding:16px">${t.length + mt.length + u.length ? '' : `<div class="card">${emptyState('search', 'Tidak ditemukan', 'Coba kata kunci lain.')}</div>`}
    ${u.length ? `<div class="sect-title"><h2>Ujian</h2></div><div class="grid">${u.map(examCard).join('')}</div>` : ''}
    ${t.length ? `<div class="sect-title"><h2>Tugas</h2></div><div class="grid">${t.map(taskCard).join('')}</div>` : ''}
    ${mt.length ? `<div class="sect-title"><h2>Materi</h2></div><div class="card">${mt.map(materiRow).join('')}</div>` : ''}</div>`;
}
function materiRow(m) {
  const ic = m.tipe === 'VIDEO' ? 'video' : m.tipe === 'LINK' ? 'link' : 'file-text';
  return `<div class="row-item click" onclick="openMateri('${m.materi_id}')"><div class="tile sm ${m.tipe === 'VIDEO' ? 'err' : m.tipe === 'LINK' ? 'sky' : ''}">${I(ic)}</div><div class="f1" style="min-width:0"><div class="bold clamp2">${esc(m.judul)}</div><div class="small muted">${esc(mapelNm(m.mapel_id))} · ${m.tipe === 'VIDEO' ? 'Video' : m.tipe === 'LINK' ? 'Tautan' : 'Berkas'} · ${D.d(m.dibuat_pada)}</div></div>${I('chev-r', 'muted')}</div>`;
}
function openMateri(id) {
  const m = SW().materi.concat(G().materi || []).find((x) => x.materi_id === id); if (!m) return;
  if (m.deskripsi && m.tipe === 'LINK') { sheet({ title: esc(m.judul), icon: 'link', body: `<p class="pre tx2">${esc(m.deskripsi)}</p><a class="file-chip mt16" href="${esc(m.url)}" target="_blank" rel="noopener"><div class="tile sky">${I('external')}</div><div class="f1 truncate bold">${esc(m.url)}</div></a>` }); return; }
  previewPublic(m.judul, m.tipe === 'FILE' ? m.file_id : '', m.tipe, m.url);
}
function resumeBanner() {
  const a = LS.get('sp_ex_active', null);
  if (!a || a.u !== me().user_id) return '';
  const ul = SW().ulangan.find((x) => x.ulangan_id === a.ulangan_id);
  if (!ul || (ul.my && (ul.my.status === 'SELESAI'))) return '';
  return `<div class="banner banner-warn mt16">${I('timer')}<div class="f1"><b>Ujian belum selesai:</b> ${esc(ul.judul)}. Jawabanmu aman tersimpan di perangkat.</div><button class="btn btn-sm btn-primary" onclick="startExamFlow('${ul.ulangan_id}')">Lanjutkan</button></div>`;
}

route('s-mapel', {
  title: 'Mata Pelajaran', roles: ['SISWA'],
  render() {
    const sw = SW(), q = (S.c.mapelQ || '').toLowerCase();
    const pend = {}; sw.tugas.filter((t) => !t.my).forEach((t) => { pend[t.mapel_id] = (pend[t.mapel_id] || 0) + 1; });
    const list = uniqPen(sw.penugasan).filter((p) => !q || mapelNm(p.mapel_id).toLowerCase().indexOf(q) >= 0);
    return `<div class="page"><div class="page-hd"><div><h1>Mata Pelajaran</h1><p class="sub">Kelas ${esc(kelasNm(me().kelas_id))} · ${list.length} mapel</p></div></div>
      <div class="input-ic mb16">${I('search')}<input class="input" placeholder="Cari mata pelajaran" value="${esc(S.c.mapelQ || '')}" oninput="S.c.mapelQ=this.value;rerenderKeepFocus()"></div>
      <div class="grid gc3">${list.map((p) => { const nT = sw.tugas.filter((t) => t.mapel_id === p.mapel_id).length, nM = sw.materi.filter((m) => m.mapel_id === p.mapel_id).length;
        return `<button class="card hoverable card-p flex items-c g16" style="text-align:left" onclick="go('s-mapel-d',{mapel_id:'${p.mapel_id}'})">${mapelIcon(p.mapel_id, 'lg')}<div class="f1" style="min-width:0"><h3>${esc(mapelNm(p.mapel_id))}</h3><div class="small muted truncate">${esc(p.guru)}</div><div class="small tx2 mt4">${nM} materi · ${nT} tugas</div></div>${pend[p.mapel_id] ? `<span class="badge">${pend[p.mapel_id]}</span>` : I('chev-r', 'muted')}</button>`; }).join('') || emptyState('book', 'Belum ada mapel', '')}</div></div>`;
  }
});

route('s-mapel-d', {
  title: (p) => mapelNm(p.mapel_id), roles: ['SISWA'], back: 's-mapel', nav: 's-mapel',
  render(p) {
    const sw = SW(), tab = p.tab || 'materi', pen = sw.penugasan.find((x) => x.mapel_id === p.mapel_id) || {};
    const mt = sw.materi.filter((x) => x.mapel_id === p.mapel_id).sort(by('dibuat_pada', -1));
    const tg = sw.tugas.filter((x) => x.mapel_id === p.mapel_id).sort(by('tenggat', -1));
    const ul = sw.ulangan.filter((x) => x.mapel_id === p.mapel_id).sort(by('buka', -1));
    const tabs = [['materi', 'Materi', mt.length], ['tugas', 'Tugas', tg.length], ['ujian', 'Ujian', ul.length]];
    return `<div class="page"><div class="card card-p flex items-c g16" style="background:var(--p50);border-color:var(--p100)">${mapelIcon(p.mapel_id, 'lg')}<div class="f1"><h1 style="font-size:22px">${esc(mapelNm(p.mapel_id))}</h1><p class="tx2">${esc(pen.guru || '')}</p></div></div>
      <div class="tabs mt16">${tabs.map((t) => `<button class="tab ${tab === t[0] ? 'on' : ''}" onclick="go('s-mapel-d',{mapel_id:'${p.mapel_id}',tab:'${t[0]}'},{replace:true})">${t[1]} <span class="badge neu">${t[2]}</span></button>`).join('')}</div>
      <div class="mt16">${tab === 'materi' ? (mt.length ? `<div class="card">${mt.map(materiRow).join('')}</div>` : `<div class="card">${emptyState('book', 'Belum ada materi', 'Materi dari guru akan muncul di sini.')}</div>`)
        : tab === 'tugas' ? (tg.length ? `<div class="grid gc2">${tg.map(taskCard).join('')}</div>` : `<div class="card">${emptyState('clipboard', 'Belum ada tugas', '')}</div>`)
          : (ul.length ? `<div class="grid gc2">${ul.map(examCard).join('')}</div>` : `<div class="card">${emptyState('exam', 'Belum ada ujian', '')}</div>`)}</div></div>`;
  }
});

route('s-tugas', {
  title: 'Tugas', roles: ['SISWA'],
  render(p) {
    const sw = SW(), tab = p.tab || 'belum';
    const groups = { belum: sw.tugas.filter((t) => !t.my).sort(by('tenggat')), kumpul: sw.tugas.filter((t) => t.my && (t.my.nilai === null || t.my.nilai === undefined)).sort(by((t) => t.my.waktu_kumpul, -1)), nilai: sw.tugas.filter((t) => t.my && t.my.nilai !== null && t.my.nilai !== undefined).sort(by('tenggat', -1)) };
    const list = groups[tab];
    return `<div class="page"><div class="page-hd"><div><h1>Tugas</h1><p class="sub">${groups.belum.length} belum dikerjakan · ${groups.belum.filter((t) => now() > t.tenggat).length} terlambat</p></div></div>
      <div class="tabs">${[['belum', 'Belum'], ['kumpul', 'Terkumpul'], ['nilai', 'Dinilai']].map((t) => `<button class="tab ${tab === t[0] ? 'on' : ''}" onclick="go('s-tugas',{tab:'${t[0]}'},{replace:true})">${t[1]} <span class="badge ${t[0] === 'belum' && groups.belum.length ? '' : 'neu'}">${groups[t[0]].length}</span></button>`).join('')}</div>
      <div class="grid gc2 mt16">${list.map(taskCard).join('') || `<div class="card" style="grid-column:1/-1">${emptyState(tab === 'belum' ? 'check-c' : 'inbox', tab === 'belum' ? 'Tidak ada tugas tertunda' : 'Belum ada', tab === 'belum' ? 'Semua tugas sudah kamu kumpulkan.' : '')}</div>`}</div></div>`;
  }
});

route('s-tugas-d', {
  title: 'Detail Tugas', roles: ['SISWA'], back: 's-tugas', nav: 's-tugas', form: true,
  render(p) {
    const t = SW().tugas.find((x) => x.tugas_id === p.id);
    if (!t) return `<div class="page">${emptyState('alert', 'Tugas tidak ditemukan', 'Tugas mungkin sudah dihapus guru.', `<button class="btn btn-primary" onclick="go('s-tugas')">Kembali</button>`)}</div>`;
    const mine = t.my ? need('mine_' + t.tugas_id, 'tugas.mine', { tugas_id: t.tugas_id }, 60000) : null;
    const st = tugasState(t), late = now() > t.tenggat, graded = st.k === 'DINILAI';
    const canEdit = !graded && (!late || t.izinkan_terlambat);
    const draft = LS.get('sp_draft_' + t.tugas_id, null);
    const F = S.c['up_' + t.tugas_id] = S.c['up_' + t.tugas_id] || { files: null };
    if (F.files === null && (!t.my || mine)) F.files = ((mine && mine.file_ids) || []).map((id) => ({ id, name: 'Berkas terkumpul', done: true }));
    const needFile = t.jenis_kumpul !== 'TEKS', needText = t.jenis_kumpul !== 'FILE';
    return `<div class="page" style="max-width:880px">
      <button class="back-link only-lg" onclick="back('s-tugas')">${I('arrow-l', 'ic-sm')}Kembali ke daftar tugas</button>
      <div class="flex items-c g8 wrap">${pill(mapelNm(t.mapel_id), 'info', 'book')}${pill(st.l, st.c)}</div>
      <h1 class="mt12" style="font-size:24px">${esc(t.judul)}</h1><p class="tx2 mt4">${esc(t.guru)}</p>
      <div class="info-tiles mt16">
        <div class="info-tile">${`<div class="tile sm ${late ? 'err' : 'warn'}">${I('calendar')}</div>`}<div class="kv"><span class="k">Tenggat</span><span class="v small">${D.rel(t.tenggat)}</span></div></div>
        <div class="info-tile"><div class="tile sm">${I('star')}</div><div class="kv"><span class="k">Nilai maks</span><span class="v mono">${t.nilai_maks}</span></div></div>
        <div class="info-tile"><div class="tile sm sky">${I(t.jenis_kumpul === 'TEKS' ? 'pen' : 'upload')}</div><div class="kv"><span class="k">Pengumpulan</span><span class="v small">${t.jenis_kumpul === 'FILE' ? 'Unggah berkas' : t.jenis_kumpul === 'TEKS' ? 'Teks jawaban' : 'Berkas / teks'}</span></div></div>
        <div class="info-tile"><div class="tile sm neu">${I('clock')}</div><div class="kv"><span class="k">Diberikan</span><span class="v small">${D.d(t.dibuat_pada)}</span></div></div>
      </div>
      <div class="card card-p mt16"><h3 class="mb8">Instruksi</h3><div class="pre tx2">${esc(t.instruksi)}</div>
        ${(t.lampiran || []).length ? `<div class="col g8 mt16">${t.lampiran.map((id, i) => `<button class="file-chip" onclick="previewPublic('Lampiran ${i + 1}','${id}')"><div class="tile err">${I('file-text')}</div><div class="f1 bold" style="text-align:left">Lampiran ${i + 1}</div>${I('eye', 'muted')}</button>`).join('')}</div>` : ''}</div>
      ${graded && mine ? `<div class="card card-p mt16"><div class="flex items-c g24 wrap">${CH.ring(mine.nilai, t.nilai_maks, { text: fmtN(mine.nilai), c: mine.nilai / t.nilai_maks >= kkmFor(me().kelas_id, t.kelas_id) / 100 ? '#16A34A' : '#D97706' })}<div class="f1" style="min-width:220px"><div class="small muted">Nilai dari guru · maks ${t.nilai_maks}</div><h2 class="mt4">${mine.nilai / t.nilai_maks * 100 >= kkmFor(me().kelas_id, t.kelas_id) ? 'Tuntas' : 'Perlu perbaikan'}</h2>${mine.komentar ? `<div class="banner banner-info mt12">${I('message')}<div><b>Komentar guru</b><div class="pre mt4">${esc(mine.komentar)}</div></div></div>` : ''}</div></div></div>` : ''}
      ${late && !t.my ? `<div class="banner ${t.izinkan_terlambat ? 'banner-warn' : 'banner-err'} mt16">${I('alert')}<div>${t.izinkan_terlambat ? 'Tenggat sudah lewat. Pengumpulan tetap bisa, tetapi ditandai <b>Terlambat</b>.' : 'Tenggat sudah lewat dan guru tidak menerima pengumpulan terlambat.'}</div></div>` : ''}
      <div class="card card-p mt16"><div class="flex items-c jc-b"><h3>Jawaban Saya</h3>${t.my ? `<span class="small muted">Dikumpulkan ${D.rel(t.my.waktu_kumpul)}</span>` : ''}</div>
        ${t.my && !mine ? `<div class="mt12">${skel(80)}</div>` : `
        ${needText ? `<div class="field mt12"><textarea class="textarea" id="ansText" placeholder="Tulis jawaban${t.jenis_kumpul === 'KEDUANYA' ? ' (opsional)' : ''}…" ${canEdit ? '' : 'readonly'} oninput="LS.set('sp_draft_${t.tugas_id}',this.value)">${esc(draft !== null && canEdit && !(mine && mine.teks && draft === '') ? draft : (mine && mine.teks) || '')}</textarea>${canEdit ? '<div class="help">Draf tersimpan otomatis di perangkat.</div>' : ''}</div>` : ''}
        ${needFile ? `<div class="col g8 mt12" id="fileList">${(F.files || []).map((f, i) => fileChipHTML(f, i, t, canEdit, mine)).join('')}</div>
          ${canEdit ? `<label class="upload mt12">${I('upload', 'ic-lg')}<div class="bold mt8">Ambil foto / pilih PDF</div><div class="small muted">Maks 10 MB per berkas · foto otomatis diperkecil</div><input type="file" hidden multiple accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onchange="addSubmitFiles('${t.tugas_id}',this.files);this.value=''"></label>` : ''}` : ''}`}
      </div>
      ${canEdit && (!t.my || mine) ? `<div class="sticky-bar"><span class="small muted f1">${t.my ? 'Kamu bisa memperbarui jawaban sebelum dinilai.' : 'Periksa kembali sebelum mengumpulkan.'}</span><button class="btn btn-primary btn-lg" id="submitBtn" onclick="submitTugas('${t.tugas_id}')">${I('send')}${t.my ? 'Perbarui Jawaban' : 'Kumpulkan Tugas'}</button></div>` : ''}
    </div>`;
  }
});
function fileChipHTML(f, i, t, canEdit, mine) {
  return `<div class="file-chip"><div class="tile ${/pdf/.test(f.mime || '') ? 'err' : 'sky'}">${I(fileIcon(f.name, f.mime))}</div><div class="f1" style="min-width:0"><div class="bold truncate small">${esc(f.name)}</div><div class="xs muted">${f.err ? `<span class="ink-err">${esc(f.err)}</span>` : f.done ? (f.size ? fmtSize(f.size) + ' · ' : '') + 'siap' : 'mengunggah…'}</div>${!f.done && !f.err ? '<div class="prog"><i></i></div>' : ''}</div>
    ${f.done && f.id && mine && mine.kumpul_id && !f.local ? `<button class="icon-btn" onclick="previewPrivate('${mine.kumpul_id}','${f.id}',${jsq(f.name)})">${I('eye')}</button>` : ''}${canEdit ? `<button class="icon-btn" onclick="removeSubmitFile('${t.tugas_id}',${i})" aria-label="Hapus">${I('x')}</button>` : ''}</div>`;
}
function addSubmitFiles(tid, files) {
  const F = S.c['up_' + tid]; F.files = F.files || [];
  Array.from(files).forEach((file) => {
    const f = { name: file.name, mime: file.type, size: file.size, done: false, local: true };
    if (file.size > 10 * 1024 * 1024) { f.err = 'Lebih dari 10 MB'; F.files.push(f); return; }
    F.files.push(f);
    uploadFile(file, 'kumpul', tid).then((r) => { f.id = r.file_id; f.size = r.size; f.done = true; f.name = r.name; refreshFileList(tid); }).catch((e) => { f.err = e.message; refreshFileList(tid); });
  });
  refreshFileList(tid);
}
function removeSubmitFile(tid, i) { const F = S.c['up_' + tid]; F.files.splice(i, 1); refreshFileList(tid); }
function refreshFileList(tid) {
  const t = SW().tugas.find((x) => x.tugas_id === tid), box = $('#fileList'); if (!t || !box) return;
  const mine = S.c['mine_' + tid] && S.c['mine_' + tid].d;
  box.innerHTML = (S.c['up_' + tid].files || []).map((f, i) => fileChipHTML(f, i, t, true, mine)).join('');
}
function submitTugas(tid) {
  const t = SW().tugas.find((x) => x.tugas_id === tid), F = S.c['up_' + tid] || { files: [] };
  const files = (F.files || []), teks = $('#ansText') ? $('#ansText').value.trim() : '';
  if (files.some((f) => !f.done && !f.err)) { toast('Tunggu hingga semua berkas selesai diunggah.', 'warn'); return; }
  const ids = files.filter((f) => f.done && f.id).map((f) => f.id);
  if (t.jenis_kumpul === 'FILE' && !ids.length) { toast('Unggah minimal satu berkas.', 'warn'); return; }
  if (t.jenis_kumpul === 'TEKS' && !teks) { toast('Tuliskan jawabanmu.', 'warn'); return; }
  if (!ids.length && !teks) { toast('Isi jawaban atau unggah berkas.', 'warn'); return; }
  const btn = $('#submitBtn'); btnBusy(btn, true, 'Mengirim…');
  call('tugas.submit', { tugas_id: tid, teks, file_ids: ids }).then((r) => {
    t.my = { kumpul_id: r.kumpul_id, waktu_kumpul: r.waktu_kumpul, terlambat: r.terlambat, nilai: null };
    S.c['mine_' + tid] = { t: Date.now(), d: Object.assign({ komentar: '' }, r) };
    files.forEach((f) => { f.local = false; });
    LS.del('sp_draft_' + tid); saveSnap(); renderChrome();
    toast(r.terlambat ? 'Tugas terkumpul (terlambat).' : 'Tugas berhasil dikumpulkan!', 'ok');
    rerender();
  }).catch((e) => { btnBusy(btn, false); failToast(e); });
}

route('s-ujian', {
  title: 'Ujian', roles: ['SISWA'],
  render(p) {
    const sw = SW(), tab = p.tab || 'aktif';
    const g = { aktif: [], jadwal: [], selesai: [] };
    sw.ulangan.forEach((u) => { const st = ulStatus(u), done = u.my && (u.my.status === 'SELESAI' || u.my.status === 'TERKUNCI'); if (done || st.k === 'SELESAI') g.selesai.push(u); else if (st.k === 'AKTIF') g.aktif.push(u); else g.jadwal.push(u); });
    g.aktif.sort(by('tutup')); g.jadwal.sort(by('buka')); g.selesai.sort(by('tutup', -1));
    return `<div class="page"><div class="page-hd"><div><h1>Ujian CBT</h1><p class="sub">Siapkan HP dengan baterai cukup. Pindah aplikasi saat ujian dihitung pelanggaran.</p></div></div>
      <div class="tabs">${[['aktif', 'Aktif'], ['jadwal', 'Akan Datang'], ['selesai', 'Selesai']].map((t) => `<button class="tab ${tab === t[0] ? 'on' : ''}" onclick="go('s-ujian',{tab:'${t[0]}'},{replace:true})">${t[1]} <span class="badge ${t[0] === 'aktif' && g.aktif.length ? 'p' : 'neu'}">${g[t[0]].length}</span></button>`).join('')}</div>
      <div class="grid gc2 mt16">${g[tab].map(examCard).join('') || `<div class="card" style="grid-column:1/-1">${emptyState('exam', tab === 'aktif' ? 'Tidak ada ujian aktif' : 'Belum ada', tab === 'aktif' ? 'Ujian akan muncul di sini saat jadwalnya dibuka.' : '')}</div>`}</div></div>`;
  }
});

route('s-nilai', {
  title: 'Nilai & Kehadiran', roles: ['SISWA'],
  render(p) {
    const tab = p.tab || 'nilai', d = need('rekap', 'siswa.rekap', {}, 60000);
    const head = `<div class="page-hd"><div><h1>Nilai & Kehadiran</h1><p class="sub">${esc(B().ta ? 'Semester ' + B().ta.semester + ' ' + B().ta.nama : '')}</p></div></div>
      <div class="tabs">${[['nilai', 'Nilai'], ['hadir', 'Kehadiran']].map((t) => `<button class="tab ${tab === t[0] ? 'on' : ''}" onclick="go('s-nilai',{tab:'${t[0]}'},{replace:true})">${t[1]}</button>`).join('')}</div>`;
    if (!d) return `<div class="page">${head}<div class="mt16">${skelCards(4)}</div></div>`;
    if (tab === 'nilai') {
      const keys = Object.keys(d.nilai);
      return `<div class="page">${head}<div class="card mt16">${keys.length ? keys.map((mp) => { const n = d.nilai[mp], open = S.c.openMapel === mp;
        return `<div class="row-item click" onclick="S.c.openMapel=S.c.openMapel==='${mp}'?null:'${mp}';rerender()">${mapelIcon(mp, 'sm')}<div class="f1" style="min-width:0"><div class="bold">${esc(mapelNm(mp))}</div><div class="meter mt8" style="max-width:280px"><i style="width:${clamp(n.rata || 0, 0, 100)}%"></i></div></div><div class="tr"><div class="b7" style="font-family:var(--f-head);font-size:20px">${fmtN(n.rata)}</div><div class="xs muted">rata-rata</div></div>${I(open ? 'chev-u' : 'chev-d', 'muted')}</div>
          ${open ? `<div style="padding:4px 16px 16px 64px" class="col g8">${n.tugas.map((x) => `<div class="flex jc-b g12 small"><span class="truncate">${I('clipboard', 'ic-sm muted')} ${esc(x.judul)}</span><b class="mono">${fmtN(x.nilai)}/${x.maks}</b></div>`).join('')}${n.ujian.map((x) => `<div class="flex jc-b g12 small"><span class="truncate">${I('exam', 'ic-sm muted')} ${esc(x.judul)}</span><b class="mono">${x.status_nilai === 'MENUNGGU_KOREKSI' ? '<span class="pill pill-vio">Menunggu koreksi</span>' : fmtN(x.n)}</b></div>`).join('')}</div>` : ''}`; }).join('') : emptyState('star', 'Belum ada nilai', 'Nilai tugas dan ujian akan tampil di sini setelah dinilai guru.')}</div></div>`;
    }
    const a = d.absensi.total, tot = a.H + a.S + a.I + a.A;
    const mon = S.c.attMon || D.ymd(now()).slice(0, 7);
    const [yy, mm] = mon.split('-').map(Number), first = new Date(yy, mm - 1, 1), days = new Date(yy, mm, 0).getDate();
    const byDay = {}; d.absensi.harian.forEach((h) => { if (h.tanggal.slice(0, 7) === mon) (byDay[+h.tanggal.slice(8)] = byDay[+h.tanggal.slice(8)] || []).push(h); });
    const cells = []; for (let i = 0; i < first.getDay(); i++) cells.push('<div></div>');
    for (let dd = 1; dd <= days; dd++) { const l = byDay[dd] || []; const worst = l.find((x) => x.s === 'A') || l.find((x) => x.s === 'S' || x.s === 'I') || l[0]; cells.push(`<div class="${worst ? 'h' + ({ H: 1, S: 2, I: 2, A: 4 }[worst.s]) : ''}" title="${l.map((x) => mapelNm(x.mapel_id) + ': ' + x.s).join(', ')}">${worst ? `<b>${worst.s}</b>` : dd}</div>`); }
    const shift = (n) => { const x = new Date(yy, mm - 1 + n, 1); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}`; };
    return `<div class="page">${head}
      <div class="grid gc4 mt16">${[['Hadir', tot ? fmtN(a.H / tot * 100) + '%' : '-', 'ok', 'check-c'], ['Sakit', a.S, '', 'info'], ['Izin', a.I, 'warn', 'alert'], ['Alpa', a.A, 'err', 'x']].map((s) => `<div class="card stat"><div><div class="lbl">${s[0]}</div><div class="val">${s[1]}</div></div><div class="tile ${s[2]}">${I(s[3])}</div></div>`).join('')}</div>
      <div class="split mt16"><div class="card"><div class="card-hd"><h3>Kalender ${BULAN[mm - 1]} ${yy}</h3><div class="flex g4"><button class="icon-btn" onclick="S.c.attMon='${shift(-1)}';rerender()">${I('chev-l')}</button><button class="icon-btn" onclick="S.c.attMon='${shift(1)}';rerender()">${I('chev-r')}</button></div></div>
        <div class="card-bd"><div class="heat">${HARI.map((h) => `<div class="hd">${h}</div>`).join('')}${cells.join('')}</div><div class="legend mt12"><span><i style="background:#DCE7FF"></i>Hadir</span><span><i style="background:#93B4FF"></i>Sakit/Izin</span><span><i style="background:#0B1F7A"></i>Alpa</span></div></div></div>
      <div class="card"><div class="card-hd"><h3>Per Mata Pelajaran</h3></div>${Object.keys(d.absensi.perMapel).map((mp) => { const x = d.absensi.perMapel[mp], t2 = x.H + x.S + x.I + x.A;
        return `<div class="row-item">${mp === 'HARIAN' ? `<div class="tile sm">${I('calendar')}</div>` : mapelIcon(mp, 'sm')}<div class="f1"><div class="bold small">${mp === 'HARIAN' ? 'Absensi harian' : esc(mapelNm(mp))}</div><div class="xs muted">${t2} pertemuan</div></div><div class="flex g4">${['H', 'S', 'I', 'A'].map((k) => `<span class="att-chip ${k}" title="${k}">${x[k]}</span>`).join('')}</div></div>`; }).join('') || emptyState('calendar', 'Belum ada data kehadiran', '')}</div></div></div>`;
  }
});

// ════════════════════════════════════════════════════════
// BAGIAN 13: MESIN UJIAN CBT (klien)
//  - Soal dimuat sekali; jawaban disimpan di localStorage setiap ketukan (0 ms).
//  - Sinkron ke server tiap ±30–45 dtk (acak agar 250 siswa tidak bersamaan) hanya jika berubah.
//  - Deteksi pindah tab / keluar layar penuh → peringatan merah + alarm + getar.
// ════════════════════════════════════════════════════════
let X = null;
function startExamFlow(ulId) {
  const u = SW().ulangan.find((x) => x.ulangan_id === ulId); if (!u) return;
  const resume = u.my && u.my.status === 'MENGERJAKAN';
  const go2 = (token) => {
    const s = sheet({ title: 'Menyiapkan ujian', locked: true, body: `<div class="tc" style="padding:20px"><div class="ring" style="border-color:var(--p100);border-top-color:var(--p600);margin:0 auto"></div><h3 class="mt16">Memuat soal…</h3><p class="small muted mt8">Jangan tutup aplikasi.</p></div>` });
    ensureAudio();
    call('exam.start', { ulangan_id: ulId, token }, { retries: 6 }).then((d) => {
      s.close();
      if (d.done) { u.my = Object.assign(u.my || {}, { status: d.result.status, nilai: d.result.nilai }); saveSnap(); showResult(d.result, u); return; }
      enterExam(d, u);
    }).catch((e) => { s.close(); if (e.code === 'TOKEN') { toast(e.message, 'err'); openTokenSheet(u, go2, e.message); } else failToast(e); });
  };
  if (resume || !u.pakai_token) { go2(''); return; }
  openTokenSheet(u, go2);
}
function openTokenSheet(u, cb, err) {
  sheet({ title: 'Masukkan Token Ujian', icon: 'key', body: `<p class="tx2 tc">${esc(u.judul)}<br><span class="small muted">${esc(mapelNm(u.mapel_id))} · ${u.jumlah_soal} soal · ${u.durasi_menit} menit</span></p>
    <div class="token-boxes mt16" id="tkBoxes">${[0, 1, 2, 3, 4, 5].map((i) => `<input maxlength="1" inputmode="text" autocomplete="off" ${i === 0 ? 'autofocus' : ''} aria-label="Karakter token ${i + 1}">`).join('')}</div>
    ${err ? `<p class="err-msg tc mt8" style="justify-content:center">${I('alert-c', 'ic-sm')}${esc(err)}</p>` : ''}
    <div class="card mt16" style="padding:14px;background:var(--subtle)"><div class="bold small mb8">Aturan ujian</div>${[['maximize', 'Layar penuh akan aktif selama ujian'], ['alert', 'Pindah tab atau aplikasi dihitung pelanggaran'], ['lock', 'Ujian terkunci otomatis setelah batas pelanggaran'], ['cloud-ok', 'Jawaban tersimpan otomatis walau sinyal putus']].map((r) => `<div class="flex items-c g8 small mt4">${I(r[0], 'ic-sm ink-p')}${r[1]}</div>`).join('')}</div>`,
  foot: `<button class="btn btn-primary btn-lg btn-block" id="tkGo">${I('arrow-r')}Mulai Mengerjakan</button>`,
  mount: (el, close) => {
    const ins = $$('#tkBoxes input', el);
    ins.forEach((inp, i) => {
      inp.oninput = () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (inp.value && ins[i + 1]) ins[i + 1].focus(); };
      inp.onkeydown = (e) => { if (e.key === 'Backspace' && !inp.value && ins[i - 1]) ins[i - 1].focus(); if (e.key === 'Enter') $('#tkGo').click(); };
      inp.onpaste = (e) => { const t = (e.clipboardData.getData('text') || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (t) { e.preventDefault(); ins.forEach((x, j) => { x.value = t[j] || ''; }); ins[Math.min(t.length, 5)].focus(); } };
    });
    $('#tkGo').onclick = () => { const tok = ins.map((x) => x.value).join(''); if (tok.length < 4) { toast('Masukkan token dari pengawas.', 'warn'); return; } close(); cb(tok); };
  } });
}
const exKey = (id) => 'sp_ex_' + id;
function enterExam(d, u) {
  const local = LS.get(exKey(d.attempt.id), null);
  X = {
    active: true, att: d.attempt, qs: d.questions, ul: d.ulangan, u, idx: local ? clamp(local.idx || 0, 0, d.questions.length - 1) : 0,
    a: Object.assign({}, d.attempt.answers || {}, (local && local.a) || {}), rg: new Set((local && local.rg) || d.attempt.ragu || []),
    v: Math.max(d.attempt.violations || 0, (local && local.v) || 0), limit: d.attempt.limit || 3, off: d.serverNow - Date.now(), batas: d.attempt.batas,
    dirty: !!local, lastSync: Date.now(), lastViol: 0, syncing: false, timers: [], status: d.attempt.status, startedAt: Date.now(), navOpen: false,
    tol: Math.max(0, Number(d.ulangan.tol) || 0)
  };
  X.wm = exWatermark(); X.guard = { blur: false, small: false, t: 0 };
  LS.set('sp_ex_active', { u: me().user_id, ulangan_id: X.ul.ulangan_id, attempt_id: X.att.id });
  u.my = Object.assign(u.my || {}, { status: 'MENGERJAKAN' });
  $('#shell').hidden = true; const ex = $('#exam'); ex.hidden = false; closeAllSheets();
  renderExam();
  if (X.status === 'TERKUNCI') { showLocked(); }
  requestFS();
  document.addEventListener('visibilitychange', onExVisibility);
  document.addEventListener('fullscreenchange', onExFS);
  document.addEventListener('webkitfullscreenchange', onExFS);
  ex.addEventListener('copy', blockEv); ex.addEventListener('contextmenu', blockEv); ex.addEventListener('cut', blockEv);
  document.addEventListener('keydown', exKeyDown); window.addEventListener('pagehide', saveExLocal);
  window.addEventListener('blur', onExBlur); window.addEventListener('focus', onExFocus); window.addEventListener('resize', onExResize);
  document.addEventListener('keyup', onExKeyShot, true); document.addEventListener('keydown', onExKeyShot, true);
  X.timers.push(setInterval(tickExam, 1000));
  setTimeout(() => { if (X && X.active) { if (!document.hasFocus()) onExBlur(); onExResize(); } }, 1200);
  scheduleSync();
  window.onbeforeunload = () => { if (X && X.active) { saveExLocal(); return 'Ujian sedang berlangsung.'; } };
}
const blockEv = (e) => { if (!(e.target && /TEXTAREA|INPUT/.test(e.target.tagName))) e.preventDefault(); };
function saveExLocal() { if (!X) return; clearTimeout(X.saveT); X.saveT = 0; LS.set(exKey(X.att.id), { a: X.a, rg: Array.from(X.rg), idx: X.idx, v: X.v, t: Date.now() }); }
/** Simpan ke perangkat sesaat setelah layar diperbarui (ketukan terasa instan, tetap aman tersimpan). */
function queueSave() { if (X && !X.saveT) X.saveT = setTimeout(saveExLocal, 40); }
function exRemaining() { return X.batas - (Date.now() + X.off); }
function answeredCount() { let n = 0; for (let i = 0; i < X.qs.length; i++) if (isAnswered(X.qs[i])) n++; return n; }
function isAnswered(q) { const v = X.a[q.id]; if (v === undefined || v === null || v === '') return false; if (Array.isArray(v)) return v.filter((x) => x !== null && x !== '').length > 0; return true; }
/** Toleransi selesai: tombol Selesai aktif mulai X menit sebelum waktu habis (0 = kapan saja). */
const finLeft = () => (X.tol ? exRemaining() - X.tol * 60000 : 0);
const canFinish = () => finLeft() <= 0;
const mmss = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); return (t >= 3600 ? Math.floor(t / 3600) + ':' + pad(Math.floor(t % 3600 / 60)) : Math.floor(t / 60)) + ':' + pad(t % 60); };
const timerCls = (rem) => 'timer ' + (rem < 300000 ? 'err' : rem < 600000 ? 'warn' : '');
/** Tombol Selesai. m: 'bar' (bilah bawah), 'side' (panel nomor soal), 'foot' (lembar daftar soal). */
function finBtn(m) {
  const cls = m === 'bar' ? 'btn-lg' : m === 'foot' ? 'btn-lg btn-block' : 'btn-block mt16', lbl = m === 'bar' ? 'Selesai' : 'Selesai & Kirim';
  if (canFinish()) return `<button class="btn btn-ok ${cls}" data-fm="${m}" onclick="confirmFinish()">${I('check')}<span>${lbl}</span></button>`;
  return `<button class="btn btn-fin-lock ${cls}" data-fm="${m}" onclick="confirmFinish()" aria-label="Tombol Selesai aktif ${X.tol} menit sebelum waktu habis">${I('lock', 'ic-sm')}<span class="fl"><b>${lbl}</b><small data-fincd>aktif ${mmss(finLeft())}</small></span></button>`;
}
function cellCls(i) { const q = X.qs[i]; return 'nb ' + (X.rg.has(q.id) ? 'rg' : isAnswered(q) ? 'ans' : '') + (i === X.idx ? ' cur' : ''); }
function exQHTML(q) {
  const n = X.qs.length;
  return `<div class="q-card"><div class="flex items-c g12 wrap jc-b"><span class="q-no">SOAL ${q.no} DARI ${n}</span><span class="small tx2">${TIPE_SOAL[q.tipe]}</span><span class="pill pill-info">Bobot: ${fmtN(q.bobot)} poin</span></div>
        <div class="divider"></div><div class="q-text">${rumus(q.teks)}</div>
        ${q.img ? `<img class="q-img" src="${esc(IMG_VIA_APP && q.gid && !IMGD[q.gid] ? '' : soalImgSrc(q.img, q.gid))}" data-fid="${esc(q.gid || '')}" alt="Gambar soal" decoding="async" onerror="imgFb(this)" onclick="if(!this.classList.contains('img-err')){const s=this.src;previewPublic('Gambar soal ${q.no}','','IMG');setTimeout(()=>{const im=$('.sheet-bd img');if(im)im.src=s},30)}">` : ''}
        ${q.tipe === 'MCMA' ? `<div class="banner banner-info mt16" style="padding:10px 12px">${I('checkbox', 'ic-sm')}<span>Pilih lebih dari satu jawaban${q.n ? ` (${q.n} jawaban benar)` : ''}.</span></div>` : ''}
      </div>
      ${answerArea(q)}
      <p class="tc small muted mt16">${I('info', 'ic-sm')} Ketuk pilihan untuk menyimpan jawaban seketika</p>`;
}
function exBottomHTML() {
  const q = X.qs[X.idx], n = X.qs.length, rg = X.rg.has(q.id);
  return `<button class="navpill" onclick="openNavSheetEx()">${I('grid', 'ic-sm')}Daftar Soal ${I('chev-u', 'ic-sm')} <span class="mono" data-ex="cnt">(${answeredCount()}/${n})</span></button>
      <div class="row"><button class="btn btn-secondary btn-lg" onclick="exNav(-1)" ${X.idx === 0 ? 'disabled' : ''}>${I('chev-l')}<span>Sebelumnya</span></button>
        <button class="btn btn-lg btn-ragu ${rg ? 'on' : ''}" id="exRagu" onclick="toggleRagu()">${I('flag')}<span>Ragu-ragu</span></button>
        ${X.idx === n - 1 ? finBtn('bar') : `<button class="btn btn-primary btn-lg" onclick="exNav(1)"><span>Berikutnya</span>${I('chev-r')}</button>`}</div>`;
}
/** Bangun seluruh layar ujian (sekali saat masuk / setelah status berubah). Pindah soal hanya mengganti bagian soal. */
function renderExam() {
  const q = X.qs[X.idx], n = X.qs.length, rem = exRemaining(), off = !navigator.onLine, ans = answeredCount();
  X.lastClock = ''; X.lastTCls = ''; X.finOk = canFinish(); X.offShown = off;
  $('#exam').innerHTML = `<div class="offline-bar" id="exOff" ${off ? '' : 'hidden'}>${I('wifi-off', 'ic-sm')}Sinyal terputus — jawaban aman tersimpan di perangkat</div>
    <div class="ex-top"><div class="flex items-s jc-b g12" style="max-width:1240px;margin:0 auto"><div class="f1" style="min-width:0"><div class="lbl">CBT ${esc(shortName(cfg().nama_aplikasi).split(' ')[0])}</div><h2 class="truncate">${esc(X.ul.judul)}</h2><div class="small muted">${esc(mapelNm(X.ul.mapel_id))} · ${n} Soal</div></div>
      <div class="col items-e g6"><div class="${timerCls(rem)}" id="exTimer">${I('clock')}<span>${D.clock(rem)}</span></div><span class="viol-pill ${X.v ? 'on' : ''}" id="exViol">${I('alert', 'ic-sm')}Pelanggaran ${X.v}/${X.limit}</span></div></div>
      <div class="ex-sub" style="max-width:1240px;margin:10px auto 0"><span class="sync-dot ${X.syncing ? 'busy' : off ? 'off' : ''}" id="exSync">${X.dirty ? 'Tersimpan di perangkat' : 'Tersimpan otomatis · ' + D.t(X.lastSync) + ' ' + TZL}</span><span class="mono xs muted">NIS: ${esc(me().nis_nip || '')}</span></div>
      <div class="ex-prog" aria-hidden="true"><i data-ex="bar" style="width:${ans / n * 100}%"></i></div></div>
    <div class="ex-body"><div class="ex-wm" aria-hidden="true" style="background-image:${X.wm}"></div><div id="exQ"><div class="q-wrap">${exQHTML(q)}</div></div>
    <aside class="ex-side only-lg" id="exSide">${navPanel()}</aside></div>
    <div class="ex-bottom" id="exBot">${exBottomHTML()}</div>
    <div class="ex-shield" id="exShield" aria-live="polite"><div>${I('eye-off', 'ic-2x')}<h2>Soal disembunyikan</h2><p id="exShieldMsg">Kembali ke halaman ujian untuk melanjutkan.</p></div></div>`;
  exPreload(); exGuardPaint();
}
function answerArea(q) {
  const v = X.a[q.id];
  if (q.tipe === 'PG') return `<div class="opts">${q.opsi.map((o, i) => `<button class="opt ${v === o.k ? 'sel' : ''}" data-k="${esc(o.k)}" onclick="ansPG('${q.id}','${o.k}')"><span class="lt">${'ABCDE'[i]}</span><span class="f1 pre">${rumus(o.t)}</span>${I('check-c', 'ck ic-lg')}</button>`).join('')}</div>`;
  if (q.tipe === 'MCMA') { const sel = Array.isArray(v) ? v : []; return `<div class="opts">${q.opsi.map((o, i) => `<button class="opt mc ${sel.indexOf(o.k) >= 0 ? 'sel' : ''}" data-k="${esc(o.k)}" data-l="${'ABCDE'[i]}" onclick="ansMC('${q.id}','${o.k}')"><span class="lt">${sel.indexOf(o.k) >= 0 ? I('check', 'ic-sm') : 'ABCDE'[i]}</span><span class="f1 pre">${rumus(o.t)}</span>${I('check-c', 'ck ic-lg')}</button>`).join('')}</div>`; }
  if (q.tipe === 'KATEGORI') { const sel = Array.isArray(v) ? v : []; return `<table class="cat-tbl"><thead><tr><th>Pernyataan</th>${q.kat.map((k) => `<th>${rumus(k)}</th>`).join('')}</tr></thead><tbody>${q.pern.map((p, i) => `<tr><td>${rumus(p)}</td>${q.kat.map((k, ki) => `<td class="rc ${sel[i] === k ? 'on' : ''}" data-r="${i}" data-c="${ki}" onclick="ansKat('${q.id}',${i},${ki})"><span class="rdo"></span></td>`).join('')}</tr>`).join('')}</tbody></table>`; }
  return `<div class="q-card mt16"><textarea class="textarea" id="esaiBox" style="min-height:200px;font-size:16px" maxlength="5000" placeholder="Tulis jawaban esai di sini…" oninput="ansEsai('${q.id}',this.value)">${esc(v || '')}</textarea><div class="flex jc-b small muted mt8"><span>${I('cloud-ok', 'ic-sm')} Tersimpan otomatis</span><span id="esaiCnt">${String(v || '').length}/5000</span></div></div>`;
}
function navStats() {
  let ans = 0, rg = 0, rgAns = 0;
  X.qs.forEach((q) => { const a = isAnswered(q), r = X.rg.has(q.id); if (a) ans++; if (r) { rg++; if (a) rgAns++; } });
  return { n: X.qs.length, ans, rg, ok: ans - rgAns, bel: X.qs.length - ans };
}
function navLegend(st) {
  return `<div class="legend"><span><i style="background:var(--p600);border-color:var(--p600)"></i>Dijawab (<b data-ex="ok">${st.ok}</b>)</span><span><i></i>Belum (<b data-ex="bel">${st.bel}</b>)</span><span><i style="background:var(--warn);border-color:var(--warn)"></i>Ragu (<b data-ex="rg">${st.rg}</b>)</span></div>`;
}
function navPanel() {
  const st = navStats();
  return `<div class="card card-p"><div class="flex items-c jc-b"><h3>Nomor Soal</h3><span class="mono small" data-ex="frac">${st.ans}/${st.n}</span></div><div class="meter mt8"><i data-ex="bar" style="width:${st.ans / st.n * 100}%"></i></div>
    <div class="navgrid mt16">${X.qs.map((q, i) => `<button class="${cellCls(i)}" data-i="${i}" onclick="exGo(${i})">${i + 1}</button>`).join('')}</div>
    ${navLegend(st)}
    <button class="btn btn-ghost btn-sm btn-block mt12" onclick="openNavSheetEx()">${I('list', 'ic-sm')}Lihat semua soal</button>
    ${finBtn('side')}</div>`;
}
/** Lembar "Daftar Soal": semua nomor + daftar soal lengkap dengan status, bisa disaring (Belum / Ragu / Dijawab). */
const exClearToasts = () => { const tb = $('#toasts'); if (tb) tb.innerHTML = ''; };
function openNavSheetEx() {
  closeAllSheets(); exClearToasts();
  const st = navStats(), f0 = st.bel ? 'bel' : 'all';
  const row = (q, i) => { const a = isAnswered(q), r = X.rg.has(q.id), sc = r ? 'rg' : a ? 'ans' : 'bel';
    const t = rumusTeks(q.teks || '').replace(/\s+/g, ' ').trim();
    return `<button class="nv-row s-${sc}${i === X.idx ? ' cur' : ''}" data-i="${i}" onclick="exGo(${i})"><span class="nv-no">${i + 1}</span><span class="f1" style="min-width:0"><span class="nv-t">${esc(t.length > 150 ? t.slice(0, 150) + '…' : t) || (q.img ? '(Soal bergambar)' : '-')}</span><span class="nv-m">${TIPE_SOAL[q.tipe]} · <b>${r ? 'Ragu-ragu' : a ? 'Sudah dijawab' : 'Belum dijawab'}</b></span></span>${I('chev-r', 'ic-sm muted')}</button>`; };
  sheet({ title: 'Daftar Soal', icon: 'list', body: `<div class="nv-wrap" data-f="${f0}">
      <div class="flex items-c jc-b small"><span class="tx2"><b class="mono" data-ex="frac">${st.ans}/${st.n}</b> soal dijawab</span><span class="mono small ${exRemaining() < 600000 ? 'ink-err' : 'tx2'}">${I('clock', 'ic-sm')} <span data-ex="clock">${D.clock(exRemaining())}</span></span></div>
      <div class="meter mt8"><i data-ex="bar" style="width:${st.ans / st.n * 100}%"></i></div>
      <div class="nv-f mt12" role="tablist">${[['all', 'Semua', st.n], ['bel', 'Belum dijawab', st.bel], ['rg', 'Ragu-ragu', st.rg], ['ans', 'Sudah dijawab', st.ok]].map((x) => `<button type="button" data-f="${x[0]}" class="${x[0] === f0 ? 'on' : ''}">${x[1]} <b>${x[2]}</b></button>`).join('')}</div>
      <div class="navgrid mt12">${X.qs.map((q, i) => `<button class="${cellCls(i)}" data-i="${i}" onclick="exGo(${i})">${i + 1}</button>`).join('')}</div>
      ${navLegend(st)}
      <div class="nv-list mt16">${X.qs.map(row).join('')}<div class="nv-none muted small tc">Tidak ada soal pada pilihan ini.</div></div></div>`,
    foot: finBtn('foot'),
    mount: (el) => {
      const w = $('.nv-wrap', el);
      $$('.nv-f button', el).forEach((b) => { b.onclick = () => { w.dataset.f = b.dataset.f; $$('.nv-f button', el).forEach((x) => x.classList.toggle('on', x === b)); }; });
      setTimeout(() => { const c = $('.nv-row.cur', el); if (c && w.dataset.f === 'all') c.scrollIntoView({ block: 'center' }); }, 280);
    } });
}
function exGo(i, dir) {
  if (!X) return;
  closeAllSheets();
  const old = X.idx; X.idx = clamp(i, 0, X.qs.length - 1);
  const q = X.qs[X.idx], box = $('#exQ');
  if (!box) { renderExam(); return; }
  const w = document.createElement('div'); w.className = 'q-wrap ' + ((dir || X.idx - old) >= 0 ? 'in-r' : 'in-l'); w.innerHTML = exQHTML(q);
  box.replaceChildren(w);
  $('#exBot').innerHTML = exBottomHTML();
  $$('.nb[data-i="' + old + '"], .nb[data-i="' + X.idx + '"]').forEach((b) => { b.className = cellCls(+b.dataset.i); });
  $('#exam').scrollTo(0, 0); window.scrollTo(0, 0);
  queueSave(); exPreload();
}
function exNav(d) { exGo(X.idx + d, d); }
/** Muat lebih dulu gambar soal sebelum & sesudahnya → pindah soal tanpa jeda. */
function exPreload() {
  X.pre = X.pre || {};
  [X.idx + 1, X.idx - 1, X.idx + 2].forEach((i) => {
    const q = X.qs[i]; if (!q || !q.img || X.pre[q.img]) return;
    // tautan Drive sudah terbukti gagal di perangkat ini → langsung ambil lewat server aplikasi
    if (IMG_VIA_APP && q.gid) { X.pre[q.img] = 1; soalImg(q.gid).catch(() => { delete X.pre[q.img]; }); return; }
    const im = new Image(); im.decoding = 'async';
    im.onerror = () => { if (q.gid) { IMG_VIA_APP = true; soalImg(q.gid).catch(() => {}); } };
    im.src = q.img; X.pre[q.img] = im;
  });
}
function setAns(qid, v) { X.a[qid] = v; X.dirty = true; queueSave(); }
function ansPG(qid, k) { setAns(qid, X.a[qid] === k ? '' : k); paintAns(); }
function ansMC(qid, k) { const s = Array.isArray(X.a[qid]) ? X.a[qid].slice() : []; const i = s.indexOf(k); if (i >= 0) s.splice(i, 1); else s.push(k); setAns(qid, s.sort()); paintAns(); }
function ansKat(qid, i, ki) { const q = X.qs.find((x) => x.id === qid), k = q.kat[ki]; const s = Array.isArray(X.a[qid]) ? X.a[qid].slice() : q.pern.map(() => null); s[i] = s[i] === k ? null : k; setAns(qid, s); paintAns(); }
const ansEsai = (qid, val) => { X.a[qid] = val; X.dirty = true; const c = $('#esaiCnt'); if (c) c.textContent = val.length + '/5000'; saveEsaiDeb(); };
const saveEsaiDeb = debounce(() => { saveExLocal(); updateExChrome(); }, 400);
/** Tandai pilihan langsung pada tombol yang ada (tanpa membangun ulang) → ketukan terasa instan. */
function paintAns() {
  const q = X.qs[X.idx], v = X.a[q.id];
  if (q.tipe === 'PG') $$('#exQ .opt').forEach((b) => b.classList.toggle('sel', v === b.dataset.k));
  else if (q.tipe === 'MCMA') { const sel = Array.isArray(v) ? v : []; $$('#exQ .opt').forEach((b) => { const on = sel.indexOf(b.dataset.k) >= 0; if (b.classList.contains('sel') !== on) { b.classList.toggle('sel', on); b.querySelector('.lt').innerHTML = on ? I('check', 'ic-sm') : b.dataset.l; } }); }
  else if (q.tipe === 'KATEGORI') { const sel = Array.isArray(v) ? v : []; $$('#exQ td.rc').forEach((td) => td.classList.toggle('on', sel[+td.dataset.r] === q.kat[+td.dataset.c])); }
  updateExChrome();
}
function refreshAnswer() { paintAns(); }
/** Perbarui hanya penanda kecil: nomor soal aktif, hitungan, bilah progres, status simpan. */
function updateExChrome() {
  if (!X) return;
  const st = navStats(), pct = st.ans / st.n * 100 + '%';
  $$('.nb[data-i="' + X.idx + '"]').forEach((b) => { b.className = cellCls(X.idx); });
  $$('.nv-row[data-i="' + X.idx + '"]').forEach((r) => { const q = X.qs[X.idx], a = isAnswered(q), g = X.rg.has(q.id); r.className = 'nv-row s-' + (g ? 'rg' : a ? 'ans' : 'bel') + ' cur'; const m = r.querySelector('.nv-m b'); if (m) m.textContent = g ? 'Ragu-ragu' : a ? 'Sudah dijawab' : 'Belum dijawab'; });
  const set = (k, v) => $$('[data-ex="' + k + '"]').forEach((e) => { if (e.textContent !== v) e.textContent = v; });
  set('cnt', `(${st.ans}/${st.n})`); set('frac', `${st.ans}/${st.n}`); set('ok', String(st.ok)); set('bel', String(st.bel)); set('rg', String(st.rg));
  $$('[data-ex="bar"]').forEach((e) => { e.style.width = pct; });
  const sy = $('#exSync'); if (sy) { sy.className = 'sync-dot ' + (X.syncing ? 'busy' : !navigator.onLine ? 'off' : ''); sy.textContent = X.dirty ? 'Tersimpan di perangkat' : 'Tersimpan otomatis · ' + D.t(X.lastSync) + ' ' + TZL; }
}
function toggleRagu() {
  const q = X.qs[X.idx]; if (X.rg.has(q.id)) X.rg.delete(q.id); else X.rg.add(q.id);
  X.dirty = true; queueSave();
  const b = $('#exRagu'); if (b) b.classList.toggle('on', X.rg.has(q.id));
  updateExChrome();
}
function tickExam() {
  if (!X || !X.active) return;
  const rem = exRemaining(), ck = D.clock(rem), tc = timerCls(rem);
  if (ck !== X.lastClock) { X.lastClock = ck; const el = $('#exTimer span'); if (el) el.textContent = ck; $$('[data-ex="clock"]').forEach((e) => { e.textContent = ck; }); }
  if (tc !== X.lastTCls) { X.lastTCls = tc; const el = $('#exTimer'); if (el) el.className = tc; }
  if (X.tol) {
    const ok = canFinish();
    if (ok !== X.finOk) { X.finOk = ok; $$('[data-fm]').forEach((b) => { b.outerHTML = finBtn(b.dataset.fm); }); if (ok) toast('Tombol Selesai sudah aktif. Periksa jawaban sebelum mengirim.', 'info'); }
    else if (!ok) { const t = 'aktif ' + mmss(finLeft()); $$('[data-fincd]').forEach((e) => { e.textContent = t; }); }
  }
  if (exTouch()) onExResize();
  const off = !navigator.onLine; if (off !== X.offShown) { X.offShown = off; const ob = $('#exOff'); if (ob) ob.hidden = !off; updateExChrome(); }
  if (rem <= 0 && X.status === 'MENGERJAKAN' && !X.submitting) finishExam('WAKTU');
}
/** Pintasan papan ketik (laptop/PC lab): ← → pindah soal, A–E memilih jawaban. */
function exKeyDown(e) {
  if (!X || !X.active || X.status !== 'MENGERJAKAN' || SHEETS.length || $('#exOverlay') || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.target && /TEXTAREA|INPUT|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'ArrowRight' && X.idx < X.qs.length - 1) { e.preventDefault(); exNav(1); }
  else if (e.key === 'ArrowLeft' && X.idx > 0) { e.preventDefault(); exNav(-1); }
  else if (/^[a-eA-E]$/.test(e.key)) { const o = $$('#exQ .opt')['abcde'.indexOf(e.key.toLowerCase())]; if (o) { e.preventDefault(); o.click(); } }
}
function scheduleSync() {
  if (!X) return;
  const jitter = 30000 + Math.random() * 15000;
  X.timers.push(setTimeout(() => { examSync(false).finally(scheduleSync); }, jitter));
}
function examSync(force) {
  if (!X || !X.active || X.syncing) return Promise.resolve();
  const heartbeat = Date.now() - X.lastSync > 90000;
  if (!X.dirty && !heartbeat && !force && X.status === 'MENGERJAKAN') return Promise.resolve();
  if (!navigator.onLine) { updateExChrome(); return Promise.resolve(); }
  X.syncing = true; updateExChrome();
  const payload = X.status === 'MENGERJAKAN' ? { id: X.att.id, a: X.a, rg: Array.from(X.rg), p: answeredCount() } : { id: X.att.id };
  const wasDirtyAt = JSON.stringify(X.a).length + X.rg.size;
  return call('exam.sync', payload, { silent: true, retries: 2, netRetries: 0 }).then((r) => {
    if (!X) return;
    X.syncing = false; X.lastSync = Date.now();
    if (JSON.stringify(X.a).length + X.rg.size === wasDirtyAt) X.dirty = false;
    if (r.serverNow) X.off = r.serverNow - Date.now();
    if (r.b && r.b < X.batas - 5000 && X.status === 'MENGERJAKAN') toast('Guru menyelesaikan ujian lebih awal. Jawabanmu dikirim otomatis saat waktu habis — periksa jawabanmu sekarang.', 'warn', 9000);
    if (r.b) X.batas = r.b;
    if (r.st === 'LOST') { recoverExam(); return; }
    if (r.st === 'TERKUNCI' && X.status !== 'TERKUNCI') { X.status = 'TERKUNCI'; X.v = r.v; showLocked(); }
    else if (r.st === 'MENGERJAKAN' && X.status === 'TERKUNCI') { X.status = 'MENGERJAKAN'; X.v = r.v; hideOverlay(); toast('Ujian dibuka kembali oleh pengawas. Lanjutkan mengerjakan.', 'ok'); renderExam(); requestFS(); }
    else if (r.st === 'SELESAI' || r.st === 'RESET') { completeExam(r.result || { status: 'SELESAI' }); return; }
    updateExChrome();
  }).catch(() => { if (X) { X.syncing = false; updateExChrome(); } });
}
function recoverExam() {   // cache server hilang (sangat jarang): mulai ulang sesi lalu kirim jawaban lokal
  call('exam.start', { ulangan_id: X.ul.ulangan_id, token: '' }, { silent: true }).then((d) => {
    if (d.done) { completeExam(d.result); return; }
    const a = X.a, rg = X.rg; LS.del(exKey(X.att.id));
    X.att = d.attempt; X.batas = d.attempt.batas; X.a = Object.assign({}, d.attempt.answers, a); X.rg = rg; X.dirty = true; saveExLocal();
    LS.set('sp_ex_active', { u: me().user_id, ulangan_id: X.ul.ulangan_id, attempt_id: X.att.id });
  }).catch(() => { /* coba lagi pada sinkron berikutnya */ });
}
// ── Deteksi pelanggaran ──
function requestFS() { const el = document.documentElement; try { if (document.fullscreenEnabled && !document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => { /* tidak didukung */ }); else if (el.webkitRequestFullscreen && !document.webkitFullscreenElement) el.webkitRequestFullscreen(); } catch (e) { /* abaikan */ } }
function onExVisibility() { if (!X || !X.active) return; if (document.hidden) violation('PINDAH_TAB'); else if (X.pendingAlarm) { X.pendingAlarm = false; alarm(); } }
function onExFS() { if (!X || !X.active || X.submitting || X.status !== 'MENGERJAKAN') return; if (!(document.fullscreenElement || document.webkitFullscreenElement) && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) violation('KELUAR_LAYAR_PENUH'); }
const VIOL_MSG = { PINDAH_TAB: 'Anda meninggalkan halaman ujian.', KELUAR_LAYAR_PENUH: 'Anda keluar dari layar penuh.', JENDELA_MENGAMBANG: 'Anda membuka jendela atau aplikasi lain (jendela mengambang / notifikasi / pencarian layar).', LAYAR_TERBAGI: 'Ujian dibuka dalam layar terbagi atau jendela kecil.', TANGKAP_LAYAR: 'Tangkapan layar terdeteksi.' };
/** Tanda air nama + NIS di atas soal: setiap tangkapan / foto layar langsung menunjukkan pemiliknya. */
function exWatermark() {
  const u = me(), raw = String(u.nama || '').slice(0, 34) + ' · ' + (u.nis_nip || u.username || '') + ' · ' + D.d(now());
  const t = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="220"><text x="10" y="130" transform="rotate(-24 210 110)" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="#64748B" fill-opacity=".16">' + t + '</text></svg>';
  return "url('data:image/svg+xml," + encodeURIComponent(svg).replace(/'/g, '%27') + "')";
}
const exTouch = () => !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
/** Fokus jendela hilang (jendela mengambang, notifikasi, pencarian layar, snipping) → soal langsung disembunyikan; lebih dari 2 detik = pelanggaran. */
function onExBlur() {
  if (!X || !X.active || X.status !== 'MENGERJAKAN' || X.submitting) return;
  X.guard.blur = true; exGuardPaint();
  clearTimeout(X.guard.t);
  X.guard.t = setTimeout(() => { if (X && X.active && X.guard.blur && !document.hasFocus() && !document.hidden) violation('JENDELA_MENGAMBANG'); }, 2000);
}
function onExFocus() { if (!X) return; X.guard.blur = false; clearTimeout(X.guard.t); exGuardPaint(); }
/** Layar terbagi / jendela kecil di HP & tablet: lebar jendela jauh lebih kecil dari layar. */
function exIsSmall() {
  if (!exTouch() || !screen || !screen.width) return false;
  const sw = Math.min(screen.width, screen.height), sh = Math.max(screen.width, screen.height), land = innerWidth > innerHeight;
  const wr = innerWidth / (land ? sh : sw), hr = innerHeight / (land ? sw : sh);
  const typing = document.activeElement && /TEXTAREA|INPUT/.test(document.activeElement.tagName);
  return wr < 0.8 || (!typing && hr < 0.45);
}
function onExResize() {
  if (!X || !X.active || X.status !== 'MENGERJAKAN') return;
  const small = exIsSmall();
  if (small === X.guard.small) return;
  X.guard.small = small; exGuardPaint(); clearTimeout(X.guard.st);
  if (small) X.guard.st = setTimeout(() => { if (X && X.active && X.guard.small) violation('LAYAR_TERBAGI'); }, 1000);
}
/** PrintScreen / pintasan tangkapan layar di laptop & PC lab. */
function onExKeyShot(e) {
  if (!X || !X.active || X.status !== 'MENGERJAKAN') return;
  const k = e.key || '', shot = k === 'PrintScreen' || e.keyCode === 44 || (e.metaKey && e.shiftKey && /^[345]$/.test(k)) || (e.shiftKey && (e.metaKey || e.key === 'Meta') && /^s$/i.test(k));
  if (!shot) return;
  try { e.preventDefault(); } catch (x) { /* abaikan */ }
  try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText('').catch(() => { /* izin papan klip ditolak */ }); } catch (x) { /* abaikan */ }
  if (e.type === 'keyup' || k !== 'PrintScreen') violation('TANGKAP_LAYAR');
}
function exGuardPaint() {
  const ex = $('#exam'); if (!ex || !X) return;
  const on = X.guard.blur || X.guard.small;
  ex.classList.toggle('ex-guard', !!on);
  const m = $('#exShieldMsg'); if (m) m.textContent = X.guard.small ? 'Ujian tidak boleh dikerjakan dalam layar terbagi / jendela mengambang. Kembalikan browser ke layar penuh.' : 'Kembali ke halaman ujian untuk melanjutkan. Membuka aplikasi atau jendela lain dihitung pelanggaran.';
}
let AC = null;
function ensureAudio() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } }
function alarm() {
  try { if (navigator.vibrate) navigator.vibrate([400, 150, 400, 150, 600]); } catch (e) { /* abaikan */ }
  if (!AC) return; ensureAudio();
  const t0 = AC.currentTime;
  [0, 0.35, 0.7].forEach((d) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'square'; o.frequency.value = 880; g.gain.setValueAtTime(0.0001, t0 + d); g.gain.exponentialRampToValueAtTime(0.25, t0 + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.28); o.connect(g); g.connect(AC.destination); o.start(t0 + d); o.stop(t0 + d + 0.3); });
}
function violation(jenis) {
  if (!X || X.status !== 'MENGERJAKAN' || X.submitting) return;
  const t = Date.now(); if (t - X.lastViol < 2500 || t - X.startedAt < 1500) return;
  X.lastViol = t; X.v++; saveExLocal();
  if (document.hidden) X.pendingAlarm = true; else alarm();
  const lockNow = X.v >= X.limit;
  if (lockNow) { X.status = 'TERKUNCI'; showLocked(); } else showViolation(jenis);
  call('exam.violation', { id: X.att.id, jenis, a: X.a, rg: Array.from(X.rg) }, { silent: true, retries: 3 }).then((r) => {
    if (!X) return; if (r.v !== undefined) X.v = Math.max(X.v, r.v);
    if (r.st === 'TERKUNCI' && X.status !== 'TERKUNCI') { X.status = 'TERKUNCI'; showLocked(); }
    const vp = $('#exViol'); if (vp) { vp.className = 'viol-pill on'; vp.innerHTML = `${I('alert', 'ic-sm')}Pelanggaran ${X.v}/${X.limit}`; }
  }).catch(() => { /* tercatat lokal, dikirim ulang lewat sinkron */ X.dirty = true; });
}
function showViolation(jenis) {
  hideOverlay();
  const o = document.createElement('div'); o.className = 'ex-overlay viol'; o.id = 'exOverlay';
  o.innerHTML = `<div class="shake">${I('shield-alert', 'ic-2x')}</div><h1>PELANGGARAN TERDETEKSI</h1><div class="cnt">${X.v} dari ${X.limit}</div>
    <p>${VIOL_MSG[jenis] || VIOL_MSG.PINDAH_TAB} Pelanggaran ke-${X.limit} akan mengunci ujian dan jawaban dikirim otomatis.</p>
    <p class="flex items-c g8" style="justify-content:center">${I('volume', 'ic-sm')}Alarm berbunyi</p>
    <button class="btn btn-white btn-lg mt24" style="color:#B91C1C" onclick="hideOverlay();requestFS();renderExam()">${I('arrow-l')}Kembali ke Ujian</button>`;
  document.body.appendChild(o);
}
function showLocked() {
  hideOverlay(); saveExLocal();
  const o = document.createElement('div'); o.className = 'ex-overlay lock'; o.id = 'exOverlay';
  o.innerHTML = `${I('lock', 'ic-2x')}<h1>Ujian Terkunci</h1><p>Batas pelanggaran tercapai. Jawaban Anda sudah dikirim otomatis. Hubungi pengawas untuk membuka kunci.</p><div class="cnt">${X.v}/${X.limit} pelanggaran</div>
    <p class="small mt16" style="opacity:.8">Halaman ini memeriksa status setiap 15 detik.</p><button class="btn btn-glass mt16" onclick="examSync(true)">${I('refresh')}Periksa sekarang</button>`;
  document.body.appendChild(o);
  X.timers.push(setInterval(() => { if (X && X.status === 'TERKUNCI') examSync(true); }, 15000));
}
function hideOverlay() { const o = $('#exOverlay'); if (o) o.remove(); }
function confirmFinish() {
  if (!X || X.status !== 'MENGERJAKAN') return;
  if (!canFinish()) { toast(`Tombol Selesai aktif ${X.tol} menit sebelum waktu habis (±${mmss(finLeft())} lagi). Gunakan waktu untuk memeriksa jawaban.`, 'warn', 5000); return; }
  closeAllSheets(); exClearToasts();
  const n = X.qs.length, kos = n - answeredCount(), rg = X.rg.size;
  confirmBox(kos || rg ? `Masih ada <b>${kos} soal kosong</b> dan <b>${rg} ragu-ragu</b>. Yakin mengirim jawaban sekarang?` : 'Semua soal sudah dijawab. Kirim jawaban sekarang? Jawaban tidak bisa diubah setelah dikirim.', { title: 'Kirim jawaban?', icon: 'send', yes: 'Kirim Jawaban', no: 'Periksa lagi', extra: kos ? `<button class="btn btn-ghost btn-sm mt12" onclick="closeAllSheets();setTimeout(openNavSheetEx,280)">${I('list', 'ic-sm')}Lihat soal yang belum dijawab</button>` : '' }).then((ok) => { if (ok) finishExam('SELESAI'); });
}
function finishExam(reason) {
  if (!X || X.submitting) return;
  X.submitting = true; saveExLocal();
  const s = sheet({ title: 'Mengirim jawaban', locked: true, body: `<div class="tc" style="padding:20px"><div class="ring" style="border-color:var(--p100);border-top-color:var(--p600);margin:0 auto"></div><h3 class="mt16">${reason === 'WAKTU' ? 'Waktu habis — mengirim jawaban…' : 'Mengirim jawaban…'}</h3><p class="small muted mt8">Jangan tutup aplikasi.</p></div>` });
  const send = (n) => call('exam.submit', { id: X.att.id, ulangan_id: X.ul.ulangan_id, a: X.a, rg: Array.from(X.rg), reason }, { silent: true, retries: 6 }).then((r) => { s.close(); completeExam(r); })
    .catch((e) => { if (n < 20 && (e.code === 'NET' || e.code === 'BUSY')) { setTimeout(() => send(n + 1), Math.min(15000, 2000 * (n + 1))); s.el.querySelector('h3').textContent = 'Menunggu koneksi… jawaban aman di perangkat'; } else { s.close(); X.submitting = false; failToast(e); } });
  send(0);
}
function completeExam(r) {
  const u = X.u;
  u.my = Object.assign(u.my || {}, { status: r.status || 'SELESAI', nilai: r.nilai, nilaiObj: r.nilaiObj, status_nilai: r.status_nilai });
  LS.del(exKey(X.att.id)); LS.del('sp_ex_active'); saveSnap();
  exitExam(false);
  showResult(r, u);
}
function exitExam(silent) {
  if (!X) return;
  X.active = false; X.timers.forEach((t) => { clearInterval(t); clearTimeout(t); });
  document.removeEventListener('visibilitychange', onExVisibility); document.removeEventListener('fullscreenchange', onExFS); document.removeEventListener('webkitfullscreenchange', onExFS);
  document.removeEventListener('keydown', exKeyDown); window.removeEventListener('pagehide', saveExLocal); clearTimeout(X.saveT);
  window.removeEventListener('blur', onExBlur); window.removeEventListener('focus', onExFocus); window.removeEventListener('resize', onExResize);
  document.removeEventListener('keyup', onExKeyShot, true); document.removeEventListener('keydown', onExKeyShot, true); clearTimeout(X.guard && X.guard.t); clearTimeout(X.guard && X.guard.st);
  window.onbeforeunload = null; hideOverlay();
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* abaikan */ }
  $('#exam').hidden = true; $('#exam').innerHTML = '';
  X = null;
  if (!silent) { $('#shell').hidden = false; renderChrome(); rerender(); }
}
function showResult(r, u) {
  const show = r.show && r.nilaiObj !== null && r.nilaiObj !== undefined;
  sheet({ title: '', size: '', body: `<div class="tc"><div class="tile lg ok" style="margin:0 auto;width:68px;height:68px">${I('check-c', 'ic-xl')}</div><h2 class="mt12">Jawaban Terkirim</h2><p class="muted small">${esc(u.judul)}</p>
    ${show ? `<div class="mt16">${CH.ring(r.nilaiObj, 100, { c: r.nilaiObj >= myKkm() ? '#16A34A' : '#D97706' })}</div><div class="small muted mt4">${r.adaEsai ? 'Nilai pilihan ganda' : 'Nilai akhir'}</div>
      <div class="grid gc3 mt16" style="grid-template-columns:repeat(3,1fr)"><div class="card" style="padding:10px"><div class="xs muted">Benar</div><div class="b7 ink-ok">${r.benar}</div></div><div class="card" style="padding:10px"><div class="xs muted">Salah</div><div class="b7 ink-err">${r.salah}</div></div><div class="card" style="padding:10px"><div class="xs muted">Durasi</div><div class="b7">${r.selesai && r.mulai ? Math.round((r.selesai - r.mulai) / 60000) + ' mnt' : '-'}</div></div></div>` : `<div class="banner banner-info mt16">${I('info')}<div>Nilai akan diumumkan oleh guru.</div></div>`}
    ${r.adaEsai && r.status_nilai === 'MENUNGGU_KOREKSI' ? `<div class="banner banner-vio mt16" style="text-align:left">${I('pen')}<div>Nilai esai menunggu koreksi guru — nilai akhir menyusul.</div></div>` : ''}
    ${r.status === 'TERKUNCI' ? `<div class="banner banner-warn mt16" style="text-align:left">${I('lock')}<div>Ujian terkunci karena pelanggaran. Jawaban terakhir sudah tersimpan.</div></div>` : ''}</div>`,
  foot: `<button class="btn btn-primary btn-lg btn-block" onclick="closeAllSheets();go('s-home')">${I('home')}Kembali ke Beranda</button>` });
}
function resumeExamIfAny() {
  const a = LS.get('sp_ex_active', null);
  if (!a || a.u !== me().user_id || !hasRole('SISWA')) return;
  const ul = SW().ulangan.find((x) => x.ulangan_id === a.ulangan_id);
  if (!ul || (ul.my && ul.my.status === 'SELESAI')) { LS.del('sp_ex_active'); return; }
  setTimeout(() => confirmBox(`Ujian <b>${esc(ul.judul)}</b> belum selesai. Lanjutkan sekarang? Waktu tetap berjalan.`, { title: 'Lanjutkan ujian', icon: 'timer', yes: 'Lanjutkan', no: 'Nanti' }).then((ok) => { if (ok) startExamFlow(ul.ulangan_id); }), 300);
}
(window.__SP_F__ = window.__SP_F__ || {}).siswa = 1;
