'use strict';
// ════════════════════════════════════════════════════════
// BAGIAN 14: HALAMAN GURU — Dashboard, Materi & Tugas, Pantau & Penilaian
// ════════════════════════════════════════════════════════
const jsq = (s) => esc(JSON.stringify(s === undefined ? null : s));
const penOpts = (sel, filter) => G().penugasan.filter(filter || (() => true)).map((p) => `<option value="${p.penugasan_id}" ${p.penugasan_id === sel ? 'selected' : ''}>${esc(penLabel(p))}${hasRole('ADMIN') && p.guru ? ' — ' + esc(shortGuru(p.guru)) : ''}</option>`).join('');
function statCard(lbl, val, unit, hint, icon, tone, onclick) {
  const sv = String(val), num = typeof val === 'number' ? val : /^\d{1,3}(\.\d{3})*$/.test(sv) ? Number(sv.replace(/\./g, '')) : NaN;
  if (Number.isInteger(num) && num >= 0) val = `<span data-count="${num}">${val}</span>`;
  return `<${onclick ? 'button' : 'div'} class="card stat ${tone ? 'c-' + tone : ''}" ${onclick ? `onclick="${onclick}" style="text-align:left;width:100%"` : ''}><div style="min-width:0"><div class="lbl">${lbl}</div><div class="val">${val}${unit ? `<small>${unit}</small>` : ''}</div>${hint ? `<div class="hint">${hint}</div>` : ''}</div><div class="tile ${tone === 'p' ? '' : tone || ''}">${I(icon)}</div></${onclick ? 'button' : 'div'}>`;
}

