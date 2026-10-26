# SMAPATISPA LEARNING — Frontend

LMS & CBT sekolah: materi, tugas, presensi, wali kelas, agenda, laporan, dan ujian CBT dengan pengawasan pelanggaran.

- **Frontend:** situs statis ini (HTML/CSS/JS murni) di GitHub Pages
- **Backend:** Google Apps Script (`Kode.gs`) sebagai REST API JSON, disimpan terpisah di proyek Apps Script, **bukan** di repo ini

## Struktur
```
index.html          halaman aplikasi (SPA)
favicon.svg
css/style.css       desain
js/config.js        ← SATU-SATUNYA file yang perlu diubah: GAS_URL (URL /exec Apps Script)
js/core.js          utilitas, API fetch, router, komponen UI
js/shell.js         navigasi, login, inisialisasi
js/siswa.js         halaman siswa + mesin ujian CBT
js/guru.js          dashboard guru, materi & tugas, bank soal, ujian, monitor, koreksi, hasil
js/umum.js          presensi, wali kelas, agenda, laporan, akun
js/admin.js         dashboard admin, pengguna, data akademik, pengaturan
js/main.js          titik mulai
```

## Memperbarui
```
git add .
git commit -m "keterangan perubahan"
git push
```
Panduan lengkap: lihat `PANDUAN-INSTALASI.md`.
