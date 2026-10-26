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
  render() {
    const u = me(), sw = SW(), t = now();
    const belum = sw.tugas.filter((x) => !x.my).sort(by('tenggat'));
    const aktif = sw.ulangan.filter((x) => ulStatus(x).k === 'AKTIF' && (!x.my || x.my.status === 'MENGERJAKAN'));
    const soon = sw.ulangan.filter((x) => ulStatus(x).k === 'JADWAL' && x.buka - t < 3 * 864e5);
    const mapels = uniqPen(sw.penugasan);
    const agenda = (B().agenda || []).filter((a) => a.selesai >= t).slice(0, 8);
    const pendingByMapel = {}; belum.forEach((x) => { pendingByMapel[x.mapel_id] = (pendingByMapel[x.mapel_id] || 0) + 1; });
    const desk = window.innerWidth >= 1024;
    const ta = B().ta;
    return `<div class="${desk ? 'page' : ''}" style="${desk ? '' : 'padding:0'}">
      <div class="s-hero grad grad-pattern" style="${desk ? 'border-radius:24px' : ''}">
        <div class="top">${logoHTML('sm')}<b style="font-family:var(--f-head);font-size:16px" class="f1 truncate">${esc(shortName(cfg().nama_aplikasi).split(' ')[0])}</b>
          <button class="round" onclick="openNotif()" aria-label="Notifikasi">${I('bell')}${unreadCount() ? `<span class="badge">${unreadCount()}</span>` : ''}</button>
          <button onclick="go('akun')" style="border-radius:50%;border:2px solid rgba(255,255,255,.6)">${avatar(u.nama, u.foto)}</button></div>
        <div class="greet">${D.greet()},</div><h1>Halo, ${esc(u.nama)}</h1>
        <div class="meta">${I('door', 'ic-sm')}Kelas ${esc(kelasNm(u.kelas_id))}${ta ? ' · Semester ' + esc(ta.semester) + ' ' + esc(ta.nama) : ''}</div>
        <label class="s-search">${I('search')}<input placeholder="Cari materi, tugas, atau ujian…" oninput="homeSearch(this.value)" id="homeQ"></label>
      </div>
      <div class="s-stats" style="${desk ? 'margin-left:24px;margin-right:24px' : ''}">
        <button class="card" onclick="go('s-tugas')" style="text-align:left"><div><div class="small tx2">Tugas Belum</div><div class="flex items-e g6 mt4"><span class="big">${belum.length}</span><span class="small bold ink-err">${belum.length ? 'Perlu Aksi' : 'Aman'}</span></div></div><div class="tile warn">${I('clipboard')}</div></button>
        <button class="card" onclick="go('s-ujian')" style="text-align:left"><div><div class="small tx2">Ujian Aktif</div><div class="flex items-e g6 mt4"><span class="big ink-p">${aktif.length}</span><span class="small bold ink-p">Tersedia</span></div></div><div class="tile">${I('exam')}</div></button>
      </div>
      <div id="homeResults"></div>
      <div style="padding:0 16px 8px;${desk ? 'padding:0' : ''}" id="homeMain">
        ${resumeBanner()}
        <div class="sect-title"><h2>Belum Dikerjakan</h2><a class="ml-a" href="javascript:void(0)" onclick="go('s-tugas')">Lihat Semua ${I('chev-r', 'ic-sm')}</a></div>
        <div class="grid ${desk ? 'gc2' : ''}">${aktif.map(examCard).join('')}${belum.slice(0, desk ? 6 : 4).map(taskCard).join('')}
          ${!aktif.length && !belum.length ? `<div class="card">${emptyState('check-c', 'Semua tugas sudah selesai', 'Tidak ada tugas atau ujian yang menunggu. Pertahankan!')}</div>` : ''}</div>
        ${soon.length ? `<div class="sect-title"><h2>Ujian Akan Datang</h2></div><div class="grid ${desk ? 'gc2' : ''}">${soon.map(examCard).join('')}</div>` : ''}
        <div class="sect-title"><h2>Mata Pelajaran</h2><span class="ml-a small muted">${esc(kelasNm(u.kelas_id))}</span></div>
        <div class="mapel-grid">${mapels.map((p) => `<button class="mapel-tile" onclick="go('s-mapel-d',{mapel_id:'${p.mapel_id}'})">${pendingByMapel[p.mapel_id] ? `<span class="badge">${pendingByMapel[p.mapel_id]}</span>` : ''}${mapelIcon(p.mapel_id)}<span class="nm">${esc(mapelNm(p.mapel_id))}</span><span class="gr truncate">${esc(shortGuru(p.guru))}</span></button>`).join('') || `<div class="muted small">Belum ada mapel.</div>`}</div>
        <div class="sect-title"><h2>Agenda Terdekat</h2><a class="ml-a" href="javascript:void(0)" onclick="go('agenda')">${I('calendar')}</a></div>
        ${agenda.length ? `<div class="hscroll">${agenda.map((a) => agendaCard(a)).join('')}</div>` : `<div class="card">${emptyState('calendar', 'Belum ada agenda', 'Agenda sekolah untuk kelasmu akan tampil di sini.')}</div>`}
        <div style="height:24px"></div>
      </div></div>`;
  }
});
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
      ${graded && mine ? `<div class="card card-p mt16"><div class="flex items-c g24 wrap">${CH.ring(mine.nilai, t.nilai_maks, { text: fmtN(mine.nilai), c: mine.nilai / t.nilai_maks >= cfg().kkm / 100 ? '#16A34A' : '#D97706' })}<div class="f1" style="min-width:220px"><div class="small muted">Nilai dari guru · maks ${t.nilai_maks}</div><h2 class="mt4">${mine.nilai / t.nilai_maks * 100 >= (cfg().kkm || 75) ? 'Tuntas' : 'Perlu perbaikan'}</h2>${mine.komentar ? `<div class="banner banner-info mt12">${I('message')}<div><b>Komentar guru</b><div class="pre mt4">${esc(mine.komentar)}</div></div></div>` : ''}</div></div></div>` : ''}
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
    dirty: !!local, lastSync: Date.now(), lastViol: 0, syncing: false, timers: [], status: d.attempt.status, startedAt: Date.now(), navOpen: false
  };
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
  X.timers.push(setInterval(tickExam, 1000));
  scheduleSync();
  window.onbeforeunload = () => { if (X && X.active) { saveExLocal(); return 'Ujian sedang berlangsung.'; } };
}
const blockEv = (e) => { if (!(e.target && /TEXTAREA|INPUT/.test(e.target.tagName))) e.preventDefault(); };
function saveExLocal() { if (!X) return; LS.set(exKey(X.att.id), { a: X.a, rg: Array.from(X.rg), idx: X.idx, v: X.v, t: Date.now() }); }
function exRemaining() { return X.batas - (Date.now() + X.off); }
function answeredCount() { return X.qs.filter((q) => isAnswered(q)).length; }
function isAnswered(q) { const v = X.a[q.id]; if (v === undefined || v === null || v === '') return false; if (Array.isArray(v)) return v.filter((x) => x !== null && x !== '').length > 0; return true; }
function renderExam() {
  const q = X.qs[X.idx], n = X.qs.length, rem = exRemaining();
  const off = !navigator.onLine;
  $('#exam').innerHTML = `${off ? `<div class="offline-bar">${I('wifi-off', 'ic-sm')}Sinyal terputus — jawaban aman tersimpan di perangkat</div>` : ''}
    <div class="ex-top"><div class="flex items-s jc-b g12" style="max-width:1240px;margin:0 auto"><div class="f1" style="min-width:0"><div class="lbl">CBT ${esc(shortName(cfg().nama_aplikasi).split(' ')[0])}</div><h2 class="truncate">${esc(X.ul.judul)}</h2><div class="small muted">${esc(mapelNm(X.ul.mapel_id))} · ${n} Soal</div></div>
      <div class="col items-e g6"><div class="timer ${rem < 300000 ? 'err' : rem < 600000 ? 'warn' : ''}" id="exTimer">${I('clock')}<span>${D.clock(rem)}</span></div><span class="viol-pill ${X.v ? 'on' : ''}" id="exViol">${I('alert', 'ic-sm')}Pelanggaran ${X.v}/${X.limit}</span></div></div>
      <div class="ex-sub" style="max-width:1240px;margin:10px auto 0"><span class="sync-dot ${X.syncing ? 'busy' : off ? 'off' : ''}" id="exSync">${X.dirty ? 'Tersimpan di perangkat' : 'Tersimpan otomatis · ' + D.t(X.lastSync) + ' ' + TZL}</span><span class="mono xs muted">NIS: ${esc(me().nis_nip || '')}</span></div></div>
    <div class="ex-body"><div>
      <div class="q-card"><div class="flex items-c g12 wrap jc-b"><span class="q-no">SOAL ${q.no} DARI ${n}</span><span class="small tx2">${TIPE_SOAL[q.tipe]}</span><span class="pill pill-info">Bobot: ${fmtN(q.bobot)} poin</span></div>
        <div class="divider"></div><div class="q-text">${esc(q.teks)}</div>
        ${q.img ? `<img class="q-img" src="${esc(q.img)}" alt="Gambar soal" onclick="previewPublic('Gambar soal ${q.no}','','IMG');setTimeout(()=>{const im=$('.sheet-bd img');if(im)im.src='${esc(q.img)}'},30)">` : ''}
        ${q.tipe === 'MCMA' ? `<div class="banner banner-info mt16" style="padding:10px 12px">${I('checkbox', 'ic-sm')}<span>Pilih lebih dari satu jawaban${q.n ? ` (${q.n} jawaban benar)` : ''}.</span></div>` : ''}
      </div>
      ${answerArea(q)}
      <p class="tc small muted mt16">${I('info', 'ic-sm')} Ketuk pilihan untuk menyimpan jawaban seketika</p>
    </div>
    <aside class="ex-side only-lg">${navPanel()}</aside></div>
    <div class="ex-bottom"><button class="navpill" onclick="openNavSheetEx()">${I('grid', 'ic-sm')}Nomor Soal ${I('chev-u', 'ic-sm')} <span class="mono">(${answeredCount()}/${n})</span></button>
      <div class="row"><button class="btn btn-secondary btn-lg" onclick="exNav(-1)" ${X.idx === 0 ? 'disabled' : ''}>${I('chev-l')}<span>Sebelumnya</span></button>
        <button class="btn ${X.rg.has(q.id) ? 'btn-warn-o' : 'btn-secondary'} btn-lg" style="${X.rg.has(q.id) ? 'background:var(--warn);color:#fff;border-color:var(--warn)' : 'color:var(--warn-x);border-color:#FCD34D;background:var(--warn-t)'}" onclick="toggleRagu()">${I('flag')}<span>Ragu-ragu</span></button>
        ${X.idx === n - 1 ? `<button class="btn btn-ok btn-lg" onclick="confirmFinish()">${I('check')}<span>Selesai</span></button>` : `<button class="btn btn-primary btn-lg" onclick="exNav(1)"><span>Berikutnya</span>${I('chev-r')}</button>`}</div></div>`;
}
function answerArea(q) {
  const v = X.a[q.id];
  if (q.tipe === 'PG') return `<div class="opts">${q.opsi.map((o, i) => `<button class="opt ${v === o.k ? 'sel' : ''}" onclick="ansPG('${q.id}','${o.k}')"><span class="lt">${'ABCDE'[i]}</span><span class="f1 pre">${esc(o.t)}</span>${I('check-c', 'ck ic-lg')}</button>`).join('')}</div>`;
  if (q.tipe === 'MCMA') { const sel = Array.isArray(v) ? v : []; return `<div class="opts">${q.opsi.map((o, i) => `<button class="opt mc ${sel.indexOf(o.k) >= 0 ? 'sel' : ''}" onclick="ansMC('${q.id}','${o.k}')"><span class="lt">${sel.indexOf(o.k) >= 0 ? I('check', 'ic-sm') : 'ABCDE'[i]}</span><span class="f1 pre">${esc(o.t)}</span>${I('check-c', 'ck ic-lg')}</button>`).join('')}</div>`; }
  if (q.tipe === 'KATEGORI') { const sel = Array.isArray(v) ? v : []; return `<table class="cat-tbl"><thead><tr><th>Pernyataan</th>${q.kat.map((k) => `<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${q.pern.map((p, i) => `<tr><td>${esc(p)}</td>${q.kat.map((k, ki) => `<td class="rc ${sel[i] === k ? 'on' : ''}" onclick="ansKat('${q.id}',${i},${ki})"><span class="rdo"></span></td>`).join('')}</tr>`).join('')}</tbody></table>`; }
  return `<div class="q-card mt16"><textarea class="textarea" id="esaiBox" style="min-height:200px;font-size:16px" maxlength="5000" placeholder="Tulis jawaban esai di sini…" oninput="ansEsai('${q.id}',this.value)">${esc(v || '')}</textarea><div class="flex jc-b small muted mt8"><span>${I('cloud-ok', 'ic-sm')} Tersimpan otomatis</span><span id="esaiCnt">${String(v || '').length}/5000</span></div></div>`;
}
function navPanel() {
  const n = X.qs.length, ans = answeredCount(), rg = X.qs.filter((q) => X.rg.has(q.id)).length;
  return `<div class="card card-p"><div class="flex items-c jc-b"><h3>Nomor Soal</h3><span class="mono small">${ans}/${n}</span></div><div class="meter mt8"><i style="width:${ans / n * 100}%"></i></div>
    <div class="navgrid mt16">${X.qs.map((q, i) => `<button class="nb ${X.rg.has(q.id) ? 'rg' : isAnswered(q) ? 'ans' : ''} ${i === X.idx ? 'cur' : ''}" onclick="exGo(${i})">${i + 1}</button>`).join('')}</div>
    <div class="legend"><span><i style="background:var(--p600);border-color:var(--p600)"></i>Dijawab (${ans - X.qs.filter((q) => X.rg.has(q.id) && isAnswered(q)).length})</span><span><i></i>Belum (${n - ans})</span><span><i style="background:var(--warn);border-color:var(--warn)"></i>Ragu (${rg})</span></div>
    <button class="btn btn-ok btn-block mt16" onclick="confirmFinish()">${I('check')}Selesai & Kirim</button></div>`;
}
function openNavSheetEx() { sheet({ title: 'Nomor Soal', body: navPanel().replace('class="card card-p"', 'class=""') }); }
function exGo(i) { closeAllSheets(); X.idx = clamp(i, 0, X.qs.length - 1); saveExLocal(); renderExam(); window.scrollTo(0, 0); $('#exam').scrollTo(0, 0); }
function exNav(d) { exGo(X.idx + d); }
function setAns(qid, v) { X.a[qid] = v; X.dirty = true; saveExLocal(); }
function ansPG(qid, k) { setAns(qid, X.a[qid] === k ? '' : k); refreshAnswer(); }
function ansMC(qid, k) { const s = Array.isArray(X.a[qid]) ? X.a[qid].slice() : []; const i = s.indexOf(k); if (i >= 0) s.splice(i, 1); else s.push(k); setAns(qid, s.sort()); refreshAnswer(); }
function ansKat(qid, i, ki) { const q = X.qs.find((x) => x.id === qid), k = q.kat[ki]; const s = Array.isArray(X.a[qid]) ? X.a[qid].slice() : q.pern.map(() => null); s[i] = s[i] === k ? null : k; setAns(qid, s); refreshAnswer(); }
const ansEsai = (qid, val) => { X.a[qid] = val; X.dirty = true; const c = $('#esaiCnt'); if (c) c.textContent = val.length + '/5000'; saveEsaiDeb(); };
const saveEsaiDeb = debounce(() => { saveExLocal(); updateExChrome(); }, 400);
function refreshAnswer() {   // render sebagian saja agar instan
  const q = X.qs[X.idx], body = $('#exam .ex-body > div');
  const old = body.querySelector('.opts, .cat-tbl'); if (old) old.outerHTML = answerArea(q);
  updateExChrome();
}
function updateExChrome() {
  const side = $('#exam .ex-side'); if (side) side.innerHTML = navPanel();
  const np = $('#exam .navpill .mono'); if (np) np.textContent = `(${answeredCount()}/${X.qs.length})`;
  const sy = $('#exSync'); if (sy) { sy.className = 'sync-dot ' + (X.syncing ? 'busy' : !navigator.onLine ? 'off' : ''); sy.textContent = X.dirty ? 'Tersimpan di perangkat' : 'Tersimpan otomatis · ' + D.t(X.lastSync) + ' ' + TZL; }
}
function toggleRagu() { const q = X.qs[X.idx]; if (X.rg.has(q.id)) X.rg.delete(q.id); else X.rg.add(q.id); X.dirty = true; saveExLocal(); renderExam(); }
function tickExam() {
  if (!X || !X.active) return;
  const rem = exRemaining(), el = $('#exTimer');
  if (el) { el.querySelector('span').textContent = D.clock(rem); el.className = 'timer ' + (rem < 300000 ? 'err' : rem < 600000 ? 'warn' : ''); }
  if (rem <= 0 && X.status === 'MENGERJAKAN' && !X.submitting) finishExam('WAKTU');
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
    <p>${jenis === 'KELUAR_LAYAR_PENUH' ? 'Anda keluar dari layar penuh.' : 'Anda meninggalkan halaman ujian.'} Pelanggaran ke-${X.limit} akan mengunci ujian dan jawaban dikirim otomatis.</p>
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
  const n = X.qs.length, kos = n - answeredCount(), rg = X.rg.size;
  confirmBox(kos || rg ? `Masih ada <b>${kos} soal kosong</b> dan <b>${rg} ragu-ragu</b>. Yakin mengirim jawaban sekarang?` : 'Semua soal sudah dijawab. Kirim jawaban sekarang? Jawaban tidak bisa diubah setelah dikirim.', { title: 'Kirim jawaban?', icon: 'send', yes: 'Kirim Jawaban', no: 'Periksa lagi' }).then((ok) => { if (ok) finishExam('SELESAI'); });
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
  window.onbeforeunload = null; hideOverlay();
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* abaikan */ }
  $('#exam').hidden = true; $('#exam').innerHTML = '';
  X = null;
  if (!silent) { $('#shell').hidden = false; renderChrome(); rerender(); }
}
function showResult(r, u) {
  const show = r.show && r.nilaiObj !== null && r.nilaiObj !== undefined;
  sheet({ title: '', size: '', body: `<div class="tc"><div class="tile lg ok" style="margin:0 auto;width:68px;height:68px">${I('check-c', 'ic-xl')}</div><h2 class="mt12">Jawaban Terkirim</h2><p class="muted small">${esc(u.judul)}</p>
    ${show ? `<div class="mt16">${CH.ring(r.nilaiObj, 100, { c: r.nilaiObj >= (cfg().kkm || 75) ? '#16A34A' : '#D97706' })}</div><div class="small muted mt4">${r.adaEsai ? 'Nilai pilihan ganda' : 'Nilai akhir'}</div>
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