route('g-dash', {
  title: 'Dashboard', roles: ['GURU', 'ADMIN'],
  mount() { fxMount(); }, leave() { fxStop(); },
  render() {
    const g = G(), st = g.stats, t = now(), u = me();
    const aktifUl = g.ulangan.filter((x) => ulStatus(x).k === 'AKTIF');
    const act = [];
    aktifUl.forEach((x) => act.push({ ic: 'exam', tone: '', judul: x.judul, sub: 'CBT · ' + plural(x.jumlah_soal, 'soal'), kelas: x.kelas_ids.map(kelasShort).join(', '), waktu: 'Berakhir ' + D.rel(x.tutup), prog: x.selesai, total: x.peserta, status: pill('Ujian Aktif', 'ok'), aksi: `<button class="btn btn-sm btn-ghost ink-p" onclick="go('g-monitor',{id:'${x.ulangan_id}'})">${I('eye', 'ic-sm')}Pantau Live</button>` }));
    g.ulangan.filter((x) => x.koreksi > 0).forEach((x) => act.push({ ic: 'pen', tone: 'vio', judul: x.judul, sub: 'Esai menunggu koreksi', kelas: x.kelas_ids.map(kelasShort).join(', '), waktu: D.d(x.tutup), prog: x.selesai - x.koreksi, total: x.selesai, status: pill(x.koreksi + ' perlu koreksi', 'vio'), aksi: `<button class="btn btn-sm btn-secondary" onclick="go('g-koreksi',{id:'${x.ulangan_id}'})">${I('star', 'ic-sm')}Koreksi</button>` }));
    g.tugas.filter((x) => x.status === 'TERBIT' && (x.kumpul > x.dinilai || (x.tenggat > t - 3 * 864e5 && x.kumpul < x.total))).sort(by('tenggat')).slice(0, 6).forEach((x) => {
      const perlu = x.kumpul - x.dinilai, lewat = t > x.tenggat;
      act.push({ ic: 'clipboard', tone: 'warn', judul: x.judul, sub: (x.jenis_kumpul === 'FILE' ? 'Unggah berkas' : x.jenis_kumpul === 'TEKS' ? 'Teks' : 'Berkas/teks') + ' · ' + mapelNm(x.mapel_id), kelas: kelasShort(x.kelas_id), waktu: (lewat ? 'Lewat tenggat ' : '') + D.rel(x.tenggat), prog: x.kumpul, total: x.total,
        status: perlu ? pill(perlu + ' perlu dinilai', 'warn') : pill((x.total - x.kumpul) + ' belum kumpul', 'err'), aksi: perlu ? `<button class="btn btn-sm btn-secondary" onclick="go('g-tugas',{id:'${x.tugas_id}'})">${I('star', 'ic-sm')}Nilai (${perlu})</button>` : `<button class="btn btn-sm btn-secondary" onclick="go('g-tugas',{id:'${x.tugas_id}'})">${I('send', 'ic-sm')}Ingatkan</button>` });
    });
    const agenda = (B().agenda || []).filter((a) => a.selesai >= t).slice(0, 4);
    const kelasChips = uniqBy(g.penugasan.filter((p) => hasRole('ADMIN') ? p.guru_id === u.user_id : true), (p) => p.penugasan_id);
    const c = cfg();
    const fx = fxOn();
    return `<div class="page${fx}">
      <div class="dash-hero grad grad-pattern fx" style="--i:0"><span class="hero-orb o1"></span><span class="hero-orb o2"></span><span class="hero-orb o3"></span>
        <div class="dh-in"><div class="f1" style="min-width:0"><div class="dh-greet">${D.greet()} ${I('sparkles', 'ic-sm')}</div><h1>Selamat Mengajar, ${esc(firstName(u.nama))}</h1><p class="sub">${esc(B().ta ? 'Semester ' + B().ta.semester + ' ' + B().ta.nama : '')} · ${HARI_P[new Date().getDay()]}, ${D.d(now())}</p></div>
          <div class="dh-art" aria-hidden="true"><span class="dh-ring"></span><div class="dh-ic">${I('cap')}</div></div></div>
        <div class="dh-qa"><button class="qa-w" onclick="go('g-konten',{form:'tugas'})">${I('plus', 'ic-sm')}Buat Tugas</button><button class="qa-w" onclick="go('g-konten',{form:'materi'})">${I('upload', 'ic-sm')}Unggah Materi</button>
          <button class="qa-w" onclick="go('g-ujian-form',{})">${I('exam', 'ic-sm')}Buat Ujian CBT</button><button class="qa-w" onclick="go('g-absensi')">${I('user-plus', 'ic-sm')}Isi Absensi Hari Ini</button></div>
      </div>
      <div class="grid gc4 mt16">
        ${statCard('Kelas Diajar', st.kelas, 'Kelas', kelasChips.map((p) => kelasShort(p.kelas_id)).filter((v, i, a) => a.indexOf(v) === i).join(', '), 'door', 'p')}
        ${statCard('Tugas Perlu Dinilai', st.perluDinilai, 'Pengumpulan', `${I('alert-c', 'ic-sm')}${g.tugas.filter((x) => x.kumpul > x.dinilai && x.tenggat < t).length} tugas lewat tenggat`, 'alert-c', st.perluDinilai ? 'warn' : '', "go('g-konten',{tab:'tugas'})")}
        ${statCard('Ujian Berlangsung', st.ujianAktif, 'Sesi Aktif', aktifUl[0] ? esc(aktifUl[0].judul) : 'Tidak ada sesi', 'timer', st.ujianAktif ? 'ok' : '', "go('g-ujian')")}
        ${statCard('Belum Kumpul', st.belumKumpul, 'Siswa', 'Dari tugas 7 hari terakhir', 'bell', st.belumKumpul ? 'err' : '')}
      </div>
      ${jadwalStrip('ajar')}
      <div class="split mt16"><div class="col g16">
        <div class="card"><div class="card-hd"><div><h3>Tugas & Ujian Memerlukan Tindakan</h3><p class="small muted">Pantau status pengerjaan siswa dan beri nilai sebelum tenggat berakhir</p></div>${act.length ? pill(act.length + ' item', 'err') : ''}</div>
          ${act.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tugas / Ujian</th><th>Kelas</th><th>Waktu / Tenggat</th><th>Progres</th><th>Status</th><th></th></tr></thead><tbody>${act.map((a) => `<tr><td><div class="flex items-c g12"><div class="tile sm ${a.tone}">${I(a.ic)}</div><div style="min-width:0"><div class="bold clamp2">${esc(a.judul)}</div><div class="xs muted">${esc(a.sub)}</div></div></div></td><td class="mono small">${esc(a.kelas)}</td><td class="small">${esc(a.waktu)}</td>
            <td style="min-width:120px"><div class="small mono">${a.prog}/${a.total}</div><div class="meter mt4"><i style="width:${a.total ? a.prog / a.total * 100 : 0}%"></i></div></td><td>${a.status}</td><td class="tr">${a.aksi}</td></tr>`).join('')}</tbody></table></div>` : emptyState('check-c', 'Semua beres', 'Tidak ada tugas atau ujian yang menunggu tindakan.')}</div>
        <div class="card"><div class="card-hd"><h3>Kelas & Mapel Saya</h3><a href="javascript:void(0)" class="small bold" onclick="go('g-absensi')">Isi presensi ${I('chev-r', 'ic-sm')}</a></div><div class="card-bd chips">${kelasChips.map((p) => `<button class="chip" onclick="go('g-absensi',{pid:'${p.penugasan_id}'})">${I('door', 'ic-sm')}${esc(penLabel(p))}</button>`).join('') || '<span class="muted small">Belum ada penugasan mengajar. Hubungi Admin.</span>'}</div></div>
      </div><div class="col g16">
        ${aktifUl[0] ? `<div class="card grad grad-pattern" style="padding:20px;border:0"><div class="flex items-c g8 small" style="opacity:.9">${I('activity', 'ic-sm')}CBT Aktif Sekarang</div><h3 class="mt8" style="font-size:18px">${esc(aktifUl[0].judul)}</h3><p class="small" style="opacity:.85">Kelas ${aktifUl[0].kelas_ids.map(kelasShort).join(', ')} · ${esc(mapelNm(aktifUl[0].mapel_id))}</p>
          <div class="flex g12 mt16 wrap"><div class="card" style="background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.2);padding:10px 14px;color:#fff"><div class="xs" style="opacity:.8">Kode Token</div><div class="mono b7" style="font-size:18px;letter-spacing:.14em">${esc(aktifUl[0].token || '—')}</div></div><div class="card" style="background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.2);padding:10px 14px;color:#fff"><div class="xs" style="opacity:.8">Partisipan</div><div class="b7">${aktifUl[0].selesai}/${aktifUl[0].peserta} selesai</div></div></div>
          <button class="btn btn-accent btn-block mt16" onclick="go('g-monitor',{id:'${aktifUl[0].ulangan_id}'})">${I('monitor')}Buka Monitor Ujian Live</button></div>` : ''}
        <div class="card"><div class="card-hd"><h3>Jadwal & Agenda Terdekat</h3><a href="javascript:void(0)" class="small bold" onclick="go('agenda')">Semua</a></div>${agenda.length ? agenda.map((a) => `<div class="row-item click" onclick="openAgendaDetail('${a.agenda_id}')"><div class="date-blk"><b>${pad(new Date(a.mulai).getDate())}</b><span>${BLN[new Date(a.mulai).getMonth()].toUpperCase()}</span></div><div class="f1" style="min-width:0"><div class="bold truncate">${esc(a.judul)}</div><div class="small muted truncate">${D.t(a.mulai)} ${TZL}${a.lokasi ? ' · ' + esc(a.lokasi) : ''}</div></div></div>`).join('') : `<div class="card-bd">${emptyState('calendar', 'Tidak ada agenda', '')}</div>`}</div>
        <div class="card card-p"><div class="flex items-c g12"><div class="tile ${c.email_aktif || c.wa_aktif ? 'ok' : 'neu'}">${I('bell')}</div><div class="f1"><h3>Bot Pengingat Otomatis</h3><div class="small muted">${c.email_aktif || c.wa_aktif ? 'Aktif' : 'Nonaktif'}</div></div>${pill(c.email_aktif || c.wa_aktif ? 'Aktif' : 'Mati', c.email_aktif || c.wa_aktif ? 'ok' : 'neu')}</div>
          <p class="small tx2 mt12">Pengingat via ${[c.email_aktif ? 'Email' : '', c.wa_aktif ? 'WhatsApp' : ''].filter(Boolean).join(' & ') || '—'} terjadwal otomatis pukul <b>${pad(c.jam_pengingat || 16)}.00 ${TZL}</b> untuk siswa yang belum menyerahkan tugas.</p></div>
      </div></div></div>`;
  }
});
function uniqBy(a, f) { const s = {}; return a.filter((x) => { const k = f(x); if (s[k]) return false; s[k] = 1; return true; }); }

// ── Materi & Tugas (daftar + composer) ──
route('g-konten', {
  title: 'Materi & Tugas', roles: ['GURU', 'ADMIN'], form: true,
  render(p) {
    const g = G(), tab = p.tab || 'semua', F = S.c.kontenF || (S.c.kontenF = { mapel: '', kelas: '', q: '' });
    let items = [];
    if (tab !== 'tugas') items = items.concat(g.materi.map((m) => Object.assign({ _t: 'materi', _d: m.dibuat_pada }, m)));
    if (tab !== 'materi') items = items.concat(g.tugas.map((x) => Object.assign({ _t: 'tugas', _d: x.dibuat_pada }, x)));
    items = items.filter((x) => (!F.mapel || x.mapel_id === F.mapel) && (!F.kelas || x.kelas_id === F.kelas) && (!F.q || String(x.judul).toLowerCase().indexOf(F.q.toLowerCase()) >= 0)).sort(by('_d', -1));
    const form = p.form || (p.edit ? (g.tugas.some((x) => x.tugas_id === p.edit) ? 'tugas' : 'materi') : '');
    const mapels = uniqBy(g.penugasan, (x) => x.mapel_id), kelas = uniqBy(g.penugasan, (x) => x.kelas_id);
    const list = `<div class="card"><div class="card-hd" style="flex-wrap:wrap"><h3>Daftar Materi & Tugas</h3><span class="small muted">${esc(B().ta ? 'Semester ' + B().ta.semester + ' ' + B().ta.nama : '')}</span>
        <div class="input-ic w100">${I('search')}<input class="input input-sm" placeholder="Cari dalam daftar…" value="${esc(F.q)}" oninput="S.c.kontenF.q=this.value;rerenderKeepFocus()"></div>
        <div class="flex g8 w100"><select class="select input-sm f1" onchange="S.c.kontenF.mapel=this.value;rerender()"><option value="">Semua mapel</option>${mapels.map((m) => `<option value="${m.mapel_id}" ${F.mapel === m.mapel_id ? 'selected' : ''}>Mapel: ${esc(mapelNm(m.mapel_id))}</option>`).join('')}</select>
          <select class="select input-sm f1" onchange="S.c.kontenF.kelas=this.value;rerender()"><option value="">Semua kelas</option>${kelas.map((k) => `<option value="${k.kelas_id}" ${F.kelas === k.kelas_id ? 'selected' : ''}>Kelas: ${esc(kelasShort(k.kelas_id))}</option>`).join('')}</select></div>
        <div class="seg">${[['semua', 'Semua'], ['materi', `Materi (${g.materi.length})`], ['tugas', `Tugas (${g.tugas.length})`]].map((t) => `<button class="${tab === t[0] ? 'on' : ''}" onclick="go('g-konten',Object.assign({},S.params,{tab:'${t[0]}'}),{replace:true})">${t[1]}</button>`).join('')}</div></div>
      <div style="padding:12px;max-height:${form ? '78vh' : 'none'};overflow:auto" class="col g12">${items.map(kontenCard).join('') || emptyState('inbox', 'Belum ada konten', 'Buat materi atau tugas pertama Anda.', `<button class="btn btn-primary" onclick="go('g-konten',{form:'tugas'})">${I('plus')}Buat Tugas</button>`)}</div></div>`;
    if (!form) return `<div class="page"><div class="page-hd"><div><h1>Materi & Tugas</h1><p class="sub">Bagikan materi, buat tugas, dan pantau pengumpulan siswa.</p></div><div class="flex g8"><button class="btn btn-secondary" onclick="go('g-konten',{form:'materi'})">${I('upload')}Materi Baru</button><button class="btn btn-primary" onclick="go('g-konten',{form:'tugas'})">${I('plus')}Tugas Baru</button></div></div>${list}</div>
      <button class="fab" onclick="openCreateMenu(this)" aria-label="Buat">${I('plus', 'ic-lg')}</button>`;
    return `<div class="page"><div class="split s-l"><div class="only-lg">${list}</div><div>${kontenForm(form, p.edit)}</div></div></div>`;
  },
  mount(p) { if (p.form || p.edit) bindKontenForm(); }
});
function kontenCard(x) {
  if (x._t === 'materi') {
    const ic = x.tipe === 'VIDEO' ? 'video' : x.tipe === 'LINK' ? 'link' : 'file-text';
    return `<div class="card" style="padding:14px"><div class="flex items-c g8"><div class="tile sm ${x.tipe === 'VIDEO' ? 'err' : x.tipe === 'LINK' ? 'sky' : ''}">${I(ic)}</div><span class="xs bold upper muted">${x.tipe === 'VIDEO' ? 'Video' : x.tipe === 'LINK' ? 'Tautan' : 'Materi berkas'}</span><span class="ml-a">${pill('Terbit', 'ok')}</span></div>
      <div class="bold mt8 clamp2">${esc(x.judul)}</div><div class="small muted mt4">${esc(mapelNm(x.mapel_id))} · ${esc(kelasShort(x.kelas_id))}</div>
      <div class="flex items-c jc-b mt12 small" style="border-top:1px solid var(--border);padding-top:10px"><span class="muted flex items-c g4">${I('calendar', 'ic-sm')}${D.d(x.dibuat_pada)}</span><span class="flex g4"><button class="btn btn-xs btn-ghost" onclick="openMateri('${x.materi_id}')">Lihat ${I('chev-r', 'ic-sm')}</button><button class="btn btn-xs btn-ghost" onclick="go('g-konten',{edit:'${x.materi_id}'})">${I('edit', 'ic-sm')}</button><button class="btn btn-xs btn-ghost ink-err" onclick="deleteMateri('${x.materi_id}')">${I('trash', 'ic-sm')}</button></span></div></div>`;
  }
  const lewat = now() > x.tenggat, sel = S.params.edit === x.tugas_id;
  return `<div class="card hoverable ${sel ? 'sel' : ''}" style="padding:14px" onclick="go('g-tugas',{id:'${x.tugas_id}'})"><div class="flex items-c g8"><div class="tile sm warn">${I('clipboard')}</div><span class="xs bold upper ${x.status === 'DRAF' ? 'muted' : lewat ? 'muted' : 'ink-p'}">${x.status === 'DRAF' ? 'Draf' : lewat ? 'Tugas selesai' : 'Tugas aktif'}</span><span class="ml-a">${x.status === 'DRAF' ? pill('Draf', 'neu') : pill(`${x.kumpul}/${x.total} kumpul`, x.kumpul >= x.total ? 'ok' : 'info')}</span></div>
    <div class="bold mt8 clamp2">${esc(x.judul)}</div><div class="small mt4 ${lewat ? 'muted' : 'ink-warn'} flex items-c g4">${I('clock', 'ic-sm')}Tenggat: ${D.rel(x.tenggat)}</div>
    <div class="small muted mt4">${esc(mapelNm(x.mapel_id))} · ${esc(kelasShort(x.kelas_id))}</div><div class="meter mt8"><i style="width:${x.total ? x.kumpul / x.total * 100 : 0}%"></i></div>
    ${x.kumpul > x.dinilai ? `<div class="small mt8 ink-warn bold">${x.kumpul - x.dinilai} perlu dinilai</div>` : ''}</div>`;
}
function kontenForm(form, editId) {
  const g = G(), isT = form === 'tugas';
  const ed = editId ? (isT ? g.tugas.find((x) => x.tugas_id === editId) : g.materi.find((x) => x.materi_id === editId)) : null;
  const draftKey = 'sp_kdraft_' + form + '_' + (editId || 'baru');
  const dr = ed ? {} : LS.get(draftKey, {});
  const v = (k, d) => ed && ed[k] !== undefined ? ed[k] : dr[k] !== undefined ? dr[k] : d;
  const S2 = S.c.kform = { form, editId, draftKey, files: ed && isT ? (ed.lampiran || []).map((id, i) => ({ id, name: 'Lampiran ' + (i + 1), done: true })) : ed && ed.file_id ? [{ id: ed.file_id, name: 'Berkas materi', done: true }] : (dr.files || []) };
  const selPens = ed ? [ed.penugasan_id] : (dr.pens || []);
  const tenggatDef = v('tenggat', D.day0(now()) + 7 * 864e5 + 23 * 3600000 + 59 * 60000);
  return `<div class="flex items-c jc-b wrap g12 mb16"><div><button class="back-link" onclick="go('g-konten',{})">${I('arrow-l', 'ic-sm')}Kembali</button>
      ${editId ? '' : `<div class="seg mb12"><button class="${!isT ? 'on' : ''}" onclick="go('g-konten',{form:'materi'},{replace:true})">Materi Baru</button><button class="${isT ? 'on' : ''}" onclick="go('g-konten',{form:'tugas'},{replace:true})">Tugas Baru</button></div>`}
      <h1 style="font-size:26px">${editId ? (isT ? 'Ubah Tugas' : 'Ubah Materi') : isT ? 'Buat Tugas Baru untuk Siswa' : 'Bagikan Materi Baru'}</h1><p class="sub tx2 mt4">${isT ? 'Atur instruksi, kelas target, lampiran, dan metode pengumpulan tugas.' : 'Unggah berkas, tautan, atau video pembelajaran untuk kelas Anda.'}</p></div>
      <span class="sync-dot" id="draftDot">Draf tersimpan otomatis</span></div>
    <form id="kForm" class="card card-p col g16" onsubmit="return false">
      <div class="field"><label class="label">${isT ? 'Judul Tugas' : 'Judul Materi'} <span class="req">*</span></label><input class="input" name="judul" required maxlength="200" value="${esc(v('judul', ''))}" placeholder="${isT ? 'Contoh: Tugas Mandiri Gelombang Cahaya' : 'Contoh: Modul Bab 4 Induksi Elektromagnetik'}"></div>
      <div class="field"><div class="flex jc-b items-c"><label class="label">Target Kelas & Mata Pelajaran <span class="req">*</span></label><span class="xs muted">${editId ? 'Kelas tidak bisa diubah' : 'Pilih satu atau lebih kelas'}</span></div>
        <div class="chips" id="penChips">${g.penugasan.filter((x) => !editId || x.penugasan_id === ed.penugasan_id).map((x) => `<button type="button" class="chip ${selPens.indexOf(x.penugasan_id) >= 0 ? 'sel-o' : ''}" data-pid="${x.penugasan_id}" ${editId ? 'disabled' : ''}>${selPens.indexOf(x.penugasan_id) >= 0 ? I('check', 'ic-sm') : ''}${esc(mapelNm(x.mapel_id))} Kelas ${esc(kelasShort(x.kelas_id))}</button>`).join('') || '<span class="muted small">Belum ada penugasan mengajar.</span>'}</div></div>
      ${!isT ? `<div class="field"><label class="label">Jenis materi</label><div class="seg" id="tipeSeg">${[['FILE', 'Berkas (PDF/gambar)'], ['LINK', 'Tautan'], ['VIDEO', 'Video YouTube']].map((t) => `<button type="button" data-v="${t[0]}" class="${v('tipe', 'FILE') === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</div><input type="hidden" name="tipe" value="${esc(v('tipe', 'FILE'))}"></div>
        <div class="field" id="urlField" ${v('tipe', 'FILE') === 'FILE' ? 'hidden' : ''}><label class="label">Tautan</label><div class="input-ic">${I('link')}<input class="input" name="url" value="${esc(v('url', ''))}" placeholder="https://"></div></div>` : ''}
      <div class="field"><label class="label">${isT ? 'Instruksi & Deskripsi Pengerjaan' : 'Deskripsi'} ${isT ? '<span class="req">*</span>' : ''}</label><textarea class="textarea" name="${isT ? 'instruksi' : 'deskripsi'}" style="min-height:180px" placeholder="${isT ? 'Tuliskan langkah pengerjaan, ketentuan, dan format pengumpulan…' : 'Ringkasan isi materi (opsional)'}">${esc(v(isT ? 'instruksi' : 'deskripsi', ''))}</textarea></div>
      <div class="field" id="fileField" ${!isT && v('tipe', 'FILE') !== 'FILE' ? 'hidden' : ''}><label class="label">${isT ? 'Lampiran (opsional)' : 'Berkas materi'}</label><div class="col g8" id="kFiles"></div>
        <label class="upload">${I('upload', 'ic-lg')}<div class="bold mt8">Klik untuk mengunggah</div><div class="small muted">PDF, gambar, atau dokumen Office · maks 10 MB</div><input type="file" hidden ${isT ? 'multiple' : ''} accept="image/*,application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" onchange="kAddFiles(this.files);this.value=''"></label></div>
      ${isT ? `<div class="form-grid c2"><div class="field"><label class="label">Tenggat <span class="req">*</span></label><input class="input" type="datetime-local" name="tenggat" value="${D.local(tenggatDef)}"></div>
        <div class="field"><label class="label">Nilai maksimal</label><input class="input" type="number" name="nilai_maks" min="1" max="1000" value="${esc(v('nilai_maks', 100))}"></div></div>
        <div class="field"><label class="label">Jenis pengumpulan</label><div class="seg" id="jkSeg">${[['FILE', 'Berkas'], ['TEKS', 'Teks'], ['KEDUANYA', 'Keduanya']].map((t) => `<button type="button" data-v="${t[0]}" class="${v('jenis_kumpul', 'KEDUANYA') === t[0] ? 'on' : ''}">${t[1]}</button>`).join('')}</div><input type="hidden" name="jenis_kumpul" value="${esc(v('jenis_kumpul', 'KEDUANYA'))}"></div>
        <label class="toggle-row" style="border:0;padding:0"><span class="switch"><input type="checkbox" name="izinkan_terlambat" ${v('izinkan_terlambat', true) ? 'checked' : ''}><span></span></span><span><b>Izinkan pengumpulan terlambat</b><br><span class="small muted">Pengumpulan setelah tenggat ditandai "Terlambat".</span></span></label>` : ''}
      ${!editId ? `<label class="check"><input type="checkbox" name="notif" checked>Kirim notifikasi ke siswa</label>` : ''}
    </form>
    <div class="sticky-bar"><span class="small muted f1 only-lg">Pastikan seluruh isian sudah benar sebelum diterbitkan.</span><button class="btn btn-ghost" onclick="go('g-konten',{})">Batal</button>
      ${isT ? `<button class="btn btn-secondary" onclick="saveKonten('DRAF')">${I('file')}Simpan Draf</button>` : ''}<button class="btn btn-primary" id="kSave" onclick="saveKonten('TERBIT')">${I('send')}${editId ? 'Simpan Perubahan' : isT ? 'Terbitkan Tugas' : 'Bagikan Materi'}</button></div>`;
}
function bindKontenForm() {
  const f = $('#kForm'); if (!f) return;
  const K = S.c.kform;
  renderKFiles();
  $$('#penChips .chip').forEach((c) => c.onclick = () => { c.classList.toggle('sel-o'); c.innerHTML = (c.classList.contains('sel-o') ? I('check', 'ic-sm') : '') + c.textContent; saveKDraft(); });
  const seg = (id, name, after) => { const s = $('#' + id); if (!s) return; s.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; $$('#' + id + ' button').forEach((x) => x.classList.toggle('on', x === b)); f.elements[name].value = b.dataset.v; if (after) after(b.dataset.v); saveKDraft(); }; };
  seg('tipeSeg', 'tipe', (t) => { $('#urlField').hidden = t === 'FILE'; $('#fileField').hidden = t !== 'FILE'; });
  seg('jkSeg', 'jenis_kumpul');
  f.addEventListener('input', debounce(saveKDraft, 500));
  f.addEventListener('change', saveKDraft);
  function saveKDraft() { if (K.editId) return; const d = formData(f); d.pens = $$('#penChips .chip.sel-o').map((c) => c.dataset.pid); d.tenggat = D.fromLocal(d.tenggat); d.files = K.files.filter((x) => x.done); LS.set(K.draftKey, d); const dot = $('#draftDot'); if (dot) dot.textContent = 'Draf tersimpan ' + D.t(Date.now()); }
}
function renderKFiles() {
  const box = $('#kFiles'); if (!box) return; const K = S.c.kform;
  box.innerHTML = K.files.map((f, i) => `<div class="file-chip"><div class="tile ${/pdf/i.test(f.mime || f.name) ? 'err' : 'sky'}">${I(fileIcon(f.name, f.mime))}</div><div class="f1" style="min-width:0"><div class="bold small truncate">${esc(f.name)}</div><div class="xs muted">${f.err ? `<span class="ink-err">${esc(f.err)}</span>` : f.done ? (f.size ? fmtSize(f.size) + ' · ' : '') + 'terunggah' : 'mengunggah…'}</div>${!f.done && !f.err ? '<div class="prog"><i></i></div>' : ''}</div>${f.done && f.id ? `<button type="button" class="icon-btn" onclick="previewPublic(${jsq(f.name)},'${f.id}')">${I('eye')}</button>` : ''}<button type="button" class="icon-btn" onclick="S.c.kform.files.splice(${i},1);renderKFiles()">${I('x')}</button></div>`).join('');
}
function kAddFiles(files) {
  const K = S.c.kform, folder = K.form === 'tugas' ? 'tugas' : 'materi';
  if (K.form === 'materi') K.files = [];
  Array.from(files).forEach((file) => {
    const f = { name: file.name, mime: file.type, size: file.size, done: false }; K.files.push(f);
    uploadFile(file, folder).then((r) => { f.id = r.file_id; f.done = true; f.size = r.size; renderKFiles(); }).catch((e) => { f.err = e.message; renderKFiles(); });
  });
  renderKFiles();
}
function saveKonten(status) {
  const f = $('#kForm'), K = S.c.kform, d = formData(f), isT = K.form === 'tugas';
  const pens = K.editId ? [] : $$('#penChips .chip.sel-o').map((c) => c.dataset.pid);
  if (!d.judul.trim()) { toast('Judul wajib diisi.', 'warn'); f.elements.judul.focus(); return; }
  if (!K.editId && !pens.length) { toast('Pilih minimal satu kelas target.', 'warn'); return; }
  if (K.files.some((x) => !x.done && !x.err)) { toast('Tunggu unggahan selesai.', 'warn'); return; }
  let payload, action;
  if (isT) {
    if (!d.instruksi.trim()) { toast('Instruksi wajib diisi.', 'warn'); return; }
    action = 'tugas.save';
    payload = { tugas_id: K.editId, penugasan_ids: pens, judul: d.judul, instruksi: d.instruksi, tenggat: D.fromLocal(d.tenggat), nilai_maks: num(d.nilai_maks, 100), jenis_kumpul: d.jenis_kumpul, izinkan_terlambat: !!d.izinkan_terlambat, lampiran: K.files.filter((x) => x.done).map((x) => x.id), status };
    if (!payload.tenggat) { toast('Isi tenggat.', 'warn'); return; }
  } else {
    action = 'materi.save';
    const file = K.files.find((x) => x.done);
    payload = { materi_id: K.editId, penugasan_ids: pens, judul: d.judul, deskripsi: d.deskripsi, tipe: d.tipe, url: d.url, file_id: file ? file.id : '', notif: d.notif !== false };
    if (d.tipe === 'FILE' && !file) { toast('Unggah berkas materi.', 'warn'); return; }
    if (d.tipe !== 'FILE' && !/^https?:[/][/]/i.test(d.url || '')) { toast('Tautan harus diawali https://', 'warn'); return; }
  }
  // Optimistic UI: tampilkan langsung di daftar, sinkron di latar
  const g = G(), list = isT ? g.tugas : g.materi, tmpIds = [];
  const backup = list.slice();
  if (K.editId) { const it = list.find((x) => (isT ? x.tugas_id : x.materi_id) === K.editId); if (it) Object.assign(it, payload, isT ? { lampiran: payload.lampiran } : {}); }
  else pens.forEach((pid) => { const pn = g.penugasan.find((x) => x.penugasan_id === pid) || {}; const id = 'tmp-' + uidc(); tmpIds.push(id); list.unshift(Object.assign({}, payload, isT ? { tugas_id: id, total: g.siswa.filter((s) => s.kelas_id === pn.kelas_id).length, kumpul: 0, dinilai: 0, terlambat: 0, lampiran: payload.lampiran } : { materi_id: id, file_id: payload.file_id }, { penugasan_id: pid, kelas_id: pn.kelas_id, mapel_id: pn.mapel_id, dibuat_pada: now(), _pending: true })); });
  LS.del(K.draftKey);
  toast(status === 'DRAF' ? 'Draf disimpan.' : K.editId ? 'Perubahan disimpan.' : isT ? 'Tugas diterbitkan ke ' + pens.length + ' kelas.' : 'Materi dibagikan.', 'ok');
  go('g-konten', { tab: isT ? 'tugas' : 'materi' }, { replace: true });
  call(action, payload).then((rows) => {
    const key = isT ? 'tugas_id' : 'materi_id';
    const keep = list.filter((x) => tmpIds.indexOf(x[key]) < 0 && rows.every((r) => r[key] !== x[key]));
    list.length = 0; rows.concat(keep).forEach((x) => list.push(x)); list.sort(by('dibuat_pada', -1));
    if (isT) G().stats.perluDinilai = G().tugas.filter((x) => x.status === 'TERBIT').reduce((n, x) => n + (x.kumpul - x.dinilai), 0);
    saveSnap(); rerender();
  }).catch((e) => { list.length = 0; backup.forEach((x) => list.push(x)); if (!K.editId) LS.set(K.draftKey, Object.assign(formData(f || document.createElement('div')), payload, { pens })); rerender(); toast('Gagal menyimpan: ' + e.message + ' Draf dipulihkan.', 'err', 8000); });
}
function deleteMateri(id) {
  confirmBox('Hapus materi ini? Siswa tidak akan bisa melihatnya lagi.', { danger: true, yes: 'Hapus' }).then((ok) => {
    if (!ok) return; const g = G(), bak = g.materi.slice();
    g.materi = g.materi.filter((m) => m.materi_id !== id); S.boot.guru.materi = g.materi; rerender(); toast('Materi dihapus.', 'ok');
    call('materi.delete', { materi_id: id }).then(saveSnap).catch((e) => { S.boot.guru.materi = bak; rerender(); failToast(e); });
  });
}

// ── Pantau & Penilaian tugas ──
route('g-tugas', {
  title: 'Pantau & Penilaian', roles: ['GURU', 'ADMIN', 'WALI'], back: 'g-konten', nav: 'g-konten', form: true,
  render(p) {
    const t0 = G().tugas.find((x) => x.tugas_id === p.id);
    const d = String(p.id).indexOf('tmp-') === 0 ? null : need('td_' + p.id, 'tugas.detail', { tugas_id: p.id }, 20000);
    if (!d) return t0 ? `<div class="page"><h1>${esc(t0.judul)}</h1><p class="muted mt8">Memuat data pengumpulan…</p><div class="split mt16"><div>${skelCards(4, 30)}</div><div>${skelCards(1, 200)}</div></div></div>` : skelPage();
    const t = d.tugas, tab = p.tab || 'semua', q = (S.c.tdQ || '').toLowerCase();
    const sudah = d.siswa.filter((s) => s.kumpul && !s.kumpul.terlambat), belum = d.siswa.filter((s) => !s.kumpul), telat = d.siswa.filter((s) => s.kumpul && s.kumpul.terlambat);
    const perlu = d.siswa.filter((s) => s.kumpul && (s.kumpul.nilai === null || s.kumpul.nilai === undefined));
    let list = tab === 'sudah' ? sudah : tab === 'belum' ? belum : tab === 'telat' ? telat : tab === 'perlu' ? perlu : d.siswa;
    if (q) list = list.filter((s) => s.nama.toLowerCase().indexOf(q) >= 0 || String(s.nis_nip).indexOf(q) >= 0);
    const selId = p.sid || (perlu[0] || d.siswa.find((s) => s.kumpul) || {}).user_id;
    const sel = d.siswa.find((s) => s.user_id === selId);
    const lastR = d.lastRemind, canRemind = !lastR || now() - lastR > 3600000;
    const showRemindBanner = S.c.remindBanner && S.c.remindBanner.id === t.tugas_id && now() - S.c.remindBanner.at < 600000;
    return `<div class="page">
      <button class="back-link" onclick="back('g-konten')">${I('arrow-l', 'ic-sm')}Kembali ke Daftar Tugas</button>
      <div class="page-hd" style="margin-bottom:12px"><div style="min-width:0"><div class="flex items-c g12 wrap"><h1 style="font-size:26px">${esc(t.judul)}</h1>${now() > t.tenggat ? pill('Tenggat lewat', 'neu') : pill('Aktif berjalan', 'ok')}</div>
        <p class="tx2 mt8 flex wrap g12 small"><span class="ink-p bold">${I('book', 'ic-sm')} ${esc(mapelNm(t.mapel_id))}</span><span>Kelas ${esc(kelasNm(t.kelas_id))}</span><span>${I('clock', 'ic-sm')} Tenggat: <b>${D.rel(t.tenggat)}</b></span><span class="mono">Nilai maks: ${t.nilai_maks}</span></p></div>
        <div class="flex g8 wrap">${hasRole('GURU') || hasRole('ADMIN') ? `<button class="btn btn-ghost btn-sm" onclick="go('g-konten',{edit:'${t.tugas_id}'})">${I('edit', 'ic-sm')}Ubah</button>
          <div class="split-btn"><button class="btn btn-primary" ${!belum.length || !canRemind ? 'disabled' : ''} onclick="remindTugas('${t.tugas_id}',['DASHBOARD','EMAIL','WA'])">${I('send')}Kirim Pengingat ke yang Belum</button><button class="btn btn-primary" ${!belum.length || !canRemind ? 'disabled' : ''} onclick="remindMenu(this,'${t.tugas_id}')">${I('chev-d', 'ic-sm')}</button></div>` : ''}</div></div>
      ${showRemindBanner ? `<div class="banner banner-ok mb16">${I('check-c')}<div class="f1"><b>Pengingat berhasil terkirim ke ${S.c.remindBanner.n} siswa</b> via ${esc(S.c.remindBanner.via)}. <span class="small">(Pengingat manual berikutnya tersedia ${Math.max(1, Math.ceil((3600000 - (now() - lastR)) / 60000))} menit lagi.)</span></div></div>` : !canRemind && belum.length ? `<div class="banner banner-info mb16">${I('clock')}<div>Pengingat terakhir dikirim ${D.ago(lastR)}. Pengingat berikutnya tersedia ${Math.ceil((3600000 - (now() - lastR)) / 60000)} menit lagi.</div></div>` : ''}
      <div class="grid gc4 mb16">${statCard('Sudah kumpul', sudah.length + telat.length, '/' + d.siswa.length, telat.length ? telat.length + ' terlambat' : 'Tepat waktu semua', 'check-c', 'ok')}${statCard('Belum kumpul', belum.length, 'siswa', '', 'alert-c', belum.length ? 'err' : '')}${statCard('Perlu dinilai', perlu.length, '', '', 'star', perlu.length ? 'warn' : '')}${statCard('Rata-rata nilai', fmtN(avg(d.siswa.filter((s) => s.kumpul && s.kumpul.nilai !== null).map((s) => s.kumpul.nilai))), '', 'dari ' + t.nilai_maks, 'chart', 'p')}</div>
      <div class="split s-l"><div class="card"><div style="padding:12px 14px 0" class="chips scroll">${[['semua', 'Semua', d.siswa.length], ['sudah', 'Sudah', sudah.length], ['belum', 'Belum', belum.length], ['telat', 'Terlambat', telat.length], ['perlu', 'Perlu dinilai', perlu.length]].map((x) => `<button class="chip ${tab === x[0] ? 'on' : ''}" onclick="go('g-tugas',Object.assign({},S.params,{tab:'${x[0]}'}),{replace:true})">${x[1]} <span class="cnt">${x[2]}</span></button>`).join('')}</div>
        <div style="padding:12px 14px" class="flex g8"><span class="pill pill-neu pill-lg">${I('door', 'ic-sm')}${esc(kelasShort(t.kelas_id))} (${d.siswa.length})</span><div class="input-ic f1">${I('search')}<input class="input input-sm" placeholder="Cari nama atau NIS" value="${esc(S.c.tdQ || '')}" oninput="S.c.tdQ=this.value;rerenderKeepFocus()"></div></div>
        <div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>Siswa</th><th>Waktu kumpul</th><th>Status</th></tr></thead><tbody>${list.map((s) => `<tr class="${s.user_id === selId ? 'sel' : ''}" style="cursor:pointer" onclick="go('g-tugas',Object.assign({},S.params,{sid:'${s.user_id}'}),{replace:true})"><td><div class="flex items-c g8">${avatar(s.nama, s.foto, 'sm')}<div style="min-width:0"><div class="bold small truncate">${esc(s.nama)}</div><div class="mono xs muted">NIS: ${esc(s.nis_nip)}</div></div></div></td>
          <td class="small">${s.kumpul ? `<span class="${s.kumpul.terlambat ? 'ink-err' : ''}">${D.ago(s.kumpul.waktu_kumpul)}</span>` : '—'}</td><td>${!s.kumpul ? pill('Belum kumpul', 'err') : s.kumpul.nilai !== null && s.kumpul.nilai !== undefined ? pill('Nilai ' + fmtN(s.kumpul.nilai), 'ok') : s.kumpul.terlambat ? pill('Terlambat', 'warn') : pill('Perlu dinilai', 'warn')}</td></tr>`).join('') || `<tr><td colspan="3">${emptyState('inbox', 'Tidak ada siswa', '')}</td></tr>`}</tbody></table></div></div>
      <div>${sel ? gradePanel(t, sel, d) : `<div class="card">${emptyState('user', 'Pilih siswa', 'Klik nama siswa di daftar untuk melihat dan menilai jawabannya.')}</div>`}</div></div></div>`;
  }
});
function gradePanel(t, s, d) {
  const k = s.kumpul, idx = d.siswa.indexOf(s), withK = d.siswa.filter((x) => x.kumpul), pos = withK.indexOf(s);
  const next = withK[pos + 1], prev = withK[pos - 1], canGrade = hasRole('GURU') || hasRole('ADMIN');
  const head = `<div class="card card-p flex items-c g12 wrap">${avatar(s.nama, s.foto, 'lg')}<div class="f1" style="min-width:0"><div class="flex items-c g8 wrap"><h3>${esc(s.nama)}</h3><span class="pill pill-info mono">Kelas ${esc(kelasShort(s.kelas_id))}</span></div><div class="mono small muted">NIS: ${esc(s.nis_nip)} · Urutan ${idx + 1}/${d.siswa.length}</div></div>
    <div class="flex g8"><button class="btn btn-secondary btn-sm" ${prev ? `onclick="go('g-tugas',Object.assign({},S.params,{sid:'${prev.user_id}'}),{replace:true})"` : 'disabled'}>${I('chev-l', 'ic-sm')}Sebelumnya</button><button class="btn btn-secondary btn-sm" ${next ? `onclick="go('g-tugas',Object.assign({},S.params,{sid:'${next.user_id}'}),{replace:true})"` : 'disabled'}>Berikutnya${I('chev-r', 'ic-sm')}</button></div></div>`;
  if (!k) return `${head}<div class="card mt16">${emptyState('inbox', 'Belum mengumpulkan', 'Siswa ini belum mengumpulkan tugas. Kirim pengingat dari tombol di atas.')}</div>`;
  return `${head}<div class="card card-p mt16"><div class="flex items-c g12 wrap jc-b"><span class="flex items-c g8">${I('check-c', 'ink-ok')}Waktu kirim: <b>${D.dt(k.waktu_kumpul)}</b></span>${k.terlambat ? pill('Terlambat', 'warn') : pill('Tepat waktu', 'ok')}</div>
      ${k.teks ? `<div class="card mt16" style="padding:14px;background:var(--subtle)"><div class="xs bold upper muted mb8">Jawaban / catatan siswa</div><div class="pre">${esc(k.teks)}</div></div>` : ''}
      ${(k.file_ids || []).map((id, i) => `<div class="file-chip mt12"><div class="tile err">${I('file-text')}</div><div class="f1 bold small">Berkas ${i + 1}</div><button class="btn btn-secondary btn-sm" onclick="previewPrivate('${k.kumpul_id}','${id}','Berkas ${i + 1} — ${esc(s.nama).replace(/'/g, '')}')">${I('eye', 'ic-sm')}Lihat Dokumen</button></div>`).join('')}</div>
    ${canGrade ? `<div class="card card-p mt16"><div class="flex items-c jc-b"><h3 class="flex items-c g8">${I('star', 'ink-p')}Formulir Penilaian</h3><span class="small muted">KKM: ${cfg().kkm || 75}</span></div>
      <div class="flex items-c g12 mt16 wrap card" style="padding:14px;background:var(--subtle)"><span class="bold">Skor Perolehan:</span><input class="input mono" id="gScore" type="number" min="0" max="${t.nilai_maks}" step="0.5" value="${k.nilai !== null && k.nilai !== undefined ? k.nilai : ''}" style="width:110px;height:52px;font-size:24px;text-align:center;font-weight:600;border:2px solid var(--p600)" autofocus><span class="mono" style="font-size:22px">/ ${t.nilai_maks}</span><span id="gTuntas"></span></div>
      <div class="xs bold upper muted mt16 mb8">Nilai cepat</div><div class="chips">${[100, 90, 85, 80, 75, 70, 60].map((v) => `<button class="chip" onclick="$('#gScore').value=${Math.round(v * t.nilai_maks / 100)};gTuntas(${t.nilai_maks})">${Math.round(v * t.nilai_maks / 100)}</button>`).join('')}</div>
      <div class="field mt16"><label class="label">Catatan & Umpan Balik Guru</label><textarea class="textarea" id="gComment" placeholder="Tuliskan umpan balik untuk siswa…">${esc(k.komentar || '')}</textarea></div>
      <label class="check mt12"><input type="checkbox" id="gNotif" checked>Kirim notifikasi nilai langsung ke siswa</label>
      <div class="flex g8 mt16 jc-e wrap"><button class="btn btn-primary btn-lg" id="gSave" onclick="saveGrade('${t.tugas_id}','${s.user_id}','${next ? next.user_id : ''}')">${I('check-c')}${next ? 'Simpan Nilai & Lanjut ke Siswa Berikutnya' : 'Simpan Nilai'}${next ? I('arrow-r') : ''}</button></div>
      <p class="kbd-hint tr mt8">Pintasan: <span class="kbd">Ctrl</span> + <span class="kbd">Enter</span></p></div>` : ''}`;
}
function gTuntas(maks) { const v = num($('#gScore').value, NaN), el = $('#gTuntas'); if (!el) return; el.innerHTML = isNaN(v) ? '' : v / maks * 100 >= (cfg().kkm || 75) ? pill('Tuntas (di atas KKM)', 'ok') : pill('Belum tuntas', 'warn'); }
ROUTES['g-tugas'].mount = (p) => {
  const sc = $('#gScore'); if (!sc) return;
  const t = G().tugas.find((x) => x.tugas_id === p.id) || (S.c['td_' + p.id] && S.c['td_' + p.id].d.tugas);
  const maks = t ? t.nilai_maks : 100;
  sc.oninput = () => gTuntas(maks); gTuntas(maks);
  const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); const b = $('#gSave'); if (b) b.click(); } };
  document.addEventListener('keydown', h); ROUTES['g-tugas'].leave = () => document.removeEventListener('keydown', h);
};
function saveGrade(tid, sid, nextSid) {
  const ent = S.c['td_' + tid], d = ent.d, s = d.siswa.find((x) => x.user_id === sid), t = d.tugas;
  const v = num($('#gScore').value, NaN), kom = $('#gComment').value, notif = $('#gNotif').checked;
  if (isNaN(v) || v < 0 || v > t.nilai_maks) { toast('Nilai harus 0–' + t.nilai_maks + '.', 'warn'); $('#gScore').focus(); return; }
  const prev = Object.assign({}, s.kumpul), wasGraded = prev.nilai !== null && prev.nilai !== undefined;
  s.kumpul.nilai = v; s.kumpul.komentar = kom;   // optimistic
  const gt = G().tugas.find((x) => x.tugas_id === tid); if (gt && !wasGraded) { gt.dinilai++; G().stats.perluDinilai = Math.max(0, G().stats.perluDinilai - 1); }
  toast(`Nilai ${s.nama}: ${fmtN(v)} tersimpan.`, 'ok', 2000);
  if (nextSid) go('g-tugas', Object.assign({}, S.params, { sid: nextSid }), { replace: true }); else rerender();
  renderChrome();
  call('tugas.grade', { kumpul_id: prev.kumpul_id, nilai: v, komentar: kom, notif }, { silent: true }).then(() => saveSnap()).catch((e) => {
    s.kumpul.nilai = prev.nilai; s.kumpul.komentar = prev.komentar; if (gt && !wasGraded) { gt.dinilai--; G().stats.perluDinilai++; }
    rerender(); toast(`Gagal menyimpan nilai ${s.nama}: ${e.message}`, 'err', 8000);
  });
}
function remindMenu(el, tid) {
  menuAt(el, [{ icon: 'bell', label: 'Dashboard saja', run: () => remindTugas(tid, ['DASHBOARD']) }, { icon: 'mail', label: 'Dashboard + Email', run: () => remindTugas(tid, ['DASHBOARD', 'EMAIL']) }, { icon: 'wa', label: 'Dashboard + WhatsApp', run: () => remindTugas(tid, ['DASHBOARD', 'WA']) }, { icon: 'send', label: 'Semua kanal', run: () => remindTugas(tid, ['DASHBOARD', 'EMAIL', 'WA']) }]);
}
function remindTugas(tid, kanal) {
  const ent = S.c['td_' + tid]; const belum = ent ? ent.d.siswa.filter((s) => !s.kumpul).length : 0;
  confirmBox(`Kirim pengingat ke <b>${belum} siswa</b> yang belum mengumpulkan lewat ${kanal.map((k) => ({ DASHBOARD: 'notifikasi aplikasi', EMAIL: 'email', WA: 'WhatsApp' })[k]).join(', ')}?`, { yes: 'Kirim Pengingat', icon: 'send' }).then((ok) => {
    if (!ok) return;
    if (ent) ent.d.lastRemind = now();
    S.c.remindBanner = { id: tid, at: now(), n: belum, via: kanal.map((k) => ({ DASHBOARD: 'Notifikasi Dashboard', EMAIL: 'Email', WA: 'WhatsApp' })[k]).join(' & ') };
    rerender();
    call('tugas.remind', { tugas_id: tid, kanal }).then((r) => { S.c.remindBanner.n = r.target; rerender(); }).catch((e) => { if (ent) ent.d.lastRemind = 0; S.c.remindBanner = null; rerender(); failToast(e); });
  });
}


