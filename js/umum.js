'use strict';
// ════════════════════════════════════════════════════════
// BAGIAN 16: PRESENSI, WALI KELAS, AGENDA, LAPORAN, AKUN
// ════════════════════════════════════════════════════════
/** Kelas yang boleh dilihat pengguna (admin: semua; guru: kelas ajar + perwalian). */
function myKelasIds() {
  if (hasRole('ADMIN')) return (B().kelas || []).map((k) => k.kelas_id);
  const s = {}; G().penugasan.forEach((p) => { s[p.kelas_id] = 1; }); (me().waliKelas || []).forEach((k) => { s[k] = 1; });
  return (B().kelas || []).map((k) => k.kelas_id).filter((k) => s[k]);
}
const waLink = (no, text) => `https://wa.me/${String(no || '').replace(/\D/g, '').replace(/^0/, '62')}${text ? '?text=' + encodeURIComponent(text) : ''}`;
const ATT_L = { H: 'Hadir', S: 'Sakit', I: 'Izin', A: 'Alpa' };

// ── Presensi siswa (per pertemuan / harian wali kelas) ──
route('g-absensi', {
  title: 'Presensi Siswa', roles: ['GURU', 'ADMIN'], form: true,
  render(p) {
    const g = G(), c = cfg(), wk = me().waliKelas || [];
    const canHarian = !!c.absensi_harian && (wk.length > 0 || hasRole('ADMIN'));
    const F = S.c.absF || (S.c.absF = { jenis: 'PERTEMUAN', pid: '', kelas: '', tgl: D.ymd(now()) });
    if (p.pid && S.c.absP !== S.rk) { F.pid = p.pid; F.jenis = 'PERTEMUAN'; S.c.absP = S.rk; }
    if (!canHarian) F.jenis = 'PERTEMUAN';
    const pens = g.penugasan.slice().sort(by((x) => kelasNm(x.kelas_id) + mapelNm(x.mapel_id)));
    const kelasH = hasRole('ADMIN') ? (B().kelas || []).map((k) => k.kelas_id) : wk;
    if (!pens.length && !canHarian) return `<div class="page"><div class="page-hd"><div><h1>Presensi Siswa</h1></div></div><div class="card">${emptyState('door', 'Belum ada penugasan mengajar', 'Admin perlu menambahkan penugasan mengajar Anda di menu Data Akademik.')}</div></div>`;
    if (F.jenis === 'PERTEMUAN' && !pens.some((x) => x.penugasan_id === F.pid)) F.pid = (pens[0] || {}).penugasan_id || '';
    if (F.jenis === 'HARIAN' && kelasH.indexOf(F.kelas) < 0) F.kelas = kelasH[0] || '';
    const pen = pens.find((x) => x.penugasan_id === F.pid), kid = F.jenis === 'PERTEMUAN' ? (pen || {}).kelas_id : F.kelas;
    if (!kid) return `<div class="page">${emptyState('door', 'Pilih kelas', '')}</div>`;
    const key = [F.jenis, kid, F.jenis === 'PERTEMUAN' ? F.pid : '', F.tgl].join('|');
    const ent = S.c['abs_' + key], d = need('abs_' + key, 'absensi.get', { kelas_id: kid, penugasan_id: F.jenis === 'PERTEMUAN' ? F.pid : '', tanggal: F.tgl, jenis: F.jenis }, 120000);
    const today = D.ymd(now()), isToday = F.tgl === today, dt = new Date(F.tgl + 'T00:00:00');
    const head = `<div class="page-hd"><div><h1>Presensi Siswa</h1><p class="sub">${F.jenis === 'HARIAN' ? 'Absensi harian wali kelas' : 'Absensi per pertemuan mata pelajaran'} · ${HARI_P[dt.getDay()]}, ${dt.getDate()} ${BULAN[dt.getMonth()]} ${dt.getFullYear()}</p></div>
      ${canHarian ? `<div class="seg">${[['PERTEMUAN', 'Per Pertemuan'], ['HARIAN', 'Harian (Wali)']].map((x) => `<button class="${F.jenis === x[0] ? 'on' : ''}" onclick="S.c.absF.jenis='${x[0]}';rerender()">${x[1]}</button>`).join('')}</div>` : ''}</div>
      <div class="card card-p flex g12 wrap items-e">
        ${F.jenis === 'PERTEMUAN' ? `<div class="field f1" style="min-width:220px"><label class="label">Kelas & mata pelajaran</label><select class="select" onchange="absPick('pid',this.value)">${uniqBy(pens, (x) => x.kelas_id).map((k) => `<optgroup label="${esc(kelasNm(k.kelas_id))}">${pens.filter((x) => x.kelas_id === k.kelas_id).map((x) => `<option value="${x.penugasan_id}" ${x.penugasan_id === F.pid ? 'selected' : ''}>${esc(mapelNm(x.mapel_id))} · ${esc(kelasShort(x.kelas_id))}${hasRole('ADMIN') && x.guru ? ' — ' + esc(shortGuru(x.guru)) : ''}</option>`).join('')}</optgroup>`).join('')}</select></div>`
        : `<div class="field f1" style="min-width:200px"><label class="label">Kelas perwalian</label><select class="select" onchange="absPick('kelas',this.value)">${kelasH.map((k) => `<option value="${k}" ${k === F.kelas ? 'selected' : ''}>${esc(kelasNm(k))}</option>`).join('')}</select></div>`}
        <div class="field"><label class="label">Tanggal</label><div class="flex g4 items-c"><button class="icon-btn" onclick="absDay(-1)" aria-label="Hari sebelumnya">${I('chev-l')}</button><input class="input" type="date" value="${F.tgl}" max="${today}" onchange="absPick('tgl',this.value)" style="width:160px"><button class="icon-btn" onclick="absDay(1)" ${isToday ? 'disabled' : ''} aria-label="Hari berikutnya">${I('chev-r')}</button>${isToday ? '' : `<button class="btn btn-ghost btn-sm" onclick="absPick('tgl','${today}')">Hari ini</button>`}</div></div></div>`;
    if (!d) return `<div class="page">${head}<div class="mt16">${ent && ent.err ? emptyState('alert', 'Gagal memuat presensi', esc(ent.err.message), `<button class="btn btn-secondary" onclick="drop('abs_');rerender()">${I('refresh')}Coba lagi</button>`) : skelCards(4, 30)}</div></div>`;
    const EE = S.c.absE || (S.c.absE = {});
    let E = EE[key];
    if (!E || (!E.dirty && E.src !== ent.t)) {
      E = EE[key] = { data: {}, dirty: false, src: ent.t };
      d.siswa.forEach((s) => { E.data[s.user_id] = d.data[s.user_id] || 'H'; });
    }
    const ro = !d.canEdit;
    return `<div class="page">${head}
      <div class="grid gc5 mt16" id="absCnt">${absCounts(E, d.siswa.length)}</div>
      <div class="card mt16"><div class="card-hd" style="flex-wrap:wrap"><div><h3>${esc(F.jenis === 'HARIAN' ? kelasNm(kid) : penLabel(pen))}</h3><p class="small muted">${d.record ? `Pertemuan ke-${d.pertemuanKe} · Tersimpan oleh ${esc(d.record.dicatat_oleh)} ${D.ago(d.record.waktu)}` : `Pertemuan ke-${d.pertemuanKe} · Belum diisi`} · ${d.siswa.length} siswa</p></div>
          <div class="flex g8 wrap">${ro ? pill('Hanya baca', 'neu', 'lock') : `<button class="btn btn-secondary btn-sm" onclick="absAll('${key}','H')">${I('check-c', 'ic-sm')}Semua Hadir</button>`}</div></div>
        ${ro ? `<div class="banner banner-warn" style="margin:12px 16px 0">${I('lock')}<div>Batas ubah presensi (7 hari) sudah lewat. Hubungi Admin bila perlu koreksi.</div></div>` : ''}
        ${d.siswa.length ? `<div>${d.siswa.map((s, i) => { const raw = E.data[s.user_id] || 'H', st = raw.charAt(0), ket = raw.split('|').slice(1).join('|'), alpa = d.alpa[s.user_id] || 0;
          return `<div class="row-item" data-sid="${s.user_id}" style="flex-wrap:wrap"><span class="mono xs muted" style="width:22px">${i + 1}</span>${avatar(s.nama, s.foto, 'sm')}<div class="f1" style="min-width:150px"><div class="bold truncate">${esc(s.nama)}</div><div class="mono xs muted">${esc(s.nis_nip || '')}${alpa ? ` · <span class="ink-err bold">Alpa ${alpa}x semester ini</span>` : ''}</div></div>
            <div class="flex g8 items-c wrap jc-e" style="margin-left:auto"><input class="input input-sm abs-ket" style="width:200px" placeholder="Keterangan (opsional)" value="${esc(ket)}" ${st === 'H' ? 'hidden' : ''} ${ro ? 'disabled' : ''} oninput="absKet('${key}','${s.user_id}',this.value)">
            <div class="att-seg" role="radiogroup" aria-label="Status ${esc(s.nama)}">${['H', 'S', 'I', 'A'].map((k) => `<button type="button" class="${k} ${st === k ? 'on' : ''}" title="${ATT_L[k]}" ${ro ? 'disabled' : ''} onclick="absSet('${key}','${s.user_id}','${k}')">${k}</button>`).join('')}</div></div></div>`; }).join('')}</div>` : `<div class="card-bd">${emptyState('users', 'Belum ada siswa di kelas ini', 'Admin perlu menambahkan siswa ke kelas.')}</div>`}</div>
      ${ro || !d.siswa.length ? '' : `<div class="sticky-bar"><span class="small f1" id="absState">${E.dirty ? `${I('alert', 'ic-sm ink-warn')} Ada perubahan belum disimpan` : d.record ? `${I('check-c', 'ic-sm ink-ok')} Tersimpan` : 'Status awal: semua Hadir'}</span>
        ${F.jenis === 'PERTEMUAN' ? `<label class="check small"><input type="checkbox" id="absWali" ${LS.get('sp_abs_wali', true) ? 'checked' : ''} onchange="LS.set('sp_abs_wali',this.checked)">Kabari wali kelas</label>` : ''}
        <button class="btn btn-primary btn-lg" onclick="absSave('${key}')">${I('check')}Simpan Presensi</button></div>`}</div>`;
  },
  mount() { ROUTES['g-absensi'].leave = () => { const EE = S.c.absE || {}; Object.keys(EE).forEach((k) => { if (EE[k].dirty) absSave(k, true); }); }; }
});
function absCounts(E, n) {
  const c = { H: 0, S: 0, I: 0, A: 0 }; Object.keys(E.data).forEach((k) => { c[E.data[k].charAt(0)]++; });
  const tone = { H: 'ok', S: 'p', I: 'warn', A: 'err' }, ic = { H: 'check-c', S: 'alert-c', I: 'info', A: 'x' };
  return statCard('Kehadiran', n ? fmtN(c.H / n * 100) + '%' : '-', '', `${c.H} dari ${n} siswa`, 'users', 'p') + ['H', 'S', 'I', 'A'].map((k) => statCard(ATT_L[k], c[k], 'siswa', '', ic[k], c[k] || k === 'H' ? tone[k] : '')).join('');
}
function absPick(k, v) { S.c.absF[k] = v; rerender(); }
function absDay(dl) { const F = S.c.absF, t = new Date(F.tgl + 'T00:00:00').getTime() + dl * 864e5; if (t > now()) return; F.tgl = D.ymd(t); rerender(); }
function absMark(key) {
  const E = S.c.absE[key]; E.dirty = true;
  const box = $('#absCnt'); if (box) box.innerHTML = absCounts(E, Object.keys(E.data).length);
  const st = $('#absState'); if (st) st.innerHTML = `${I('alert', 'ic-sm ink-warn')} Ada perubahan belum disimpan`;
}
function absSet(key, sid, k) {
  const E = S.c.absE[key], ket = (E.data[sid] || '').split('|').slice(1).join('|');
  E.data[sid] = k === 'H' ? 'H' : k + (ket ? '|' + ket : '');
  const row = $(`.row-item[data-sid="${sid}"]`);
  if (row) { $$('.att-seg button', row).forEach((b) => b.classList.toggle('on', b.textContent === k)); const inp = $('.abs-ket', row); inp.hidden = k === 'H'; if (k === 'H') inp.value = ''; else if (k === 'A' || k === 'S' || k === 'I') setTimeout(() => { if (!inp.value) inp.focus(); }, 0); }
  absMark(key);
}
function absKet(key, sid, v) { const E = S.c.absE[key], st = (E.data[sid] || 'H').charAt(0); E.data[sid] = st + (v.trim() ? '|' + v.trim().replace(/\|/g, '/') : ''); absMark(key); }
function absAll(key, k) { const E = S.c.absE[key]; Object.keys(E.data).forEach((sid) => { E.data[sid] = k; }); E.dirty = true; rerender(); toast('Semua siswa ditandai ' + ATT_L[k] + '.', 'ok', 1800); }
function absSave(key, quiet) {
  const E = S.c.absE[key], ent = S.c['abs_' + key]; if (!E || !ent || !ent.d) return;
  const [jenis, kid, pid, tgl] = key.split('|'), d = ent.d, prev = { rec: d.record, data: d.data };
  const data = Object.assign({}, E.data), cnt = { H: 0, S: 0, I: 0, A: 0 }; Object.keys(data).forEach((k) => { cnt[data[k].charAt(0)]++; });
  // Optimistic: anggap tersimpan, sinkron di latar
  d.data = data; d.record = { ringkasan: `H:${cnt.H},S:${cnt.S},I:${cnt.I},A:${cnt.A}`, dicatat_oleh: me().nama, waktu: now() }; E.dirty = false;
  if (!quiet) { toast(`Presensi tersimpan · H ${cnt.H} · S ${cnt.S} · I ${cnt.I} · A ${cnt.A}`, 'ok'); rerender(); }
  const wali = $('#absWali');
  call('absensi.save', { jenis, kelas_id: kid, penugasan_id: pid, tanggal: tgl, data, notifWali: jenis === 'PERTEMUAN' && (wali ? wali.checked : LS.get('sp_abs_wali', true)) }, { silent: true, retries: 6 }).then((r) => {
    d.record.waktu = r.waktu; ent.t = Date.now(); E.src = ent.t; drop('wr_'); drop('lap_');
  }).catch((e) => {
    d.record = prev.rec; d.data = prev.data; E.data = data; E.dirty = true;
    toast('Presensi belum tersimpan: ' + e.message + ' Data masih ada di layar, coba simpan lagi.', 'err', 9000);
    if (S.route === 'g-absensi') rerender();
  });
}

