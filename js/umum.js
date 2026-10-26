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
(window.__SP_F__ = window.__SP_F__ || {}).umum = 1;