// ════════════════════════════════════════════════════════
// BAGIAN 15: BANK SOAL, IMPORT, UJIAN CBT (buat, monitor, koreksi, hasil)
// ════════════════════════════════════════════════════════
const soalList = () => need('soal', 'soal.list', {}, 120000);
// ── Berkas soal: soal dikelompokkan per mapel + kelas + jenis penilaian ──
const JENIS_BK = { UH: 'UH', UTS: 'PTS', UAS: 'PAS', LATIHAN: 'Latihan', '': 'Umum' };
const JENIS_BK_L = [['UH', 'Ulangan Harian'], ['UTS', 'PTS · Tengah Semester'], ['UAS', 'PAS · Akhir Semester'], ['LATIHAN', 'Latihan'], ['', 'Umum']];
const bkId = () => 'bk' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
/** Kelompokkan butir soal menjadi berkas. Soal lama (belum berlabel) dikelompokkan otomatis per mapel + guru + ujian pertama yang memakainya. */
function berkasList(list) {
  const ulBy = {}; (G().ulangan || []).forEach((u) => { ulBy[u.ulangan_id] = u; });
  const m = {};
  list.forEach((s) => {
    let k, info;
    if (s.berkas_id) { k = 'B:' + s.berkas_id; info = { berkas_id: s.berkas_id, nama: s.nama_berkas || 'Berkas tanpa nama', kelas_ids: s.kelas_ids || [], jenis: s.jenis || '' }; }
    else {
      const u0 = (s.ul || []).map((id) => ulBy[id]).filter(Boolean).sort(by('buka'))[0];
      k = 'L:' + s.pembuat_id + ':' + s.mapel_id + ':' + (u0 ? u0.ulangan_id : '-');
      info = { berkas_id: '', nama: u0 ? u0.judul : 'Soal ' + mapelNm(s.mapel_id), kelas_ids: u0 ? u0.kelas_ids || [] : [], jenis: u0 ? u0.jenis || '' : '', legacy: true };
    }
    const b = m[k] || (m[k] = Object.assign({ key: k, mapel_id: s.mapel_id, pembuat_id: s.pembuat_id, pembuat: s.pembuat, soal: [], ul: {}, t: 0, tipe: { PG: 0, MCMA: 0, KATEGORI: 0, ESAI: 0 }, skor: 0 }, info));
    b.soal.push(s); b.tipe[s.tipe] = (b.tipe[s.tipe] || 0) + 1; b.skor += num(s.skor_maks); b.t = Math.max(b.t, num(s.dibuat_pada)); (s.ul || []).forEach((id) => { b.ul[id] = 1; });
  });
  Object.keys(S.c.bkDraft || {}).forEach((k) => { if (!m[k]) m[k] = Object.assign({ soal: [], ul: {}, tipe: { PG: 0, MCMA: 0, KATEGORI: 0, ESAI: 0 }, skor: 0, draft: true }, S.c.bkDraft[k]); });
  return Object.keys(m).map((k) => { const b = m[k]; b.nUl = Object.keys(b.ul).length; b.soal.sort((x, y) => num(x.dibuat_pada) - num(y.dibuat_pada)); return b; }).sort((a, b) => b.t - a.t);
}
function bkJenisPill(j) { return `<span class="bk-j j-${j || 'U'}">${esc(JENIS_BK[j || ''] || j)}</span>`; }
function bkKelas(ids, max) { const l = (ids || []).map(kelasShort); return l.length ? l.slice(0, max || 6).map((k) => `<span class="bk-k">${esc(k)}</span>`).join('') + (l.length > (max || 6) ? `<span class="bk-k">+${l.length - (max || 6)}</span>` : '') : '<span class="xs muted">Kelas belum diatur</span>'; }
function berkasCard(b, showGuru) {
  const t = b.tipe, mix = ['PG', 'MCMA', 'KATEGORI', 'ESAI'].filter((k) => t[k]).map((k) => (k === 'PG' ? 'PG' : k === 'ESAI' ? 'Esai' : k === 'MCMA' ? 'MCMA' : 'B/S') + ' ' + t[k]).join(' · ');
  return `<button class="bk-card" onclick="go('g-berkas',{k:'${b.key}'})"><div class="bk-top"><span class="bk-ic mp${hashN(b.mapel_id) % 6}">${I('file-text')}<b>${b.soal.length}</b></span>
      <div class="f1" style="min-width:0"><div class="bk-nm">${esc(b.nama)}</div><div class="xs muted truncate mt4">${esc(mapelNm(b.mapel_id))}${showGuru ? ' · ' + esc(b.pembuat || '') : ''}</div></div>${bkJenisPill(b.jenis)}</div>
    <div class="bk-kls">${bkKelas(b.kelas_ids, 5)}</div>
    <div class="bk-ft"><span>${b.soal.length} soal${mix ? ' · ' + mix : ''}</span><span class="${b.nUl ? 'ink-ok' : 'muted'}">${b.nUl ? I('check', 'ic-sm') + b.nUl + ' ujian' : b.draft ? 'Berkas baru' : 'Belum dipakai'}</span></div></button>`;
}
route('g-bank', {
  title: 'Bank Soal', roles: ['GURU', 'ADMIN'],
  render(p) {
    const list = soalList(), admin = hasRole('ADMIN');
    const F = S.c.bkF || (S.c.bkF = { q: '', jenis: '*', mapel: '', guru: '', kelas: '', view: 'berkas' });
    const head = `<div class="page-hd"><div><h1>Bank Soal</h1><p class="sub">${admin ? 'Berkas soal semua guru per mata pelajaran — lengkap dengan kelas, jenis penilaian (UH, PTS, PAS), dan penyusunnya.' : 'Berkas soal Anda per kelas. Satu berkas = satu kumpulan soal, misalnya PTS B. Inggris kelas XII-1.'}</p></div>
      <div class="flex g8 wrap"><button class="btn btn-secondary" onclick="go('g-import')">${I('upload')}Import Berkas Soal</button><button class="btn btn-primary" onclick="openBerkasForm(null)">${I('plus')}Buat Berkas</button></div></div>`;
    if (!list) return `<div class="page">${head}${skelCards(3)}</div>`;
    const all = berkasList(list), q = F.q.trim().toLowerCase();
    const match = (b) => (F.jenis === '*' || b.jenis === F.jenis) && (!F.mapel || b.mapel_id === F.mapel) && (!F.guru || b.pembuat_id === F.guru)
      && (!q || (b.nama + ' ' + mapelNm(b.mapel_id) + ' ' + (b.pembuat || '') + ' ' + b.kelas_ids.map(kelasShort).join(' ')).toLowerCase().indexOf(q) >= 0);
    const rows = all.filter(match), nSoal = list.length;
    const mapels = uniqBy(all, (b) => b.mapel_id).map((b) => b.mapel_id).sort((a, b) => mapelNm(a).localeCompare(mapelNm(b)));
    const jChips = `<div class="chips">${[['*', 'Semua']].concat(JENIS_BK_L.map((x) => [x[0], JENIS_BK[x[0]]])).map((x) => { const n = all.filter((b) => x[0] === '*' || b.jenis === x[0]).length; return n || x[0] === '*' ? `<button class="chip ${F.jenis === x[0] ? 'on' : ''}" onclick="S.c.bkF.jenis='${x[0]}';rerender()">${esc(x[1])} <span class="cnt">${n}</span></button>` : ''; }).join('')}</div>`;
    const search = `<div class="input-ic" style="min-width:220px;flex:1;max-width:340px">${I('search')}<input class="input input-sm" id="bkQ" placeholder="Cari berkas, mapel, guru, kelas…" value="${esc(F.q)}"></div>`;
    const empty = `<div class="card">${emptyState('file-text', all.length ? 'Tidak ada berkas yang cocok' : 'Belum ada berkas soal', all.length ? 'Ubah kata kunci atau saringan.' : 'Import berkas Word/Excel atau buat berkas baru lalu tulis soalnya.', all.length ? '' : `<button class="btn btn-primary" onclick="go('g-import')">${I('upload')}Import Berkas Soal</button>`)}</div>`;
    let body;
    if (admin) {
      const gurus = uniqBy(all, (b) => b.pembuat_id).sort((a, b) => String(a.pembuat).localeCompare(String(b.pembuat)));
      const stats = [['Berkas soal', all.length, 'file-text', ''], ['Butir soal', nSoal, 'list-check', ''], ['Mapel terisi', mapels.length + '/' + (B().mapel || []).length, 'book', 'ok'], ['Guru penyusun', gurus.length, 'users', 'vio']];
      const tools = `<div class="card mt16"><div class="flex g12 items-c wrap" style="padding:14px 16px">${search}
          <select class="select input-sm" style="max-width:200px" onchange="S.c.bkF.mapel=this.value;rerender()"><option value="">Semua mapel</option>${mapels.map((m) => `<option value="${m}" ${F.mapel === m ? 'selected' : ''}>${esc(mapelNm(m))}</option>`).join('')}</select>
          <select class="select input-sm" style="max-width:220px" onchange="S.c.bkF.guru=this.value;rerender()"><option value="">Semua guru</option>${gurus.map((g) => `<option value="${g.pembuat_id}" ${F.guru === g.pembuat_id ? 'selected' : ''}>${esc(g.pembuat)}</option>`).join('')}</select>
          <div class="seg ml-a">${[['berkas', 'Berkas'], ['rekap', 'Rekap per Mapel']].map((x) => `<button type="button" class="${F.view === x[0] ? 'on' : ''}" onclick="S.c.bkF.view='${x[0]}';rerender()">${x[1]}</button>`).join('')}</div></div>
        <div style="padding:0 16px 14px">${jChips}</div></div>`;
      if (F.view === 'rekap') {
        const cols = [['UH', 'UH'], ['UTS', 'PTS'], ['UAS', 'PAS'], ['X', 'Latihan / Umum']];
        const ms = (B().mapel || []).slice().sort((a, b) => a.nama_mapel.localeCompare(b.nama_mapel)).filter((m) => !F.mapel || m.mapel_id === F.mapel);
        body = `<div class="card mt16"><div class="card-hd"><h3>${I('table', 'ink-p')} Rekap berkas soal per mapel</h3><span class="small muted">Klik nama berkas untuk membuka</span></div><div class="tbl-wrap"><table class="tbl bk-rekap"><thead><tr><th>Mata pelajaran</th>${cols.map((c) => `<th>${c[1]}</th>`).join('')}</tr></thead><tbody>
          ${ms.map((m) => { const bs = rows.filter((b) => b.mapel_id === m.mapel_id);
            return `<tr><td><div class="flex items-c g8">${mapelIcon(m.mapel_id, 'sm')}<b class="small">${esc(m.nama_mapel)}</b></div></td>${cols.map((c) => { const xs = bs.filter((b) => c[0] === 'X' ? (b.jenis === 'LATIHAN' || !b.jenis) : b.jenis === c[0]);
              return `<td>${xs.length ? xs.map((b) => `<a href="javascript:void(0)" class="bk-cell" title="${esc(b.nama)}" onclick="go('g-berkas',{k:'${b.key}'})"><b>${esc(b.pembuat || '-')}</b><span>${b.kelas_ids.map(kelasShort).join(', ') || 'kelas ?'} · ${b.soal.length} soal</span></a>`).join('') : `<span class="bk-none ${c[0] === 'UTS' || c[0] === 'UAS' ? 'req' : ''}">${c[0] === 'UTS' || c[0] === 'UAS' ? 'Belum ada' : '—'}</span>`}</td>`; }).join('')}</tr>`; }).join('')}
        </tbody></table></div></div>`;
      } else {
        const grp = mapels.filter((m) => rows.some((b) => b.mapel_id === m));
        body = grp.length ? grp.map((m) => { const bs = rows.filter((b) => b.mapel_id === m);
          return `<section class="bk-sec"><div class="bk-sec-hd">${mapelIcon(m, 'sm')}<h3>${esc(mapelNm(m))}</h3><span class="small muted">${bs.length} berkas · ${sum(bs.map((b) => b.soal.length))} soal · ${uniqBy(bs, (b) => b.pembuat_id).length} guru</span></div><div class="bk-grid">${bs.map((b) => berkasCard(b, true)).join('')}</div></section>`; }).join('') : `<div class="mt16">${empty}</div>`;
      }
      return `<div class="page">${head}<div class="grid gc4">${stats.map((x) => `<div class="card stat"><div><div class="lbl">${x[0]}</div><div class="val">${x[1]}</div></div><div class="tile ${x[3]}">${I(x[2])}</div></div>`).join('')}</div>${tools}${body}</div>`;
    }
    // ── Guru: per kelas ──
    const pens = G().penugasan, kls = uniqBy(pens, (x) => x.kelas_id).map((x) => x.kelas_id);
    const inK = (b, k) => k === '-' ? !b.kelas_ids.length : b.kelas_ids.indexOf(k) >= 0;
    const secK = kls.filter((k) => rows.some((b) => inK(b, k))).concat(rows.some((b) => !b.kelas_ids.length || !b.kelas_ids.some((k) => kls.indexOf(k) >= 0)) ? ['-'] : []);
    const show = F.kelas ? secK.filter((k) => k === F.kelas) : secK;
    const kChips = `<div class="chips">${[['', 'Semua kelas', all.length]].concat(kls.map((k) => [k, kelasShort(k), all.filter((b) => inK(b, k)).length])).map((x) => `<button class="chip ${F.kelas === x[0] ? 'on' : ''}" onclick="S.c.bkF.kelas='${x[0]}';rerender()">${esc(x[1])} <span class="cnt">${x[2]}</span></button>`).join('')}</div>`;
    body = show.length ? show.map((k) => { const bs = rows.filter((b) => k === '-' ? !b.kelas_ids.length || !b.kelas_ids.some((x) => kls.indexOf(x) >= 0) : inK(b, k));
      return `<section class="bk-sec"><div class="bk-sec-hd"><span class="tile sm">${I(k === '-' ? 'file' : 'door')}</span><h3>${k === '-' ? 'Belum diatur kelasnya' : 'Kelas ' + esc(kelasNm(k))}</h3><span class="small muted">${bs.length} berkas · ${sum(bs.map((b) => b.soal.length))} soal</span></div><div class="bk-grid">${bs.map((b) => berkasCard(b, false)).join('')}</div></section>`; }).join('') : `<div class="mt16">${empty}</div>`;
    return `<div class="page">${head}<div class="card"><div class="flex g12 items-c wrap" style="padding:14px 16px">${search}<span class="small muted ml-a">${all.length} berkas · ${nSoal} butir soal</span></div><div style="padding:0 16px 10px">${kChips}</div><div style="padding:0 16px 14px">${jChips}</div></div>${body}</div>`;
  },
  mount() { const q = $('#bkQ'); if (q) q.oninput = debounce(() => { S.c.bkF.q = q.value; const pos = q.selectionStart; rerender(); const n = $('#bkQ'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { /* abaikan */ } } }, 250); }
});
/** Detail berkas: daftar butir soal di dalamnya + aksi (buat ujian, tambah/import soal, unduh, ubah, hapus). */
route('g-berkas', {
  title: 'Berkas Soal', roles: ['GURU', 'ADMIN'], back: 'g-bank', nav: 'g-bank',
  render(p) {
    const list = soalList(); if (!list) return skelPage();
    const b = berkasList(list).find((x) => x.key === p.k);
    const backBtn = `<button class="back-link" onclick="back('g-bank')">${I('arrow-l', 'ic-sm')}Kembali ke Bank Soal</button>`;
    if (!b) return `<div class="page">${backBtn}<div class="card">${emptyState('file-text', 'Berkas tidak ditemukan', 'Berkas mungkin sudah dihapus atau namanya diubah.', `<button class="btn btn-primary" onclick="go('g-bank')">Ke Bank Soal</button>`)}</div></div>`;
    const ulBy = {}; (G().ulangan || []).forEach((u) => { ulBy[u.ulangan_id] = u; });
    const uls = Object.keys(b.ul).map((id) => ulBy[id]).filter(Boolean);
    const own = hasRole('ADMIN') || b.pembuat_id === me().user_id;
    return `<div class="page">${backBtn}
      <div class="card bk-hero"><div class="flex g16 items-s wrap"><span class="bk-ic lg mp${hashN(b.mapel_id) % 6}">${I('file-text')}<b>${b.soal.length}</b></span>
        <div class="f1" style="min-width:220px"><div class="flex items-c g8 wrap">${bkJenisPill(b.jenis)}<span class="pill pill-info">${esc(mapelNm(b.mapel_id))}</span>${hasRole('ADMIN') ? `<span class="small muted">${I('user', 'ic-sm')} ${esc(b.pembuat || '')}</span>` : ''}</div>
          <h1 class="mt8" style="font-size:22px">${esc(b.nama)}</h1><div class="bk-kls mt8">${bkKelas(b.kelas_ids, 12)}</div>
          <p class="small muted mt8">${b.soal.length} butir · total skor ${fmtN(b.skor)} · PG ${b.tipe.PG} · MCMA ${b.tipe.MCMA} · Benar/Salah ${b.tipe.KATEGORI} · Esai ${b.tipe.ESAI}</p>
          ${uls.length ? `<p class="small mt8">${I('exam', 'ic-sm ink-p')} Dipakai di: ${uls.map((u) => `<a href="javascript:void(0)" class="ink-p bold" onclick="go('g-ujian-form',{id:'${u.ulangan_id}'})">${esc(u.judul)}</a>`).join(', ')}</p>` : ''}</div>
        ${own ? `<div class="flex g8 wrap"><button class="btn btn-ghost btn-sm" onclick="openBerkasForm('${b.key}')">${I('edit', 'ic-sm')}Ubah info</button><button class="btn btn-ghost btn-sm ink-err" onclick="delBerkas('${b.key}')">${I('trash', 'ic-sm')}Hapus</button></div>` : ''}</div>
        ${b.legacy ? `<div class="banner banner-info mt16">${I('info')}<div class="small">Berkas ini dikelompokkan otomatis dari soal lama berdasarkan ujian yang memakainya. Klik <b>Ubah info</b> untuk memberi nama, kelas, dan jenis penilaian yang tepat.</div></div>` : ''}
        <div class="flex g8 wrap mt16"><button class="btn btn-primary" ${b.soal.length ? '' : 'disabled'} onclick="go('g-ujian-form',{berkas:'${b.key}'})">${I('send')}Buat Ujian dari Berkas Ini</button>
          ${own ? `<button class="btn btn-secondary" onclick="berkasAddSoal('${b.key}')">${I('plus')}Tulis Soal</button><button class="btn btn-secondary" onclick="berkasImport('${b.key}')">${I('upload')}Import ke Berkas</button>` : ''}
          <button class="btn btn-ghost" ${b.soal.length ? '' : 'disabled'} onclick="exportBerkas('${b.key}')">${I('download')}Unduh Excel</button></div></div>
      ${b.soal.length && window.innerWidth < 768 ? `<div class="card mt16 bk-list">${b.soal.map((s, i) => `<div class="bk-q" onclick="openSoalEditor('${s.soal_id}')" role="button"><span class="bk-qn">${i + 1}</span><div class="f1" style="min-width:0"><div class="flex items-c g6 wrap">${pill(TIPE_SOAL[s.tipe].replace('PG Kompleks ', ''), s.tipe === 'ESAI' ? 'vio' : 'info')}<span class="xs muted mono">Kunci ${esc(String(fmtKunci(s.kunci)).slice(0, 20))} · ${fmtN(s.skor_maks)} poin</span>${s.gambar ? `<span class="xs ink-p">${I('image', 'ic-sm')}</span>` : ''}</div><div class="small mt4 bk-qt">${esc(s.teks)}</div></div>
          ${own ? `<div class="col g4"><button class="icon-btn" onclick="event.stopPropagation();dupSoal('${s.soal_id}')" title="Duplikat">${I('copy')}</button><button class="icon-btn ink-err" onclick="event.stopPropagation();delSoal('${s.soal_id}')" title="Hapus">${I('trash')}</button></div>` : ''}</div>`).join('')}</div>`
      : b.soal.length ? `<div class="card mt16">${dataTable('bk_' + b.key, b.soal, [
        { h: 'No', k: 'dibuat_pada', n: true, r: (s) => `<span class="mono bold small">${b.soal.indexOf(s) + 1}</span>`, search: false },
        { h: 'Butir soal', k: 'teks', r: (s) => `<div class="clamp2" style="max-width:560px">${esc(s.teks)}</div>${s.gambar ? `<div class="xs ink-p mt4">${I('image', 'ic-sm')} Ada gambar</div>` : ''}` },
        { h: 'Tipe', k: 'tipe', r: (s) => pill(TIPE_SOAL[s.tipe].replace('PG Kompleks ', ''), s.tipe === 'ESAI' ? 'vio' : 'info') },
        { h: 'Kunci', k: 'kunci', sort: false, r: (s) => `<span class="mono small">${esc(String(fmtKunci(s.kunci)).slice(0, 24))}</span>`, search: false },
        { h: 'Skor', k: 'skor_maks', n: true, r: (s) => `<span class="mono">${fmtN(s.skor_maks)}</span>` },
        { h: '', sort: false, r: (s) => own ? `<div class="flex g4 jc-e"><button class="icon-btn" onclick="event.stopPropagation();openSoalEditor('${s.soal_id}')" title="Ubah">${I('edit')}</button><button class="icon-btn" onclick="event.stopPropagation();dupSoal('${s.soal_id}')" title="Duplikat">${I('copy')}</button><button class="icon-btn ink-err" onclick="event.stopPropagation();delSoal('${s.soal_id}')" title="Hapus">${I('trash')}</button></div>` : '' }
      ], { ph: 'Cari di berkas ini…', onRow: (s) => `openSoalEditor('${s.soal_id}')`, emptyT: 'Tidak ada soal', emptyD: '' })}</div>`
      : `<div class="card mt16">${emptyState('file-text', 'Berkas masih kosong', 'Import soal dari Word/Excel atau tulis soal satu per satu.', own ? `<div class="flex g8 wrap" style="justify-content:center"><button class="btn btn-primary" onclick="berkasImport('${b.key}')">${I('upload')}Import ke Berkas</button><button class="btn btn-secondary" onclick="berkasAddSoal('${b.key}')">${I('plus')}Tulis Soal</button></div>` : '')}</div>`}</div>`;
  }
});
const bkFind = (key) => berkasList(soalList() || []).find((x) => x.key === key);
const bkInfo = (b) => ({ berkas_id: b.berkas_id, nama_berkas: b.nama, kelas_ids: b.kelas_ids, jenis: b.jenis });
/** Kelas yang boleh dipilih untuk berkas: guru → kelas yang diajar pada mapel itu; admin → semua kelas. */
function bkKelasOpts(mapel) {
  if (hasRole('ADMIN')) return (B().kelas || []).map((k) => k.kelas_id);
  let ks = uniqBy(G().penugasan.filter((x) => !mapel || x.mapel_id === mapel), (x) => x.kelas_id).map((x) => x.kelas_id);
  if (!ks.length) ks = uniqBy(G().penugasan, (x) => x.kelas_id).map((x) => x.kelas_id);
  return ks.concat((B().kelas || []).filter((k) => k.bebas && ks.indexOf(k.kelas_id) < 0).map((k) => k.kelas_id));
}
/** Kelas tanpa jadwal mengajar (mis. kelas simulasi/uji coba): boleh dipilih guru mana pun untuk ujian. */
const kelasBebas = (k) => !!kelasBy(k).bebas;
const ujKelasOK = (mapel, k) => hasRole('ADMIN') || kelasBebas(k) || G().penugasan.some((x) => x.mapel_id === mapel && x.kelas_id === k);
/** Pilihan kelas ujian: kelas yang mengajar mapel ini dulu, lalu kelas lain yang boleh dipilih (admin: semua kelas). */
function ujKelasOpts(mapel) {
  const pen = uniqBy(G().penugasan.filter((x) => x.mapel_id === mapel), (x) => x.kelas_id).map((x) => x.kelas_id);
  const lain = (B().kelas || []).map((k) => k.kelas_id).filter((k) => pen.indexOf(k) < 0 && (hasRole('ADMIN') || kelasBebas(k)));
  return { pen, lain };
}
function bkMapelOpts() { const ms = uniqBy(G().penugasan, (x) => x.mapel_id).map((x) => x.mapel_id); if (hasRole('ADMIN')) (B().mapel || []).forEach((m) => { if (ms.indexOf(m.mapel_id) < 0) ms.push(m.mapel_id); }); return ms; }
/** Beri label berkas pada soal lama (berkas otomatis) agar bisa ditambah soal / diimpor. */
function bkEnsure(b) {
  if (b.berkas_id) return Promise.resolve(b);
  return call('berkas.save', Object.assign(bkInfo(b), { soal_ids: b.soal.map((s) => s.soal_id), mapel_id: b.mapel_id })).then((r) => { bkApply(r.soal); return bkFind('B:' + r.berkas_id); });
}
function bkApply(rows) { const l = S.c.soal && S.c.soal.d; if (!l) return; const by = {}; rows.forEach((x) => { by[x.soal_id] = x; }); l.forEach((x, i) => { if (by[x.soal_id]) { l[i] = by[x.soal_id]; delete by[x.soal_id]; } }); Object.keys(by).forEach((k) => l.unshift(by[k])); }
/** Form buat / ubah info berkas. */
function openBerkasForm(key) {
  if (srvOld('2.4.0', 'Berkas soal')) return;
  const b = key ? bkFind(key) : null, ms = bkMapelOpts();
  const E = { nama: b ? b.nama : '', mapel: b ? b.mapel_id : (S.c.bkF && S.c.bkF.mapel) || ms[0] || '', jenis: b ? b.jenis : 'UTS', kelas: b ? b.kelas_ids.slice() : (S.c.bkF && S.c.bkF.kelas && S.c.bkF.kelas !== '-' ? [S.c.bkF.kelas] : []) };
  const draw = (el) => {
    const opts = bkKelasOpts(E.mapel);
    $('#bfKelas', el).innerHTML = opts.map((k) => `<button type="button" class="chip ${E.kelas.indexOf(k) >= 0 ? 'sel-o' : ''}" data-k="${k}">${E.kelas.indexOf(k) >= 0 ? I('check', 'ic-sm') : ''}${esc(kelasShort(k))}</button>`).join('') || '<span class="small muted">Belum ada kelas untuk mapel ini.</span>';
  };
  sheet({ title: b ? 'Ubah Info Berkas' : 'Buat Berkas Soal', icon: 'file-text', body: `<form class="col g16" id="bfForm" onsubmit="return false">
      <div class="field"><label class="label">Nama berkas <span class="req">*</span></label><input class="input" id="bfNama" maxlength="150" value="${esc(E.nama)}" placeholder="Contoh: PTS Ganjil B. Inggris Kelas XII"></div>
      <div class="field"><label class="label">Mata pelajaran</label><select class="select" id="bfMapel">${ms.map((m) => `<option value="${m}" ${E.mapel === m ? 'selected' : ''}>${esc(mapelNm(m))}</option>`).join('')}</select></div>
      <div class="field"><label class="label">Jenis penilaian</label><div class="seg wrap" id="bfJenis">${JENIS_BK_L.map((x) => `<button type="button" data-v="${x[0]}" class="${E.jenis === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}</div></div>
      <div class="field"><label class="label">Untuk kelas</label><div class="chips" id="bfKelas"></div><div class="help">Boleh lebih dari satu kelas.</div></div></form>`,
    foot: `<button class="btn btn-secondary" data-x2>Batal</button><button class="btn btn-primary" id="bfSave">${I('check')}${b ? 'Simpan' : 'Buat Berkas'}</button>`,
    mount: (el, close) => {
      el.querySelector('[data-x2]').onclick = close; draw(el);
      $('#bfMapel', el).onchange = (e) => { E.mapel = e.target.value; const ok = bkKelasOpts(E.mapel); E.kelas = E.kelas.filter((k) => ok.indexOf(k) >= 0); draw(el); };
      $('#bfJenis', el).onclick = (e) => { const x = e.target.closest('button'); if (!x) return; E.jenis = x.dataset.v; $$('#bfJenis button', el).forEach((y) => y.classList.toggle('on', y === x)); };
      $('#bfKelas', el).onclick = (e) => { const x = e.target.closest('[data-k]'); if (!x) return; const i = E.kelas.indexOf(x.dataset.k); if (i >= 0) E.kelas.splice(i, 1); else E.kelas.push(x.dataset.k); draw(el); };
      $('#bfSave', el).onclick = () => {
        E.nama = $('#bfNama', el).value.trim();
        if (!E.nama) { toast('Nama berkas wajib diisi.', 'warn'); return; }
        if (!b || b.draft) {   // berkas baru: dibuat saat soal pertama disimpan
          const id = b ? b.berkas_id : bkId(), k = 'B:' + id;
          S.c.bkDraft = S.c.bkDraft || {}; S.c.bkDraft[k] = { key: k, berkas_id: id, nama: E.nama, mapel_id: E.mapel, kelas_ids: E.kelas, jenis: E.jenis, pembuat_id: me().user_id, pembuat: me().nama, t: now() };
          close(); go('g-berkas', { k }, b ? { replace: true } : {}); return;
        }
        const btn = $('#bfSave', el); btnBusy(btn, true, 'Menyimpan…');
        call('berkas.save', { berkas_id: b.berkas_id, soal_ids: b.berkas_id ? [] : b.soal.map((s) => s.soal_id), nama_berkas: E.nama, kelas_ids: E.kelas, jenis: E.jenis, mapel_id: E.mapel }).then((r) => {
          bkApply(r.soal); close(); toast('Info berkas disimpan.', 'ok'); go('g-berkas', { k: 'B:' + r.berkas_id }, { replace: true });
        }).catch((e) => { btnBusy(btn, false); failToast(e); });
      };
    } });
}
function delBerkas(key) {
  const b = bkFind(key); if (!b || srvOld('2.4.0', 'Berkas soal')) return;
  if (b.draft) { delete S.c.bkDraft[key]; go('g-bank', {}, { replace: true }); return; }
  confirmBox(`Hapus berkas <b>${esc(b.nama)}</b> beserta <b>${b.soal.length} soal</b> di dalamnya? Tindakan ini tidak bisa dibatalkan.`, { danger: true, yes: 'Hapus Berkas', title: 'Hapus berkas soal?' }).then((ok) => {
    if (!ok) return;
    call('berkas.delete', b.berkas_id ? { berkas_id: b.berkas_id } : { soal_ids: b.soal.map((s) => s.soal_id) }).then(() => {
      const del = {}; b.soal.forEach((s) => { del[s.soal_id] = 1; }); S.c.soal.d = S.c.soal.d.filter((s) => !del[s.soal_id]);
      toast('Berkas dihapus.', 'ok'); go('g-bank', {}, { replace: true });
    }).catch(failToast);
  });
}
function berkasAddSoal(key) { const b = bkFind(key); if (!b || srvOld('2.4.0', 'Berkas soal')) return; (b.draft ? Promise.resolve(b) : bkEnsure(b)).then((x) => openSoalEditor(null, null, x)).catch(failToast); }
function berkasImport(key) { const b = bkFind(key); if (!b || srvOld('2.4.0', 'Berkas soal')) return; (b.draft ? Promise.resolve(b) : bkEnsure(b)).then((x) => { S.c.imp = null; go('g-import', { k: x.key }); }).catch(failToast); }
/** Unduh berkas sebagai Excel (format sama dengan template import, bisa diimpor ulang). */
function exportBerkas(key) {
  const b = bkFind(key); if (!b) return;
  const rows = b.soal.map((s) => {
    const o = s.opsi || {}, k = s.kunci;
    if (s.tipe === 'KATEGORI') return ['KATEGORI', [s.teks].concat(o.pernyataan || []).join(' | '), ...(o.kategori || []).concat(['', '', '', '', '']).slice(0, 5), (k || []).join(' | '), s.skor_maks, s.mode_skor, s.gambar_url || ''];
    if (s.tipe === 'ESAI') return ['ESAI', s.teks, o.rubrik || '', '', '', '', '', (k && k.acuan) || '', s.skor_maks, '', s.gambar_url || ''];
    return [s.tipe, s.teks, o.A || '', o.B || '', o.C || '', o.D || '', o.E || '', Array.isArray(k) ? k.join(', ') : k || '', s.skor_maks, s.mode_skor, s.gambar_url || ''];
  });
  exportXlsx(('Berkas_' + b.nama).replace(/[^\w]+/g, '_').slice(0, 60), [{ name: 'Soal', rows: [IMPORT_COLS].concat(rows) },
    { name: 'Info', rows: [['Nama berkas', b.nama], ['Mapel', mapelNm(b.mapel_id)], ['Jenis', JENIS_BK[b.jenis || '']], ['Kelas', b.kelas_ids.map(kelasNm).join(', ')], ['Guru', b.pembuat || ''], ['Jumlah soal', b.soal.length]] }]);
}
function openSoalEditor(id, base, bk) {
  const list = (S.c.soal && S.c.soal.d) || [];
  const s = base || (id ? list.find((x) => x.soal_id === id) : null) || { tipe: 'PG', skor_maks: 10, mode_skor: 'PROPORSIONAL', opsi: { A: '', B: '', C: '', D: '', E: '' }, kunci: '', mapel_id: bk ? bk.mapel_id : (G().penugasan[0] || {}).mapel_id };
  if (!bk && base && base.berkas_id) bk = bkFind('B:' + base.berkas_id);
  const bkNew = !(id && !base) && bk ? bkInfo(bk) : null;
  const E = S.c.sEd = { id: base ? null : id, tipe: s.tipe, gambar: s.gambar || '', kat: (s.opsi && s.opsi.kategori) || ['Benar', 'Salah'], pern: (s.opsi && s.opsi.pernyataan) || ['', ''], kunciK: s.tipe === 'KATEGORI' ? (s.kunci || []) : [], s };
  const mapels = uniqBy(G().penugasan, (x) => x.mapel_id).map((x) => x.mapel_id);
  if (hasRole('ADMIN')) (B().mapel || []).forEach((m) => { if (mapels.indexOf(m.mapel_id) < 0) mapels.push(m.mapel_id); });
  sheet({ title: id && !base ? 'Detail & Edit Soal' : 'Soal Baru', icon: 'list-check', size: 'drawer', body: `<form id="sForm" class="col g16" onsubmit="return false">
      ${bkNew ? `<div class="info-tile">${I('file-text', 'ink-p')}<div class="f1 small">Disimpan ke berkas <b>${esc(bkNew.nama_berkas)}</b></div></div>` : ''}
      <div class="field"><label class="label">Mata pelajaran</label><select class="select" name="mapel_id" ${bkNew ? 'disabled' : ''}>${mapels.concat(bkNew && mapels.indexOf(s.mapel_id) < 0 ? [s.mapel_id] : []).map((m) => `<option value="${m}" ${s.mapel_id === m ? 'selected' : ''}>${esc(mapelNm(m))}</option>`).join('')}</select></div>
      <div class="field"><label class="label">Tipe soal</label><div class="seg w100" id="sTipe">${Object.keys(TIPE_SOAL).map((k) => `<button type="button" data-v="${k}" class="${s.tipe === k ? 'on' : ''}">${k === 'KATEGORI' ? 'Kategori' : k === 'MCMA' ? 'MCMA' : k === 'PG' ? 'PG' : 'Esai'}</button>`).join('')}</div></div>
      <div class="field"><label class="label">Teks pertanyaan <span class="req">*</span></label><textarea class="textarea" name="teks" style="min-height:140px" placeholder="Tulis soal. Rumus bisa ditulis biasa, mis. F = m · a">${esc(s.teks || '')}</textarea></div>
      <div class="field"><label class="label">Gambar / stimulus (opsional)</label><div id="sImg"></div></div>
      <div id="sBody"></div>
      <div class="form-grid c2"><div class="field"><label class="label">Skor maksimal</label><input class="input" type="number" name="skor_maks" min="0.5" max="100" step="0.5" value="${esc(s.skor_maks)}"></div>
        <div class="field" id="sMode"><label class="label">Mode penilaian</label><select class="select" name="mode_skor"><option value="PROPORSIONAL" ${s.mode_skor !== 'SEMUA' ? 'selected' : ''}>Proporsional (skor parsial)</option><option value="SEMUA" ${s.mode_skor === 'SEMUA' ? 'selected' : ''}>Semua benar baru dapat skor</option></select></div></div>
    </form>`, foot: `${id && !base ? `<button class="btn btn-danger-o" onclick="delSoal('${id}')">${I('trash')}</button>` : ''}<button class="btn btn-secondary" data-x2>Batal</button><button class="btn btn-primary" id="sSave">${I('check')}Simpan Soal</button>`,
  mount: (el, close) => {
    el.querySelector('[data-x2]').onclick = close;
    const f = $('#sForm', el);
    const drawBody = () => {
      const t = E.tipe, op = (E.s.tipe === t ? E.s.opsi : null) || {}, ku = E.s.tipe === t ? E.s.kunci : null;
      $('#sMode', el).hidden = t === 'PG' || t === 'ESAI';
      if (t === 'PG' || t === 'MCMA') $('#sBody', el).innerHTML = `<div class="field"><label class="label">Pilihan jawaban & kunci ${t === 'MCMA' ? '(boleh lebih dari satu)' : ''}</label><div class="col g8">${['A', 'B', 'C', 'D', 'E'].map((L) => `<div class="flex items-c g8"><label class="flex items-c g6" title="Tandai sebagai kunci"><input type="${t === 'PG' ? 'radio' : 'checkbox'}" name="kunci" value="${L}" ${(t === 'PG' ? ku === L : (ku || []).indexOf(L) >= 0) ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--ok)"><span class="mono bold" style="width:16px">${L}</span></label><input class="input" name="opsi_${L}" placeholder="Pilihan ${L}${L > 'B' ? ' (opsional)' : ''}" value="${esc(op[L] || '')}"></div>`).join('')}</div><div class="help">Centang lingkaran/kotak di kiri untuk menandai kunci jawaban.</div></div>`;
      else if (t === 'KATEGORI') {
        $('#sBody', el).innerHTML = `<div class="field"><label class="label">Label kategori</label><input class="input" id="katIn" value="${esc(E.kat.join(', '))}" placeholder="Benar, Salah"><div class="help">Pisahkan dengan koma, mis. Benar, Salah atau Sesuai, Tidak Sesuai.</div></div>
          <div class="field"><label class="label">Pernyataan & kunci</label><div class="col g8" id="pernBox">${E.pern.map((p2, i) => `<div class="flex g8 items-c"><input class="input f1" data-pern="${i}" value="${esc(p2)}" placeholder="Pernyataan ${i + 1}"><select class="select" data-kun="${i}" style="width:130px">${E.kat.map((k) => `<option ${E.kunciK[i] === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select><button type="button" class="icon-btn" data-delp="${i}">${I('x')}</button></div>`).join('')}</div>
          <button type="button" class="btn btn-ghost btn-sm mt8" id="addPern">${I('plus', 'ic-sm')}Tambah pernyataan</button></div>`;
        const sync = () => { E.pern = $$('[data-pern]', el).map((x) => x.value); E.kunciK = $$('[data-kun]', el).map((x) => x.value); };
        $('#katIn', el).onchange = () => { sync(); E.kat = $('#katIn', el).value.split(',').map((x) => x.trim()).filter(Boolean); drawBody(); };
        $('#addPern', el).onclick = () => { sync(); E.pern.push(''); drawBody(); };
        $$('[data-delp]', el).forEach((b) => b.onclick = () => { sync(); E.pern.splice(+b.dataset.delp, 1); E.kunciK.splice(+b.dataset.delp, 1); drawBody(); });
        $('#pernBox', el).oninput = sync; $('#pernBox', el).onchange = sync;
      } else $('#sBody', el).innerHTML = `<div class="field"><label class="label">Rubrik penilaian</label><textarea class="textarea" name="rubrik" placeholder="Kriteria skor penuh, sebagian, dan nol…">${esc((op && op.rubrik) || '')}</textarea></div><div class="field"><label class="label">Acuan jawaban</label><textarea class="textarea" name="acuan" placeholder="Contoh jawaban ideal untuk korektor…">${esc((ku && ku.acuan) || '')}</textarea></div>`;
    };
    const drawImg = () => { $('#sImg', el).innerHTML = E.gambar ? `<div class="file-chip"><img src="${esc(soalImgSrc(driveImg(E.gambar, 400), E.gambar))}" data-fid="${esc(/^https?:/.test(E.gambar) ? '' : E.gambar)}" onerror="imgFb(this)" style="width:64px;height:48px;object-fit:cover;border-radius:8px" alt=""><div class="f1 small bold">Gambar terpasang</div><button type="button" class="icon-btn" id="imgDel">${I('x')}</button></div>` : `<label class="upload" style="padding:14px">${I('image')}<span class="bold small"> Unggah gambar</span><input type="file" hidden accept="image/*" id="imgIn"></label>`;
      const del = $('#imgDel', el); if (del) del.onclick = () => { E.gambar = ''; drawImg(); };
      const inp = $('#imgIn', el); if (inp) inp.onchange = () => { const file = inp.files[0]; if (!file) return; $('#sImg', el).innerHTML = `<div class="file-chip"><div class="tile">${I('image')}</div><div class="f1"><div class="small bold">Mengunggah…</div><div class="prog"><i></i></div></div></div>`; uploadFile(file, 'soal').then((r) => { E.gambar = r.file_id; drawImg(); }).catch((e) => { failToast(e); drawImg(); }); };
    };
    drawBody(); drawImg();
    $('#sTipe', el).onclick = (e) => { const b = e.target.closest('button'); if (!b) return; E.tipe = b.dataset.v; $$('#sTipe button', el).forEach((x) => x.classList.toggle('on', x === b)); drawBody(); };
    $('#sSave', el).onclick = () => {
      const d = formData(f), t = E.tipe, p2 = { soal_id: E.id, mapel_id: bkNew ? s.mapel_id : d.mapel_id, tipe: t, teks: d.teks, skor_maks: num(d.skor_maks), mode_skor: d.mode_skor, gambar: E.gambar };
      if (bkNew) p2.berkas = bkNew;
      if (t === 'PG' || t === 'MCMA') { p2.opsi = {}; ['A', 'B', 'C', 'D', 'E'].forEach((L) => { p2.opsi[L] = d['opsi_' + L]; }); p2.kunci = t === 'PG' ? d.kunci : $$('[name=kunci]:checked', el).map((x) => x.value); }
      else if (t === 'KATEGORI') { E.pern = $$('[data-pern]', el).map((x) => x.value); E.kunciK = $$('[data-kun]', el).map((x) => x.value); p2.opsi = { kategori: E.kat, pernyataan: E.pern.filter((x) => x.trim()) }; p2.kunci = E.kunciK.slice(0, p2.opsi.pernyataan.length); }
      else { p2.opsi = { rubrik: d.rubrik }; p2.kunci = { acuan: d.acuan }; }
      if (!String(p2.teks).trim()) { toast('Teks soal wajib diisi.', 'warn'); return; }
      const btn = $('#sSave', el); btnBusy(btn, true, 'Menyimpan…');
      call('soal.save', p2).then((r) => {
        const l = S.c.soal && S.c.soal.d; if (l) { const i = l.findIndex((x) => x.soal_id === r.soal_id); if (i >= 0) l[i] = r; else l.unshift(r); }
        if (r.berkas_id && S.c.bkDraft) delete S.c.bkDraft['B:' + r.berkas_id];
        close(); toast('Soal tersimpan.', 'ok'); rerender();
      }).catch((e) => { btnBusy(btn, false); failToast(e); });
    };
  } });
}
function dupSoal(id) { const s = ((S.c.soal && S.c.soal.d) || []).find((x) => x.soal_id === id); if (s) openSoalEditor(null, Object.assign({}, s, { soal_id: null, teks: s.teks + ' (salinan)' })); }
function delSoal(id) {
  confirmBox('Hapus soal ini dari bank soal?', { danger: true, yes: 'Hapus' }).then((ok) => {
    if (!ok) return; const l = S.c.soal.d, bak = l.slice(); S.c.soal.d = l.filter((x) => x.soal_id !== id); closeAllSheets(); rerender();
    call('soal.delete', { soal_id: id }).then(() => toast('Soal dihapus.', 'ok')).catch((e) => { S.c.soal.d = bak; rerender(); failToast(e); });
  });
}