// ── Kelas perwalian (rekap wali kelas) ──
route('w-kelas', {
  title: (p) => 'Kelas Perwalian ' + kelasShort(p.kelas_id || (me().waliKelas || [])[0]), roles: ['WALI', 'ADMIN'],
  render(p) {
    const kid = p.kelas_id || (me().waliKelas || [])[0];
    if (!kid) return `<div class="page">${emptyState('users', 'Anda belum menjadi wali kelas', 'Admin menetapkan wali kelas di menu Data Akademik.')}</div>`;
    const F = S.c.wF || (S.c.wF = { bulan: D.ymd(now()).slice(0, 7), mode: 'PERTEMUAN' }), tab = p.tab || 'perhatian';
    const key = 'wr_' + kid + '|' + F.bulan + '|' + F.mode, ent = S.c[key];
    const d = need(key, 'wali.recap', { kelas_id: kid, bulan: F.bulan, mode: F.mode }, 60000);
    if (!d) return ent && ent.err ? `<div class="page">${emptyState('alert', 'Gagal memuat rekap', esc(ent.err.message), `<button class="btn btn-secondary" onclick="drop('wr_');rerender()">${I('refresh')}Coba lagi</button>`)}</div>` : skelPage();
    const st = d.stats, perlu = d.rows.filter((r) => r.alasan.length).sort((a, b) => b.alasan.length - a.alasan.length || b.tunggakan - a.tunggakan);
    const tabs = [['perhatian', 'Perlu Perhatian', perlu.length, perlu.length ? 'p' : 'neu'], ['presensi', 'Rekap Presensi'], ['nilai', 'Leger Nilai'], ['tunggakan', 'Tugas Tertunggak', d.tunggakan.length, d.tunggakan.length ? 'p' : 'neu'], ['siswa', 'Daftar Siswa', d.rows.length, 'neu']];
    const goTab = (t) => `go('w-kelas',{kelas_id:'${kid}',tab:'${t}'},{replace:true})`;
    let body = '';
    if (tab === 'perhatian') body = perlu.length ? `<div class="grid gc2">${perlu.map((r) => `<div class="card card-p"><div class="flex items-c g12">${avatar(r.nama, r.foto)}<div class="f1" style="min-width:0"><div class="bold truncate">${esc(r.nama)}</div><div class="mono xs muted">NIS ${esc(r.nis_nip || '-')}</div></div>${r.no_wa ? `<a class="btn btn-secondary btn-sm" href="${waLink(r.no_wa, 'Halo ' + firstName(r.nama) + ', ini dari wali kelas ' + d.kelas.nama_kelas + '.')}" target="_blank" rel="noopener">${I('wa', 'ic-sm')}WA</a>` : ''}</div>
          <div class="chips mt12">${r.alasan.map((a) => pill(a, /Alpa/.test(a) ? 'err' : /tugas/.test(a) ? 'warn' : 'vio', /Alpa/.test(a) ? 'user' : /tugas/.test(a) ? 'clipboard' : 'chart')).join('')}</div>
          <div class="grid gc3 mt12" style="grid-template-columns:repeat(3,1fr);gap:8px"><div class="info-tile" style="flex-direction:column;align-items:flex-start;gap:0;padding:10px"><span class="xs muted">Kehadiran</span><b class="mono">${r.attPct === null ? '-' : fmtN(r.attPct) + '%'}</b></div><div class="info-tile" style="flex-direction:column;align-items:flex-start;gap:0;padding:10px"><span class="xs muted">Rata-rata</span><b class="mono ${r.rata !== null && r.rata < d.kkm ? 'ink-err' : ''}">${fmtN(r.rata)}</b></div><div class="info-tile" style="flex-direction:column;align-items:flex-start;gap:0;padding:10px"><span class="xs muted">Tertunggak</span><b class="mono">${r.tunggakan}</b></div></div>
          ${r.tunggakan ? `<button class="btn btn-ghost btn-sm mt12" onclick="waliRemindMenu(this,'${kid}',['${r.user_id}'])">${I('send', 'ic-sm')}Kirim pengingat tugas</button>` : ''}</div>`).join('')}</div>`
      : `<div class="card">${emptyState('check-c', 'Semua siswa dalam kondisi baik', `Tidak ada siswa yang melewati ambang alpa, tunggakan tugas, atau di bawah KKM ${d.kkm}.`)}</div>`;
    else if (tab === 'presensi') {
      const [yy, mm] = F.bulan.split('-').map(Number), first = new Date(yy, mm - 1, 1), off = (first.getDay() + 6) % 7, dim = new Date(yy, mm, 0).getDate();
      const mx = Math.max(1, ...Object.keys(d.heat).map((k) => d.heat[k]));
      const cells = []; for (let i = 0; i < off; i++) cells.push('<div class="hd"></div>');
      for (let i = 1; i <= dim; i++) { const k = `${yy}-${pad(mm)}-${pad(i)}`, v = d.heat[k] || 0, lv = v ? Math.min(4, Math.ceil(v / mx * 4)) : 0; cells.push(`<div class="${lv ? 'h' + lv : ''}" title="${i} ${BULAN[mm - 1]}: ${v} siswa tidak hadir">${i}</div>`); }
      body = `<div class="card card-p flex g12 wrap items-e"><div class="field"><label class="label">Bulan</label><input class="input" type="month" value="${F.bulan}" max="${D.ymd(now()).slice(0, 7)}" onchange="S.c.wF.bulan=this.value||S.c.wF.bulan;rerender()"></div>
          ${cfg().absensi_harian ? `<div class="field"><label class="label">Sumber data</label><div class="seg">${[['PERTEMUAN', 'Per pertemuan'], ['HARIAN', 'Harian wali']].map((x) => `<button class="${F.mode === x[0] ? 'on' : ''}" onclick="S.c.wF.mode='${x[0]}';rerender()">${x[1]}</button>`).join('')}</div></div>` : ''}
          ${F.mode === 'HARIAN' ? `<button class="btn btn-primary ml-a" onclick="S.c.absF=Object.assign(S.c.absF||{},{jenis:'HARIAN',kelas:'${kid}',tgl:D.ymd(now())});go('g-absensi')">${I('user-plus')}Isi Absensi Harian</button>` : ''}</div>
        <div class="split mt16"><div class="card"><div class="card-hd"><h3>Rekap ${BULAN[mm - 1]} ${yy}</h3><span class="small muted">Semester: % hadir dari semua pertemuan</span></div>
            <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nama siswa</th>${['H', 'S', 'I', 'A'].map((k) => `<th class="n" title="${ATT_L[k]} bulan ini">${k}</th>`).join('')}<th>Kehadiran semester</th></tr></thead><tbody>${d.rows.map((r) => `<tr><td><div class="bold small">${esc(r.nama)}</div><div class="mono xs muted">${esc(r.nis_nip || '')}</div></td>${['H', 'S', 'I', 'A'].map((k) => `<td class="n">${r.attMonth[k] ? `<span class="att-chip ${k}">${r.attMonth[k]}</span>` : '<span class="muted">0</span>'}</td>`).join('')}
              <td style="min-width:140px"><div class="flex items-c g8"><div class="meter f1 ${r.attPct !== null && r.attPct < 80 ? 'err' : r.attPct !== null && r.attPct < 90 ? 'warn' : 'ok'}"><i style="width:${r.attPct || 0}%"></i></div><span class="mono small">${r.attPct === null ? '-' : fmtN(r.attPct) + '%'}</span></div></td></tr>`).join('')}</tbody></table></div></div>
          <div class="card card-p"><h3>Peta Ketidakhadiran</h3><p class="small muted mt4">Jumlah siswa sakit/izin/alpa per tanggal</p><div class="heat mt16">${['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((h) => `<div class="hd">${h}</div>`).join('')}${cells.join('')}</div>
            <div class="legend-row mt12"><span><i style="background:var(--subtle)"></i>0</span><span><i style="background:#DCE7FF"></i>Sedikit</span><span><i style="background:#2563EB"></i>Sedang</span><span><i style="background:#0B1F7A"></i>Banyak</span></div></div></div>`;
    } else if (tab === 'nilai') {
      const rows = d.rows.map((r) => { const o = { user_id: r.user_id, nama: r.nama, nis_nip: r.nis_nip, rata: r.rata }; d.mapelIds.forEach((m) => { o['m_' + m] = r.nilai[m] === undefined ? null : r.nilai[m]; }); return o; });
      const cellN = (v) => v === null || v === undefined ? '<span class="muted">-</span>' : `<span class="mono ${v < d.kkm ? 'ink-err bold' : ''}">${fmtN(v)}</span>`;
      body = `<div class="card">${dataTable('leger_' + kid, rows, [{ h: 'Nama siswa', k: 'nama', r: (r) => `<div class="bold small">${esc(r.nama)}</div><div class="mono xs muted">${esc(r.nis_nip || '')}</div>` }]
        .concat(d.mapelIds.map((m) => ({ h: mapelBy(m).kode || mapelNm(m).slice(0, 10), k: 'm_' + m, n: true, search: false, r: (r) => cellN(r['m_' + m]) })))
        .concat([{ h: 'Rata-rata', k: 'rata', n: true, search: false, r: (r) => `<b>${cellN(r.rata)}</b>` }, { h: 'Status', k: 'rata', sort: false, search: false, r: (r) => r.rata === null ? '<span class="xs muted">Belum ada nilai</span>' : r.rata >= d.kkm ? pill('Tuntas', 'ok') : pill('Di bawah KKM', 'err') }]),
        { ph: 'Cari siswa…', per: 50, tools: `<span class="small muted">KKM ${d.kkm} · rata-rata tugas & ujian per mapel</span>` })}
        <div class="card-ft small muted">${d.mapelIds.map((m) => `<b>${esc(mapelBy(m).kode || '')}</b> ${esc(mapelNm(m))}`).join(' · ')}</div></div>`;
    } else if (tab === 'tunggakan') {
      const byId = {}; d.rows.forEach((r) => { byId[r.user_id] = r; });
      body = d.tunggakan.length ? `<div class="flex jc-e mb12"><button class="btn btn-primary" onclick="waliRemindMenu(this,'${kid}',[])">${I('send')}Ingatkan semua yang menunggak</button></div><div class="col g12">${d.tunggakan.slice().sort(by('tenggat', -1)).map((t) => `<div class="card card-p"><div class="flex items-c g12 wrap">${mapelIcon(t.mapel_id, 'sm')}<div class="f1" style="min-width:0"><div class="bold">${esc(t.judul)}</div><div class="small muted">${esc(mapelNm(t.mapel_id))} · tenggat ${D.dt(t.tenggat)}</div></div>${pill(t.siswa_ids.length + ' belum kumpul', 'err')}</div>
          <div class="chips mt12">${t.siswa_ids.map((s) => `<span class="chip">${esc((byId[s] || {}).nama || '-')}</span>`).join('')}</div></div>`).join('')}</div>`
        : `<div class="card">${emptyState('check-c', 'Tidak ada tugas tertunggak', 'Semua tugas yang sudah lewat tenggat telah dikumpulkan.')}</div>`;
    } else {
      body = `<div class="card">${dataTable('wsiswa_' + kid, d.rows, [
        { h: 'Nama siswa', k: 'nama', r: (r) => `<div class="flex items-c g8">${avatar(r.nama, r.foto, 'sm')}<div><div class="bold small">${esc(r.nama)}</div><div class="mono xs muted">NIS ${esc(r.nis_nip || '-')}</div></div></div>` },
        { h: 'Username', k: 'username', r: (r) => `<span class="mono small">${esc(r.username || '')}</span>` },
        { h: 'WhatsApp', k: 'no_wa', r: (r) => r.no_wa ? `<a href="${waLink(r.no_wa)}" target="_blank" rel="noopener" class="small mono">${esc(r.no_wa)}</a>` : '<span class="xs muted">Belum diisi</span>' },
        { h: 'Kehadiran', k: 'attPct', n: true, r: (r) => r.attPct === null ? '-' : `<span class="mono">${fmtN(r.attPct)}%</span>` },
        { h: '', sort: false, search: false, r: (r) => `<div class="flex g4 jc-e"><button class="icon-btn" title="Ubah data" onclick="openUserForm(${jsq(r.user_id)},{kelas:'${kid}',wali:true})">${I('edit')}</button><button class="icon-btn" title="Reset kata sandi" onclick="resetPw(${jsq(r.user_id)},${jsq(r.nama)})">${I('key')}</button></div>` }
      ], { ph: 'Cari nama atau NIS…', per: 50, tools: `<button class="btn btn-primary btn-sm" onclick="openUserForm(null,{kelas:'${kid}',wali:true})">${I('user-plus', 'ic-sm')}Tambah Siswa</button>` })}</div>`;
    }
    return `<div class="page"><div class="page-hd"><div><h1>Kelas Perwalian ${esc(d.kelas.nama_kelas)}</h1><p class="sub">Wali kelas: ${esc(d.kelas.wali || '-')} · ${d.rows.length} siswa${B().ta ? ' · Semester ' + esc(B().ta.semester) + ' ' + esc(B().ta.nama) : ''}</p></div>
        <div class="flex g8 wrap"><button class="btn btn-secondary" onclick="drop('${key}');rerender()" title="Muat ulang">${I('refresh')}</button><button class="btn btn-secondary" onclick="exportWali('${key}')">${I('download')}Ekspor Rekap</button>${d.tunggakan.length ? `<button class="btn btn-primary" onclick="waliRemindMenu(this,'${kid}',[])">${I('send')}Kirim Pengingat</button>` : ''}</div></div>
      <div class="grid gc5">${statCard('Jumlah siswa', st.siswa, 'siswa', esc(d.kelas.nama_kelas), 'users', 'p', goTab('siswa'))}${statCard('Rata-rata kehadiran', st.kehadiran === null ? '-' : fmtN(st.kehadiran) + '%', '', 'Semester berjalan', 'user-plus', st.kehadiran !== null && st.kehadiran < 85 ? 'warn' : 'ok', goTab('presensi'))}${statCard('Rata-rata nilai', fmtN(st.rata), '', 'KKM ' + d.kkm, 'chart', st.rata !== null && st.rata < d.kkm ? 'err' : '', goTab('nilai'))}${statCard('Perlu perhatian', st.perlu, 'siswa', st.perlu ? 'Butuh tindak lanjut' : 'Aman', 'alert', st.perlu ? 'err' : '', goTab('perhatian'))}${statCard('Tugas tertunggak', st.tunggakan, 'item', d.tunggakan.length + ' tugas', 'clipboard', st.tunggakan ? 'warn' : '', goTab('tunggakan'))}</div>
      <div class="tabs mt24 scroll">${tabs.map((t) => `<button class="tab ${tab === t[0] ? 'on' : ''}" onclick="${goTab(t[0])}">${t[1]}${t[2] !== undefined ? ` <span class="badge ${t[3]}">${t[2]}</span>` : ''}</button>`).join('')}</div>
      <div class="mt16">${body}</div></div>`;
  }
});
function waliRemindMenu(el, kid, ids) {
  const run = (kanal) => {
    const key = Object.keys(S.c).find((k) => k.indexOf('wr_' + kid + '|') === 0), d = key && S.c[key].d;
    const n = ids.length || (d ? d.rows.filter((r) => r.tunggakan > 0).length : 0);
    confirmBox(`Kirim pengingat tugas tertunggak ke <b>${n} siswa</b> lewat ${kanal.map((k) => ({ DASHBOARD: 'notifikasi aplikasi', EMAIL: 'email', WA: 'WhatsApp' })[k]).join(', ')}?`, { yes: 'Kirim', icon: 'send' }).then((ok) => {
      if (!ok) return;
      toast('Pengingat sedang dikirim ke ' + n + ' siswa…', 'info');
      call('wali.remind', { kelas_id: kid, siswa_ids: ids, kanal }, { silent: true }).then((r) => toast(`Pengingat terkirim ke ${r.siswa} siswa · aplikasi ${r.dashboard} · email ${r.email} · WA ${r.wa}`, 'ok', 6000)).catch(failToast);
    });
  };
  menuAt(el, [{ icon: 'bell', label: 'Notifikasi aplikasi', run: () => run(['DASHBOARD']) }, { icon: 'mail', label: 'Aplikasi + Email', run: () => run(['DASHBOARD', 'EMAIL']) }, { icon: 'wa', label: 'Aplikasi + WhatsApp', run: () => run(['DASHBOARD', 'WA']) }, { icon: 'send', label: 'Semua kanal', run: () => run(['DASHBOARD', 'EMAIL', 'WA']) }]);
}
function exportWali(key) {
  const d = S.c[key].d, byId = {}; d.rows.forEach((r) => { byId[r.user_id] = r; });
  exportXlsx('rekap_wali_' + d.kelas.nama_kelas.replace(/\W+/g, '_') + '_' + d.bulan, [
    { name: 'Presensi ' + d.bulan, rows: [['No', 'NIS', 'Nama', 'Hadir (bulan)', 'Sakit (bulan)', 'Izin (bulan)', 'Alpa (bulan)', 'Hadir (semester)', 'Sakit (semester)', 'Izin (semester)', 'Alpa (semester)', '% Kehadiran']].concat(d.rows.map((r, i) => [i + 1, r.nis_nip, r.nama, r.attMonth.H, r.attMonth.S, r.attMonth.I, r.attMonth.A, r.att.H, r.att.S, r.att.I, r.att.A, r.attPct])) },
    { name: 'Leger Nilai', rows: [['No', 'NIS', 'Nama'].concat(d.mapelIds.map(mapelNm)).concat(['Rata-rata', 'Status'])].concat(d.rows.map((r, i) => [i + 1, r.nis_nip, r.nama].concat(d.mapelIds.map((m) => r.nilai[m] === undefined ? '' : r.nilai[m])).concat([r.rata === null ? '' : r.rata, r.rata === null ? '' : r.rata >= d.kkm ? 'Tuntas' : 'Di bawah KKM']))) },
    { name: 'Tugas Tertunggak', rows: [['Tugas', 'Mapel', 'Tenggat', 'Siswa belum mengumpulkan']].concat(d.tunggakan.map((t) => [t.judul, mapelNm(t.mapel_id), D.dt(t.tenggat), t.siswa_ids.map((s) => (byId[s] || {}).nama).join(', ')])) },
    { name: 'Perlu Perhatian', rows: [['NIS', 'Nama', 'Alasan', 'No WA']].concat(d.rows.filter((r) => r.alasan.length).map((r) => [r.nis_nip, r.nama, r.alasan.join('; '), r.no_wa])) }]);
}