// ── Import soal (wizard 3 langkah) ──
const IMPORT_COLS = ['tipe', 'soal', 'opsi_A', 'opsi_B', 'opsi_C', 'opsi_D', 'opsi_E', 'kunci', 'skor', 'mode_skor', 'gambar'];
route('g-import', {
  title: 'Import Soal', roles: ['GURU', 'ADMIN'], back: 'g-bank', nav: 'g-bank',
  render(p) {
    const list = soalList(); if (!list) return skelPage();
    const W = S.c.imp || (S.c.imp = { step: 1, mapel: (G().penugasan[0] || {}).mapel_id, items: null, res: null, file: '', extra: {}, warn: [], bk: { mode: p.k ? 'ada' : 'baru', key: p.k || '', nama: '', jenis: 'UTS', kelas: [] } });
    const mapels = bkMapelOpts(); if (!W.mapel) W.mapel = mapels[0];
    const mine = berkasList(list).filter((b) => hasRole('ADMIN') || b.pembuat_id === me().user_id), BK = W.bk;
    const tgt = BK.mode === 'ada' ? mine.find((b) => b.key === BK.key) : null;
    if (tgt) W.mapel = tgt.mapel_id;
    const kOpts = bkKelasOpts(W.mapel);
    const step = (n, t) => `<div class="card" style="padding:14px 16px;flex:1;min-width:200px;${W.step === n ? 'background:var(--p600);color:#fff;border-color:var(--p600)' : W.step > n ? 'background:var(--ok-t);border-color:rgba(22,163,74,.3)' : ''}"><div class="flex items-c g12"><span class="tile sm" style="${W.step === n ? 'background:#fff;color:var(--p600)' : W.step > n ? 'background:var(--ok);color:#fff' : ''}">${W.step > n ? I('check') : n}</span><div><div class="xs bold upper" style="opacity:.8">Langkah ${n}${W.step === n ? ' (aktif)' : ''}</div><div class="bold">${t}</div></div></div></div>`;
    const res = W.res, nImg = res ? res.valid.filter((v) => (W.items[v.i] || {}).img).length : 0, nExtra = Object.keys(W.extra || {}).length;
    const thumb = (it) => it && it.img ? `<img class="imp-thumb" src="${impThumb(it)}" alt="" onclick="event.stopPropagation();impZoom(${W.items.indexOf(it)})">` : it && it.imgErr ? `<span class="xs ink-warn" title="${esc(it.imgErr)}">${I('alert', 'ic-sm')} gambar dilewati</span>` : '<span class="xs muted">—</span>';
    return `<div class="page"><button class="back-link" onclick="back('g-bank')">${I('arrow-l', 'ic-sm')}Kembali ke Bank Soal</button>
      <div class="page-hd"><div><h1>Import Butir Soal</h1><p class="sub">Impor soal dari Word (.docx), Excel (.xlsx/.csv), atau Google Sheets, lengkap dengan gambar soal.</p></div></div>
      <div class="flex g12 wrap">${step(1, 'Unduh Template')}${step(2, 'Unggah Berkas')}${step(3, 'Pratinjau & Simpan')}</div>
      <div class="split mt16"><div class="col g16">
        <div class="card card-p"><h3>${I('upload', 'ink-p')} Unggah berkas soal</h3>
          <div class="field mt12"><label class="label">Simpan ke berkas</label><div class="seg w100">${[['baru', 'Berkas baru'], ['ada', 'Berkas yang sudah ada']].map((x) => `<button type="button" class="${BK.mode === x[0] ? 'on' : ''}" onclick="S.c.imp.bk.mode='${x[0]}';rerender()" ${x[0] === 'ada' && !mine.length ? 'disabled' : ''}>${x[1]}</button>`).join('')}</div></div>
          ${BK.mode === 'ada' ? `<div class="field mt12"><label class="label">Pilih berkas</label><select class="select" onchange="S.c.imp.bk.key=this.value;S.c.imp.res=null;rerender()"><option value="">— pilih berkas —</option>${mine.map((b) => `<option value="${b.key}" ${BK.key === b.key ? 'selected' : ''}>${esc(b.nama)} — ${esc(mapelNm(b.mapel_id))} (${b.soal.length} soal)</option>`).join('')}</select>${tgt ? `<div class="bk-kls mt8">${bkJenisPill(tgt.jenis)}${bkKelas(tgt.kelas_ids, 8)}</div>` : ''}</div>`
          : `<div class="field mt12"><label class="label">Nama berkas <span class="req">*</span></label><input class="input" value="${esc(BK.nama)}" placeholder="Contoh: PTS Ganjil B. Inggris Kelas XII" oninput="S.c.imp.bk.nama=this.value"></div>
          <div class="form-grid c2 mt12"><div class="field"><label class="label">Mapel</label><select class="select" onchange="S.c.imp.mapel=this.value;S.c.imp.bk.kelas=[];S.c.imp.res=null;rerender()">${mapels.map((m) => `<option value="${m}" ${W.mapel === m ? 'selected' : ''}>${esc(mapelNm(m))}</option>`).join('')}</select></div>
            <div class="field"><label class="label">Jenis penilaian</label><select class="select" onchange="S.c.imp.bk.jenis=this.value">${JENIS_BK_L.map((x) => `<option value="${x[0]}" ${BK.jenis === x[0] ? 'selected' : ''}>${x[1]}</option>`).join('')}</select></div></div>
          <div class="field mt12"><label class="label">Untuk kelas</label><div class="chips">${kOpts.map((k) => `<button type="button" class="chip ${BK.kelas.indexOf(k) >= 0 ? 'sel-o' : ''}" onclick="impKelas('${k}')">${BK.kelas.indexOf(k) >= 0 ? I('check', 'ic-sm') : ''}${esc(kelasShort(k))}</button>`).join('') || '<span class="small muted">Tidak ada kelas.</span>'}</div></div>`}
          <label class="upload mt12" id="impDrop">${I('file-text', 'ic-lg')}<div class="bold mt8">${W.file ? esc(W.file) : 'Pilih berkas Word (.docx) atau Excel (.xlsx, .csv)'}</div><div class="small muted">Gambar yang ditempel di dalam berkas ikut terbaca</div><input type="file" hidden accept=".docx,.xlsx,.xls,.csv" onchange="impFile(this.files[0]);this.value=''"></label>
          <label class="btn btn-ghost btn-sm mt8" style="cursor:pointer">${I('image', 'ic-sm')}${nExtra ? nExtra + ' gambar tambahan dipilih' : 'Gambar terpisah (opsional)'}<input type="file" hidden accept="image/png,image/jpeg,image/gif,image/webp" multiple onchange="impExtra(this.files);this.value=''"></label>
          <p class="help">Pakai "gambar terpisah" bila kolom <b>gambar</b> di Excel berisi nama berkas, misalnya <span class="mono">grafik1.png</span>.</p>
          <div class="or">atau</div>
          <div class="flex g8"><div class="input-ic f1">${I('link')}<input class="input" id="impUrl" placeholder="Tempel tautan Google Sheet"></div><button class="btn btn-secondary" onclick="impSheet()">Proses</button></div>
          <p class="help mt8">Sheet harus dibagikan "Siapa pun yang memiliki link dapat melihat".</p></div>
        ${W.busy ? `<div class="card card-p">${skel(16, '40%')}<p class="small muted mt12">${esc(W.busy)}</p></div>` : ''}
        ${W.warn && W.warn.length ? `<div class="banner banner-warn">${I('alert')}<div class="f1 small">${W.warn.slice(0, 6).map(esc).join('<br>')}${W.warn.length > 6 ? '<br>…' : ''}</div></div>` : ''}
        ${res ? `<div class="card"><div class="card-hd" style="flex-wrap:wrap"><div class="flex items-c g12"><div class="tile">${I('chart')}</div><div><h3>Hasil Validasi: ${res.total} Soal Dideteksi</h3><p class="small muted">Sistem memeriksa kunci jawaban, skor, struktur pilihan, dan gambar.</p></div></div>
            <div class="flex g8 wrap">${pill(res.valid.length + ' siap impor', 'ok', 'check-c')}${nImg ? pill(nImg + ' bergambar', 'info', 'image') : ''}${res.errors.length ? pill(res.errors.length + ' perlu diperbaiki', 'err', 'alert-c') : ''}</div></div>
          <div class="tbl-wrap" style="max-height:520px"><table class="tbl compact"><thead><tr><th>Asal</th><th>Tipe</th><th>Pratinjau</th><th>Gambar</th><th>Kunci</th><th class="n">Skor</th><th>Status</th></tr></thead><tbody>
            ${res.all.map((r) => { const it = W.items[r.i] || {}; return r.err ? `<tr class="row-err"><td class="xs mono">${esc(it.ref || '#' + (r.i + 2))}</td><td>${esc((it.row || {}).tipe || '-')}</td><td class="small">${esc(String((it.row || {}).soal || '').slice(0, 90))}</td><td>${thumb(it)}</td><td class="mono">${esc((it.row || {}).kunci || 'KOSONG')}</td><td class="n mono">${esc((it.row || {}).skor || '')}</td><td class="small ink-err">${I('alert', 'ic-sm')} ${esc(r.err)}</td></tr>`
              : `<tr><td class="xs mono">${esc(it.ref || '#' + (r.i + 2))}</td><td>${pill(r.tipe, r.tipe === 'ESAI' ? 'vio' : 'info')}</td><td class="small">${esc(r.teks)}</td><td>${thumb(it)}</td><td class="mono small">${esc(fmtKunci(r.kunci))}</td><td class="n mono">${fmtN(r.skor)}</td><td>${pill('Valid', 'ok', 'check')}</td></tr>`; }).join('')}</tbody></table></div></div>` : ''}
      </div><div class="col g16"><div class="card card-p"><h3>${I('download', 'ink-p')} Template Resmi</h3>
          <p class="small tx2 mt8"><b>Word</b>: ketik soal seperti lembar ujian biasa — nomor, pilihan A–E, lalu baris <span class="mono">KUNCI: B</span>. Gambar cukup ditempel di bawah teks soal.</p>
          <a class="btn btn-secondary btn-block mt12" href="templates/template-soal-cbt.docx" download onclick="S.c.imp.step=Math.max(S.c.imp.step,2);setTimeout(rerender,50)">${I('file-text')}Template Word (.docx)</a>
          <p class="small tx2 mt16"><b>Excel</b>: satu baris = satu soal. Kolom: <span class="mono xs">${IMPORT_COLS.join(', ')}</span>. Gambar ditempel di kolom <b>gambar</b> pada baris soalnya.</p>
          <a class="btn btn-secondary btn-block mt12" href="templates/template-soal-cbt.xlsx" download onclick="S.c.imp.step=Math.max(S.c.imp.step,2);setTimeout(rerender,50)">${I('table')}Template Excel (.xlsx)</a>
          <ul class="small tx2" style="padding-left:18px;margin:14px 0 0;line-height:1.8"><li><b>Tipe</b>: PG, MCMA (PG kompleks), KATEGORI (benar–salah), ESAI</li><li>Kunci MCMA: <span class="mono">A, C</span> · benar–salah: <span class="mono">Benar, Salah</span></li><li>Gambar otomatis diperkecil & disimpan di Drive sekolah</li><li>Format gambar: PNG atau JPG, satu gambar per soal</li><li><b>Paragraf baru</b> di Excel: tekan <b>Alt+Enter</b> di dalam sel, atau tekan Enter lalu lanjutkan mengetik di sel bawahnya dengan kolom tipe & kunci dikosongkan — otomatis digabung jadi satu soal</li></ul></div>
        <div class="card card-p"><div class="flex items-c g8">${I('shield', 'ink-ok')}<b>Proteksi integritas</b></div><p class="small tx2 mt8">Soal bermasalah dilewati otomatis sehingga tidak masuk ke bank soal. Perbaiki di berkas lalu unggah ulang.</p></div></div></div>
      ${res && res.valid.length ? `<div class="sticky-bar"><span class="small muted f1">${res.valid.length} soal valid${nImg ? ' (' + nImg + ' bergambar)' : ''} akan disimpan ke berkas <b>${esc(tgt ? tgt.nama : BK.nama || '(isi nama berkas)')}</b> · ${esc(mapelNm(W.mapel))}.</span><button class="btn btn-ghost" onclick="S.c.imp=null;rerender()">Batal / Unggah Ulang</button><button class="btn btn-primary btn-lg" id="impSave" onclick="impSave()">${I('cloud-ok')}Simpan ${res.valid.length} Soal ke Bank Soal${I('arrow-r')}</button></div>` : ''}</div>`;
  }
});
function fmtKunci(k) { try { const v = typeof k === 'string' ? JSON.parse(k) : k; return Array.isArray(v) ? v.join(v.some((x) => String(x).length > 1) ? ' | ' : ',') : v && v.acuan !== undefined ? 'Rubrik guru' : String(v); } catch (e) { return String(k); } }
function impThumb(it) { if (!it.thumb) it.thumb = URL.createObjectURL(it.img); return it.thumb; }
function impZoom(i) { const it = S.c.imp.items[i]; if (!it || !it.img) return; sheet({ title: esc(it.ref || 'Gambar soal'), size: 'wide', body: `<img src="${impThumb(it)}" alt="" style="width:100%;border-radius:12px;background:#fff">` }); }
/** Baca berkas: Word & Excel memakai pembaca bawaan (dengan gambar); CSV/XLS lama lewat pembaca tabel. */
function impKelas(k) { const K = S.c.imp.bk.kelas, i = K.indexOf(k); if (i >= 0) K.splice(i, 1); else K.push(k); rerender(); }
async function impFile(file) {
  if (!file) return;
  const W = S.c.imp; W.file = file.name;
  if (W.bk.mode === 'baru' && !W.bk.nama.trim()) W.bk.nama = file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim().slice(0, 150); W.res = null; W.warn = []; W.busy = 'Membaca berkas ' + file.name + '…'; rerender();
  try {
    let parsed;
    if (/\.docx$/i.test(file.name)) parsed = await parseDocxSoal(file);
    else if (/\.xlsx$/i.test(file.name)) parsed = await parseXlsxSoal(file);
    else if (/\.doc$/i.test(file.name)) throw new Error('Format .doc lama tidak didukung. Buka di Word lalu simpan sebagai .docx.');
    else { const rows = await readSheetFile(file); parsed = { items: rowsToObjs(rows).map((o, i) => ({ row: impNormKeys(o), ref: 'Baris ' + (i + 2) })), warnings: [] }; }
    W.busy = ''; impSetItems(parsed);
  } catch (e) { W.busy = ''; rerender(); failToast(e); }
}
function impNormKeys(o) { const n = {}; Object.keys(o).forEach((k) => { n[k.replace(/^opsi_([a-e])$/, (m, l) => 'opsi_' + l.toUpperCase())] = o[k]; }); return n; }
/** Gambar terpisah: dicocokkan dengan nama berkas di kolom gambar/url_gambar. */
function impExtra(files) {
  const W = S.c.imp; W.extra = W.extra || {};
  Array.from(files || []).forEach((f) => { W.extra[f.name.toLowerCase()] = f; });
  if (W.items) impSetItems({ items: W.items, warnings: W.warn }); else rerender();
}
function impSheet() { const url = $('#impUrl').value.trim(); if (!url) return; call('sheet.read', { url }).then((r) => { S.c.imp.file = 'Google Sheet'; impSetItems({ items: rowsToObjs(r.rows).map((o, i) => ({ row: impNormKeys(o), ref: 'Baris ' + (i + 2) })), warnings: [] }); }).catch(failToast); }
/**
 * Baris lanjutan: di Excel/Google Sheets tombol Enter memindahkan kursor ke sel di bawahnya. Baris tanpa tipe, kunci,
 * skor & mode_skor dianggap lanjutan soal di atasnya → isinya digabung sebagai paragraf baru (kolom yang sama).
 */
function impMergeLanjutan(items) {
  const isi = (v) => String(v == null ? '' : v).trim() !== '', IMG_COL = ['gambar', 'url_gambar', 'gambar_id'];
  if (!items.some((it) => isi(it.row.tipe))) return { items, n: 0 };   // berkas tanpa kolom tipe: dibiarkan apa adanya
  const out = []; let n = 0;
  items.forEach((it) => {
    const r = it.row, prev = out[out.length - 1];
    if (prev && !isi(r.tipe) && !isi(r.kunci) && !isi(r.skor) && !isi(r.mode_skor)) {
      Object.keys(r).forEach((k) => {
        if (!isi(r[k])) return;
        const v = String(r[k]).trim();
        if (IMG_COL.indexOf(k) >= 0) { if (!prev.img && !isi(prev.row[k])) prev.row[k] = v; return; }
        prev.row[k] = isi(prev.row[k]) ? String(prev.row[k]).replace(/\s+$/, '') + '\n' + v : v;
      });
      if (it.img && !prev.img) { prev.img = it.img; prev.imgName = it.imgName; prev.imgErr = it.imgErr; }
      prev.ref = String(prev.ref || '') + '+' + String(it.ref || '').replace(/^Baris\s*/, '');
      n++; return;
    }
    out.push(it);
  });
  return { items: out, n };
}
function impSetItems(parsed) {
  const mg = impMergeLanjutan(parsed.items || []);
  if (mg.n) parsed = Object.assign({}, parsed, { items: mg.items, warnings: (parsed.warnings || []).concat([mg.n + ' baris lanjutan (kolom tipe & kunci kosong) digabung ke soal di atasnya sebagai paragraf baru.']) });
  const W = S.c.imp, items = (parsed.items || []).slice(0, 500), ex = W.extra || {};
  if (!items.length) { W.items = null; W.res = null; W.warn = parsed.warnings || []; rerender(); toast((parsed.warnings || [])[0] || 'Tidak ada soal yang terbaca dari berkas.', 'warn'); return; }
  items.forEach((it) => {
    const nm = String(it.row.gambar || it.row.url_gambar || '').trim(), key = nm.split(/[\\/]/).pop().toLowerCase();
    if (!it.img && /\.(png|jpe?g|gif|webp)$/i.test(key)) { if (ex[key]) { it.img = ex[key]; it.imgName = ex[key].name; it.imgErr = ''; } else it.imgErr = 'Berkas "' + nm + '" belum dipilih di "Gambar terpisah".'; }
  });
  W.items = items; W.warn = (parsed.warnings || []).concat((parsed.items || []).length > 500 ? ['Maksimal 500 soal per import; sisanya dilewati.'] : []);
  const rows = items.map(impRowOut);
  W.busy = 'Memeriksa ' + items.length + ' soal…'; rerender();
  call('soal.import', { mapel_id: W.mapel, rows, dry: true }).then((r) => {
    const all = []; r.valid.forEach((v) => all.push(v)); r.errors.forEach((e) => all.push({ i: e.i, err: e.msg })); all.sort(by('i'));
    W.busy = ''; W.res = { total: items.length, valid: r.valid, errors: r.errors, all }; W.step = 3; rerender();
  }).catch((e) => { W.busy = ''; rerender(); failToast(e); });
}
/** Baris untuk server: tanpa kolom bantu; bila gambar akan diunggah, nama berkas tidak dikirim sebagai tautan. */
function impRowOut(it, gid) {
  const r = Object.assign({}, it.row); Object.keys(r).forEach((k) => { if (k.charAt(0) === '_') delete r[k]; });
  if (it.img || /\.(png|jpe?g|gif|webp)$/i.test(String(r.gambar || r.url_gambar || ''))) { delete r.gambar; if (!/^https?:/.test(r.url_gambar || '')) delete r.url_gambar; }
  if (gid) r.gambar_id = gid;
  return r;
}
async function impSave() {
  const W = S.c.imp, btn = $('#impSave'), okIdx = {}; W.res.valid.forEach((v) => { okIdx[v.i] = 1; });
  if (srvOld('2.4.0', 'Import ke berkas soal')) return;
  let bk;
  if (W.bk.mode === 'ada') { const t = bkFind(W.bk.key); if (!t) { toast('Pilih berkas tujuan terlebih dahulu.', 'warn'); return; } bk = t; W.mapel = t.mapel_id; }
  else { if (!W.bk.nama.trim()) { toast('Isi nama berkas terlebih dahulu.', 'warn'); return; } bk = { berkas_id: bkId(), nama: W.bk.nama.trim(), kelas_ids: W.bk.kelas.slice(), jenis: W.bk.jenis, mapel_id: W.mapel }; }
  const sel = W.items.filter((it, i) => okIdx[i]), withImg = sel.filter((it) => it.img);
  btnBusy(btn, true, 'Menyiapkan…');
  try {
    const ids = withImg.length ? await uploadSoalImages(withImg, (n, tot) => btnLabel(btn, `Mengunggah gambar ${n}/${tot}…`)) : new Map();
    if (!bk.berkas_id && bk.soal) { btnLabel(btn, 'Menyiapkan berkas…'); bk = await bkEnsure(bk); }
    btnLabel(btn, 'Menyimpan soal…');
    const r = await call('soal.import', { mapel_id: W.mapel, rows: sel.map((it) => impRowOut(it, ids.get(it))), berkas: bkInfo(bk) });
    if (S.c.soal && S.c.soal.d) S.c.soal.d = r.soal.concat(S.c.soal.d);
    if (S.c.bkDraft) delete S.c.bkDraft['B:' + r.berkas_id];
    (W.items || []).forEach((it) => { if (it.thumb) URL.revokeObjectURL(it.thumb); });
    toast(r.inserted + ' soal masuk ke berkas "' + bk.nama + '"' + (ids.size ? ', ' + withImg.length + ' dengan gambar' : '') + '.', 'ok', 6000); S.c.imp = null; go('g-berkas', { k: 'B:' + r.berkas_id }, { replace: true });
  } catch (e) { btnBusy(btn, false); failToast(e); }
}