// ── Agenda sekolah (kalender + daftar) ──
route('agenda', {
  title: 'Agenda Sekolah', roles: ['SISWA', 'GURU', 'ADMIN'],
  render() {
    const t0 = new Date(now()), M = S.c.agM || (S.c.agM = { y: t0.getFullYear(), m: t0.getMonth(), f: '', view: window.innerWidth >= 768 ? 'cal' : 'list', sel: '' });
    const can = isGuru(), uid = me().user_id;
    const all = (B().agenda || []).filter((a) => !M.f || (M.f === 'MINE' ? a.dibuat_oleh === uid : a.target_tipe === M.f)).sort(by('mulai'));
    const first = new Date(M.y, M.m, 1), off = (first.getDay() + 6) % 7, dim = new Date(M.y, M.m + 1, 0).getDate(), cells = Math.ceil((off + dim) / 7) * 7, today = D.day0(now());
    const evOn = (ms) => all.filter((a) => D.day0(a.mulai) <= ms && D.day0(a.selesai || a.mulai) >= ms);
    const upcoming = all.filter((a) => (a.selesai || a.mulai) >= now()).slice(0, 8);
    const label = (a) => a.target_tipe === 'SEMUA' ? 'Semua warga' : a.target_tipe === 'GURU' ? 'Guru' : (a.target_kelas_ids || []).map(kelasShort).join(', ');
    let cal = '';
    if (M.view === 'cal') {
      const out = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((h) => `<div class="dh">${h}</div>`);
      for (let i = 0; i < cells; i++) {
        const dt = new Date(M.y, M.m, 1 - off + i), ms = dt.getTime(), ev = evOn(ms), inM = dt.getMonth() === M.m, ymd = D.ymd(ms);
        out.push(`<div class="${inM ? '' : 'out'} ${ms === today ? 'today' : ''}" style="${M.sel === ymd ? 'box-shadow:inset 0 0 0 2px var(--p600)' : ''};cursor:pointer" onclick="S.c.agM.sel='${ymd}';rerender()"><span class="dn">${dt.getDate()}</span>${ev.slice(0, 3).map((a) => `<span class="ev ${a.target_tipe}" title="${esc(a.judul)}" onclick="event.stopPropagation();openAgendaDetail('${a.agenda_id}')">${esc(D.t(a.mulai) + ' ' + a.judul)}</span>`).join('')}${ev.length > 3 ? `<span class="xs muted">+${ev.length - 3} lagi</span>` : ''}</div>`);
      }
      const selMs = M.sel ? new Date(M.sel + 'T00:00:00').getTime() : 0, selEv = selMs ? evOn(selMs) : [];
      cal = `<div class="card"><div class="card-hd"><div class="flex items-c g8"><button class="icon-btn" onclick="agMonth(-1)" aria-label="Bulan sebelumnya">${I('chev-l')}</button><h3 style="min-width:150px;text-align:center">${BULAN[M.m]} ${M.y}</h3><button class="icon-btn" onclick="agMonth(1)" aria-label="Bulan berikutnya">${I('chev-r')}</button></div><button class="btn btn-ghost btn-sm" onclick="S.c.agM.y=${t0.getFullYear()};S.c.agM.m=${t0.getMonth()};S.c.agM.sel='${D.ymd(now())}';rerender()">Hari ini</button></div><div class="cal">${out.join('')}</div>
        ${M.sel ? `<div class="card-bd"><div class="flex items-c jc-b mb8"><b>${D.dd(selMs)} ${new Date(selMs).getFullYear()}</b>${can ? `<button class="btn btn-ghost btn-sm" onclick="openAgendaForm(null,'${M.sel}')">${I('plus', 'ic-sm')}Tambah di tanggal ini</button>` : ''}</div>${selEv.length ? `<div class="col g8">${selEv.map((a) => agendaCard(a, true)).join('')}</div>` : '<p class="small muted">Tidak ada agenda pada tanggal ini.</p>'}</div>` : ''}</div>`;
    } else {
      const grp = {}; all.filter((a) => (a.selesai || a.mulai) >= today).forEach((a) => { const d = new Date(a.mulai), k = BULAN[d.getMonth()] + ' ' + d.getFullYear(); (grp[k] = grp[k] || []).push(a); });
      const past = all.filter((a) => (a.selesai || a.mulai) < today).reverse();
      cal = Object.keys(grp).length || past.length ? `${Object.keys(grp).map((k) => `<div class="sect-title"><h2>${k}</h2></div><div class="col g8">${grp[k].map((a) => agendaCard(a, true)).join('')}</div>`).join('')}${past.length ? `<div class="sect-title"><h2 class="muted">Sudah berlalu</h2></div><div class="col g8" style="opacity:.75">${past.slice(0, 15).map((a) => agendaCard(a, true)).join('')}</div>` : ''}` : `<div class="card">${emptyState('calendar', 'Belum ada agenda', can ? 'Tambahkan agenda sekolah, rapat guru, atau kegiatan kelas.' : 'Agenda sekolah untukmu akan tampil di sini.', can ? `<button class="btn btn-primary" onclick="openAgendaForm(null)">${I('plus')}Agenda Baru</button>` : '')}</div>`;
    }
    return `<div class="page"><div class="page-hd"><div><h1>Agenda Sekolah</h1><p class="sub">Kegiatan sekolah, rapat guru, dan agenda kelas sesuai sasaran.</p></div>
        <div class="flex g8 wrap"><div class="seg"><button class="${M.view === 'cal' ? 'on' : ''}" onclick="S.c.agM.view='cal';rerender()">${I('calendar', 'ic-sm')}Kalender</button><button class="${M.view === 'list' ? 'on' : ''}" onclick="S.c.agM.view='list';rerender()">${I('list', 'ic-sm')}Daftar</button></div>${can ? `<button class="btn btn-primary" onclick="openAgendaForm(null)">${I('plus')}Agenda Baru</button>` : ''}</div></div>
      <div class="chips mb16 scroll">${[['', 'Semua'], ['SEMUA', 'Seluruh warga sekolah'], ['GURU', 'Khusus guru'], ['KELAS', 'Kelas tertentu']].concat(can ? [['MINE', 'Buatan saya']] : []).map((x) => `<button class="chip ${M.f === x[0] ? 'on' : ''}" onclick="S.c.agM.f='${x[0]}';rerender()">${x[1]}</button>`).join('')}</div>
      <div class="split s-r"><div>${cal}</div><div class="col g16" ${M.view === 'list' && window.innerWidth < 1024 ? 'hidden' : ''}><div class="card"><div class="card-hd"><h3>Akan Datang</h3><span class="small muted">${upcoming.length}</span></div>${upcoming.length ? upcoming.map((a) => `<div class="row-item click" onclick="openAgendaDetail('${a.agenda_id}')"><div class="date-blk ${a.mulai - now() < 864e5 && a.mulai > now() ? 'err' : ''}"><b>${pad(new Date(a.mulai).getDate())}</b><span>${BLN[new Date(a.mulai).getMonth()].toUpperCase()}</span></div><div class="f1" style="min-width:0"><div class="bold truncate">${esc(a.judul)}</div><div class="xs muted truncate">${D.t(a.mulai)} ${TZL} · ${esc(label(a))}</div></div></div>`).join('') : `<div class="card-bd small muted">Tidak ada agenda mendatang.</div>`}</div>
        <div class="card card-p"><h3>Keterangan warna</h3><div class="col g8 mt12 small"><span class="flex items-c g8"><i style="width:12px;height:12px;border-radius:3px;background:var(--p600)"></i>Seluruh warga sekolah</span><span class="flex items-c g8"><i style="width:12px;height:12px;border-radius:3px;background:var(--tx3)"></i>Khusus guru</span><span class="flex items-c g8"><i style="width:12px;height:12px;border-radius:3px;background:var(--sky)"></i>Kelas tertentu</span></div></div></div></div></div>`;
  }
});
function agMonth(d) { const M = S.c.agM; M.m += d; if (M.m < 0) { M.m = 11; M.y--; } if (M.m > 11) { M.m = 0; M.y++; } M.sel = ''; rerender(); }
function openAgendaForm(id, ymd) {
  const a = id ? (B().agenda || []).find((x) => x.agenda_id === id) : null;
  const base = ymd ? new Date(ymd + 'T00:00:00').getTime() : D.day0(now()) + 864e5;
  const E = { target: a ? a.target_tipe : 'SEMUA', kelas: a ? (a.target_kelas_ids || []).slice() : [], file: a ? a.lampiran_file_id : '' };
  const kelasOpts = myKelasIds();
  sheet({ title: a ? 'Ubah Agenda' : 'Agenda Baru', icon: 'calendar', size: 'drawer', body: `<form id="agForm" class="col g16" onsubmit="return false">
      <div class="field"><label class="label">Judul agenda <span class="req">*</span></label><input class="input" name="judul" value="${esc(a ? a.judul : '')}" placeholder="Contoh: Rapat Pleno Kenaikan Kelas" autofocus></div>
      <div class="form-grid c2"><div class="field"><label class="label">Mulai <span class="req">*</span></label><input class="input" type="datetime-local" name="mulai" value="${D.local(a ? a.mulai : base + 7 * 3600000)}"></div><div class="field"><label class="label">Selesai</label><input class="input" type="datetime-local" name="selesai" value="${D.local(a ? a.selesai : base + 9 * 3600000)}"></div></div>
      <div class="field"><label class="label">Lokasi</label><div class="input-ic">${I('pin')}<input class="input" name="lokasi" value="${esc(a ? a.lokasi : '')}" placeholder="Aula, ruang guru, lapangan…"></div></div>
      <div class="field"><label class="label">Dapat dilihat oleh</label><div class="seg w100" id="agTarget">${[['SEMUA', 'Semua warga'], ['GURU', 'Guru saja'], ['KELAS', 'Kelas tertentu']].map((x) => `<button type="button" data-v="${x[0]}" class="${E.target === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}</div>
        <div class="chips mt8" id="agKelas" ${E.target === 'KELAS' ? '' : 'hidden'}>${kelasOpts.map((k) => `<button type="button" class="chip ${E.kelas.indexOf(k) >= 0 ? 'sel-o' : ''}" data-k="${k}">${esc(kelasNm(k))}</button>`).join('') || '<span class="small muted">Tidak ada kelas.</span>'}</div></div>
      <div class="field"><label class="label">Deskripsi</label><textarea class="textarea" name="deskripsi" placeholder="Detail kegiatan, perlengkapan, dll.">${esc(a ? a.deskripsi : '')}</textarea></div>
      <div class="field"><label class="label">Lampiran (opsional)</label><div id="agFile"></div></div>
      ${a ? '' : `<label class="check"><input type="checkbox" name="notif" checked>Kirim notifikasi ke sasaran agenda</label>`}</form>`,
  foot: `${a ? `<button class="btn btn-danger-o" onclick="deleteAgenda('${a.agenda_id}')">${I('trash')}</button>` : ''}<button class="btn btn-secondary" data-x2>Batal</button><button class="btn btn-primary" id="agSave">${I('check')}Simpan Agenda</button>`,
  mount: (el, close) => {
    el.querySelector('[data-x2]').onclick = close;
    $('#agTarget', el).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; E.target = b.dataset.v; $$('#agTarget button', el).forEach((x) => x.classList.toggle('on', x === b)); $('#agKelas', el).hidden = E.target !== 'KELAS'; };
    $('#agKelas', el).onclick = (e) => { const b = e.target.closest('[data-k]'); if (!b) return; const i = E.kelas.indexOf(b.dataset.k); if (i >= 0) E.kelas.splice(i, 1); else E.kelas.push(b.dataset.k); b.classList.toggle('sel-o', i < 0); };
    const drawF = () => { $('#agFile', el).innerHTML = E.file ? `<div class="file-chip"><div class="tile">${I('clip')}</div><div class="f1 small bold">Lampiran terpasang</div><button type="button" class="icon-btn" id="agFDel">${I('x')}</button></div>` : `<label class="upload" style="padding:14px">${I('upload')}<span class="bold small"> Unggah berkas (gambar/PDF, maks 10 MB)</span><input type="file" hidden id="agFIn" accept="image/*,application/pdf,.doc,.docx"></label>`;
      const del = $('#agFDel', el); if (del) del.onclick = () => { E.file = ''; drawF(); };
      const inp = $('#agFIn', el); if (inp) inp.onchange = () => { const f = inp.files[0]; if (!f) return; $('#agFile', el).innerHTML = `<div class="file-chip"><div class="tile">${I('clip')}</div><div class="f1"><div class="small bold">Mengunggah ${esc(f.name)}…</div><div class="prog"><i></i></div></div></div>`; uploadFile(f, 'agenda').then((r) => { E.file = r.file_id; drawF(); }).catch((x) => { failToast(x); drawF(); }); };
    };
    drawF();
    $('#agSave', el).onclick = () => {
      const f = formData($('#agForm', el)), mulai = D.fromLocal(f.mulai), selesai = D.fromLocal(f.selesai) || mulai;
      if (!f.judul.trim()) { toast('Judul agenda wajib diisi.', 'warn'); return; }
      if (!mulai) { toast('Isi waktu mulai.', 'warn'); return; }
      if (selesai < mulai) { toast('Waktu selesai tidak boleh sebelum mulai.', 'warn'); return; }
      if (E.target === 'KELAS' && !E.kelas.length) { toast('Pilih minimal satu kelas.', 'warn'); return; }
      const payload = { agenda_id: a ? a.agenda_id : '', judul: f.judul.trim(), deskripsi: f.deskripsi, mulai, selesai, lokasi: f.lokasi, target_tipe: E.target, target_kelas_ids: E.target === 'KELAS' ? E.kelas : [], lampiran_file_id: E.file, notif: f.notif !== false };
      const list = B().agenda = B().agenda || [], bak = list.slice();
      // Optimistic: tampil di kalender seketika
      const tmp = Object.assign({}, a || {}, payload, { agenda_id: a ? a.agenda_id : 'tmp_' + uidc(), dibuat_oleh: a ? a.dibuat_oleh : me().user_id, pembuat: a ? a.pembuat : me().nama });
      if (a) list[list.indexOf(a)] = tmp; else list.push(tmp);
      close(); toast(a ? 'Agenda diperbarui.' : 'Agenda ditambahkan.', 'ok'); rerender();
      call('agenda.save', payload, { silent: true }).then((r) => {
        const i = B().agenda.findIndex((x) => x.agenda_id === tmp.agenda_id); if (i >= 0) B().agenda[i] = r; saveSnap(); rerender();
      }).catch((x) => { B().agenda = bak; rerender(); failToast(x); });
    };
  } });
}
function deleteAgenda(id) {
  confirmBox('Hapus agenda ini? Agenda akan hilang dari kalender semua sasaran.', { danger: true, yes: 'Hapus Agenda' }).then((ok) => {
    if (!ok) return; const bak = (B().agenda || []).slice(); B().agenda = bak.filter((a) => a.agenda_id !== id); closeAllSheets(); rerender(); toast('Agenda dihapus.', 'ok');
    if (String(id).indexOf('tmp_') === 0) return;
    call('agenda.delete', { agenda_id: id }, { silent: true }).then(saveSnap).catch((e) => { B().agenda = bak; rerender(); failToast(e); });
  });
}

// ── Laporan & grafik ──
route('laporan', {
  title: 'Laporan & Grafik', roles: ['GURU', 'ADMIN'],
  render() {
    const F = S.c.lapF || (S.c.lapF = { kelas: '', mapel: '', per: '183' }), kkm = cfg().kkm || 75;
    const kelasOpts = myKelasIds();
    const mapelOpts = hasRole('ADMIN') || (me().waliKelas || []).length ? (B().mapel || []).map((m) => m.mapel_id) : uniqBy(G().penugasan, (x) => x.mapel_id).map((x) => x.mapel_id);
    const dari = F.per === '0' ? 0 : D.day0(now()) - num(F.per) * 864e5;
    const key = 'lap_' + [F.kelas, F.mapel, F.per].join('|'), ent = S.c[key];
    const d = need(key, 'laporan.data', { kelas_id: F.kelas, mapel_id: F.mapel, dari }, 120000);
    const filt = `<div class="card card-p flex g12 wrap items-e"><div class="field" style="min-width:170px"><label class="label">Kelas</label><select class="select" onchange="S.c.lapF.kelas=this.value;rerender()"><option value="">Semua kelas (${kelasOpts.length})</option>${kelasOpts.map((k) => `<option value="${k}" ${F.kelas === k ? 'selected' : ''}>${esc(kelasNm(k))}</option>`).join('')}</select></div>
      <div class="field" style="min-width:190px"><label class="label">Mata pelajaran</label><select class="select" onchange="S.c.lapF.mapel=this.value;rerender()"><option value="">Semua mapel</option>${mapelOpts.map((m) => `<option value="${m}" ${F.mapel === m ? 'selected' : ''}>${esc(mapelNm(m))}</option>`).join('')}</select></div>
      <div class="field"><label class="label">Periode</label><div class="seg">${[['30', '30 hari'], ['90', '3 bulan'], ['183', 'Semester'], ['0', 'Semua']].map((x) => `<button class="${F.per === x[0] ? 'on' : ''}" onclick="S.c.lapF.per='${x[0]}';rerender()">${x[1]}</button>`).join('')}</div></div>
      <div class="ml-a flex g8"><button class="btn btn-secondary" onclick="drop('${key}');rerender()" title="Muat ulang">${I('refresh')}</button><button class="btn btn-primary" ${d ? '' : 'disabled'} onclick="exportLaporan('${key}')">${I('download')}Ekspor Excel</button></div></div>`;
    const head = `<div class="page-hd"><div><h1>Laporan & Grafik</h1><p class="sub">Analisis nilai, kehadiran, dan pengumpulan tugas berdasarkan kelas dan mata pelajaran.</p></div></div>`;
    if (!d) return `<div class="page">${head}${filt}<div class="mt16">${ent && ent.err ? emptyState('alert', 'Gagal memuat laporan', esc(ent.err.message)) : skelCards(4, 120)}</div></div>`;
    const withN = d.rows.filter((r) => r.rata !== null), hadirs = d.rows.filter((r) => r.hadir !== null);
    const rata = avg(withN.map((r) => r.rata)), hadir = avg(hadirs.map((r) => r.hadir)), tot = d.status.sudah + d.status.terlambat + d.status.belum, bawah = withN.filter((r) => r.rata < kkm).length;
    const distL = ['< 60', '60–74', '75–84', '85–94', '95–100'];
    return `<div class="page">${head}${filt}
      <div class="grid gc4 mt16">${statCard('Rata-rata nilai', fmtN(rata), '/ 100', `${withN.length} siswa bernilai`, 'star', rata !== null && rata < kkm ? 'warn' : 'p')}${statCard('Rata-rata kehadiran', hadir === null ? '-' : fmtN(hadir) + '%', '', `${hadirs.length} siswa tercatat`, 'user-plus', hadir !== null && hadir < 85 ? 'warn' : 'ok')}${statCard('Pengumpulan tugas', tot ? fmtN((d.status.sudah + d.status.terlambat) / tot * 100) + '%' : '-', '', `${d.status.belum} tertunggak · ${d.status.terlambat} terlambat`, 'clipboard', d.status.belum ? 'warn' : 'ok')}${statCard('Di bawah KKM', bawah, 'siswa', 'KKM ' + kkm, 'alert', bawah ? 'err' : '')}</div>
      <div class="card card-p mt16 banner-info" style="background:linear-gradient(135deg,var(--p50),var(--surface))"><div class="flex items-c g8">${I('sparkles', 'ink-p')}<h3>Analisis Otomatis</h3></div><ul class="small tx2" style="padding-left:18px;line-height:1.8;margin:10px 0 0">${(d.insights.length ? d.insights : ['Belum cukup data untuk dianalisis pada filter ini.']).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="grid gc2 mt16"><div class="card card-p"><h3>Rata-rata Nilai per Kelas</h3><p class="small muted">Garis merah = KKM ${kkm}</p><div class="mt12">${CH.bars(d.perKelas.filter((k) => k.rata !== null).map((k) => ({ l: String(k.nama).split(' ')[0], v: k.rata, c: k.rata < kkm ? '#DC2626' : undefined })), { max: 100, ref: kkm, refLabel: 'KKM ' + kkm, label: 'Rata-rata nilai per kelas' })}</div></div>
        <div class="card card-p"><h3>Tren Kehadiran Bulanan</h3><p class="small muted">Persentase hadir dari presensi per pertemuan</p><div class="mt12">${CH.line(d.hadirBulan.map((b) => ({ l: BLN[+b.bulan.slice(5) - 1] + " '" + b.bulan.slice(2, 4), v: b.pct })), { unit: '%', max: 100, label: 'Tren kehadiran' })}</div></div>
        <div class="card card-p"><h3>Status Pengumpulan Tugas</h3><p class="small muted">${tot} pengumpulan yang diharapkan</p><div class="mt16">${CH.stack([{ l: 'Tepat waktu', v: d.status.sudah, c: '#16A34A' }, { l: 'Terlambat', v: d.status.terlambat, c: '#D97706' }, { l: 'Belum mengumpulkan', v: d.status.belum, c: '#DC2626' }])}</div></div>
        <div class="card card-p"><h3>Sebaran Nilai Siswa</h3><p class="small muted">Jumlah siswa per rentang rata-rata</p><div class="mt12">${CH.bars(d.dist.map((v, i) => ({ l: distL[i], v, c: i < 2 ? '#DC2626' : '#16A34A' })), { h: 220, label: 'Sebaran nilai' })}</div></div></div>
      <div class="card mt16"><div class="card-hd"><h3>Rekap per Siswa</h3><span class="small muted">${d.rows.length} siswa</span></div>${dataTable('lap', d.rows, [
        { h: 'Nama siswa', k: 'nama', r: (r) => `<div class="bold small">${esc(r.nama)}</div><div class="mono xs muted">${esc(r.nis_nip || '')}</div>` },
        { h: 'Kelas', k: 'kelas_id', v: (r) => kelasNm(r.kelas_id), r: (r) => esc(kelasShort(r.kelas_id)) },
        { h: 'Tugas', k: 'tugas', n: true, search: false, r: (r) => `<span class="mono">${fmtN(r.tugas)}</span>` },
        { h: 'Ujian', k: 'ujian', n: true, search: false, r: (r) => `<span class="mono">${fmtN(r.ujian)}</span>` },
        { h: 'Rata-rata', k: 'rata', n: true, search: false, r: (r) => `<b class="mono ${r.rata !== null && r.rata < kkm ? 'ink-err' : ''}">${fmtN(r.rata)}</b>` },
        { h: 'Kehadiran', k: 'hadir', n: true, search: false, r: (r) => r.hadir === null ? '-' : `<span class="mono">${fmtN(r.hadir)}%</span>` },
        { h: 'Status', k: 'rata', sort: false, search: false, r: (r) => r.rata === null ? '<span class="xs muted">Belum ada nilai</span>' : r.rata >= kkm ? pill('Tuntas', 'ok') : pill('Perlu remedial', 'err') }
      ], { ph: 'Cari nama atau NIS…', sort: 'nama' })}</div></div>`;
  }
});
function exportLaporan(key) {
  const d = S.c[key].d, F = S.c.lapF, kkm = cfg().kkm || 75;
  exportXlsx('laporan_' + (F.kelas ? kelasNm(F.kelas).replace(/\W+/g, '_') : 'semua_kelas') + '_' + D.ymd(now()), [
    { name: 'Rekap Siswa', rows: [['No', 'NIS', 'Nama', 'Kelas', 'Rata Tugas', 'Rata Ujian', 'Rata-rata', '% Kehadiran', 'Status']].concat(d.rows.map((r, i) => [i + 1, r.nis_nip, r.nama, kelasNm(r.kelas_id), r.tugas, r.ujian, r.rata, r.hadir, r.rata === null ? '' : r.rata >= kkm ? 'Tuntas' : 'Remedial'])) },
    { name: 'Per Kelas', rows: [['Kelas', 'Rata-rata', 'Jumlah siswa bernilai']].concat(d.perKelas.map((k) => [k.nama, k.rata, k.n])) },
    { name: 'Kehadiran Bulanan', rows: [['Bulan', '% Hadir']].concat(d.hadirBulan.map((b) => [b.bulan, b.pct])) },
    { name: 'Analisis', rows: [['Kesimpulan']].concat(d.insights.map((x) => [x])) }]);
}

// ── Akun saya ──
route('akun', {
  title: 'Akun Saya', roles: ['SISWA', 'GURU', 'ADMIN'], form: true,
  render() {
    const u = me(), c = cfg(), kls = u.kelas_id ? kelasBy(u.kelas_id) : null;
    const roleP = [hasRole('SISWA') ? pill('Siswa', 'info') : '', hasRole('ADMIN') ? pill('Admin', 'dark') : '', hasRole('GURU') ? pill('Guru', 'p') : '', hasRole('WALI') ? pill('Wali Kelas ' + (u.waliKelas || []).map(kelasShort).join(', '), 'ok') : ''].join('');
    const row = (ic, l, v) => `<div class="row-item"><div class="tile sm">${I(ic)}</div><div class="f1" style="min-width:0"><div class="xs muted">${l}</div><div class="bold truncate">${v}</div></div></div>`;
    return `<div class="page" style="max-width:920px">
      <div class="card grad grad-pattern" style="padding:24px;border:0"><div class="flex items-c g16 wrap"><div class="rel">${avatar(u.nama, u.foto, 'xl')}<label class="icon-btn" style="position:absolute;right:-4px;bottom:-4px;background:#fff;color:var(--p600);box-shadow:var(--sh2);cursor:pointer" title="Ganti foto">${I('camera')}<input type="file" hidden accept="image/*" onchange="akunFoto(this.files[0])"></label></div>
        <div class="f1" style="min-width:0"><h1 style="font-size:24px">${esc(u.nama)}</h1><div class="mono small mt4" style="opacity:.85">${esc(u.nis_nip ? (hasRole('SISWA') ? 'NIS ' : 'NIP ') + u.nis_nip : '@' + u.username)}</div><div class="chips mt12">${roleP}</div></div></div></div>
      <div class="grid gc2 mt16"><div class="card"><div class="card-hd"><h3>Data Akun</h3></div>
          ${row('user', 'Username', `<span class="mono">${esc(u.username)}</span>`)}${kls ? row('door', 'Kelas', esc(kls.nama_kelas) + (kls.wali ? ` <span class="small muted">· Wali: ${esc(kls.wali)}</span>` : '')) : ''}
          ${row('cap', 'Sekolah', esc(c.nama_sekolah || '-'))}${row('history', 'Login terakhir', u.login_terakhir ? D.dt(u.login_terakhir) : '-')}
          <div class="card-bd"><button class="btn btn-secondary btn-block" onclick="showChangePassword(false)">${I('shield')}Ubah Kata Sandi</button></div></div>
        <div class="col g16"><div class="card card-p"><h3>${I('wa', 'ink-ok')} Nomor WhatsApp</h3><p class="small muted mt4">Untuk pengingat tugas & ujian${hasRole('SISWA') ? ' dari guru dan wali kelas' : ''}.</p>
            <div class="flex g8 mt12"><div class="input-ic f1">${I('phone')}<input class="input" id="akWA" inputmode="tel" value="${esc(u.no_wa || '')}" placeholder="08xxxxxxxxxx"></div><button class="btn btn-primary" onclick="akunWA()">Simpan</button></div></div>
          <div class="card card-p"><h3>${I('g')} Akun Google</h3>${u.email_google ? `<div class="flex items-c g12 mt12 card" style="padding:12px;background:var(--subtle)">${I('check-c', 'ink-ok')}<div class="f1" style="min-width:0"><div class="xs muted">Tertaut</div><div class="bold truncate">${esc(u.email_google)}</div></div><button class="btn btn-ghost btn-sm ink-err" onclick="akunUnlink()">Lepas</button></div><p class="small muted mt8">Anda bisa masuk dengan tombol "Masuk dengan Google".</p>`
            : c.google_login ? `<p class="small muted mt4">Tautkan agar bisa masuk cukup dengan satu klik.</p><button class="btn btn-google btn-block mt12" onclick="googleLogin('link')">${I('g')}Tautkan Akun Google</button>` : `<p class="small muted mt4">Login dengan Google belum diaktifkan Admin sekolah.</p>`}</div>
          <div class="card"><div class="toggle-row" style="padding:14px 16px"><div class="tile sm">${I(isDark() ? 'moon' : 'sun')}</div><div class="f1"><b>Mode gelap</b><div class="small muted">Nyaman untuk belajar malam hari</div></div><label class="switch"><input type="checkbox" ${isDark() ? 'checked' : ''} onchange="setDark(this.checked);rerender()"><span></span></label></div>
            <div class="toggle-row" style="padding:14px 16px"><div class="tile sm">${I('bell')}</div><div class="f1"><b>Pengingat otomatis</b><div class="small muted">${c.email_aktif || c.wa_aktif ? `Dikirim pukul ${pad(c.jam_pengingat || 16)}.00 ${TZL} via ${[c.email_aktif ? 'email' : '', c.wa_aktif ? 'WhatsApp' : ''].filter(Boolean).join(' & ')}` : 'Hanya notifikasi di aplikasi'}</div></div></div></div>
          <button class="btn btn-danger-o btn-block" onclick="doLogout()">${I('logout')}Keluar dari Aplikasi</button></div></div>
      <p class="tc xs muted mt24">${esc(c.nama_aplikasi)} · v${esc(c.version || '1.0')}</p></div>`;
  }
});
function akunFoto(file) {
  if (!file) return;
  const u = S.boot.user, old = u.foto; u.foto = URL.createObjectURL(file); renderChrome(); rerender();   // tampil seketika
  uploadFile(file, 'foto').then((r) => call('profil.update', { foto_file_id: r.file_id }, { silent: true })).then((nu) => { const local = u.foto; Object.assign(u, nu, { foto: local }); saveSnapLater(nu.foto); toast('Foto profil diperbarui.', 'ok'); })
    .catch((e) => { u.foto = old; renderChrome(); rerender(); failToast(e); });
}
/** Simpan URL foto Drive ke snapshot (pratinjau lokal tetap dipakai di sesi ini). */
function saveSnapLater(url) { const u = S.boot.user, cur = u.foto; u.foto = url; saveSnap(); setTimeout(() => { if (S.boot && S.boot.user === u) u.foto = cur; }, 800); }
function akunWA() {
  const v = $('#akWA').value.trim(), u = S.boot.user, old = u.no_wa;
  if (v && !/^(\+?62|0)8\d{7,12}$/.test(v.replace(/[\s-]/g, ''))) { toast('Nomor WhatsApp tidak valid. Contoh: 081234567890', 'warn'); return; }
  u.no_wa = v; toast('Nomor WhatsApp disimpan.', 'ok');
  call('profil.update', { no_wa: v }, { silent: true }).then((nu) => { u.no_wa = nu.no_wa; saveSnap(); if (S.route === 'akun') rerender(); }).catch((e) => { u.no_wa = old; rerender(); failToast(e); });
}
function akunUnlink() {
  confirmBox('Lepas tautan akun Google? Anda tetap bisa masuk dengan username dan kata sandi.', { yes: 'Lepas Tautan', danger: true }).then((ok) => {
    if (!ok) return; const u = S.boot.user, old = u.email_google; u.email_google = ''; rerender();
    call('profil.unlinkGoogle', {}, { silent: true }).then((r) => { Object.assign(u, { email_google: r.user.email_google }); saveSnap(); toast('Tautan Google dilepas.', 'ok'); }).catch((e) => { u.email_google = old; rerender(); failToast(e); });
  });
}

'use strict';
// ════════════════════════════════════════════════════════
// BAGIAN 8: KELAS GABUNGAN (eskul/pengayaan) · JADWAL PELAJARAN · IMPORT SOAL WORD/EXCEL
// ════════════════════════════════════════════════════════

// ── Kelas gabungan: anggotanya siswa dari beberapa rombel ──
const JENIS_KELAS = { REGULER: 'Reguler', ESKUL: 'Ekstrakurikuler', PENGAYAAN: 'Pengayaan' };
const isKhusus = (k) => !!k && (k.jenis === 'ESKUL' || k.jenis === 'PENGAYAAN');
/** Rombel reguler saja: dipakai untuk kelas asal siswa (akun, import akun, pindah kelas). */
const kelasReg = () => (B().kelas || []).filter((k) => !isKhusus(k));
/** Apakah siswa (data ringkas) termasuk kelas kid: kelas asal atau kelas gabungan yang diikuti. */
const inKelas = (s, kid) => !!s && (s.kelas_id === kid || (s.kelas_x || []).indexOf(kid) >= 0);
const kelasPill = (k) => isKhusus(k) ? pill(k.jenis === 'ESKUL' ? 'Eskul' : 'Pengayaan', k.jenis === 'ESKUL' ? 'vio' : 'info') : '';
/** Jumlah siswa sebuah kelas menurut data guru/admin (kelas gabungan memakai jumlah dari server). */
function jmlSiswaKelas(kid) { const k = kelasBy(kid); if (isKhusus(k) && k.jml !== undefined) return k.jml; return (G().siswa || []).filter((s) => inKelas(s, kid)).length; }

// ════════════════════════════════════════════════════════
// JADWAL PELAJARAN
// Baris ringkas dari server: k=kelas, h=hari(1–7), j=jam ke, p=penugasan, m=mapel, g=guru, gn=nama guru, l=kegiatan, r=ruang
// ════════════════════════════════════════════════════════
const HARI_N = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const JD = () => B().jadwal || { cfg: { hari: [1, 2, 3, 4, 5], def: [], khusus: {} }, rows: [] };
const jdSlots = (cfg, h) => ((cfg.khusus || {})[h]) || cfg.def || [];
const hariIni = () => { const d = new Date(now()).getDay(); return d === 0 ? 7 : d; };
const hmNow = () => { const d = new Date(now()); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
const jamLbl = (s) => s.mulai.replace(':', '.') + '–' + s.selesai.replace(':', '.');
/** Hari sekolah berikutnya (termasuk hari ini bila belum lewat jam terakhir). */
function jdHariAktif(cfg, rows) {
  const h0 = hariIni(), t = hmNow(), days = (cfg.hari || []).slice().sort();
  const last = (h) => { const sl = jdSlots(cfg, h).filter((s) => s.ke && rows.some((r) => r.h === h && r.j === s.ke)); return sl.length ? sl[sl.length - 1].selesai : ''; };
  if (days.indexOf(h0) >= 0 && last(h0) && t < last(h0)) return { h: h0, label: 'Hari Ini', today: true };
  for (let i = 1; i <= 7; i++) { const h = ((h0 - 1 + i) % 7) + 1; if (days.indexOf(h) >= 0 && last(h)) return { h, label: i === 1 ? 'Besok' : HARI_N[h] + (i === 7 ? ' Depan' : ''), today: false }; }
  return { h: h0, label: 'Hari Ini', today: true };
}
/**
 * Susun jadwal satu hari: jam berurutan dengan isi yang sama digabung (mis. jam 1–2 Fisika).
 * Hasil: [{mulai, selesai, ke:[…], rows:[…]} | {mulai, selesai, label}] — label = istirahat/kegiatan di pengaturan jam.
 */
function jdDay(rows, cfg, h, opt) {
  opt = opt || {};
  const out = [], sig = (rs) => rs.map((r) => r.k + '|' + (r.p || '') + '|' + (r.l || '') + '|' + (r.r || '')).sort().join('#');
  jdSlots(cfg, h).forEach((s) => {
    if (!s.ke) { if (opt.istirahat !== false) out.push({ mulai: s.mulai, selesai: s.selesai, label: s.label || 'Istirahat' }); return; }
    const rs = rows.filter((r) => r.h === h && r.j === s.ke);
    if (!rs.length && opt.kosong === false) return;
    const prev = out[out.length - 1];
    if (prev && prev.ke && rs.length && sig(prev.rows) === sig(rs) && prev.selesai === s.mulai) { prev.selesai = s.selesai; prev.ke.push(s.ke); return; }
    out.push({ mulai: s.mulai, selesai: s.selesai, ke: [s.ke], rows: rs });
  });
  // buang istirahat di awal/akhir hari yang tidak berisi pelajaran (untuk tampilan ringkas)
  if (opt.kosong === false) { while (out.length && !out[0].ke) out.shift(); while (out.length && !out[out.length - 1].ke) out.pop(); }
  return out;
}
/** Status blok terhadap waktu sekarang (hanya untuk hari ini). */
function jdStatus(blk, h, today) {
  if (today === false || h !== hariIni()) return '';
  const t = hmNow(); return t >= blk.selesai ? 'lalu' : t >= blk.mulai ? 'kini' : 'nanti';
}
/** Teks isi satu baris jadwal sesuai sudut pandang. mode: siswa | ajar (guru) | kelas (wali/admin) | guru (admin per guru) */
function jdText(r, mode) {
  const mp = r.p ? mapelNm(r.m) : (r.l || 'Kegiatan');
  if (mode === 'ajar' || mode === 'guru') return { t: mp, s: [kelasNm(r.k), r.r].filter(Boolean).join(' · ') };
  if (mode === 'siswa') return { t: mp, s: [r.gn, r.k !== me().kelas_id ? kelasNm(r.k) : '', r.r].filter(Boolean).join(' · ') };
  return { t: mp, s: [r.gn, r.r].filter(Boolean).join(' · ') };
}
/** Buka presensi pertemuan langsung dari jadwal (guru). */
function absenDariJadwal(pid) { S.c.absF = Object.assign(S.c.absF || {}, { jenis: 'PERTEMUAN', pid, tgl: D.ymd(now()) }); go('g-absensi'); }

/** Kartu "Jadwal Hari Ini" untuk beranda siswa & dashboard guru. */
function jadwalStrip(mode) {
  const jd = JD(), cfg = jd.cfg, rows = mode === 'ajar' ? jd.rows.filter((r) => r.g === me().user_id) : jd.rows;
  if (!rows.length) return mode === 'siswa' ? '' : '';
  const act = jdHariAktif(cfg, rows), blocks = jdDay(rows, cfg, act.h, { istirahat: false, kosong: false });
  const isToday = act.today, kini = isToday ? blocks.find((b) => jdStatus(b, act.h) === 'kini') : null;
  const next = isToday ? blocks.find((b) => jdStatus(b, act.h) === 'nanti') : blocks[0];
  const card = (b) => {
    const st = jdStatus(b, act.h, isToday), r = b.rows[0], tx = r ? jdText(r, mode) : { t: '—', s: '' };
    const lbl = st === 'kini' ? pill('Sekarang', 'ok', 'activity') : b === next ? pill('Berikutnya', 'info') : '';
    return `<div class="jd-item ${st === 'kini' ? 'kini' : st === 'lalu' ? 'lalu' : ''}" ${r && r.p && mode === 'siswa' ? `onclick="go('s-mapel-d',{mapel_id:'${r.m}'})" role="button"` : ''}>
      <div class="flex items-c g6 jc-b"><span class="mono xs bold">${jamLbl(b)}</span>${lbl}</div>
      <div class="bold mt8 truncate">${esc(tx.t)}</div><div class="xs muted truncate mt4">${esc(tx.s || (b.ke.length > 1 ? 'Jam ' + b.ke[0] + '–' + b.ke[b.ke.length - 1] : 'Jam ke-' + b.ke[0]))}</div>
      ${b.rows.length > 1 ? `<div class="xs muted mt4">+ ${b.rows.length - 1} lainnya</div>` : ''}
      ${mode === 'ajar' && r && r.p ? `<button class="btn btn-sm btn-secondary mt8" onclick="event.stopPropagation();absenDariJadwal('${r.p}')">${I('user-plus', 'ic-sm')}Presensi</button>` : ''}</div>`;
  };
  const head = mode === 'ajar' ? (isToday ? 'Mengajar Hari Ini' : 'Jadwal Mengajar ' + act.label) : (isToday ? 'Jadwal Hari Ini' : 'Jadwal ' + act.label);
  const sub = kini ? 'Sekarang: ' + jdText(kini.rows[0], mode).t : next ? (isToday ? 'Berikutnya ' : 'Mulai ') + next.mulai.replace(':', '.') + ' · ' + jdText(next.rows[0], mode).t : 'Pelajaran hari ini sudah selesai';
  if (mode === 'siswa') return `<div class="sect-title"><h2>${head}</h2><a class="ml-a" href="javascript:void(0)" onclick="go('jadwal')">Seminggu ${I('chev-r', 'ic-sm')}</a></div>
    <p class="small tx2" style="margin:-4px 0 10px">${HARI_N[act.h]} · ${esc(sub)}</p><div class="hscroll">${blocks.map(card).join('')}</div>`;
  return `<div class="card mt16"><div class="card-hd"><div><h3>${head}</h3><p class="small muted">${HARI_N[act.h]} · ${esc(sub)}</p></div><a href="javascript:void(0)" class="small bold" onclick="go('jadwal')">Seminggu ${I('chev-r', 'ic-sm')}</a></div>
    <div class="card-bd"><div class="hscroll">${blocks.map(card).join('')}</div></div></div>`;
}

/** Grid jadwal seminggu (desktop) atau per hari (HP). cellFn opsional untuk mode edit admin. */
function jdGrid(rows, cfg, mode, opt) {
  opt = opt || {};
  const days = (cfg.hari || []).slice().sort(), desk = window.innerWidth >= 900;
  const st = S.c.jdDay || (S.c.jdDay = {}), key = opt.key || 'v';
  if (!st[key] || days.indexOf(st[key]) < 0) st[key] = days.indexOf(hariIni()) >= 0 ? hariIni() : days[0];
  const show = desk ? days : [st[key]];
  const col = (h) => {
    const blocks = opt.edit ? jdSlots(cfg, h).map((s) => s.ke ? { mulai: s.mulai, selesai: s.selesai, ke: [s.ke], rows: rows.filter((r) => r.h === h && r.j === s.ke) } : { mulai: s.mulai, selesai: s.selesai, label: s.label || 'Istirahat' }) : jdDay(rows, cfg, h);
    return `<div class="jd-col">${desk ? `<div class="jd-head ${h === hariIni() ? 'today' : ''}">${HARI_N[h]}</div>` : ''}${blocks.map((b) => {
      if (!b.ke) return `<div class="jd-brk"><span>${esc(b.label)}</span><span class="mono">${jamLbl(b)}</span></div>`;
      const stt = opt.edit ? '' : jdStatus(b, h);
      const inner = b.rows.length ? b.rows.map((r) => { const tx = jdText(r, mode); return `<div class="jd-les ${r.p ? '' : 'keg'} ${opt.bentrok && opt.bentrok(r) ? 'bentrok' : ''}">${r.p ? `<span class="dot" style="background:${mapelColor(r.m)}"></span>` : ''}<div style="min-width:0"><div class="bold small truncate">${esc(tx.t)}</div>${tx.s ? `<div class="xs muted truncate">${esc(tx.s)}</div>` : ''}${opt.bentrok && opt.bentrok(r) ? `<div class="xs ink-err bold">${I('alert', 'ic-sm')} ${esc(opt.bentrok(r))}</div>` : ''}</div></div>`; }).join('')
        : `<div class="xs muted">${opt.edit ? I('plus', 'ic-sm') + ' Isi' : '—'}</div>`;
      const click = opt.edit ? `onclick="jdPick(${h},'${b.ke[0]}')"` : '';
      return `<div class="jd-slot ${stt} ${opt.edit ? 'edit' : ''} ${b.rows.length ? '' : 'kosong'}" ${click}><div class="jd-time"><span class="mono">${b.mulai.replace(':', '.')}</span><span class="xs muted">${b.ke.length > 1 ? 'Jam ' + b.ke[0] + '–' + b.ke[b.ke.length - 1] : 'Jam ' + b.ke[0]}</span></div><div class="jd-body">${inner}</div>${stt === 'kini' ? '<span class="jd-now">Sekarang</span>' : ''}</div>`;
    }).join('')}</div>`;
  };
  return `${desk ? '' : `<div class="seg mb12" style="display:flex;overflow-x:auto">${days.map((h) => `<button class="${st[key] === h ? 'on' : ''}" style="flex:1" onclick="S.c.jdDay['${key}']=${h};rerender()">${HARI_N[h].slice(0, 3)}${h === hariIni() ? ' •' : ''}</button>`).join('')}</div>`}
    <div class="jd-wrap"><div class="jd-grid" style="grid-template-columns:repeat(${show.length},minmax(${desk ? 150 : 0}px,1fr))">${show.map(col).join('')}</div></div>`;
}
const MAPEL_COLORS = ['#2563EB', '#16A34A', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#DC2626', '#65A30D', '#9333EA', '#0D9488'];
function mapelColor(id) { let h = 0; String(id || '').split('').forEach((c) => { h = (h * 31 + c.charCodeAt(0)) | 0; }); return MAPEL_COLORS[Math.abs(h) % MAPEL_COLORS.length]; }

// ── Halaman Jadwal untuk siswa & guru ──
route('jadwal', {
  title: 'Jadwal Pelajaran', roles: ['SISWA', 'GURU'],
  render() {
    const jd = JD(), u = me(), isS = hasRole('SISWA');
    const V = S.c.jdV || (S.c.jdV = { mode: 'ajar', kelas: (u.waliKelas || [])[0] || '' });
    let rows = jd.rows, mode = 'siswa', sub = '';
    if (isS) sub = 'Kelas ' + kelasNm(u.kelas_id) + ((u.kelas_x || []).length ? ' · ' + u.kelas_x.map(kelasNm).join(', ') : '');
    else if (V.mode === 'wali' && (u.waliKelas || []).length) { rows = jd.rows.filter((r) => r.k === V.kelas); mode = 'kelas'; sub = 'Kelas ' + kelasNm(V.kelas); }
    else { rows = jd.rows.filter((r) => r.g === u.user_id); mode = 'ajar'; sub = plural(rows.length, 'jam pelajaran') + ' per minggu'; }
    const tools = !isS && (u.waliKelas || []).length ? `<div class="seg">${[['ajar', 'Jadwal Mengajar']].concat(u.waliKelas.map((k) => ['wali:' + k, kelasNm(k)])).map((x) => { const on = x[0] === 'ajar' ? V.mode === 'ajar' : V.mode === 'wali' && 'wali:' + V.kelas === x[0]; return `<button class="${on ? 'on' : ''}" onclick="${x[0] === 'ajar' ? "S.c.jdV.mode='ajar'" : `S.c.jdV.mode='wali';S.c.jdV.kelas='${x[0].slice(5)}'`};rerender()">${esc(x[1])}</button>`; }).join('')}</div>` : '';
    return `<div class="page"><div class="page-hd"><div><h1>Jadwal Pelajaran</h1><p class="sub">${esc(sub)}${B().ta ? ' · Semester ' + esc(B().ta.semester) + ' ' + esc(B().ta.nama) : ''}</p></div>${tools}</div>
      ${rows.length ? jdGrid(rows, jd.cfg, mode, { key: 'v' + mode }) : `<div class="card">${emptyState('clock', 'Jadwal belum tersedia', isS ? 'Jadwal pelajaran kelasmu belum diatur oleh admin sekolah.' : 'Admin sekolah belum mengisi jadwal untuk Anda. Jadwal diatur di menu Jadwal Pelajaran oleh Admin.')}</div>`}</div>`;
  }
});

// ── Editor jadwal (Admin) ──
route('a-jadwal', {
  title: 'Jadwal Pelajaran', roles: ['ADMIN'],
  render() {
    const d = need('jdl', 'jadwal.list', {}, 60000), ent = S.c.jdl;
    if (!d) return ent && ent.err ? `<div class="page">${emptyState('alert', 'Gagal memuat jadwal', esc(ent.err.message), `<button class="btn btn-secondary" onclick="drop('jdl');rerender()">${I('refresh')}Coba lagi</button>`)}</div>` : skelPage();
    const kelas = (B().kelas || []).slice().sort((a, b) => (isKhusus(a) - isKhusus(b)) || String(a.nama_kelas).localeCompare(String(b.nama_kelas), 'id', { numeric: true }));
    const E = S.c.jdE || (S.c.jdE = { view: 'kelas', kelas: (kelas[0] || {}).kelas_id, guru: '' });
    if (!kelas.some((k) => k.kelas_id === E.kelas)) E.kelas = (kelas[0] || {}).kelas_id;
    const cnt = {}; d.rows.forEach((r) => { cnt[r.k] = (cnt[r.k] || 0) + 1; });
    const slotMap = {}; d.rows.forEach((r) => { if (!r.g) return; const k = r.g + '|' + r.h + '|' + r.j; (slotMap[k] = slotMap[k] || []).push(r.k); });
    const bentrok = (r) => { const ks = (slotMap[r.g + '|' + r.h + '|' + r.j] || []).filter((x) => x !== r.k); return ks.length ? 'Bentrok: ' + ks.map(kelasShort).join(', ') : ''; };
    const nB = Object.keys(slotMap).filter((k) => new Set(slotMap[k]).size > 1).length;
    const st = S.c.jdSave || '';
    const status = st === 'saving' ? `<span class="small muted flex items-c g6">${I('refresh', 'ic-sm')}Menyimpan…</span>` : st === 'err' ? `<span class="small ink-err flex items-c g6">${I('alert', 'ic-sm')}Gagal menyimpan <button class="btn btn-sm btn-ghost" onclick="jdFlush()">Coba lagi</button></span>` : st === 'ok' ? `<span class="small ink-ok flex items-c g6">${I('check-c', 'ic-sm')}Tersimpan</span>` : '';
    const gurus = (B().gurus || []).slice().sort(by('nama'));
    let body;
    if (E.view === 'guru') {
      if (!E.guru) E.guru = (gurus[0] || {}).user_id || '';
      const rows = d.rows.filter((r) => r.g === E.guru);
      body = `<div class="card card-p"><div class="flex g12 items-e wrap"><div class="field" style="min-width:240px"><label class="label">Guru</label><select class="select" onchange="S.c.jdE.guru=this.value;rerender()">${gurus.map((g) => `<option value="${g.user_id}" ${g.user_id === E.guru ? 'selected' : ''}>${esc(g.nama)} (${d.rows.filter((r) => r.g === g.user_id).length} jam)</option>`).join('')}</select></div><p class="small muted">${plural(rows.length, 'jam')} per minggu. Ubah jadwal melalui tampilan per kelas.</p></div></div>
        <div class="mt16">${rows.length ? jdGrid(rows, d.cfg, 'guru', { key: 'g', bentrok }) : `<div class="card">${emptyState('clock', 'Belum ada jam mengajar', 'Guru ini belum dijadwalkan di kelas mana pun.')}</div>`}</div>`;
    } else {
      const k = kelasBy(E.kelas), rows = d.rows.filter((r) => r.k === E.kelas);
      const pens = G().penugasan.filter((p) => p.kelas_id === E.kelas);
      body = `<div class="chips scroll">${kelas.map((x) => `<button class="chip ${x.kelas_id === E.kelas ? 'on' : ''}" onclick="S.c.jdE.kelas='${x.kelas_id}';rerender()">${esc(x.nama_kelas)}${isKhusus(x) ? ' ★' : ''}<span class="cnt">${cnt[x.kelas_id] || 0}</span></button>`).join('')}</div>
        <div class="card card-p mt12 flex items-c g12 wrap"><div class="f1" style="min-width:200px"><div class="bold">${esc(k.nama_kelas)} ${kelasPill(k)}</div><div class="small muted">${plural(rows.length, 'jam terisi')} · ${plural(pens.length, 'penugasan mengajar')} · klik kotak jam untuk mengisi</div></div>${status}</div>
        ${!pens.length ? `<div class="banner banner-warn mt12">${I('alert')}<div class="f1 small">Kelas ini belum punya penugasan mengajar, jadi mapel belum bisa dipilih. Tambahkan di Data Akademik → Penugasan Mengajar, atau gunakan Import Excel (penugasan dibuat otomatis).</div><button class="btn btn-sm btn-secondary" onclick="go('a-akademik',{tab:'penugasan'})">Penugasan</button></div>` : ''}
        <div class="mt12">${jdGrid(rows, d.cfg, 'kelas', { key: 'e', edit: true, bentrok })}</div>`;
    }
    return `<div class="page"><div class="page-hd"><div><h1>Jadwal Pelajaran</h1><p class="sub">Hanya admin yang dapat mengubah. Guru dan siswa melihat jadwalnya di dashboard masing-masing.</p></div>
        <div class="flex g8 wrap"><button class="btn btn-secondary" onclick="openJamEditor()">${I('clock')}Jam Pelajaran</button><button class="btn btn-secondary" onclick="openJadwalImport()">${I('upload')}Import Excel</button><button class="btn btn-ghost" onclick="exportJadwal()">${I('download')}Ekspor</button></div></div>
      ${nB ? `<div class="banner banner-err mb16">${I('alert-c')}<div class="f1 small"><b>${nB} jadwal bentrok:</b> ada guru yang dijadwalkan di dua kelas pada jam yang sama. Kotak yang bentrok diberi tanda merah.</div></div>` : ''}
      <div class="seg mb12">${[['kelas', 'Per Kelas'], ['guru', 'Per Guru']].map((x) => `<button class="${E.view === x[0] ? 'on' : ''}" onclick="S.c.jdE.view='${x[0]}';rerender()">${x[1]}</button>`).join('')}</div>
      ${body}</div>`;
  }
});
/** Pilih isi satu kotak jam (penugasan / kegiatan / kosongkan). */
function jdPick(h, ke) {
  const d = S.c.jdl && S.c.jdl.d; if (!d) return;
  const kid = S.c.jdE.kelas, slots = jdSlots(d.cfg, h), s = slots.find((x) => x.ke === ke), cur = d.rows.find((r) => r.k === kid && r.h === h && r.j === ke);
  const nextS = slots.slice(slots.indexOf(s) + 1).find((x) => x.ke);
  const pens = G().penugasan.filter((p) => p.kelas_id === kid).sort(by((p) => mapelNm(p.mapel_id)));
  const busy = (gid) => d.rows.filter((r) => r.g === gid && r.h === h && r.j === ke && r.k !== kid).map((r) => kelasShort(r.k));
  sheet({ title: `${HARI_N[h]} · Jam ke-${esc(ke)} · ${esc(kelasNm(kid))}`, icon: 'clock', body: `<p class="small muted">${jamLbl(s)}</p>
    <div class="col g8 mt12">${pens.map((p) => { const b = busy(p.guru_id); return `<button class="row-item click card" style="padding:10px 12px;text-align:left;${cur && cur.p === p.penugasan_id ? 'border-color:var(--p600);background:var(--p50)' : ''}" data-pid="${p.penugasan_id}">${mapelIcon(p.mapel_id, 'sm')}<div class="f1" style="min-width:0"><div class="bold small">${esc(mapelNm(p.mapel_id))}</div><div class="xs muted truncate">${esc(p.guru || '')}</div>${b.length ? `<div class="xs ink-err bold">${I('alert', 'ic-sm')} Sudah mengajar ${esc(b.join(', '))} di jam ini</div>` : ''}</div>${cur && cur.p === p.penugasan_id ? I('check-c', 'ink-p') : ''}</button>`; }).join('') || '<p class="small muted">Belum ada penugasan mengajar di kelas ini.</p>'}</div>
    <div class="divider"></div>
    <div class="form-grid c2"><div class="field"><label class="label">Kegiatan lain (bukan pelajaran)</label><input class="input" id="jdLbl" maxlength="60" placeholder="mis. Upacara, Literasi, Pramuka" value="${esc(cur && !cur.p ? cur.l : '')}"></div>
      <div class="field"><label class="label">Ruang (opsional)</label><input class="input" id="jdRu" maxlength="40" placeholder="mis. Lab IPA" value="${esc(cur ? cur.r : '')}"></div></div>
    ${nextS ? `<label class="flex items-c g8 mt12 small" style="cursor:pointer"><input type="checkbox" id="jdNext" style="width:18px;height:18px;accent-color:var(--p600)"> Isi juga jam ke-${esc(nextS.ke)} (${jamLbl(nextS)})</label>` : ''}`,
    foot: `${cur ? `<button class="btn btn-danger-o" id="jdClr">${I('trash')}Kosongkan</button>` : ''}<button class="btn btn-primary" id="jdKeg">${I('check')}Simpan Kegiatan</button>`,
    mount: (el, close) => {
      const apply = (p, label) => {
        const ru = $('#jdRu', el).value.trim(), kes = [ke].concat(nextS && $('#jdNext', el) && $('#jdNext', el).checked ? [nextS.ke] : []);
        kes.forEach((j) => {
          d.rows = d.rows.filter((r) => !(r.k === kid && r.h === h && r.j === j));
          if (p || label) { const pn = p ? G().penugasan.find((x) => x.penugasan_id === p) : null; d.rows.push({ id: 'tmp', k: kid, h, j, p: p || '', m: pn ? pn.mapel_id : '', g: pn ? pn.guru_id : '', gn: pn ? pn.guru || '' : '', l: p ? '' : label, r: ru }); }
        });
        close(); JDV[kid] = (JDV[kid] || 0) + 1; rerender(); jdQueue(kid);
      };
      $$('[data-pid]', el).forEach((b) => { b.onclick = () => apply(b.dataset.pid, ''); });
      $('#jdKeg', el).onclick = () => { const v = $('#jdLbl', el).value.trim(); if (!v) { toast('Pilih mapel di atas, atau isi nama kegiatan.', 'warn'); return; } apply('', v); };
      if ($('#jdClr', el)) $('#jdClr', el).onclick = () => apply('', '');
    } });
}
/** Simpan otomatis per kelas (ditunda sebentar agar beberapa perubahan cepat jadi satu permintaan). */
const JDQ = {}, JDV = {};   // JDV: versi edit lokal per kelas (jawaban server lama tidak menimpa edit yang lebih baru)
let jdTimer = null;
function jdQueue(kid) { JDQ[kid] = 1; S.c.jdSave = 'saving'; clearTimeout(jdTimer); jdTimer = setTimeout(jdFlush, 700); }
let jdBusy = false;
/** Kirim perubahan yang antre. Hanya satu pengiriman berjalan sekaligus agar urutan simpan di server selalu benar. */
function jdFlush() {
  const d = S.c.jdl && S.c.jdl.d; if (!d) return;
  if (jdBusy) { clearTimeout(jdTimer); jdTimer = setTimeout(jdFlush, 400); return; }
  const ks = Object.keys(JDQ); ks.forEach((k) => delete JDQ[k]);
  if (!ks.length) { if (S.c.jdSave === 'err') { S.c.jdSave = ''; rerender(); } return; }
  jdBusy = true; S.c.jdSave = 'saving'; if (S.route === 'a-jadwal') rerender();
  Promise.all(ks.map((kid) => {
    const v = JDV[kid] || 0, cells = d.rows.filter((r) => r.k === kid).map((r) => ({ hari: r.h, jam_ke: r.j, penugasan_id: r.p, label: r.l, ruang: r.r }));
    return call('jadwal.save', { kelas_id: kid, cells }, { silent: true }).then((res) => {
      if ((JDV[kid] || 0) === v) d.rows = d.rows.filter((r) => r.k !== kid).concat(res.rows);   // edit yang lebih baru tetap dipertahankan
      if (res.bentrok.length) toast(`Jadwal ${kelasNm(kid)} tersimpan, tetapi ada ${res.bentrok.length} bentrok guru (ditandai merah).`, 'warn', 6000);
    });
  })).then(() => {
    jdBusy = false;
    if (Object.keys(JDQ).length) { jdFlush(); return; }
    S.c.jdSave = 'ok'; S.c.jdl.t = Date.now(); syncJadwalSaya(d); if (S.route === 'a-jadwal') rerender();
  }).catch((e) => { jdBusy = false; ks.forEach((k) => { JDQ[k] = 1; }); S.c.jdSave = 'err'; failToast(e); if (S.route === 'a-jadwal') rerender(); });
}
/** Admin yang juga guru: perbarui jadwal mengajarnya sendiri di data awal tanpa memuat ulang. */
function syncJadwalSaya(d) { if (!B().jadwal || !hasRole('GURU')) return; const u = me(); B().jadwal.cfg = d.cfg; B().jadwal.rows = d.rows.filter((r) => r.g === u.user_id || (u.waliKelas || []).indexOf(r.k) >= 0); saveSnap(); }

// ── Pengaturan jam pelajaran ──
function openJamEditor() {
  const d = S.c.jdl && S.c.jdl.d; if (!d) return;
  const W = JSON.parse(JSON.stringify(d.cfg)); W.khusus = W.khusus || {};
  const addMin = (hm, m) => { const [h, mm] = hm.split(':').map(Number), t = h * 60 + mm + m; return pad(Math.floor(t / 60) % 24) + ':' + pad(t % 60); };
  const tbl = (key) => {
    const list = key === 'def' ? W.def : W.khusus[key];
    return `<div class="tbl-wrap"><table class="tbl compact"><thead><tr><th style="width:80px">Jam ke</th><th>Mulai</th><th>Selesai</th><th>Keterangan</th><th></th></tr></thead><tbody>${list.map((s, i) => `<tr>
      <td><input class="input input-sm" data-k="${key}" data-i="${i}" data-f="ke" value="${esc(s.ke)}" placeholder="—" style="width:64px"></td>
      <td><input class="input input-sm" type="time" data-k="${key}" data-i="${i}" data-f="mulai" value="${s.mulai}"></td>
      <td><input class="input input-sm" type="time" data-k="${key}" data-i="${i}" data-f="selesai" value="${s.selesai}"></td>
      <td><input class="input input-sm" data-k="${key}" data-i="${i}" data-f="label" value="${esc(s.label || '')}" placeholder="${s.ke ? '' : 'Istirahat'}" ${s.ke ? 'disabled' : ''}></td>
      <td><button class="icon-btn ink-err" data-del="${key}:${i}" title="Hapus">${I('x')}</button></td></tr>`).join('')}</tbody></table></div>
      <div class="flex g8 mt8 wrap"><button class="btn btn-sm btn-secondary" data-add="${key}:jam">${I('plus', 'ic-sm')}Jam pelajaran</button><button class="btn btn-sm btn-ghost" data-add="${key}:ist">${I('plus', 'ic-sm')}Istirahat / kegiatan</button></div>`;
  };
  const s = sheet({ title: 'Jam Pelajaran', icon: 'clock', size: 'wide', body: '<div id="jamBox"></div>', foot: `<button class="btn btn-primary" id="jamSave">${I('check')}Simpan Jam Pelajaran</button>`,
    mount: (el) => {
      const draw = () => {
        $('#jamBox', el).innerHTML = `<div class="field"><label class="label">Hari sekolah</label><div class="chips">${[1, 2, 3, 4, 5, 6, 7].map((h) => `<button type="button" class="chip ${W.hari.indexOf(h) >= 0 ? 'sel-o' : ''}" data-h="${h}">${W.hari.indexOf(h) >= 0 ? I('check', 'ic-sm') : ''}${HARI_N[h]}</button>`).join('')}</div></div>
          <h3 class="mt16">Jam pelajaran umum</h3><p class="small muted mt4">Berlaku untuk semua hari sekolah, kecuali hari yang diberi jam khusus. Baris tanpa "jam ke" adalah istirahat atau kegiatan.</p><div class="mt8">${tbl('def')}</div>
          <h3 class="mt24">Hari dengan jam berbeda</h3><p class="small muted mt4">Misalnya Senin ada upacara atau Jumat lebih pendek.</p>
          ${W.hari.map((h) => `<div class="card card-p mt12"><label class="flex items-c g8" style="cursor:pointer"><input type="checkbox" data-kh="${h}" ${W.khusus[h] ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--p600)"><b>${HARI_N[h]}</b> memakai jam khusus</label>${W.khusus[h] ? `<div class="mt12">${tbl(String(h))}</div>` : ''}</div>`).join('')}`;
        $$('[data-h]', el).forEach((b) => { b.onclick = () => { const h = +b.dataset.h, i = W.hari.indexOf(h); if (i >= 0) W.hari.splice(i, 1); else W.hari.push(h); W.hari.sort(); draw(); }; });
        $$('[data-kh]', el).forEach((c) => { c.onchange = () => { const h = c.dataset.kh; if (c.checked) W.khusus[h] = JSON.parse(JSON.stringify(W.def)); else delete W.khusus[h]; draw(); }; });
        $$('[data-f]', el).forEach((inp) => { inp.oninput = () => { const list = inp.dataset.k === 'def' ? W.def : W.khusus[inp.dataset.k], it = list[+inp.dataset.i]; it[inp.dataset.f] = inp.value.trim(); if (inp.dataset.f === 'ke') { const lb = inp.closest('tr').querySelector('[data-f="label"]'); lb.disabled = !!it.ke; } }; });
        $$('[data-del]', el).forEach((b) => { b.onclick = () => { const [k, i] = b.dataset.del.split(':'); (k === 'def' ? W.def : W.khusus[k]).splice(+i, 1); draw(); }; });
        $$('[data-add]', el).forEach((b) => { b.onclick = () => {
          const [k, t] = b.dataset.add.split(':'), list = k === 'def' ? W.def : W.khusus[k], last = list[list.length - 1];
          const mulai = last ? last.selesai : '07:00', nKe = list.filter((x) => x.ke).length + 1;
          list.push(t === 'jam' ? { ke: String(nKe), mulai, selesai: addMin(mulai, 45), label: '' } : { ke: '', mulai, selesai: addMin(mulai, 15), label: 'Istirahat' }); draw();
        }; });
      };
      draw();
      $('#jamSave', el).onclick = () => {
        const btn = $('#jamSave', el); btnBusy(btn, true, 'Menyimpan…');
        call('jadwal.jam', { cfg: W }).then((r) => {
          d.cfg = r.cfg; if (B().jadwal) B().jadwal.cfg = r.cfg; saveSnap(); s.close(); rerender();
          toast(r.yatim ? `Jam pelajaran disimpan. ${r.yatim} jadwal berada di luar jam baru dan tidak ditampilkan — periksa kembali.` : 'Jam pelajaran disimpan.', r.yatim ? 'warn' : 'ok', 7000);
        }).catch((e) => { btnBusy(btn, false); failToast(e); });
      };
    } });
}

// ── Import & ekspor jadwal (Excel) ──
const JADWAL_COLS = ['kelas', 'hari', 'jam_ke', 'mapel', 'guru', 'ruang', 'kegiatan'];
function jadwalTemplate() {
  const d = S.c.jdl && S.c.jdl.d, cfg = d ? d.cfg : JD().cfg, kelas = (B().kelas || []).slice().sort(by('nama_kelas'));
  const k0 = kelas.find((k) => G().penugasan.some((p) => p.kelas_id === k.kelas_id)) || kelas[0] || { nama_kelas: 'XI-1', kelas_id: '' };
  const pens = G().penugasan.filter((p) => p.kelas_id === k0.kelas_id).slice(0, 3);
  const ex = [JADWAL_COLS, [k0.nama_kelas, 'Senin', '1', '', '', '', 'Upacara']];
  pens.forEach((p, i) => ex.push([k0.nama_kelas, 'Senin', i === 0 ? '2-3' : String(i + 3), mapelNm(p.mapel_id), p.guru || '', i === 0 ? 'Lab IPA' : '', '']));
  if (!pens.length) ex.push([k0.nama_kelas, 'Senin', '2-3', 'Matematika', 'Nama Guru', '', '']);
  const jam = [['hari', 'jam ke', 'mulai', 'selesai', 'keterangan']];
  (cfg.hari || []).forEach((h) => jdSlots(cfg, h).forEach((s) => jam.push([HARI_N[h], s.ke, s.mulai, s.selesai, s.label || ''])));
  exportXlsx('template_jadwal_pelajaran', [
    { name: 'Jadwal', rows: ex },
    { name: 'Petunjuk', rows: [['Petunjuk pengisian jadwal pelajaran'], ['Satu baris = satu pelajaran di satu kelas. Kolom: kelas, hari, jam_ke, mapel, guru, ruang, kegiatan.'], ['kelas: nama kelas seperti di Data Akademik (singkatan XI-2 atau 11-2 boleh bila hanya cocok satu kelas). Kelas eskul/pengayaan juga bisa.'], ['hari: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu.'], ['jam_ke: satu jam (3), rentang (1-2), atau daftar (1,3). Harus ada di lembar "Jam Pelajaran".'], ['mapel: nama atau kode mapel. guru: nama, NIP, atau username guru (wajib bila mapel di kelas itu diajar lebih dari satu guru).'], ['Bila guru dan mapel belum punya penugasan di kelas tersebut, penugasan dibuat otomatis saat import.'], ['kegiatan: isi untuk acara non-pelajaran (Upacara, Literasi) dan kosongkan kolom mapel.'], ['Mode "Ganti" menghapus jadwal lama kelas-kelas yang ada di berkas lalu memakai isi berkas. Mode "Tambah" hanya mengganti jam yang tertulis di berkas.']] },
    { name: 'Jam Pelajaran', rows: jam },
    { name: 'Daftar Kelas', rows: [['nama_kelas', 'jenis']].concat(kelas.map((k) => [k.nama_kelas, JENIS_KELAS[k.jenis || 'REGULER']])) },
    { name: 'Daftar Mapel', rows: [['nama_mapel', 'kode']].concat((B().mapel || []).map((m) => [m.nama_mapel, m.kode || ''])) },
    { name: 'Daftar Guru', rows: [['nama', 'nip']].concat((B().gurus || []).map((g) => [g.nama, g.nis_nip || ''])) },
    { name: 'Penugasan', rows: [['kelas', 'mapel', 'guru']].concat(G().penugasan.map((p) => [kelasNm(p.kelas_id), mapelNm(p.mapel_id), p.guru || '']).sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1]))) }]);
}
function exportJadwal() {
  const d = S.c.jdl && S.c.jdl.d; if (!d) return;
  const rows = d.rows.slice().sort((a, b) => kelasNm(a.k).localeCompare(kelasNm(b.k)) || a.h - b.h || String(a.j).localeCompare(String(b.j), 'id', { numeric: true }));
  exportXlsx('jadwal_pelajaran_' + D.ymd(now()), [{ name: 'Jadwal', rows: [JADWAL_COLS].concat(rows.map((r) => [kelasNm(r.k), HARI_N[r.h], r.j, r.p ? mapelNm(r.m) : '', r.gn || '', r.r || '', r.p ? '' : r.l])) }]);
}
function openJadwalImport() {
  const W = { rows: null, res: null, file: '', mode: 'GANTI' };
  const s = sheet({ title: 'Import Jadwal dari Excel', icon: 'upload', size: 'wide', body: '<div id="jiBody"></div>', foot: `<button class="btn btn-secondary" id="jiTpl">${I('download')}Unduh Template</button><button class="btn btn-primary" id="jiGo" disabled>${I('cloud-ok')}Import</button>`,
    mount: (el) => {
      const draw = () => {
        const r = W.res;
        $('#jiBody', el).innerHTML = `<p class="small tx2">Kolom: <span class="mono xs">${JADWAL_COLS.join(', ')}</span>. Unduh template: isinya contoh dari data sekolah Anda serta daftar kelas, mapel, guru, dan jam pelajaran.</p>
          <label class="upload mt12">${I('file-text', 'ic-lg')}<div class="bold mt8">${W.file ? esc(W.file) : 'Pilih berkas .xlsx atau .csv'}</div><div class="small muted">Maksimal 3.000 baris</div><input type="file" hidden accept=".xlsx,.xls,.csv" id="jiFile"></label>
          <div class="field mt16"><label class="label">Cara menyimpan</label><div class="seg">${[['GANTI', 'Ganti jadwal kelas di berkas'], ['TAMBAH', 'Hanya jam yang tertulis']].map((x) => `<button class="${W.mode === x[0] ? 'on' : ''}" data-m="${x[0]}">${x[1]}</button>`).join('')}</div></div>
          ${r ? `<div class="flex g8 mt16 wrap">${pill(r.jam + ' jam siap', 'ok', 'check')}${pill(r.kelas.length + ' kelas', 'info')}${r.penugasanBaru ? pill(r.penugasanBaru + ' penugasan baru', 'vio', 'plus') : ''}${r.errors.length ? pill(r.errors.length + ' baris bermasalah (dilewati)', 'err', 'alert') : ''}</div>
            <div class="tbl-wrap mt12" style="max-height:44vh"><table class="tbl compact"><thead><tr><th>Baris</th><th>Kelas</th><th>Hari</th><th>Jam</th><th>Mapel / kegiatan</th><th>Guru</th><th>Status</th></tr></thead><tbody>${r.all.map((x) => x.err ? `<tr class="row-err"><td class="mono">#${x.i + 2}</td><td colspan="5" class="small">${esc([W.rows[x.i].kelas, W.rows[x.i].hari, W.rows[x.i].jam_ke, W.rows[x.i].mapel || W.rows[x.i].kegiatan].filter(Boolean).join(' · '))}</td><td class="small ink-err">${esc(x.err)}</td></tr>`
              : `<tr><td class="mono">#${x.i + 2}</td><td class="small">${esc(x.kelas)}</td><td class="small">${esc(x.hari)}</td><td class="mono small">${esc(x.jam_ke)}</td><td class="small">${esc(x.mapel || x.kegiatan)}${x.ruang ? ' · ' + esc(x.ruang) : ''}</td><td class="small">${esc(x.guru || '')}</td><td>${x.baru ? pill('Penugasan baru', 'vio') : pill('Valid', 'ok')}</td></tr>`).join('')}</tbody></table></div>` : ''}`;
        $$('[data-m]', el).forEach((b) => { b.onclick = () => { W.mode = b.dataset.m; draw(); }; });
        $('#jiFile', el).onchange = (e) => {
          const f = e.target.files[0]; if (!f) return; W.file = f.name;
          readSheetFile(f).then((rows) => { W.rows = rowsToObjs(rows); if (!W.rows.length) throw new Error('Berkas kosong atau baris pertama bukan nama kolom.'); return call('jadwal.import', { rows: W.rows, dry: true }); })
            .then((r2) => { W.res = Object.assign(r2, { all: r2.valid.concat(r2.errors.map((x) => ({ i: x.i, err: x.msg }))).sort(by('i')) }); $('#jiGo', el).disabled = !r2.valid.length; $('#jiGo', el).innerHTML = `${I('cloud-ok')}Import ${r2.jam} Jam`; draw(); })
            .catch(failToast);
        };
      };
      draw();
      $('#jiTpl', el).onclick = jadwalTemplate;
      $('#jiGo', el).onclick = () => {
        const btn = $('#jiGo', el), okI = {}; W.res.valid.forEach((v) => { okI[v.i] = 1; }); btnBusy(btn, true, 'Menyimpan…');
        call('jadwal.import', { rows: W.rows.filter((x, i) => okI[i]), mode: W.mode }).then((r) => {
          s.close(); S.c.jdl = { t: Date.now(), d: r.list }; syncJadwalSaya(r.list);
          if (r.penugasanBaru) refreshBoot(true).catch(() => {});
          rerender(); toast(`${r.inserted} jam pelajaran diimpor untuk ${r.kelas} kelas${r.penugasanBaru ? ', ' + r.penugasanBaru + ' penugasan baru dibuat' : ''}.`, 'ok', 6000);
          if (r.bentrok.length) toast(r.bentrok.length + ' jadwal bentrok guru ditemukan. Periksa kotak bertanda merah.', 'warn', 8000);
        }).catch((e) => { btnBusy(btn, false); failToast(e); });
      };
    } });
}

// ════════════════════════════════════════════════════════
// IMPORT SOAL DARI WORD (.docx) & EXCEL (.xlsx) LENGKAP DENGAN GAMBAR
// Berkas dibaca langsung di perangkat (JSZip). Gambar diperkecil lalu diunggah ke Drive saat soal disimpan.
// ════════════════════════════════════════════════════════
let JSZIPP = null;
function loadJSZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (JSZIPP) return JSZIPP;
  JSZIPP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'; s.onload = () => res(window.JSZip); s.onerror = () => { JSZIPP = null; rej(new Error('Pustaka pembaca berkas gagal dimuat. Periksa koneksi internet lalu coba lagi.')); }; document.head.appendChild(s); });
  return JSZIPP;
}
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const xmlOf = (t) => new DOMParser().parseFromString(t, 'application/xml');
const kidsL = (el, n) => Array.from(el ? el.children : []).filter((c) => c.localName === n);
const kidL = (el, n) => kidsL(el, n)[0] || null;
function descL(el, n) { if (!el) return null; for (const c of el.children) { if (c.localName === n) return c; const x = descL(c, n); if (x) return x; } return null; }
function allL(el, n, out) { out = out || []; if (!el) return out; for (const c of el.children) { if (c.localName === n) out.push(c); allL(c, n, out); } return out; }
const attrL = (el, n) => { if (!el) return ''; for (const a of el.attributes) if (a.localName === n) return a.value; return ''; };
function joinPath(base, target) {
  if (target.charAt(0) === '/') return target.slice(1);
  const parts = (base + target).split('/'), out = [];
  parts.forEach((p) => { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p); });
  return out.join('/');
}
/** Peta relasi (rId → path di dalam zip) dari berkas .rels. */
async function relsOf(zip, relPath, baseDir) {
  const f = zip.file(relPath), m = {}; if (!f) return m;
  kidsL(xmlOf(await f.async('string')).documentElement, 'Relationship').forEach((r) => { if (r.getAttribute('TargetMode') !== 'External') m[r.getAttribute('Id')] = joinPath(baseDir, r.getAttribute('Target')); });
  return m;
}
const IMG_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' };
/** Ambil gambar dari zip sebagai Blob; format yang tidak bisa ditampilkan browser (EMF/WMF/TIFF) dilaporkan. */
async function zipImage(zip, path) {
  const ext = String(path.split('.').pop() || '').toLowerCase(), f = zip.file(path);
  if (!f) return { err: 'Gambar tidak ditemukan di dalam berkas.' };
  if (!IMG_MIME[ext]) return { err: 'Format gambar ' + ext.toUpperCase() + ' tidak didukung. Simpan ulang gambar sebagai PNG/JPG lalu tempel lagi.' };
  return { blob: new Blob([await f.async('uint8array')], { type: IMG_MIME[ext] }), name: path.split('/').pop() };
}
const SUPC = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ' };
const SUBC = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉', '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎' };
/** Pangkat/indeks Word → karakter Unicode (m/s², H₂O); bila tak terpetakan → ^(…) / _(…). */
function supSub(t, va) {
  if (!t || (va !== 'superscript' && va !== 'subscript')) return t || '';
  const m = va === 'superscript' ? SUPC : SUBC, chars = t.split('');
  return chars.every((c) => m[c]) ? chars.map((c) => m[c]).join('') : (va === 'superscript' ? '^' : '_') + (t.length > 1 ? '(' + t + ')' : t);
}
/** Teks persamaan Word (OMML) dalam bentuk sederhana: pecahan a/b, akar √, pangkat & indeks. */
function mathText(el) {
  if (!el) return '';
  const n = el.localName;
  if (n === 't') return el.textContent;
  if (/Pr$/.test(n)) return '';
  if (n === 'sSup') return mathText(kidL(el, 'e')) + supSub(mathText(kidL(el, 'sup')), 'superscript');
  if (n === 'sSub') return mathText(kidL(el, 'e')) + supSub(mathText(kidL(el, 'sub')), 'subscript');
  if (n === 'sSubSup') return mathText(kidL(el, 'e')) + supSub(mathText(kidL(el, 'sub')), 'subscript') + supSub(mathText(kidL(el, 'sup')), 'superscript');
  if (n === 'f') { const a = mathText(kidL(el, 'num')), b = mathText(kidL(el, 'den')); return (a.length > 1 ? '(' + a + ')' : a) + '/' + (b.length > 1 ? '(' + b + ')' : b); }
  if (n === 'rad') { const x = mathText(kidL(el, 'e')); return '√' + (x.length > 1 ? '(' + x + ')' : x); }
  let s = ''; for (const c of el.children) s += mathText(c); return s;
}
/** Format penomoran otomatis Word: numId → {level: decimal|upperLetter|lowerLetter|bullet|…}. */
async function docxNumFmt(zip) {
  const f = zip.file('word/numbering.xml'), out = {}; if (!f) return out;
  const x = xmlOf(await f.async('string')).documentElement, abs = {};
  kidsL(x, 'abstractNum').forEach((a) => { const m = {}; kidsL(a, 'lvl').forEach((l) => { m[attrL(l, 'ilvl')] = attrL(kidL(l, 'numFmt'), 'val') || 'decimal'; }); abs[attrL(a, 'abstractNumId')] = m; });
  kidsL(x, 'num').forEach((n) => { out[attrL(n, 'numId')] = abs[attrL(kidL(n, 'abstractNumId'), 'val')] || {}; });
  return out;
}
function paraInfo(p, numFmt) {
  let txt = ''; const imgs = [];
  const pPr = kidL(p, 'pPr'), numPr = pPr && kidL(pPr, 'numPr');
  let list = null;
  if (numPr) { const nid = attrL(kidL(numPr, 'numId'), 'val'), lvl = +(attrL(kidL(numPr, 'ilvl'), 'val') || 0); if (nid && nid !== '0') list = { lvl, fmt: (numFmt[nid] || {})[lvl] || 'decimal' }; }
  const walk = (el, va) => {
    for (const c of el.children) {
      const n = c.localName;
      if (n === 'pPr' || n === 'rPr' || n === 'Fallback' || n === 'delText' || n === 'instrText' || n === 'del') continue;
      if (n === 'r') { const rPr = kidL(c, 'rPr'), v = rPr && kidL(rPr, 'vertAlign'); walk(c, v ? attrL(v, 'val') : ''); continue; }
      if (n === 't') { txt += supSub(c.textContent, va); continue; }
      if (n === 'tab') { txt += ' '; continue; }
      if (n === 'br' || n === 'cr') { txt += '\n'; continue; }
      if (n === 'blip') { const id = c.getAttributeNS(R_NS, 'embed'); if (id) imgs.push(id); continue; }
      if (n === 'imagedata') { const id = c.getAttributeNS(R_NS, 'id'); if (id) imgs.push(id); continue; }
      if (n === 'oMath' || n === 'oMathPara') { txt += mathText(c); continue; }
      walk(c, va);
    }
  };
  walk(p, '');
  return { text: txt.replace(/ /g, ' ').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim(), imgs: imgs.filter((v, i, a) => a.indexOf(v) === i), list };
}
/** Paragraf dokumen sesuai urutan baca (termasuk isi tabel & content control). */
function docxParas(body, numFmt) {
  const out = [];
  const walk = (el) => { for (const c of el.children) { const n = c.localName; if (n === 'p') out.push(paraInfo(c, numFmt)); else if (n === 'tbl' || n === 'tr' || n === 'tc' || n === 'sdt' || n === 'sdtContent' || n === 'customXml') walk(c); } };
  walk(body);
  return out;
}
const SKOR_DEF = { PG: 1, MCMA: 2, KATEGORI: 2, ESAI: 5 };
function normTipe(t) {
  const x = String(t || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (!x) return '';
  if (/^(PG|PILIHANGANDA|PILGAN)$/.test(x)) return 'PG';
  if (/MCMA|KOMPLEKS|GANDAKOMPLEKS|JAMAK/.test(x)) return 'MCMA';
  if (/BENAR|SALAH|^BS$|KATEGORI|SETUJU/.test(x)) return 'KATEGORI';
  if (/ESAI|ESSAY|URAIAN|ISIAN/.test(x)) return 'ESAI';
  return x;
}
/**
 * Ubah paragraf Word menjadi soal. Format: "1. teks", "A. pilihan", "KUNCI: B", "TIPE:", "SKOR:", "RUBRIK:",
 * pernyataan benar–salah diawali "-". Penomoran & huruf otomatis Word juga dikenali.
 */
function soalFromParas(paras) {
  const qs = [], warn = [], def = {};
  const mk = paras.findIndex((p) => /^=+\s*MULAI\s+SOAL\s*=+$/i.test(p.text));
  const list = mk >= 0 ? paras.slice(mk + 1) : paras;
  const RX_Q = /^(\d{1,3})\s*[.)](?:\s+|$)([\s\S]*)$/, RX_O = /^([A-Ea-e])\s*[.)](?:\s+|$)([\s\S]*)$/;
  const RX_M = /^(KUNCI JAWABAN|KUNCI|JAWABAN|SKOR|BOBOT|POIN|TIPE SOAL|TIPE|JENIS|RUBRIK|PEDOMAN|KATEGORI|LABEL|MODE SKOR|MODE|PEMBAHASAN)\s*[:=]\s*([\s\S]*)$/i;
  const RX_B = /^[-•*–·▪●]\s*([\s\S]+)$/;
  let q = null, last = '', auto = 0;
  const start = (no, text) => { q = { no, soal: text ? [text] : [], opsi: {}, per: [], img: [], meta: {} }; qs.push(q); last = 'soal'; };
  const nextLetter = () => 'ABCDE'.split('').find((L) => !q.opsi[L]);
  list.forEach((p) => {
    const t = p.text, L = p.list;
    const m = t.match(RX_M);
    if (m) {
      const k = m[1].toUpperCase(), v = m[2].trim();
      const key = /KUNCI|JAWABAN/.test(k) ? 'kunci' : /SKOR|BOBOT|POIN/.test(k) ? 'skor' : /TIPE|JENIS/.test(k) ? 'tipe' : /RUBRIK|PEDOMAN/.test(k) ? 'rubrik' : /KATEGORI|LABEL/.test(k) ? 'kategori' : /MODE/.test(k) ? 'mode' : 'bahas';
      if (!q) { if (key === 'skor' || key === 'tipe' || key === 'mode') def[key] = v; return; }
      q.meta[key] = v; last = 'meta:' + key;
    } else if (RX_Q.test(t) && !(L && L.fmt !== 'decimal')) {
      const mm = t.match(RX_Q); start(+mm[1], mm[2].trim()); auto = +mm[1];
    } else if (L && L.fmt === 'decimal' && L.lvl === 0 && !RX_O.test(t)) {
      start(++auto, t);
    } else if (q && L && /letter/i.test(L.fmt) && !RX_O.test(t)) {
      const ltr = nextLetter(); if (ltr) { q.opsi[ltr] = t; last = 'opsi:' + ltr; } else warn.push(`Soal no. ${q.no}: pilihan jawaban lebih dari 5 (A–E), sisanya dilewati.`);
    } else if (q && RX_O.test(t)) {
      const mm = t.match(RX_O), ltr = mm[1].toUpperCase(); q.opsi[ltr] = mm[2].trim(); last = 'opsi:' + ltr;
    } else if (q && (RX_B.test(t) || (L && (L.fmt === 'bullet' || L.lvl > 0)))) {
      const mm = t.match(RX_B); if (mm || t) { q.per.push(mm ? mm[1].trim() : t); last = 'per'; }
    } else if (q && t) {
      if (last === 'soal') q.soal.push(t);
      else if (last.indexOf('opsi:') === 0) q.opsi[last.slice(5)] += ' ' + t;
      else if (last.indexOf('meta:') === 0 && ['rubrik', 'kunci', 'bahas'].indexOf(last.slice(5)) >= 0) q.meta[last.slice(5)] += '\n' + t;
      else if (last === 'per') q.per[q.per.length - 1] += ' ' + t;
      else q.soal.push(t);
    }
    if (q && p.imgs.length) { p.imgs.forEach((id) => { if (q.img.length) warn.push(`Soal no. ${q.no}: hanya 1 gambar per soal, gambar berikutnya dilewati.`); else q.img.push(id); }); }
  });
  if (mk < 0 && !qs.length) warn.push('Tidak ada soal yang dikenali. Pastikan setiap soal diawali nomor, misalnya "1. Teks soal".');
  return { items: qs.map((x) => soalRowOf(x, def)), warnings: warn.filter((v, i, a) => a.indexOf(v) === i) };
}
function soalRowOf(q, def) {
  const kunci = String(q.meta.kunci || '').trim(), opsiN = Object.keys(q.opsi).length;
  const letters = (kunci.toUpperCase().match(/\b[A-E]\b/g) || (/^[A-E]{2,5}$/i.test(kunci) ? kunci.toUpperCase().split('') : []));
  let tipe = normTipe(q.meta.tipe || def.tipe);
  if (!tipe) tipe = q.per.length ? 'KATEGORI' : opsiN >= 2 ? (letters.length > 1 ? 'MCMA' : 'PG') : 'ESAI';
  const skor = String(q.meta.skor || def.skor || SKOR_DEF[tipe] || 1).replace(',', '.').replace(/[^0-9.]/g, '');
  const text = q.soal.join('\n').trim(), row = { tipe, soal: text, skor, mode_skor: String(q.meta.mode || def.mode || '').toUpperCase() };
  if (tipe === 'PG' || tipe === 'MCMA') {
    'ABCDE'.split('').forEach((L) => { row['opsi_' + L] = q.opsi[L] || ''; });
    row.kunci = tipe === 'PG' ? (letters[0] || (kunci.match(/^[A-Ea-e]/) || [''])[0].toUpperCase()) : letters.join(',');
  } else if (tipe === 'KATEGORI') {
    const kat = q.meta.kategori ? q.meta.kategori.split(/[,;|]/).map((x) => x.trim()).filter(Boolean) : ['Benar', 'Salah'];
    row.soal = [text].concat(q.per).map((x) => String(x).replace(/\|/g, '/')).join(' | ');
    kat.slice(0, 5).forEach((x, i) => { row['opsi_' + 'ABCDE'[i]] = x; });
    row.kunci = kunci.split(/[,;|]/).map((x) => x.trim()).filter(Boolean).join('|');
  } else { row.opsi_A = q.meta.rubrik || ''; row.kunci = kunci; }
  return { row, imgRef: q.img[0] || '', ref: 'Soal no. ' + q.no };
}
/** Baca Word: hasil {items:[{row, img, imgErr, ref}], warnings}. */
async function parseDocxSoal(file) {
  const zip = await (await loadJSZip()).loadAsync(file);
  const f = zip.file('word/document.xml'); if (!f) throw new Error('Berkas bukan dokumen Word (.docx). Simpan ulang dari Word sebagai .docx.');
  const doc = xmlOf(await f.async('string')), rels = await relsOf(zip, 'word/_rels/document.xml.rels', 'word/'), numFmt = await docxNumFmt(zip);
  const res = soalFromParas(docxParas(descL(doc.documentElement, 'body'), numFmt));
  for (const it of res.items) { if (it.imgRef) { const g = rels[it.imgRef] ? await zipImage(zip, rels[it.imgRef]) : { err: 'Gambar tertaut (bukan tertanam) tidak bisa dibaca. Tempel gambarnya langsung.' }; if (g.blob) { it.img = g.blob; it.imgName = g.name; } else it.imgErr = g.err; } }
  return res;
}
const colIdx = (ref) => { const m = String(ref || '').match(/^([A-Z]+)/); if (!m) return -1; let n = 0; m[1].split('').forEach((c) => { n = n * 26 + c.charCodeAt(0) - 64; }); return n - 1; };
/** Gambar "di dalam sel" Excel 365 (Sisipkan Gambar → Tempatkan di Sel): vm → metadata → richData → media. */
async function xlsxCellImages(zip) {
  const md = zip.file('xl/metadata.xml'), rv = zip.file('xl/richData/rdrichvalue.xml'); if (!md || !rv) return null;
  const mx = xmlOf(await md.async('string')).documentElement, types = kidsL(descL(mx, 'metadataTypes'), 'metadataType').map((t) => t.getAttribute('name'));
  const fm = {}; kidsL(mx, 'futureMetadata').forEach((f) => { fm[f.getAttribute('name')] = kidsL(f, 'bk').map((bk) => +(attrL(descL(bk, 'rvb'), 'i') || 0)); });
  const vmList = kidsL(descL(mx, 'valueMetadata'), 'bk').map((bk) => { const rc = kidL(bk, 'rc'); const tn = types[+rc.getAttribute('t') - 1]; return tn && fm[tn] ? fm[tn][+rc.getAttribute('v')] : -1; });
  const rvx = xmlOf(await rv.async('string')).documentElement, rvs = kidsL(rvx, 'rv');
  const stF = zip.file('xl/richData/rdrichvaluestructure.xml'), keyPos = {};
  if (stF) kidsL(xmlOf(await stF.async('string')).documentElement, 's').forEach((s, i) => { keyPos[i] = kidsL(s, 'k').findIndex((k) => k.getAttribute('n') === '_rvRel:LocalImageIdentifier'); });
  const relF = zip.file('xl/richData/richValueRel.xml'); if (!relF) return null;
  const relIds = kidsL(xmlOf(await relF.async('string')).documentElement, 'rel').map((r) => r.getAttributeNS(R_NS, 'id'));
  const rels = await relsOf(zip, 'xl/richData/_rels/richValueRel.xml.rels', 'xl/richData/');
  return (vm) => { const ri = vmList[vm - 1]; const r = rvs[ri]; if (!r) return ''; const pos = keyPos[+r.getAttribute('s')]; const vals = kidsL(r, 'v'); const li = +(vals[pos >= 0 ? pos : 0] || {}).textContent; return rels[relIds[li]] || ''; };
}
/** Baca Excel: lembar berisi kolom "soal" (mis. "Soal"), gambar tertanam per baris (di atas sel / di dalam sel). */
async function parseXlsxSoal(file) {
  const zip = await (await loadJSZip()).loadAsync(file);
  const wbF = zip.file('xl/workbook.xml'); if (!wbF) throw new Error('Berkas bukan Excel (.xlsx) yang valid.');
  const wb = xmlOf(await wbF.async('string')).documentElement, wbRels = await relsOf(zip, 'xl/_rels/workbook.xml.rels', 'xl/');
  const ss = []; const ssF = zip.file('xl/sharedStrings.xml');
  if (ssF) kidsL(xmlOf(await ssF.async('string')).documentElement, 'si').forEach((si) => { let s = ''; const walk = (el) => { for (const c of el.children) { if (c.localName === 'rPh') continue; if (c.localName === 't') s += c.textContent; else walk(c); } }; walk(si); ss.push(s); });
  const sheets = kidsL(descL(wb, 'sheets'), 'sheet').map((s) => ({ name: s.getAttribute('name') || '', path: wbRels[s.getAttributeNS(R_NS, 'id')] })).filter((s) => s.path && zip.file(s.path));
  sheets.sort((a, b) => (/soal/i.test(b.name) ? 1 : 0) - (/soal/i.test(a.name) ? 1 : 0));
  const cellImg = await xlsxCellImages(zip).catch(() => null);
  for (const sh of sheets) {
    const sx = xmlOf(await zip.file(sh.path).async('string')).documentElement, grid = [], vmAt = {};
    kidsL(descL(sx, 'sheetData'), 'row').forEach((r) => {
      const rn = +r.getAttribute('r'), cells = [];
      kidsL(r, 'c').forEach((c, ci) => {
        const t = c.getAttribute('t'), ix = c.getAttribute('r') ? colIdx(c.getAttribute('r')) : ci, v = kidL(c, 'v');
        let val = v ? v.textContent : '';
        if (t === 's') val = ss[+val] || ''; else if (t === 'inlineStr') { val = allL(c, 't').map((x) => x.textContent).join(''); } else if (t === 'b') val = val === '1' ? 'TRUE' : 'FALSE'; else if (t === 'e') val = '';
        else if (val && /^-?\d+\.\d{6,}$/.test(val)) val = String(Math.round(Number(val) * 1e6) / 1e6);
        cells[ix] = val;
        if (c.getAttribute('vm')) vmAt[rn] = +c.getAttribute('vm');
      });
      grid.push({ rn, cells });
    });
    const head = grid[0] ? Array.from(grid[0].cells, (x) => String(x || '').trim().toLowerCase().replace(/\s+/g, '_')) : [];
    if (head.indexOf('soal') < 0) continue;
    // gambar mengambang (di atas sel) dari drawing lembar ini
    const imgAt = {}, shDir = sh.path.replace(/[^/]+$/, ''), shRels = await relsOf(zip, shDir + '_rels/' + sh.path.split('/').pop() + '.rels', shDir);
    const drw = Object.keys(shRels).map((k) => shRels[k]).find((p) => /drawings\/drawing\d*\.xml$/.test(p));
    if (drw && zip.file(drw)) {
      const dx = xmlOf(await zip.file(drw).async('string')).documentElement, dDir = drw.replace(/[^/]+$/, ''), dRels = await relsOf(zip, dDir + '_rels/' + drw.split('/').pop() + '.rels', dDir);
      Array.from(dx.children).filter((a) => /Anchor$/.test(a.localName)).forEach((a) => {
        const blip = descL(a, 'blip'), id = blip && blip.getAttributeNS(R_NS, 'embed'); if (!id || !dRels[id]) return;
        const fr = kidL(a, 'from'), to = kidL(a, 'to');
        let rn = fr ? +descL(fr, 'row').textContent + 1 : 0; if (rn <= 1 && to) rn = +descL(to, 'row').textContent + 1;
        if (rn > 1 && !imgAt[rn]) imgAt[rn] = dRels[id];
      });
    }
    if (cellImg) Object.keys(vmAt).forEach((rn) => { if (!imgAt[rn]) { const p = cellImg(vmAt[rn]); if (p) imgAt[rn] = p; } });
    const items = [];
    for (const g of grid.slice(1)) {
      const o = {}; head.forEach((k, i) => { if (k) o[k.replace(/^opsi_([a-e])$/, (m, l) => 'opsi_' + l.toUpperCase())] = String(g.cells[i] === undefined ? '' : g.cells[i]).trim(); });
      if (!Object.keys(o).some((k) => o[k]) && !imgAt[g.rn]) continue;
      const it = { row: o, ref: 'Baris ' + g.rn };
      if (imgAt[g.rn]) { const im = await zipImage(zip, imgAt[g.rn]); if (im.blob) { it.img = im.blob; it.imgName = im.name; } else it.imgErr = im.err; }
      items.push(it);
    }
    return { items, warnings: [] };
  }
  throw new Error('Tidak ditemukan lembar dengan kolom "soal". Gunakan template Excel dari aplikasi.');
}
/** Kecilkan gambar soal (sisi terpanjang 1280 px). Diagram PNG kecil tetap PNG agar tetap tajam. */
function prepSoalImage(blob, name) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob), img = new Image();
    img.onload = () => {
      const s = Math.min(1, 1280 / Math.max(img.width, img.height));
      const keep = blob.type === 'image/png' && s === 1 && blob.size < 400000 || blob.type === 'image/jpeg' && s === 1 && blob.size < 300000;
      const done = (b, mime) => { URL.revokeObjectURL(url); const r = new FileReader(); r.onload = () => res({ name: (name || 'gambar').replace(/\.\w+$/, '') + (mime === 'image/png' ? '.png' : '.jpg'), mime, data: String(r.result).split(',')[1] }); r.readAsDataURL(b); };
      if (keep) { done(blob, blob.type); return; }
      const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(img.width * s)); cv.height = Math.max(1, Math.round(img.height * s));
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(img, 0, 0, cv.width, cv.height);
      cv.toBlob((b) => done(b || blob, b ? 'image/jpeg' : blob.type), 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Gambar "' + (name || '') + '" rusak atau formatnya tidak dikenali.')); };
    img.src = url;
  });
}
async function blobKey(b) { try { const h = await crypto.subtle.digest('SHA-1', await b.arrayBuffer()); return Array.from(new Uint8Array(h)).map((x) => x.toString(16).padStart(2, '0')).join(''); } catch (e) { return b.size + ':' + b.type; } }
/** Unggah gambar soal secara bertahap (maks 6 gambar / ±4 MB per panggilan). Kembalikan Map(item → file_id). */
async function uploadSoalImages(items, onProgress) {
  const byKey = {}, order = [];
  for (const it of items) { const k = await blobKey(it.img); if (!byKey[k]) { byKey[k] = { it, users: [] }; order.push(k); } byKey[k].users.push(it); }
  const ids = new Map(); let done = 0, batch = [], size = 0;
  const flush = async () => {
    if (!batch.length) return;
    const r = await call('file.uploadMany', { folder: 'soal', files: batch.map((b) => b.f) }, { silent: true, timeout: 180000, retries: 2 });
    r.files.forEach((f, i) => byKey[batch[i].k].users.forEach((u) => ids.set(u, f.file_id)));
    done += batch.length; onProgress && onProgress(done, order.length); batch = []; size = 0;
  };
  onProgress && onProgress(0, order.length);
  for (const k of order) {
    const f = await prepSoalImage(byKey[k].it.img, byKey[k].it.imgName);
    if (batch.length && (batch.length >= 6 || size + f.data.length > 4.2e6)) await flush();
    batch.push({ k, f }); size += f.data.length;
  }
  await flush();
  return ids;
}
const btnLabel = (btn, t) => { if (btn) btn.innerHTML = `<span class="spin"></span>${esc(t)}`; };
(window.__SP_F__ = window.__SP_F__ || {}).umum = 1;