// ── Daftar ujian ──
route('g-ujian', {
  title: 'Ujian CBT', roles: ['GURU', 'ADMIN'],
  leave() { S.c.ujSel = null; },
  render(p) {
    const g = G(), tab = p.tab || 'semua', SEL = S.c.ujSel;
    const all = g.ulangan.slice().sort(by('buka', -1)), grp = { DRAF: [], JADWAL: [], AKTIF: [], SELESAI: [] };
    all.forEach((u) => grp[ulStatus(u).k].push(u));
    const list = tab === 'semua' ? all : grp[tab];
    const canDel = (u) => ulStatus(u).k !== 'AKTIF';
    const nSel = SEL ? Object.keys(SEL).length : 0;
    return `<div class="page"><div class="page-hd"><div><h1>Ujian CBT</h1><p class="sub">Susun ulangan dari bank soal, pantau langsung, koreksi esai, dan analisis hasil.</p></div><div class="flex g8 wrap"><button class="btn btn-secondary" onclick="go('g-bank')">${I('list-check')}Bank Soal</button><button class="btn btn-primary" onclick="go('g-ujian-form',{})">${I('plus')}Buat Ujian</button></div></div>
      <div class="flex items-c g8 wrap"><div class="tabs f1" style="min-width:0">${[['semua', 'Semua', all.length], ['AKTIF', 'Berlangsung', grp.AKTIF.length], ['JADWAL', 'Terjadwal', grp.JADWAL.length], ['DRAF', 'Draf', grp.DRAF.length], ['SELESAI', 'Selesai', grp.SELESAI.length]].map((t) => `<button class="tab ${tab === t[0] ? 'on' : ''}" onclick="go('g-ujian',{tab:'${t[0]}'},{replace:true})">${t[1]} <span class="badge ${t[0] === 'AKTIF' && t[2] ? 'p' : 'neu'}">${t[2]}</span></button>`).join('')}</div>
        ${list.some(canDel) ? `<button class="btn ${SEL ? 'btn-secondary' : 'btn-ghost'} btn-sm" onclick="S.c.ujSel=S.c.ujSel?null:{};rerender()">${I(SEL ? 'x' : 'checkbox', 'ic-sm')}${SEL ? 'Batal pilih' : 'Pilih & hapus'}</button>` : ''}</div>
      ${SEL ? `<div class="banner banner-info mt12">${I('info')}<div class="f1 small">Ketuk kartu ujian draf, terjadwal, atau selesai untuk memilih. Ujian yang sedang berlangsung tidak bisa dihapus.</div>${list.some(canDel) ? `<button class="btn btn-ghost btn-sm" onclick="ujSelAll(${JSON.stringify(list.filter(canDel).map((u) => u.ulangan_id)).replace(/"/g, '&quot;')})">Pilih semua (${list.filter(canDel).length})</button>` : ''}</div>` : ''}
      <div class="grid gc2 mt16">${list.map((u) => { const st = ulStatus(u), on = SEL && SEL[u.ulangan_id], selectable = SEL && canDel(u);
        return `<div class="card card-p uj-card ${on ? 'uj-on' : ''} ${SEL && !canDel(u) ? 'uj-dim' : ''}" ${selectable ? `onclick="ujToggle('${u.ulangan_id}')" role="button"` : ''}>${selectable ? `<span class="uj-chk">${on ? I('check', 'ic-sm') : ''}</span>` : ''}<div class="flex items-c g8 wrap"><span class="pill pill-p mono">${esc(JENIS_UL[u.jenis] || u.jenis)}</span>${pill(st.l, st.c, st.k === 'AKTIF' ? 'activity' : st.k === 'DRAF' ? 'edit' : 'calendar')}${u.koreksi ? pill(u.koreksi + ' perlu koreksi', 'vio', 'pen') : ''}<span class="ml-a mono small muted">${u.token ? I('key', 'ic-sm') + ' ' + esc(u.token) : 'Tanpa token'}</span></div>
          <h3 class="mt12" style="font-size:17px">${esc(u.judul)}</h3><p class="small muted mt4">${esc(mapelNm(u.mapel_id))} · Kelas ${u.kelas_ids.map(kelasShort).join(', ')} · ${u.jumlah_soal} soal · ${u.durasi_menit} menit</p>
          <p class="small tx2 mt8 flex items-c g6">${I('calendar', 'ic-sm')}${D.dt(u.buka)} – ${D.rel(u.tutup)}</p>
          <div class="flex items-c g8 mt12"><div class="f1"><div class="meter"><i style="width:${u.peserta ? u.selesai / u.peserta * 100 : 0}%"></i></div></div><span class="mono xs">${u.selesai}/${u.peserta} selesai</span></div>
          ${SEL ? '' : `<div class="flex g8 mt16 wrap">${st.k === 'AKTIF' ? `<button class="btn btn-primary btn-sm" onclick="go('g-monitor',{id:'${u.ulangan_id}'})">${I('monitor', 'ic-sm')}Monitor Live</button><button class="btn btn-ghost btn-sm ink-err" title="Akhiri ujian sekarang" onclick="finishUjian('${u.ulangan_id}')">${I('flag', 'ic-sm')}Selesaikan</button>` : ''}
            ${u.selesai ? `<button class="btn btn-secondary btn-sm" onclick="go('g-hasil',{id:'${u.ulangan_id}'})">${I('chart', 'ic-sm')}Hasil & Analisis</button>` : ''}${u.koreksi ? `<button class="btn btn-secondary btn-sm" onclick="go('g-koreksi',{id:'${u.ulangan_id}'})">${I('pen', 'ic-sm')}Koreksi Esai</button>` : ''}
            <button class="btn btn-ghost btn-sm" onclick="go('g-ujian-form',{id:'${u.ulangan_id}'})">${I('edit', 'ic-sm')}${st.k === 'DRAF' ? 'Lanjutkan' : 'Ubah'}</button>${canDel(u) ? `<button class="btn btn-ghost btn-sm ink-err ml-a" title="Hapus ujian" onclick="delUjian('${u.ulangan_id}')">${I('trash', 'ic-sm')}</button>` : ''}</div>`}</div>`; }).join('') || `<div class="card" style="grid-column:1/-1">${emptyState('exam', 'Belum ada ujian', 'Buat ujian CBT dari bank soal.', `<button class="btn btn-primary" onclick="go('g-ujian-form',{})">${I('plus')}Buat Ujian</button>`)}</div>`}</div>
      ${SEL && nSel ? `<div class="sticky-bar"><span class="small f1"><b>${nSel}</b> ujian dipilih</span><button class="btn btn-ghost" onclick="S.c.ujSel={};rerender()">Kosongkan</button><button class="btn btn-danger btn-lg" onclick="delUjian(Object.keys(S.c.ujSel))">${I('trash')}Hapus ${nSel} Ujian</button></div>` : ''}</div>`;
  }
});
function ujToggle(id) { const s = S.c.ujSel; if (!s) return; if (s[id]) delete s[id]; else s[id] = 1; rerender(); }
function ujSelAll(ids) { const s = S.c.ujSel || (S.c.ujSel = {}); const all = ids.every((id) => s[id]); ids.forEach((id) => { if (all) delete s[id]; else s[id] = 1; }); rerender(); }
/** Unduh rekap nilai sebuah ujian (Excel) sebelum dihapus. */
function dlHasil(id, btn) {
  if (btn) btnBusy(btn, true, 'Menyiapkan…');
  call('ulangan.results', { ulangan_id: id }).then((d) => { S.c['res_' + id] = { t: Date.now(), d }; exportHasil(id); if (btn) { btnBusy(btn, false); btn.innerHTML = I('check', 'ic-sm') + 'Terunduh'; } }).catch((e) => { if (btn) btnBusy(btn, false); failToast(e); });
}
/** Server (Apps Script) masih versi lama? Beri tahu cara memperbarui, jangan kirim permintaan yang pasti gagal. */
function srvOld(min, fitur) {
  const v = String(cfg().version || '0').split('.').map(Number), m = min.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((v[i] || 0) > m[i]) return false; if ((v[i] || 0) < m[i]) { toast(`${fitur} butuh server versi ${min} — server Anda masih versi ${cfg().version || '?'}. Ganti isi Kode.gs dengan versi terbaru lalu Terapkan → Kelola deployment → Versi baru.`, 'err', 9000); return true; } }
  return false;
}
/** Selesaikan ujian lebih awal: ujian ditutup, siswa yang sedang mengerjakan diberi 60 detik lalu jawabannya terkirim otomatis. */
function finishUjian(id) {
  const g = G(), u = g.ulangan.find((x) => x.ulangan_id === id) || (S.c['mon_' + id] && S.c['mon_' + id].d && S.c['mon_' + id].d.ulangan);
  if (!u || srvOld('2.4.1', 'Selesaikan ujian')) return;
  confirmBox(`Selesaikan <b>${esc(u.judul)}</b> sekarang, walau waktunya belum habis?<br><br>• Siswa yang <b>belum mulai</b> tidak bisa masuk lagi.<br>• Siswa yang <b>sedang mengerjakan</b> diberi waktu <b>60 detik</b>, lalu jawabannya terkirim dan dinilai otomatis.<br>• Jadwal bisa dibuka lagi lewat tombol <b>Ubah</b> bila perlu.`, { title: 'Selesaikan ujian?', icon: 'flag', yes: 'Selesaikan Sekarang', danger: true }).then((ok) => {
    if (!ok) return;
    const done = (r) => {
      const x = g.ulangan.find((y) => y.ulangan_id === id); if (x) { x.tutup = r.tutup; if (r.dikirim) x.selesai = Math.min(x.peserta || 1e9, (x.selesai || 0) + r.dikirim); }
      drop('mon_' + id); saveSnap(); rerender();
      toast('Ujian diselesaikan & ditutup' + (r.dikirim ? ' · ' + r.dikirim + ' jawaban siswa dikirim otomatis' : '') + '.', 'ok', 7000);
    };
    call('ulangan.finish', { ulangan_id: id }).then((r) => {
      if (!r.jeda) { done(r); return; }
      let left = r.jeda, sent = false;
      const sh = sheet({ title: 'Menyelesaikan ujian', icon: 'flag', locked: true, body: `<div class="tc" style="padding:8px 4px"><div class="mono b7" style="font-size:44px" id="finCd">0:${pad(left)}</div><p class="small tx2 mt8"><b>${r.mengerjakan} siswa</b> sedang mengerjakan. Perangkat mereka mengirim jawaban terakhir secara otomatis.</p><p class="xs muted mt8">Ujian sudah ditutup untuk siswa yang belum mulai.</p></div>`,
        foot: `<button class="btn btn-primary btn-block" id="finNow">${I('send')}Kirim semua sekarang</button>` });
      const finish = () => { if (sent) return; sent = true; clearInterval(tm); btnBusy($('#finNow', sh.el), true, 'Mengirim…');
        call('ulangan.finish', { ulangan_id: id, segera: true }).then((r2) => { sh.close(); done(r2); }).catch((e) => { sh.close(); failToast(e); }); };
      const tm = setInterval(() => { left--; const el = $('#finCd', sh.el); if (el) el.textContent = Math.floor(Math.max(0, left) / 60) + ':' + pad(Math.max(0, left) % 60); if (left <= -5) finish(); }, 1000);
      $('#finNow', sh.el).onclick = finish;
    }).catch(failToast);
  });
}
/** Hapus satu / beberapa ujian. Ujian yang sudah dikerjakan (selesai maupun baru dimulai): nilai ikut terhapus (dicadangkan otomatis ke Drive), wajib konfirmasi ketik HAPUS. */
function delUjian(ids) {
  ids = [].concat(ids); const g = G(), uls = ids.map((id) => g.ulangan.find((u) => u.ulangan_id === id)).filter(Boolean);
  if (!uls.length || srvOld('2.4.0', 'Hapus ujian')) return;
  const dikerjakan = (u) => Math.max(u.dimulai || 0, u.selesai || 0);
  const run = (hasil, close) => {
    const bak = g.ulangan.slice(), del = {}; uls.forEach((u) => { del[u.ulangan_id] = 1; });
    g.ulangan = g.ulangan.filter((u) => !del[u.ulangan_id]); S.c.ujSel = null; if (close) close(); rerender();
    call('ulangan.delete', { ulangan_id: uls[0].ulangan_id, ulangan_ids: uls.map((u) => u.ulangan_id), hapus_hasil: hasil }).then((r) => {
      toast((r && r.deleted || 1) + ' ujian dihapus' + (r && r.nilai ? ' · ' + r.nilai + ' nilai dicadangkan ke Drive (Cadangan › Ujian Terhapus)' : '') + '.', 'ok', 7000); drop('ud_'); saveSnap();
    }).catch((e) => {
      g.ulangan = bak; rerender();
      if (e.code === 'HAS_RESULT' && !hasil) askHasil(e.message); else failToast(e);
    });
  };
  // ujian yang sudah dikerjakan siswa → dialog khusus (nilai ikut terhapus)
  const askHasil = (note) => {
    const withRes = uls.filter((u) => dikerjakan(u) > 0), list = withRes.length ? withRes : uls;
    sheet({ title: 'Hapus ujian beserta nilai?', icon: 'trash', body: `<div class="col g12">
        <div class="banner banner-warn">${I('alert')}<div class="small">${note ? esc(note).replace(/Centang[^.]*\./, '') + ' ' : `<b>${withRes.length} ujian</b> sudah dikerjakan siswa (<b>${sum(withRes.map(dikerjakan))} siswa</b>). `}Nilai dan jawaban siswa beserta riwayat pelanggarannya ikut terhapus dari aplikasi (rapor & rekap nilai).</div></div>
        <div class="col g8">${list.map((u) => { const n = dikerjakan(u), b2 = n - (u.selesai || 0); return `<div class="info-tile"><div class="f1" style="min-width:0"><div class="small bold truncate">${esc(u.judul)}</div><div class="xs muted">${esc(mapelNm(u.mapel_id))}${n ? ' · ' + (u.selesai || 0) + ' selesai' + (b2 > 0 ? ' · ' + b2 + ' belum selesai' : '') : ''}</div></div>${u.selesai ? `<button type="button" class="btn btn-secondary btn-sm" onclick="dlHasil('${u.ulangan_id}',this)">${I('download', 'ic-sm')}Unduh nilai</button>` : ''}</div>`; }).join('')}</div>
        <p class="small tx2">${I('shield', 'ic-sm ink-ok')} Salinan nilai otomatis disimpan ke Google Drive sekolah (folder <b>Cadangan › Ujian Terhapus</b>). Soal di bank soal tidak ikut terhapus.</p>
        <div class="field"><label class="label">Ketik <b class="mono">HAPUS</b> untuk konfirmasi</label><input class="input mono" id="ujDelTxt" autocomplete="off" placeholder="HAPUS"></div></div>`,
      foot: `<button class="btn btn-secondary" data-x2>Batal</button><button class="btn btn-danger" id="ujDelGo" disabled>${I('trash')}Hapus Permanen</button>`,
      mount: (el, close) => { el.querySelector('[data-x2]').onclick = close; const inp = $('#ujDelTxt', el), go2 = $('#ujDelGo', el);
        inp.oninput = () => { go2.disabled = inp.value.trim().toUpperCase() !== 'HAPUS'; };
        go2.onclick = () => run(true, close); } });
  };
  const names = uls.slice(0, 3).map((u) => '<b>' + esc(u.judul) + '</b>').join(', ') + (uls.length > 3 ? ' dan ' + (uls.length - 3) + ' lainnya' : '');
  if (uls.some((u) => dikerjakan(u) > 0)) { askHasil(''); return; }
  confirmBox(`Hapus ${uls.length > 1 ? uls.length + ' ujian: ' : 'ujian '}${names}? Soal di bank soal tetap aman.`, { danger: true, yes: 'Hapus', title: 'Hapus ujian?' }).then((ok) => { if (ok) run(false); });
}

const VIOL_TXT = { PINDAH_TAB: 'meninggalkan halaman ujian (pindah tab/aplikasi).', KELUAR_LAYAR_PENUH: 'keluar dari layar penuh.', JENDELA_MENGAMBANG: 'membuka jendela/aplikasi lain (jendela mengambang, notifikasi, atau pencarian layar).', LAYAR_TERBAGI: 'membuka ujian di layar terbagi / jendela kecil.', TANGKAP_LAYAR: 'menekan tombol tangkapan layar.' };
// ── Form buat / ubah ujian ──
route('g-ujian-form', {
  title: (p) => p.id ? 'Ubah Ujian CBT' : 'Buat Ujian CBT', roles: ['GURU', 'ADMIN'], back: 'g-ujian', nav: 'g-ujian', form: true,
  render(p) {
    const bank = soalList(), det = p.id ? need('ud_' + p.id, 'ulangan.detail', { ulangan_id: p.id }, 10000) : null;
    if (!bank || (p.id && !det)) return skelPage();
    let U = S.c.uForm;
    const fk = p.id || (p.berkas ? 'bk:' + p.berkas : 'baru');
    if (!U || U.key !== fk) {
      const u = det ? det.ulangan : null, c = cfg(), d0 = D.day0(now()) + 864e5, bk = !u && p.berkas ? bkFind(p.berkas) : null;
      const [bh, bm] = String(B().admin && B().admin.settings ? B().admin.settings.jam_buka_default : '07:00').split(':').map(Number);
      const bkK = bk ? bk.kelas_ids.filter((k) => ujKelasOK(bk.mapel_id, k)) : [];
      U = S.c.uForm = { key: fk, id: p.id, terkunci: det ? det.terkunci : false,
        judul: u ? u.judul : bk ? bk.nama : '', jenis: u ? u.jenis : bk && JENIS_UL[bk.jenis] ? bk.jenis : 'UH', mapel_id: u ? u.mapel_id : bk ? bk.mapel_id : (G().penugasan[0] || {}).mapel_id, kelas_ids: u ? u.kelas_ids : bkK,
        buka: u ? u.buka : d0 + (bh || 7) * 3600000 + (bm || 0) * 60000, tutup: u ? u.tutup : d0 + 12 * 3600000, durasi: u ? u.durasi_menit : 90,
        pakai_token: u ? !!u.token : true, token: u ? u.token : '', acak_soal: u ? u.acak_soal : true, acak_opsi: u ? u.acak_opsi : true,
        tampilkan: u ? u.tampilkan_nilai : '', batas: u ? u.batas_pelanggaran : '', status: u ? u.status : 'DRAF',
        soal: det ? det.soal.map((s) => ({ soal_id: s.soal_id, bobot: s.bobot })) : bk ? bk.soal.map((s) => ({ soal_id: s.soal_id, bobot: s.skor_maks })) : [], mode: 'manual', acakN: 20 };
      if (!U.mapel_id) U.mapel_id = (bkMapelOpts()[0]) || '';
    }
    const bankBy = {}; bank.forEach((s) => { bankBy[s.soal_id] = s; });
    const KO = ujKelasOpts(U.mapel_id), kChip = (k) => `<button type="button" class="chip ${U.kelas_ids.indexOf(k) >= 0 ? 'sel-o' : ''}" onclick="uToggleKelas('${k}')">${U.kelas_ids.indexOf(k) >= 0 ? I('check', 'ic-sm') : ''}${esc(kelasShort(k))}${kelasBebas(k) && !hasRole('ADMIN') ? ' <span class="xs muted">(tanpa jadwal)</span>' : ''}</button>`;
    const mapels = uniqBy(G().penugasan, (x) => x.mapel_id); bkMapelOpts().concat([U.mapel_id]).forEach((m) => { if (m && !mapels.some((x) => x.mapel_id === m)) mapels.push({ mapel_id: m }); });
    const sel = U.soal.filter((s) => bankBy[s.soal_id]);
    const comp = { PG: [0, 0], MCMA: [0, 0], KATEGORI: [0, 0], ESAI: [0, 0] }; sel.forEach((s) => { const t = bankBy[s.soal_id].tipe; comp[t][0]++; comp[t][1] += num(s.bobot); });
    const totalBobot = sum(sel.map((s) => s.bobot));
    const sect = (n, t, body, ic) => `<div class="card card-p"><div class="flex items-c g12 mb16"><span class="q-no" style="height:28px">${n}</span><h3>${t}</h3>${ic || ''}</div>${body}</div>`;
    return `<div class="page"><button class="back-link" onclick="back('g-ujian')">${I('arrow-l', 'ic-sm')}Kembali ke Daftar Ujian CBT</button>
      <div class="page-hd"><div><h1>${p.id ? 'Ubah Paket & Jadwal Ujian' : 'Buat Paket & Jadwal Ujian CBT'}</h1><p class="sub">Konfigurasi jadwal pengerjaan, aturan anti-curang, dan komposisi butir soal.</p></div><div class="flex g8 items-c">${pill(U.status === 'TERBIT' ? 'Diterbitkan' : 'Draf belum diterbitkan', U.status === 'TERBIT' ? 'ok' : 'neu')}</div></div>
      ${U.terkunci ? `<div class="banner banner-warn mb16">${I('lock')}<div>Sudah ada siswa yang mengerjakan. Daftar soal terkunci; jadwal dan aturan masih bisa diubah.</div></div>` : ''}
      <div class="split s-r"><div class="col g16" id="uForm">
        ${sect(1, 'Identitas & Target Peserta', `<div class="col g16"><div class="field"><label class="label">Judul ujian <span class="req">*</span></label><input class="input" data-u="judul" value="${esc(U.judul)}" placeholder="Contoh: Penilaian Akhir Semester Fisika"></div>
          <div class="field"><label class="label">Jenis asesmen</label><div class="seg wrap" data-useg="jenis">${[['UH', 'UH / Harian'], ['UTS', 'PTS / Tengah Semester'], ['UAS', 'PAS / Akhir Semester'], ['LATIHAN', 'Latihan']].map((x) => `<button type="button" data-v="${x[0]}" class="${U.jenis === x[0] ? 'on' : ''}">${x[1]}</button>`).join('')}</div></div>
          <div class="form-grid c2"><div class="field"><label class="label">Mata pelajaran</label><select class="select" data-u="mapel_id" ${U.terkunci ? 'disabled' : ''}>${mapels.map((m) => `<option value="${m.mapel_id}" ${U.mapel_id === m.mapel_id ? 'selected' : ''}>${esc(mapelNm(m.mapel_id))}</option>`).join('')}</select></div>
          <div class="field"><label class="label">Kelas target <span class="req">*</span></label><div class="chips">${KO.pen.map(kChip).join('') || (KO.lain.length ? '' : '<span class="small muted">Tidak ada kelas untuk mapel ini.</span>')}</div>${KO.lain.length ? `${KO.pen.length ? `<div class="xs muted mt8">${hasRole('ADMIN') ? 'Kelas lain' : 'Kelas tanpa jadwal mengajar (mis. kelas simulasi)'}</div>` : ''}<div class="chips mt4">${KO.lain.map(kChip).join('')}</div>` : ''}</div></div></div>`)}
        ${sect(2, 'Jadwal & Durasi Pengerjaan', `<div class="form-grid c3"><div class="field"><label class="label">Waktu buka</label><input class="input" type="datetime-local" data-u="buka" value="${D.local(U.buka)}"><div class="help">Siswa bisa mulai sejak waktu ini</div></div>
          <div class="field"><label class="label">Waktu tutup</label><input class="input" type="datetime-local" data-u="tutup" value="${D.local(U.tutup)}"><div class="help">Batas akhir sesi susulan</div></div>
          <div class="field"><label class="label">Durasi (menit)</label><input class="input" type="number" min="5" max="600" data-u="durasi" value="${U.durasi}"><div class="help">Timer individu sejak klik Mulai</div></div></div>`, `<span class="ml-a xs muted">${I('clock', 'ic-sm')} Zona waktu perangkat ${TZL}</span>`)}
        ${sect(3, 'Keamanan & Integritas CBT', `<div>
          <div class="toggle-row"><div class="tile sm">${I('key')}</div><div class="f1"><b>Wajibkan token ujian</b><div class="small muted">Siswa memasukkan token dari pengawas ruang sebelum mulai.</div>${U.pakai_token ? `<div class="flex items-c g8 mt8"><span class="small">Token:</span><input class="input input-sm mono" style="width:130px" data-u="token" value="${esc(U.token)}" placeholder="otomatis" maxlength="6" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')"><button type="button" class="icon-btn" onclick="S.c.uForm.token=Math.random().toString(36).slice(2,8).toUpperCase();rerender()" title="Buat token">${I('refresh')}</button></div>` : ''}</div><label class="switch"><input type="checkbox" data-uc="pakai_token" ${U.pakai_token ? 'checked' : ''}><span></span></label></div>
          <div class="toggle-row"><div class="tile sm warn">${I('shield-alert')}</div><div class="f1"><b>Batas maksimal pelanggaran</b><div class="small muted">Deteksi keluar jendela / ganti tab. Ujian terkunci jika mencapai batas.</div></div><select class="select input-sm" style="width:190px" data-u="batas"><option value="">Ikuti global (${(B().admin && B().admin.settings && B().admin.settings.batas_pelanggaran) || 3})</option>${[1, 2, 3, 4, 5, 10].map((n) => `<option value="${n}" ${String(U.batas) === String(n) ? 'selected' : ''}>${n} kali</option>`).join('')}</select></div>
          <div class="toggle-row"><div class="tile sm">${I('maximize')}</div><div class="f1"><b>Layar penuh & blokir salin-tempel</b><div class="small muted">Selalu aktif untuk semua ujian CBT.</div></div>${pill('Aktif', 'ok')}</div></div>`)}
        ${sect(4, 'Aturan Pengerjaan & Tampilan Nilai', `<div>
          <div class="toggle-row"><div class="tile sm">${I('refresh')}</div><div class="f1"><b>Acak urutan soal</b><div class="small muted">Setiap peserta menerima urutan nomor soal berbeda.</div></div><label class="switch"><input type="checkbox" data-uc="acak_soal" ${U.acak_soal ? 'checked' : ''}><span></span></label></div>
          <div class="toggle-row"><div class="tile sm">${I('list')}</div><div class="f1"><b>Acak opsi pilihan (A–E)</b><div class="small muted">Urutan pilihan jawaban teracak otomatis.</div></div><label class="switch"><input type="checkbox" data-uc="acak_opsi" ${U.acak_opsi ? 'checked' : ''}><span></span></label></div>
          <div class="toggle-row"><div class="tile sm ok">${I('eye')}</div><div class="f1"><b>Tampilkan nilai ke siswa</b><div class="small muted">Nilai pilihan ganda langsung tampil setelah selesai.</div></div><select class="select input-sm" style="width:190px" data-u="tampilkan"><option value="">Ikuti global</option><option value="TRUE" ${U.tampilkan === 'TRUE' ? 'selected' : ''}>Tampilkan</option><option value="FALSE" ${U.tampilkan === 'FALSE' ? 'selected' : ''}>Sembunyikan</option></select></div></div>`)}
        ${sect(5, 'Komposisi Butir Soal', `<div class="flex g8 wrap items-c mb12"><div class="seg">${[['manual', 'Pilih Manual'], ['acak', 'Acak Otomatis']].map((x) => `<button type="button" class="${U.mode === x[0] ? 'on' : ''}" onclick="S.c.uForm.mode='${x[0]}';rerender()" ${U.terkunci ? 'disabled' : ''}>${x[1]}</button>`).join('')}</div>
            ${U.mode === 'acak' && !U.terkunci ? `<span class="small">Ambil</span><input class="input input-sm" type="number" min="1" style="width:80px" value="${U.acakN}" onchange="S.c.uForm.acakN=+this.value"><span class="small">soal acak dari ${bank.filter((s) => s.mapel_id === U.mapel_id).length} soal ${esc(mapelNm(U.mapel_id))}</span><button type="button" class="btn btn-secondary btn-sm" onclick="uRandom()">${I('refresh', 'ic-sm')}Ambil</button>` : !U.terkunci ? `<button type="button" class="btn btn-primary btn-sm" onclick="openBerkasPicker()">${I('file-text', 'ic-sm')}Ambil dari Berkas</button><button type="button" class="btn btn-secondary btn-sm" onclick="openSoalPicker()">${I('plus', 'ic-sm')}Pilih Butir Soal</button><button type="button" class="btn btn-ghost btn-sm" onclick="go('g-import')">${I('upload', 'ic-sm')}Import Excel</button>` : ''}</div>
          ${sel.length ? `<div class="col g8">${sel.map((s, i) => { const b = bankBy[s.soal_id]; return `<div class="card" style="padding:10px 12px"><div class="flex items-c g12"><span class="mono bold small" style="width:24px">${i + 1}</span><div class="f1" style="min-width:0"><div class="flex items-c g8"><span class="mono xs muted">#${esc(String(b.soal_id).slice(0, 4).toUpperCase())}</span>${pill(TIPE_SOAL[b.tipe].replace('PG Kompleks ', ''), b.tipe === 'ESAI' ? 'vio' : 'info')}</div><div class="small truncate mt4">${esc(b.teks)}</div></div>
              <div class="flex items-c g4"><span class="xs muted">Bobot</span><input class="input input-sm mono" style="width:70px" type="number" min="0.5" step="0.5" value="${s.bobot}" onchange="uBobot(${i},this.value)" ${U.terkunci ? 'disabled' : ''}></div>
              ${U.terkunci ? '' : `<div class="flex g4"><button type="button" class="icon-btn" onclick="uMove(${i},-1)" ${i === 0 ? 'disabled' : ''}>${I('chev-u')}</button><button type="button" class="icon-btn" onclick="uMove(${i},1)" ${i === sel.length - 1 ? 'disabled' : ''}>${I('chev-d')}</button><button type="button" class="icon-btn ink-err" onclick="uRemove(${i})">${I('x')}</button></div>`}</div></div>`; }).join('')}</div>` : emptyState('list-check', 'Belum ada soal', 'Tambahkan soal dari bank soal mapel ini.')}`)}
      </div><div><div class="card card-p ex-side" style="position:sticky;top:84px"><h3>Ringkasan</h3>
          <div class="grid gc2 mt16" style="grid-template-columns:1fr 1fr"><div class="info-tile" style="flex-direction:column;align-items:flex-start;gap:2px"><span class="xs muted">Jumlah butir</span><span class="b7" style="font-size:22px">${sel.length}</span></div><div class="info-tile" style="flex-direction:column;align-items:flex-start;gap:2px"><span class="xs muted">Total bobot</span><span class="b7" style="font-size:22px">${fmtN(totalBobot)}</span></div></div>
          <div class="col g8 mt16">${Object.keys(comp).map((k) => `<div class="flex jc-b small"><span class="tx2">${TIPE_SOAL[k]}</span><b class="mono">${comp[k][0]} soal · ${fmtN(comp[k][1])} poin</b></div>`).join('')}</div>
          ${U.pakai_token ? `<div class="token-card mt16"><div class="xs" style="color:#94A3B8">TOKEN UJIAN</div><div class="tk">${esc(U.token || 'AUTO')}</div></div>` : ''}
          <div class="divider"></div><p class="small tx2">${I('users', 'ic-sm')} Estimasi peserta: <b>${G().siswa.filter((s) => U.kelas_ids.some((k) => inKelas(s, k))).length} siswa</b> (${U.kelas_ids.length} kelas)</p>
          <p class="small tx2 mt8">${I('info', 'ic-sm')} Siswa menerima notifikasi saat ujian diterbitkan.</p>
          <div class="col g8 mt16"><button class="btn btn-primary btn-block" id="uPub" onclick="saveUjian('TERBIT')">${I('send')}${U.status === 'TERBIT' ? 'Simpan & Tetap Terbit' : 'Terbitkan & Jadwalkan'}</button><button class="btn btn-secondary btn-block" onclick="saveUjian('DRAF')">${I('file')}Simpan Draf</button><button class="btn btn-ghost btn-block" onclick="S.c.uForm=null;back('g-ujian')">Batal</button></div></div></div></div></div>`;
  },
  mount() {
    const box = $('#uForm'); if (!box) return; const U = S.c.uForm;
    $$('[data-u]', box).forEach((el) => { el.onchange = el.oninput = () => { const k = el.dataset.u; U[k] = el.type === 'datetime-local' ? D.fromLocal(el.value) : el.type === 'number' ? num(el.value) : el.value; if (k === 'mapel_id') { U.kelas_ids = []; rerender(); } }; });
    $$('[data-uc]', box).forEach((el) => { el.onchange = () => { U[el.dataset.uc] = el.checked; rerender(); }; });
    $$('[data-useg]', box).forEach((s) => { s.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; U[s.dataset.useg] = b.dataset.v; $$('button', s).forEach((x) => x.classList.toggle('on', x === b)); }; });
  }
});
function uToggleKelas(k) { const U = S.c.uForm, i = U.kelas_ids.indexOf(k); if (i >= 0) U.kelas_ids.splice(i, 1); else U.kelas_ids.push(k); rerender(); }
function uBobot(i, v) { S.c.uForm.soal[i].bobot = num(v, 1); rerender(); }
function uMove(i, d) { const s = S.c.uForm.soal, t = s[i]; s[i] = s[i + d]; s[i + d] = t; rerender(); }
function uRemove(i) { S.c.uForm.soal.splice(i, 1); rerender(); }
function uRandom() {
  const U = S.c.uForm, pool = S.c.soal.d.filter((s) => s.mapel_id === U.mapel_id).slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  U.soal = pool.slice(0, Math.max(1, U.acakN)).map((s) => ({ soal_id: s.soal_id, bobot: s.skor_maks }));
  toast(U.soal.length + ' soal diambil acak.', 'ok'); rerender();
}
function openSoalPicker() {
  const U = S.c.uForm, have = {}; U.soal.forEach((s) => { have[s.soal_id] = 1; });
  const pool = S.c.soal.d.filter((s) => s.mapel_id === U.mapel_id);
  sheet({ title: 'Ambil dari Bank Soal — ' + esc(mapelNm(U.mapel_id)), size: 'wide', icon: 'list-check', body: pool.length ? `<div class="flex g8 mb12"><button class="btn btn-ghost btn-sm" onclick="$$('#pickList input').forEach(x=>x.checked=true)">Pilih semua</button><button class="btn btn-ghost btn-sm" onclick="$$('#pickList input').forEach(x=>x.checked=false)">Kosongkan</button></div><div class="col g8" id="pickList">${pool.map((s) => `<label class="card flex items-s g12" style="padding:12px;cursor:pointer"><input type="checkbox" value="${s.soal_id}" ${have[s.soal_id] ? 'checked disabled' : ''} style="width:18px;height:18px;margin-top:3px;accent-color:var(--p600)"><div class="f1" style="min-width:0"><div class="flex g8 items-c">${pill(TIPE_SOAL[s.tipe].replace('PG Kompleks ', ''), s.tipe === 'ESAI' ? 'vio' : 'info')}<span class="xs muted">${fmtN(s.skor_maks)} poin</span>${have[s.soal_id] ? '<span class="xs ink-ok bold">sudah dipilih</span>' : ''}</div><div class="small mt4 clamp2">${esc(s.teks)}</div></div></label>`).join('')}</div>` : emptyState('list-check', 'Bank soal mapel ini kosong', 'Buat atau import soal terlebih dahulu.', `<button class="btn btn-primary" onclick="closeAllSheets();go('g-bank')">Ke Bank Soal</button>`),
    foot: `<button class="btn btn-primary" id="pickOk">${I('plus')}Masukkan ke Paket Ujian</button>`, mount: (el, close) => { const b = $('#pickOk', el); if (b) b.onclick = () => { $$('#pickList input:checked:not(:disabled)', el).forEach((x) => { const s = pool.find((y) => y.soal_id === x.value); U.soal.push({ soal_id: s.soal_id, bobot: s.skor_maks }); }); close(); rerender(); }; } });
}
/** Ambil semua soal dari satu berkas sekaligus (soal yang sudah ada tidak digandakan). */
function openBerkasPicker() {
  const U = S.c.uForm, all = berkasList(S.c.soal.d || []).filter((b) => b.soal.length && (hasRole('ADMIN') || b.pembuat_id === me().user_id || b.mapel_id === U.mapel_id));
  const same = all.filter((b) => b.mapel_id === U.mapel_id), other = all.filter((b) => b.mapel_id !== U.mapel_id);
  const have = {}; U.soal.forEach((s) => { have[s.soal_id] = 1; });
  const row = (b) => { const n = b.soal.filter((s) => !have[s.soal_id]).length;
    return `<button type="button" class="bk-pick" data-k="${b.key}" ${n ? '' : 'disabled'}><span class="bk-ic mp${hashN(b.mapel_id) % 6}">${I('file-text')}<b>${b.soal.length}</b></span><span class="f1" style="min-width:0;text-align:left"><b class="truncate" style="display:block">${esc(b.nama)}</b><span class="xs muted">${esc(mapelNm(b.mapel_id))} · ${b.kelas_ids.map(kelasShort).join(', ') || 'kelas belum diatur'}${hasRole('ADMIN') ? ' · ' + esc(b.pembuat || '') : ''}</span></span>${bkJenisPill(b.jenis)}<span class="xs ${n ? 'ink-p bold' : 'muted'}">${n ? '+' + n + ' soal' : 'sudah masuk'}</span></button>`; };
  sheet({ title: 'Ambil dari Berkas Soal', icon: 'file-text', size: 'wide', body: all.length ? `${same.length ? `<div class="lbl mb8">Berkas ${esc(mapelNm(U.mapel_id))}</div><div class="col g8">${same.map(row).join('')}</div>` : `<div class="banner banner-info">${I('info')}<div class="small">Belum ada berkas untuk ${esc(mapelNm(U.mapel_id))}.</div></div>`}
      ${other.length ? `<div class="lbl mt16 mb8">Mapel lain</div><div class="col g8">${other.map(row).join('')}</div>` : ''}`
    : emptyState('file-text', 'Belum ada berkas soal', 'Import berkas Word/Excel di Bank Soal terlebih dahulu.', `<button class="btn btn-primary" onclick="closeAllSheets();go('g-import')">Import Berkas Soal</button>`),
  mount: (el, close) => { $$('.bk-pick', el).forEach((x) => { x.onclick = () => { const b = all.find((y) => y.key === x.dataset.k); if (!b) return; let n = 0;
    b.soal.forEach((s) => { if (!have[s.soal_id]) { U.soal.push({ soal_id: s.soal_id, bobot: s.skor_maks }); n++; } });
    if (!U.judul.trim()) U.judul = b.nama;
    if (b.mapel_id !== U.mapel_id && !U.soal.some((s) => !b.soal.some((y) => y.soal_id === s.soal_id))) { U.mapel_id = b.mapel_id; U.kelas_ids = b.kelas_ids.filter((k) => ujKelasOK(b.mapel_id, k)); }
    close(); toast(n + ' soal dari "' + b.nama + '" dimasukkan.', 'ok'); rerender(); }; }); } });
}
function saveUjian(status) {
  const U = S.c.uForm;
  if (!U.judul.trim()) { toast('Judul ujian wajib diisi.', 'warn'); return; }
  if (!U.kelas_ids.length) { toast('Pilih minimal satu kelas.', 'warn'); return; }
  if (U.tutup <= U.buka) { toast('Waktu tutup harus setelah waktu buka.', 'warn'); return; }
  if (status === 'TERBIT' && !U.soal.length) { toast('Tambahkan soal sebelum menerbitkan.', 'warn'); return; }
  if (U.pakai_token && U.token && String(U.token).length !== 6) { toast('Token harus tepat 6 karakter, atau kosongkan agar dibuat otomatis.', 'warn'); return; }
  const p = { ulangan_id: U.id, judul: U.judul, jenis: U.jenis, mapel_id: U.mapel_id, kelas_ids: U.kelas_ids, buka: U.buka, tutup: U.tutup, durasi_menit: U.durasi, acak_soal: U.acak_soal, acak_opsi: U.acak_opsi, pakai_token: U.pakai_token, token: U.token, tampilkan_nilai: U.tampilkan, batas_pelanggaran: U.batas, status, soal: U.soal };
  const btn = $('#uPub'); btnBusy(btn, true, 'Menyimpan…');
  call('ulangan.save', p).then((r) => {
    const g = G(), i = g.ulangan.findIndex((x) => x.ulangan_id === r.ulangan_id);
    if (i >= 0) g.ulangan[i] = Object.assign(g.ulangan[i], r, { selesai: g.ulangan[i].selesai, koreksi: g.ulangan[i].koreksi }); else g.ulangan.unshift(r);
    S.c.uForm = null; drop('ud_'); saveSnap();
    toast(status === 'TERBIT' ? 'Ujian diterbitkan.' + (r.token ? ' Token: ' + r.token : '') : 'Draf ujian disimpan.', 'ok', 6000);
    go('g-ujian', {}, { replace: true });
  }).catch((e) => { btnBusy(btn, false); failToast(e); });
}

// ── Monitor ujian live ──
route('g-monitor', {
  title: 'Monitor Ujian Live', roles: ['GURU', 'ADMIN'], back: 'g-ujian', nav: 'g-ujian',
  render(p) {
    const d = need('mon_' + p.id, 'ulangan.monitor', { ulangan_id: p.id }, 15000);
    if (!d) return skelPage();
    const u = d.ulangan, st = d.stats, t = now(), F = S.c.monF || (S.c.monF = { st: '', q: '', kelas: '' });
    let rows = d.rows.filter((r) => (!F.st || r.st === F.st) && (!F.kelas || r.kelas_id === F.kelas) && (!F.q || r.nama.toLowerCase().indexOf(F.q.toLowerCase()) >= 0 || String(r.nis_nip).indexOf(F.q) >= 0));
    const rank = { TERKUNCI: 0, MENGERJAKAN: 1, BELUM: 2, SELESAI: 3 }; rows = rows.slice().sort((a, b) => rank[a.st] - rank[b.st] || b.v - a.v || a.nama.localeCompare(b.nama));
    const sisa = u.tutup - t, pct = d.rows.length ? Math.round(st.SELESAI / d.rows.length * 100) : 0;
    return `<div class="page">
      <div class="card grad grad-pattern" style="padding:20px;border:0"><div class="flex items-c g8 small wrap" style="opacity:.9">${I('activity', 'ic-sm')}SESI ${sisa > 0 ? 'SEDANG BERLANGSUNG' : 'SELESAI'} · ${esc(JENIS_UL[u.jenis] || u.jenis)} · <span class="sync-dot" style="color:#fff">Diperbarui otomatis tiap 20 detik</span></div>
        <h1 class="mt8" style="font-size:24px">${esc(u.judul)}</h1><p class="small mt4" style="opacity:.9">${I('users', 'ic-sm')} Kelas: <b>${u.kelas_ids.map(kelasShort).join(', ')}</b> · Total peserta: <b>${d.rows.length}</b> · ${D.day0(u.buka) === D.day0(u.tutup) ? D.t(u.buka) + '–' + D.t(u.tutup) + ' ' + TZL : D.dt(u.buka) + ' – ' + D.dt(u.tutup)} · durasi ${u.durasi_menit} menit</p>
        <div class="flex g12 mt16 wrap"><div class="card" style="background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.22);padding:12px 16px;color:#fff"><div class="xs" style="opacity:.8">Sisa waktu sesi</div><div class="mono b7" style="font-size:22px" id="monLeft">${leftLong(sisa)}</div><div class="xs" style="opacity:.8">${pct}% selesai</div></div>
          <div class="card" style="background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.22);padding:12px 16px;color:#fff"><div class="xs" style="opacity:.8">Token ujian aktif</div><div class="mono b7" style="font-size:22px;letter-spacing:.14em">${esc(u.token || '—')}</div><div class="flex g8 mt4">${u.token ? `<button class="btn btn-glass btn-xs" onclick="copyText('${esc(u.token)}')">${I('copy', 'ic-sm')}Salin</button>` : ''}<button class="btn btn-glass btn-xs" onclick="regenToken('${u.ulangan_id}')">${I('refresh', 'ic-sm')}Token baru</button></div></div>
          <div class="f1"></div><div class="flex g8 items-e wrap"><button class="btn btn-glass btn-sm" onclick="drop('mon_${u.ulangan_id}');rerender()">${I('refresh', 'ic-sm')}Muat ulang</button>${sisa > 0 || st.MENGERJAKAN ? `<button class="btn btn-white btn-sm" style="color:#B91C1C" onclick="finishUjian('${u.ulangan_id}')">${I('flag', 'ic-sm')}Selesaikan Ujian</button>` : ''}<button class="btn btn-accent btn-sm" onclick="go('g-hasil',{id:'${u.ulangan_id}'})">${I('chart', 'ic-sm')}Hasil</button></div></div></div>
      <div class="grid gc5 mt16">${statCard('Total terdaftar', d.rows.length, '', '100% kuota', 'users', 'p', "S.c.monF.st='';rerender()")}${statCard('Mengerjakan', st.MENGERJAKAN, '', d.rows.length ? fmtN(st.MENGERJAKAN / d.rows.length * 100) + '%' : '', 'pen', st.MENGERJAKAN ? 'p' : '', "S.c.monF.st='MENGERJAKAN';rerender()")}${statCard('Selesai submit', st.SELESAI, '', pct + '%', 'check-c', 'ok', "S.c.monF.st='SELESAI';rerender()")}${statCard('Terkunci', st.TERKUNCI, '', st.TERKUNCI ? 'Perlu tindakan' : 'Aman', 'lock', st.TERKUNCI ? 'err' : '', "S.c.monF.st='TERKUNCI';rerender()")}${statCard('Belum masuk', st.BELUM, '', '', 'user', st.BELUM ? 'warn' : '', "S.c.monF.st='BELUM';rerender()")}</div>
      <div class="split s-r mt16"><div class="card"><div class="card-hd" style="flex-wrap:wrap"><div><h3>Daftar Monitor Peserta</h3><p class="small muted">Status pengerjaan, jawaban tersimpan, dan deteksi kecurangan.</p></div>
          <div class="flex g8 wrap">${u.kelas_ids.length > 1 ? `<select class="select input-sm" style="width:150px" onchange="S.c.monF.kelas=this.value;rerender()"><option value="">Semua kelas</option>${u.kelas_ids.map((k) => `<option value="${k}" ${F.kelas === k ? 'selected' : ''}>${esc(kelasShort(k))}</option>`).join('')}</select>` : ''}<div class="input-ic">${I('search')}<input class="input input-sm" placeholder="Cari nama atau NIS" value="${esc(F.q)}" oninput="S.c.monF.q=this.value;rerenderKeepFocus()"></div></div></div>
        <div class="chips scroll" style="padding:12px 16px 0">${[['', 'Semua', d.rows.length], ['MENGERJAKAN', 'Mengerjakan', st.MENGERJAKAN], ['SELESAI', 'Selesai', st.SELESAI], ['TERKUNCI', 'Terkunci', st.TERKUNCI], ['BELUM', 'Belum masuk', st.BELUM]].map((x) => `<button class="chip ${F.st === x[0] ? 'on' : ''}" onclick="S.c.monF.st='${x[0]}';rerender()">${x[1]} <span class="cnt">${x[2]}</span></button>`).join('')}</div>
        <div class="tbl-wrap mt8"><table class="tbl"><thead><tr><th>Siswa & identitas</th><th>Status</th><th>Progres soal</th><th>Pelanggaran</th><th class="tr">Tindakan</th></tr></thead><tbody>${rows.map((r) => {
          const stp = r.st === 'TERKUNCI' ? pill('Terkunci', 'dark', 'lock') : r.st === 'MENGERJAKAN' ? pill('Mengerjakan', 'info') : r.st === 'SELESAI' ? pill('Selesai', 'ok', 'check') : pill('Belum masuk', 'neu');
          const left = r.st === 'MENGERJAKAN' ? 'Sisa ' + D.clock(r.b - t) : r.st === 'SELESAI' ? 'Diserahkan' : '';
          return `<tr><td><div class="flex items-c g8">${avatar(r.nama, r.foto, 'sm')}<div style="min-width:0"><div class="bold small truncate">${esc(r.nama)} ${r.online ? '<span title="Online" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--ok)"></span>' : ''}</div><div class="mono xs muted">NIS: ${esc(r.nis_nip)} · ${esc(kelasShort(r.kelas_id))}</div></div></div></td><td>${stp}<div class="mono xs muted mt4">${left}</div></td>
            <td style="min-width:96px"><div class="mono small">${r.p}/${d.total}</div><div class="meter mt4 ${r.st === 'SELESAI' ? 'ok' : ''}"><i style="width:${d.total ? r.p / d.total * 100 : 0}%"></i></div></td>
            <td>${r.v ? `<span class="pill ${r.v >= u.limit ? 'pill-err' : 'pill-warn'}">${I('alert', 'ic-sm')}${r.v}/${u.limit} ${r.v >= u.limit ? 'Kritis' : 'Waspada'}</span>` : `<span class="xs muted">0 · Bersih</span>`}</td>
            <td class="tr"><div class="flex g4 jc-e">${r.st === 'TERKUNCI' ? `<button class="btn btn-sm btn-danger" style="white-space:nowrap" onclick="monUnlock('${u.ulangan_id}','${r.id}',${jsq(r.nama)},${r.v})">${I('unlock', 'ic-sm')}Buka Kunci</button>` : ''}${r.st === 'MENGERJAKAN' ? `<button class="btn btn-sm btn-secondary" onclick="monAct('${u.ulangan_id}','${r.id}','ADDTIME',5)">+5m</button>` : ''}${r.id ? `<button class="icon-btn" onclick="monMenu(this,'${u.ulangan_id}','${r.id}',${jsq(r.nama)},'${r.st}')">${I('more')}</button>` : ''}</div></td></tr>`; }).join('') || `<tr><td colspan="5">${emptyState('users', 'Tidak ada peserta', '')}</td></tr>`}</tbody></table></div></div>
      <div class="col g16"><div class="card"><div class="card-hd"><h3 class="flex items-c g8">${I('shield', 'ink-p')}Security Audit Log</h3>${pill('LIVE', 'err')}</div><div style="max-height:560px;overflow:auto">${d.logs.length ? d.logs.map((l) => `<div class="row-item" style="align-items:flex-start"><div class="tile sm ${l.jenis === 'SELESAI' ? 'ok' : l.st === 'TERKUNCI' ? 'err' : 'warn'}">${I(l.jenis === 'SELESAI' ? 'check-c' : l.jenis === 'KELUAR_LAYAR_PENUH' || l.jenis === 'LAYAR_TERBAGI' ? 'maximize' : l.jenis === 'TANGKAP_LAYAR' ? 'camera' : 'alert')}</div><div class="f1" style="min-width:0"><div class="xs muted mono">${D.t(l.t)}.${pad(new Date(l.t).getSeconds())} ${TZL}</div><div class="small"><b>${esc(l.nama)}</b> ${l.jenis === 'SELESAI' ? 'menyerahkan jawaban.' : (VIOL_TXT[l.jenis] || VIOL_TXT.PINDAH_TAB)}</div></div></div>`).join('') : `<div class="card-bd">${emptyState('shield', 'Belum ada kejadian', 'Pelanggaran dan penyerahan jawaban akan tercatat di sini.')}</div>`}</div></div></div></div></div>`;
  },
  mount(p) {
    if (S.c.monTimer) clearInterval(S.c.monTimer);
    S.c.monTimer = setInterval(() => {
      if (S.route !== 'g-monitor' || document.hidden) return;
      const d = S.c['mon_' + p.id] && S.c['mon_' + p.id].d, el = $('#monLeft'); if (d && el) el.textContent = leftLong(d.ulangan.tutup - now());
      if (S.c['mon_' + p.id] && Date.now() - S.c['mon_' + p.id].t > 20000) need('mon_' + p.id, 'ulangan.monitor', { ulangan_id: p.id }, 20000);
    }, 1000);
    ROUTES['g-monitor'].leave = () => { clearInterval(S.c.monTimer); S.c.monTimer = null; };
  }
});
/** Sisa waktu: jam:menit:detik bila < 1 hari, selain itu 'N hari M jam'. */
function leftLong(ms) { if (ms <= 0) return 'Ditutup'; if (ms < 864e5) return D.clock(ms); const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 3600000); return d + ' hari ' + h + ' jam'; }
function monMenu(el, ul, id, nama, st) {
  const items = [];
  if (st === 'MENGERJAKAN' || st === 'TERKUNCI') items.push({ icon: 'clock', label: 'Tambah waktu 10 menit', run: () => monAct(ul, id, 'ADDTIME', 10) });
  items.push({ icon: 'refresh', label: 'Reset peserta (mulai ulang)', danger: true, run: () => confirmBox(`Reset <b>${esc(nama)}</b>? Semua jawaban peserta ini akan dihapus dan ia harus memulai ujian dari awal.`, { danger: true, yes: 'Reset Peserta' }).then((ok) => { if (ok) monAct(ul, id, 'RESET'); }) });
  menuAt(el, items);
}
function monUnlock(ul, id, nama, v) {
  confirmBox(`Buka kunci ujian <b>${esc(nama)}</b>? Peserta melanjutkan dengan sisa waktu saat terkunci.`, { title: 'Buka Kunci Sesi Ujian', icon: 'unlock', yes: 'Buka Kunci Sekarang',
    extra: `<div class="field mt16"><label class="label">Kompensasi tambahan waktu</label><div class="seg" id="ulMin">${[0, 5, 10, 15].map((m) => `<button type="button" data-v="${m}" class="${m === 0 ? 'on' : ''}" onclick="$$('#ulMin button').forEach(x=>x.classList.toggle('on',x===this))">+${m} menit</button>`).join('')}</div></div><label class="check mt12"><input type="checkbox" id="ulReset" checked>Reset hitungan pelanggaran menjadi 0/${S.c['mon_' + ul].d.ulangan.limit} (beri kesempatan baru)</label>`,
    collect: (el) => ({ minutes: +($('#ulMin .on', el) || { dataset: { v: 0 } }).dataset.v, resetViol: $('#ulReset', el).checked }) }).then((r) => { if (r) monAct(ul, id, 'UNLOCK', r.minutes, r.resetViol); });
}
function monAct(ul, id, act, minutes, resetViol) {
  const ent = S.c['mon_' + ul], row = ent && ent.d.rows.find((r) => r.id === id), bak = row ? Object.assign({}, row) : null;
  if (row) { if (act === 'UNLOCK') { row.st = 'MENGERJAKAN'; if (resetViol !== false) row.v = 0; } else if (act === 'ADDTIME') row.b += (minutes || 5) * 60000; else if (act === 'RESET') { row.st = 'BELUM'; row.p = 0; row.v = 0; row.id = ''; } rerender(); }
  call('ulangan.action', { ulangan_id: ul, attempt_id: id, act, minutes, resetViol }).then(() => { toast(act === 'UNLOCK' ? 'Kunci dibuka.' : act === 'ADDTIME' ? 'Waktu ditambah ' + (minutes || 5) + ' menit.' : 'Peserta direset.', 'ok'); }).catch((e) => { if (row && bak) Object.assign(row, bak); rerender(); failToast(e); });
}
function regenToken(ul) {
  confirmBox('Buat token baru? Token lama tidak berlaku untuk peserta yang belum mulai.', { yes: 'Buat Token Baru', icon: 'key' }).then((ok) => {
    if (!ok) return; call('ulangan.token', { ulangan_id: ul }).then((r) => { const ent = S.c['mon_' + ul]; if (ent) ent.d.ulangan.token = r.token; const gu = G().ulangan.find((x) => x.ulangan_id === ul); if (gu) gu.token = r.token; saveSnap(); rerender(); toast('Token baru: ' + r.token, 'ok'); }).catch(failToast);
  });
}

// ── Koreksi esai ──
route('g-koreksi', {
  title: 'Koreksi Esai', roles: ['GURU', 'ADMIN'], back: 'g-ujian', nav: 'g-ujian', form: true,
  render(p) {
    const d = need('es_' + p.id, 'ulangan.essays', { ulangan_id: p.id }, 60000);
    if (!d) return skelPage();
    if (!d.soal.length) return `<div class="page">${emptyState('pen', 'Ulangan ini tidak memiliki soal esai', 'Semua soal dinilai otomatis.', `<button class="btn btn-primary" onclick="go('g-hasil',{id:'${p.id}'})">Lihat Hasil</button>`)}</div>`;
    const qi = clamp(num(p.q, 0), 0, d.soal.length - 1), q = d.soal[qi], F = S.c.esF || (S.c.esF = { st: 'perlu', kelas: '' });
    const graded = (j, sid) => j.k && j.k[sid] && j.k[sid].s !== undefined && j.k[sid].s !== '';
    let list = d.jawaban.filter((j) => (!F.kelas || j.kelas_id === F.kelas));
    const perlu = list.filter((j) => !graded(j, q.soal_id) && String(j.a[q.soal_id] || '').trim()), sudah = list.filter((j) => graded(j, q.soal_id));
    const shown = F.st === 'perlu' ? perlu : F.st === 'sudah' ? sudah : list;
    const selId = p.a && shown.some((j) => j.attempt_id === p.a) ? p.a : (shown[0] || {}).attempt_id;
    const j = d.jawaban.find((x) => x.attempt_id === selId), pos = shown.indexOf(j), next = shown[pos + 1], prev = shown[pos - 1];
    const hide = !!S.c.esHide, g = j && j.k[q.soal_id];
    const quick = [0, 0.3, 0.5, 0.7, 0.8, 1].map((f) => Math.round(q.bobot * f * 2) / 2);
    return `<div class="page"><button class="back-link" onclick="back('g-ujian')">${I('arrow-l', 'ic-sm')}Kembali</button>
      <div class="page-hd"><div><h1>Koreksi Lembar Jawaban Esai — ${esc(d.ulangan.judul)}</h1><p class="sub">Kelas ${d.ulangan.kelas_ids.map(kelasShort).join(', ')} · ${d.jawaban.length} peserta selesai · ${d.soal.length} butir uraian</p></div><button class="btn btn-secondary" onclick="go('g-hasil',{id:'${p.id}'})">${I('chart')}Hasil & Analisis</button></div>
      <div class="grid gc3">${d.soal.map((s, i) => { const done = d.jawaban.filter((x) => graded(x, s.soal_id)).length; return `<button class="card hoverable ${i === qi ? 'sel' : ''}" style="padding:14px;text-align:left" onclick="go('g-koreksi',{id:'${p.id}',q:${i}},{replace:true})"><div class="flex items-c g8"><span class="q-no" style="height:26px">#${s.no}</span><span class="xs muted">Bobot ${fmtN(s.bobot)} poin</span><span class="ml-a">${done >= d.jawaban.length ? pill('Selesai', 'ok') : pill('Aktif', 'info')}</span></div><div class="bold small mt8 clamp2">${esc(s.teks)}</div><div class="flex items-c g8 mt8"><div class="meter f1"><i style="width:${d.jawaban.length ? done / d.jawaban.length * 100 : 0}%"></i></div><span class="mono xs">${done}/${d.jawaban.length}</span></div></button>`; }).join('')}</div>
      <div class="card mt16 flex g12 items-c wrap" style="padding:12px 16px">${d.ulangan.kelas_ids.length > 1 ? `<select class="select input-sm" style="width:160px" onchange="S.c.esF.kelas=this.value;rerender()"><option value="">Semua kelas</option>${d.ulangan.kelas_ids.map((k) => `<option value="${k}" ${F.kelas === k ? 'selected' : ''}>${esc(kelasShort(k))}</option>`).join('')}</select>` : ''}
        <div class="seg">${[['semua', 'Semua', list.length], ['perlu', 'Perlu koreksi', perlu.length], ['sudah', 'Sudah dinilai', sudah.length]].map((x) => `<button class="${F.st === x[0] ? 'on' : ''}" onclick="S.c.esF.st='${x[0]}';rerender()">${x[1]} (${x[2]})</button>`).join('')}</div>
        <label class="check ml-a small"><input type="checkbox" ${hide ? 'checked' : ''} onchange="S.c.esHide=this.checked;rerender()">Sembunyikan nama siswa</label></div>
      <div class="split s-eq mt16"><div class="col g16"><div class="card card-p"><div class="flex items-c jc-b"><h3>${I('file-text', 'ink-p')} Stimulus & Butir Soal</h3><span class="pill pill-info mono">BOBOT ${fmtN(q.bobot)}</span></div><p class="pre mt12">${esc(q.teks)}</p>${q.gambar ? `<img src="${esc(soalImgSrc(q.gambar))}" class="q-img" alt="Gambar soal" onerror="imgFb(this)">` : ''}</div>
          ${q.acuan ? `<div class="card card-p"><h3>${I('key', 'ink-ok')} Kunci & Acuan Jawaban</h3><div class="code-box mt12 pre" style="font-family:var(--f-body)">${esc(q.acuan)}</div></div>` : ''}
          ${q.rubrik ? `<div class="card card-p"><h3>${I('list', 'ink-p')} Rubrik Penilaian (maks ${fmtN(q.bobot)})</h3><div class="banner banner-ok mt12 pre" style="display:block">${esc(q.rubrik)}</div></div>` : ''}</div>
        <div class="col g16">${j ? `<div class="card card-p flex items-c g12 wrap">${hide ? `<div class="av">${pos + 1}</div>` : avatar(j.nama, '', '')}<div class="f1" style="min-width:0"><div class="xs ink-p bold">Siswa ke-${pos + 1} dari ${shown.length}</div><h3>${hide ? 'Peserta #' + (pos + 1) : esc(j.nama)}</h3><div class="mono xs muted">${hide ? '' : 'NIS: ' + esc(j.nis_nip) + ' · '}${esc(kelasShort(j.kelas_id))} · Skor PG otomatis: ${fmtN(j.so)}</div></div>
            <div class="flex g8"><button class="btn btn-secondary btn-sm" ${prev ? `onclick="go('g-koreksi',Object.assign({},S.params,{a:'${prev.attempt_id}'}),{replace:true})"` : 'disabled'}>${I('chev-l', 'ic-sm')}</button><button class="btn btn-secondary btn-sm" ${next ? `onclick="go('g-koreksi',Object.assign({},S.params,{a:'${next.attempt_id}'}),{replace:true})"` : 'disabled'}>Berikutnya ${I('chev-r', 'ic-sm')}</button></div></div>
          <div class="card card-p"><div class="flex items-c jc-b"><h3>${I('pen', 'ink-p')} Jawaban Siswa</h3>${graded(j, q.soal_id) ? pill('Sudah dinilai', 'ok') : pill('Perlu dinilai', 'warn')}</div><div class="card mt12 pre" style="padding:16px;background:var(--subtle);min-height:120px;line-height:1.7">${esc(j.a[q.soal_id]) || '<span class="muted">(Tidak menjawab — skor 0 otomatis)</span>'}</div></div>
          <div class="card card-p" style="border:2px solid var(--p100)"><div class="flex items-c jc-b"><h3>${I('check-c', 'ink-p')} Input Skor & Catatan Guru</h3><span class="small ink-p bold">Maks. ${fmtN(q.bobot)} poin</span></div>
            <div class="xs bold upper muted mt16 mb8">Pilih skor cepat sesuai rubrik</div><div class="grid" style="grid-template-columns:repeat(6,1fr);gap:8px">${quick.map((v) => `<button class="btn btn-secondary btn-sm ${g && num(g.s) === v ? 'btn-primary' : ''}" style="${g && num(g.s) === v ? 'color:#fff' : ''}" onclick="$('#esScore').value=${v}">${fmtN(v)}</button>`).join('')}</div>
            <div class="flex items-c g12 mt16 card" style="padding:12px;background:var(--subtle)"><span class="bold f1">Skor akhir butir soal ini:</span><input class="input mono" id="esScore" type="number" min="0" max="${q.bobot}" step="0.5" value="${g ? g.s : ''}" style="width:100px;height:50px;font-size:22px;text-align:center;border:2px solid var(--p600)"><span class="mono" style="font-size:20px">/ ${fmtN(q.bobot)}</span></div>
            <div class="field mt16"><label class="label">Catatan evaluasi untuk siswa</label><textarea class="textarea" id="esCom" style="min-height:90px" placeholder="Umpan balik singkat…">${esc((g && g.c) || '')}</textarea></div>
            <div class="flex g8 mt16"><button class="btn btn-primary btn-lg f1" id="esSave" onclick="saveEssay('${p.id}','${j.attempt_id}','${q.soal_id}','${next ? next.attempt_id : ''}')">${I('check')}Simpan & Lanjut ke Siswa Berikutnya</button></div><p class="kbd-hint tr mt8"><span class="kbd">Shift</span> + <span class="kbd">Enter</span> untuk simpan & lanjut</p></div>`
          : `<div class="card">${emptyState('check-c', F.st === 'perlu' ? 'Semua jawaban soal ini sudah dinilai' : 'Tidak ada jawaban', F.st === 'perlu' ? 'Pilih butir esai lain atau lihat hasil akhir.' : '')}</div>`}</div></div>
      <div class="card mt16"><div class="card-hd"><h3>Daftar Siswa (Soal #${q.no})</h3><span class="small muted">${sudah.length}/${list.length} dinilai</span></div><div class="card-bd grid gc4" style="gap:8px">${list.map((x, i) => { const gg = x.k[q.soal_id]; return `<button class="card ${x.attempt_id === selId ? 'sel' : ''}" style="padding:10px;text-align:left" onclick="go('g-koreksi',Object.assign({},S.params,{a:'${x.attempt_id}'}),{replace:true})"><div class="flex jc-b items-c"><span class="xs muted">${esc(kelasShort(x.kelas_id))} · ${i + 1}</span>${gg ? `<span class="pill pill-ok mono">${fmtN(gg.s)}</span>` : String(x.a[q.soal_id] || '').trim() ? pill('–', 'neu') : '<span class="xs muted">kosong</span>'}</div><div class="bold small truncate mt4">${hide ? 'Peserta #' + (i + 1) : esc(x.nama)}</div><div class="xs ${gg ? 'ink-ok' : 'ink-warn'}">${gg ? 'Sudah dinilai' : 'Belum dinilai'}</div></button>`; }).join('')}</div></div></div>`;
  },
  mount(p) {
    const h = (e) => { if (e.shiftKey && e.key === 'Enter') { e.preventDefault(); const b = $('#esSave'); if (b) b.click(); } };
    document.addEventListener('keydown', h); ROUTES['g-koreksi'].leave = () => document.removeEventListener('keydown', h);
  }
});
function saveEssay(ul, aid, sid, nextAid) {
  const d = S.c['es_' + ul].d, j = d.jawaban.find((x) => x.attempt_id === aid), q = d.soal.find((x) => x.soal_id === sid);
  const v = num($('#esScore').value, NaN), c = $('#esCom').value;
  if (isNaN(v) || v < 0 || v > q.bobot) { toast('Skor harus 0–' + q.bobot + '.', 'warn'); return; }
  const prev = j.k[sid]; j.k[sid] = { s: v, c };   // optimistic
  toast('Skor ' + fmtN(v) + ' tersimpan.', 'ok', 1500);
  if (nextAid) go('g-koreksi', Object.assign({}, S.params, { a: nextAid }), { replace: true }); else rerender();
  const gr = {}; gr[sid] = { s: v, c };
  call('ulangan.grade', { ulangan_id: ul, attempt_id: aid, grades: gr }, { silent: true }).then((r) => {
    j.na = r.na; j.sn = r.sn;
    const gu = G().ulangan.find((x) => x.ulangan_id === ul); if (gu && r.sn === 'FINAL' && r.prevSn !== 'FINAL') { gu.koreksi = Math.max(0, gu.koreksi - 1); renderChrome(); saveSnap(); }
    drop('res_' + ul);
  }).catch((e) => { if (prev) j.k[sid] = prev; else delete j.k[sid]; rerender(); toast('Gagal menyimpan skor: ' + e.message, 'err', 8000); });
}

// ── Hasil & analisis butir soal ──
route('g-hasil', {
  title: 'Hasil & Analisis CBT', roles: ['GURU', 'ADMIN', 'WALI'], back: 'g-ujian', nav: 'g-ujian',
  render(p) {
    const d = need('res_' + p.id, 'ulangan.results', { ulangan_id: p.id }, 30000);
    if (!d) return skelPage();
    const u = d.ulangan, F = S.c.resF || (S.c.resF = { kelas: '', tab: 'rekap' }), kkm = d.kkm;
    const rows = d.rows.filter((r) => !F.kelas || r.kelas_id === F.kelas), nas = rows.map((r) => r.na);
    const st = { n: rows.length, avg: avg(nas), max: nas.length ? Math.max(...nas) : 0, min: nas.length ? Math.min(...nas) : 0, tuntas: nas.filter((x) => x >= kkm).length };
    const top = rows[0], bins = [[0, 60, '< 60'], [60, 75, '60–74'], [75, 85, '75–84'], [85, 95, '85–94'], [95, 101, '95–100']].map((b) => ({ l: b[2], v: nas.filter((x) => x >= b[0] && x < b[1]).length, c: b[0] < kkm ? '#DC2626' : '#16A34A' }));
    const diff = (pct) => pct >= 70 ? ['Mudah', 'ok'] : pct >= 30 ? ['Sedang', 'info'] : ['Sukar', 'err'];
    return `<div class="page"><button class="back-link" onclick="back('g-ujian')">${I('arrow-l', 'ic-sm')}Kembali</button>
      <div class="page-hd"><div><span class="pill pill-info mono">${esc(JENIS_UL[u.jenis] || u.jenis)} · ${esc(mapelNm(u.mapel_id))}</span><h1 class="mt8">Hasil Evaluasi & Analisis Butir Soal</h1><p class="sub">${esc(u.judul)} · Kelas ${u.kelas_ids.map(kelasShort).join(', ')} (${d.peserta} peserta terdaftar) · Selesai ${D.dt(u.tutup)}</p></div>
        <div class="flex g8 wrap">${d.stats.koreksi ? `<button class="btn btn-secondary" onclick="go('g-koreksi',{id:'${u.ulangan_id}'})">${I('pen')}Koreksi ${d.stats.koreksi} esai</button>` : ''}<button class="btn btn-secondary" onclick="drop('res_${u.ulangan_id}');rerender()">${I('refresh')}</button><button class="btn btn-primary" onclick="exportHasil('${u.ulangan_id}')">${I('download')}Ekspor Excel (.xlsx)</button></div></div>
      <div class="flex g8 wrap mb16">${u.kelas_ids.length > 1 ? `<select class="select input-sm" style="width:180px" onchange="S.c.resF.kelas=this.value;rerender()"><option value="">Semua kelas (${d.rows.length})</option>${u.kelas_ids.map((k) => `<option value="${k}" ${F.kelas === k ? 'selected' : ''}>${esc(kelasShort(k))}</option>`).join('')}</select>` : ''}<span class="pill pill-neu pill-lg">KKTP / KKM: ${kkm}</span></div>
      <div class="grid gc4">${statCard('Rata-rata nilai CBT', fmtN(st.avg), '/ 100', st.avg >= kkm ? 'Melampaui KKM' : 'Di bawah KKM', 'star', st.avg >= kkm ? 'ok' : 'warn')}${statCard('Ketuntasan klasikal', st.n ? fmtN(st.tuntas / st.n * 100) + '%' : '-', '', `<b>${st.tuntas}</b> tuntas · <b>${st.n - st.tuntas}</b> perlu remedial`, 'check-c', 'p')}${statCard('Sebaran nilai', fmtN(st.max), '', 'Terendah ' + fmtN(st.min) + (top ? ' · Tertinggi: ' + esc(firstName(top.nama)) : ''), 'trending', '')}${statCard('Perlu koreksi', d.stats.koreksi, 'esai', d.stats.koreksi ? 'Nilai akhir belum final' : 'Semua nilai final', 'pen', d.stats.koreksi ? 'warn' : 'ok')}</div>
      <div class="split mt16"><div class="card card-p"><div class="flex items-c jc-b"><h3>Distribusi Frekuensi Rentang Nilai</h3><span class="small muted">${st.n} siswa</span></div><div class="mt16">${CH.bars(bins, { h: 230, label: 'Distribusi nilai' })}</div><div class="legend-row mt8"><span><i style="background:#DC2626"></i>Remedial (&lt; ${kkm})</span><span><i style="background:#16A34A"></i>Tuntas (≥ ${kkm})</span></div></div>
        <div class="card card-p"><h3>${I('sparkles', 'ink-p')} Kesimpulan Otomatis</h3><ul class="small tx2" style="padding-left:18px;line-height:1.8;margin:12px 0 0">${hasilInsight(d, rows, st, kkm).map((x) => `<li>${x}</li>`).join('')}</ul></div></div>
      <div class="tabs mt24">${[['rekap', 'Rekap Nilai Siswa (' + rows.length + ')'], ['butir', 'Analisis Butir Soal (' + d.analysis.length + ')']].map((t) => `<button class="tab ${F.tab === t[0] ? 'on' : ''}" onclick="S.c.resF.tab='${t[0]}';rerender()">${t[1]}</button>`).join('')}</div>
      <div class="card mt16">${F.tab === 'butir' ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>No</th><th>Tipe</th><th>Butir soal</th><th>Tingkat kesukaran</th><th>Distribusi jawaban (PG)</th><th>Rekomendasi</th></tr></thead><tbody>${d.analysis.map((a) => { const df = diff(a.pct), dist = Object.keys(a.dist).sort().map((k) => `<span class="${String(a.kunci) === k ? 'ink-ok bold' : ''}">${k}:${a.dist[k]}</span>`).join(' · ');
          return `<tr><td class="mono">${pad(a.no)}</td><td>${pill(TIPE_SOAL[a.tipe].replace('PG Kompleks ', ''), a.tipe === 'ESAI' ? 'vio' : 'info')}</td><td class="small" style="max-width:360px">${esc(a.teks)}</td><td style="min-width:160px">${a.tipe === 'ESAI' ? '<span class="xs muted">Dinilai manual</span>' : `<div class="flex items-c g8"><div class="meter f1 ${df[1] === 'err' ? 'err' : df[1] === 'ok' ? 'ok' : ''}"><i style="width:${a.pct}%"></i></div><span class="mono small">${fmtN(a.pct)}%</span></div><div class="xs mt4">${pill(df[0], df[1])}</div>`}</td><td class="mono xs">${dist || '—'}</td><td class="small">${a.tipe === 'ESAI' ? '—' : a.pct < 30 ? `<span class="ink-err">${I('alert', 'ic-sm')} Revisi redaksi / remedial materi</span>` : a.pct > 90 ? '<span class="tx2">Pertimbangkan dinaikkan tingkatnya</span>' : `<span class="ink-ok">${I('check-c', 'ic-sm')} Pertahankan</span>`}</td></tr>`; }).join('')}</tbody></table></div>`
        : dataTable('res_' + u.ulangan_id, rows.map((r, i) => Object.assign({ rank: i + 1 }, r)), [
          { h: 'Rank', k: 'rank', n: true, r: (r) => `<span class="mono bold">${r.rank}</span>` },
          { h: 'NIS', k: 'nis_nip', r: (r) => `<span class="mono small">${esc(r.nis_nip)}</span>` },
          { h: 'Nama siswa', k: 'nama', r: (r) => `<div class="bold">${esc(r.nama)}</div><div class="xs muted">Waktu tempuh: ${r.durasi === null ? '-' : r.durasi + ' menit'}${r.v ? ' · ' + r.v + ' pelanggaran' : ''}</div>` },
          { h: 'Kelas', k: 'kelas_id', r: (r) => esc(kelasShort(r.kelas_id)) },
          { h: 'Skor PG', k: 'so', n: true, r: (r) => `<span class="mono">${fmtN(r.so)}</span>` },
          { h: 'Skor esai', k: 'se', n: true, r: (r) => r.sn === 'MENUNGGU_KOREKSI' ? pill('Menunggu', 'vio') : `<span class="mono">${fmtN(r.se)}</span>` },
          { h: 'Nilai akhir', k: 'na', n: true, r: (r) => `<b class="mono" style="font-size:15px">${fmtN(r.na)}</b>` },
          { h: 'Status KKTP', k: 'na', v: (r) => r.na >= kkm ? 1 : 0, r: (r) => r.na >= kkm ? pill('Tuntas', 'ok', 'check') : pill('Perlu remedial', 'err', 'alert') }
        ], { ph: 'Cari nama atau NIS…', emptyT: 'Belum ada peserta yang selesai' })}</div></div>`;
  }
});
function hasilInsight(d, rows, st, kkm) {
  const out = [];
  if (!rows.length) return ['Belum ada peserta yang menyelesaikan ulangan ini.'];
  out.push(`${fmtN(st.tuntas / st.n * 100)}% siswa mencapai KKM ${kkm} (${st.tuntas} dari ${st.n}).`);
  const hard = d.analysis.filter((a) => a.tipe !== 'ESAI' && a.pct < 30), easy = d.analysis.filter((a) => a.tipe !== 'ESAI' && a.pct > 90);
  if (hard.length) out.push(`${hard.length} butir tergolong <b>sukar</b> (nomor ${hard.map((a) => a.no).join(', ')}): materi terkait perlu penguatan atau redaksi soal ditinjau ulang.`);
  if (easy.length) out.push(`${easy.length} butir dijawab benar oleh &gt;90% siswa.`);
  const remed = rows.filter((r) => r.na < kkm).length; if (remed) out.push(`${remed} siswa perlu dijadwalkan remedial.`);
  if (d.stats.koreksi) out.push(`${d.stats.koreksi} jawaban esai belum dikoreksi; nilai akhir siswa tersebut belum final.`);
  const viol = rows.filter((r) => r.v > 0).length; if (viol) out.push(`${viol} peserta tercatat melakukan pelanggaran selama ujian.`);
  return out;
}
function exportHasil(ul) {
  const d = S.c['res_' + ul].d, u = d.ulangan;
  exportXlsx('hasil_' + u.judul.replace(/[^\w]+/g, '_').slice(0, 40), [
    { name: 'Rekap Nilai', rows: [['Rank', 'NIS', 'Nama', 'Kelas', 'Skor PG', 'Skor Esai', 'Nilai Akhir', 'Status', 'Durasi (menit)', 'Pelanggaran']].concat(d.rows.map((r, i) => [i + 1, r.nis_nip, r.nama, kelasNm(r.kelas_id), r.so, r.se, r.na, r.na >= d.kkm ? 'Tuntas' : 'Remedial', r.durasi, r.v])) },
    { name: 'Analisis Butir', rows: [['No', 'Tipe', 'Soal', '% Benar', 'Jumlah Menjawab']].concat(d.analysis.map((a) => [a.no, a.tipe, a.teks, a.pct, a.jawab])) }]);
}
(window.__SP_F__ = window.__SP_F__ || {}).guru = 1;
