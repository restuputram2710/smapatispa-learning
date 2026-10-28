# Panduan Instalasi SMAPATISPA LEARNING v2.3
**Frontend di GitHub Pages + Google Apps Script sebagai REST API**

```
Siswa/Guru (HP & laptop)
   │  buka  https://NAMAANDA.github.io/smapatispa-learning/
   ▼
GitHub Pages  ── index.html, css/, js/  (tampilan aplikasi)
   │  fetch() JSON
   ▼
Google Apps Script (Kode.gs)  ── /exec  (API: login, tugas, ujian, presensi, …)
   │
   ▼
Google Sheets (DB_MASTER, DB_AKADEMIK, DB_UJIAN) + Google Drive (berkas)
```

Keuntungan dibanding versi sebelumnya:
- Tidak ada lagi halaman Google yang menyela, seperti "Sorry, unable to open the file" atau banner "Aplikasi ini dibuat oleh pengguna Google Apps Script".
- Bisa dibuka di Chrome HP mana pun. Aplikasi memanggil server tanpa cookie akun Google, sehingga tidak terganggu akun yang login di browser.
- Tombol **Kembali** di HP berpindah halaman di dalam aplikasi.
- Layar penuh saat ujian CBT bekerja lebih baik.

Data lama **tetap dipakai**: spreadsheet, akun, tugas, dan ujian tidak berubah.

---

## Pembaruan v2.3 — database Supabase (opsional)

Versi ini menambahkan pilihan menyimpan data di **Supabase (PostgreSQL)** menggantikan Google Sheets. Frontend **tidak berubah** (tidak perlu push ke GitHub/Vercel); hanya backend yang diperbarui: tambah file **Supabase.gs**, ganti **Kode.gs v2.3.0**, lalu deploy versi baru. Tanpa langkah migrasi, aplikasi tetap memakai Google Sheets seperti biasa.

Langkah lengkap (membuat project Supabase, menjalankan `SETUP_SUPABASE.sql`, mengisi Properti skrip, `salinKeSupabase` → `pindahKeSupabase`, dan cara kembali dengan `kembaliKeSheets`) ada di **PANDUAN-MIGRASI-SUPABASE.md**.

---

## Pembaruan v2.2 — jadwal pelajaran, kelas eskul/pengayaan, import soal Word & Excel bergambar

Bila aplikasi sudah berjalan, cukup lakukan dua langkah ini. Data lama tidak berubah.

1. **Backend:** tempel **Kode.gs v2.2.0** di Apps Script lalu Simpan. Buka **Terapkan → Kelola deployment**, pilih deployment yang dipakai situs (ID-nya sama dengan `GAS_URL` di `js/config.js`), lalu **✏️ → Version: New version → Deploy**.
   - Sheet **Jadwal** dan kolom baru di sheet **Kelas** dibuat otomatis pada permintaan pertama setelah deploy. Bisa juga dipastikan dengan menjalankan `cekInstalasi`.
   - Cek versi: buka `URL_EXEC?t=1`, harus tampil `"version":"2.2.0"`.
2. **Frontend:** salin isi ZIP terbaru ke folder `smapatispa-learning` (pilih **Ganti** bila ditanya). File yang berubah ada di `css/`, `js/`, dan folder baru `templates/`. Lalu jalankan `git add .` → `git commit -m "v2.2 jadwal eskul import word"` → `git push`.

**Fitur baru:**
- **Jadwal Pelajaran** (menu Admin). Atur **Jam Pelajaran** dulu, termasuk hari dengan jam khusus seperti Jumat. Setelah itu klik kotak jam untuk memilih mapel–guru, atau isi semuanya lewat **Import Excel** (template berisi daftar kelas, mapel, guru, dan jam). Simpan berjalan otomatis. Guru yang bentrok jam diberi tanda merah. Guru dan siswa melihat jadwalnya di dashboard dan di menu Jadwal. Guru bisa langsung membuka presensi dari jadwal.
- **Kelas eskul/pengayaan** (Data Akademik → Kelas → **Eskul / Pengayaan**). Anggotanya bisa seluruh siswa dari beberapa rombel dan/atau siswa pilihan. Kelas ini bisa dipakai untuk penugasan mengajar, tugas, ujian CBT, presensi, agenda, dan jadwal. Pembina mendapat menu kelas binaan.
- **Import soal CBT** (Bank Soal → Import). Bisa dari **Word (.docx)**: ketik seperti lembar ujian dengan baris `KUNCI: B` dan gambar ditempel di bawah soal. Bisa juga dari **Excel (.xlsx)**: gambar ditempel di kolom `gambar` pada baris soalnya. Template keduanya tersedia di halaman import. Gambar diperkecil otomatis dan disimpan di Drive.

---

## Bagian A — Perbarui backend Apps Script (±5 menit)

1. Buka proyek Apps Script SMAPATISPA LEARNING yang sudah ada.
2. Buka file **Kode.gs**, hapus seluruh isinya (Ctrl+A → Delete), lalu tempel isi **Kode.gs v2.2.0**. Tekan **Simpan** (Ctrl+S).
3. **Hapus** file HTML **Index**, **Stylesheet**, dan **JavaScript** dari proyek. Klik ⋮ di samping nama file → Hapus. File-file itu sudah pindah ke GitHub.
4. **Tidak perlu** menjalankan `setupAppEnvironment` lagi, karena data sudah ada. Fungsi itu hanya untuk proyek yang benar-benar baru.
5. Pilih fungsi **`cekInstalasi`** → ▶ Jalankan → buka *Log eksekusi*. Semua baris harus ✅, kecuali "Alamat frontend" yang boleh ❌ dulu.
6. Buka **Terapkan → Kelola deployment → ✏️ Edit**, lalu atur:
   - Versi: **Versi baru**
   - Jalankan sebagai: **Saya**
   - Yang memiliki akses: **Siapa saja**

   Klik **Terapkan**. URL `/exec` **tetap sama**.
7. Uji API: buka di browser `URL_EXEC_ANDA?action=config`. Harus tampil teks seperti `{"success":true,"data":{"nama_aplikasi":"SMAPATISPA LEARNING",...`

> ⚠️ Jangan memilih **Deployment baru**, karena itu menghasilkan URL baru yang berbeda. Selalu pakai **Kelola deployment → Edit → Versi baru**.

---

## Bagian B — Pasang frontend di GitHub Pages

### B1. Siapkan folder
1. Ekstrak **smapatispa-learning.zip** (klik kanan → *Extract All*). Folder hasilnya, misalnya `Documents\smapatispa-learning`, **adalah folder proyek**. Isinya harus langsung terlihat seperti ini:
   ```
   smapatispa-learning\
   ├── index.html        ← harus di paling atas
   ├── favicon.svg
   ├── README.md
   ├── PANDUAN-INSTALASI.md
   ├── css\style.css
   └── js\  (config.js, core.js, shell.js, siswa.js, guru.js, umum.js, admin.js, main.js)
   ```
2. Buka **js\config.js** dengan Notepad. Pastikan `GAS_URL` berisi URL `/exec` Anda. Sudah terisi dengan URL yang Anda kirim, jadi cukup dicek.

### B2. Unggah ke GitHub lewat terminal
Jangan memakai tombol **"Upload files"** di web GitHub. Cara itu membuat folder `css/` dan `js/` hilang, sehingga situs rusak.

| Langkah | Perintah / tindakan |
|---|---|
| 1. Install Git | https://git-scm.com/download/win → pengaturan default. Cek: `git --version` |
| 2. Akun GitHub | Daftar di https://github.com. Username akan menjadi bagian alamat situs. |
| 3. Identitas (sekali) | `git config --global user.name "Nama Anda"` dan `git config --global user.email "email@akun-github.com"` |
| 4. Repository baru | github.com → **+** → **New repository**. Nama `smapatispa-learning`, pilih **Public**, **jangan** centang README. |
| 5. Masuk ke folder | Buka folder `smapatispa-learning` di File Explorer, ketik `powershell` di address bar lalu Enter. Cek dengan `dir`: **index.html harus terlihat**. |
| 6. Kirim | `git init` → `git add .` → `git commit -m "Upload pertama"` → `git branch -M main` → `git remote add origin https://github.com/USERNAME/smapatispa-learning.git` → `git push -u origin main` |
| 7. Token | Saat diminta *Password*, tempel **Personal Access Token** (github.com/settings/tokens → *Generate new token (classic)* → centang **repo**). Layar memang tidak menampilkan apa pun saat token ditempel. |
| 8. Aktifkan Pages | Repo → **Settings → Pages**. Source: *Deploy from a branch*, Branch: **main** / **(root)** → Save. Tunggu 1–2 menit. |

Alamat situs Anda: **https://USERNAME.github.io/smapatispa-learning/**

### B3. Cara memperbarui nanti
Dari folder yang sama, jalankan:
```
git add .
git commit -m "keterangan perubahan"
git push
```
Situs diperbarui dalam 1–2 menit. Tekan **Ctrl+Shift+R** bila yang tampil masih versi lama.

---

## Bagian C — Pengaturan setelah online

1. Masuk sebagai Admin, buka **Pengaturan → Login & Akses**, lalu isi **Alamat aplikasi** dengan URL GitHub Pages Anda. Tautan ini dipakai di email/WA pengingat dan email persetujuan pendaftaran.
2. **(Opsional) Masuk dengan Google:**
   1. Buka https://console.cloud.google.com, lalu buat atau pilih project.
   2. Buka **Google Auth Platform** dan isi *Branding* (nama aplikasi dan email). Pilih Audience **External**, lalu klik **Publish app**.
   3. Buka **Clients → Create client → Web application**. Di *Authorized JavaScript origins*, isi `https://USERNAME.github.io` (tanpa nama repo dan tanpa `/` di akhir).
   4. Salin **Client ID**, tempel di Pengaturan → Login & Akses, lalu **Simpan**.

   Tanpa langkah ini, semua pengguna tetap bisa masuk dengan username dan kata sandi.
3. **Hapus data contoh** setelah selesai mencoba: **Dashboard Admin → banner "Data contoh…" → Tinjau & Hapus**, atau **Pengaturan → Cadangan & Log → Tinjau & Hapus Data Contoh**.
   - Yang dihapus: akun guru/siswa contoh (`suwandi`, `andi`, … dan siswa NIS `2223…`) beserta tugas, materi, ujian, soal, presensi, dan agendanya.
   - Akun admin dan akun yang Anda buat atau import tetap aman. Spreadsheet dicadangkan otomatis sebelum menghapus.
   - Kelas contoh yang sudah berisi siswa asli tidak dihapus, cukup ganti namanya di Data Akademik → Kelas.
   - Cara lain: di editor Apps Script, jalankan fungsi `hapusDataContoh`.
4. Ganti kata sandi admin bila masih `admin123`.

---

## Bagian D — Membagikan ke siswa
- Bagikan alamat GitHub Pages lewat WhatsApp atau grup kelas.
- Di HP, siswa bisa memilih menu browser **⋮ → Tambahkan ke Layar Utama** supaya aplikasi terbuka seperti aplikasi biasa.
- Bila sekolah punya Blogger, cukup pasang **tautan atau tombol** ke alamat GitHub Pages (tidak perlu iframe).

---

## Pemecahan masalah

| Yang terlihat | Penyebab | Solusi |
|---|---|---|
| Layar "Alamat server belum diatur" | `GAS_URL` di `js/config.js` kosong atau salah format | Isi URL yang berakhiran `/exec`, lalu `git add .` → `git commit -m "config"` → `git push` |
| "Tidak dapat menghubungi server aplikasi" | URL `/exec` salah, deployment bukan "Siapa saja", atau memakai URL `/dev` | Cek Bagian A langkah 6–7 |
| Layar biru "File css/style.css tidak ditemukan" atau "File JavaScript tidak lengkap" | Struktur folder di GitHub salah | Pastikan `index.html` di root repo, folder `css/` dan `js/` utuh. Unggah lewat terminal. |
| Halaman 404 GitHub Pages | Folder yang di-push salah (index.html tidak di root) atau Pages belum aktif | Buka repo di browser. `index.html` harus terlihat di daftar paling atas. |
| Perubahan tidak muncul | Cache browser | Ctrl+Shift+R, atau buka di jendela Samaran |
| Tombol "Masuk dengan Google" tidak muncul atau error | Client ID belum diisi, atau origin tidak cocok | Origin harus persis `https://USERNAME.github.io` |
| Kode.gs diubah tapi tidak berefek | Belum membuat versi deployment baru | Kelola deployment → Edit → Versi baru |
| Tombol "Template Word/Excel" menampilkan 404 | Folder `templates/` belum ikut di-push | Salin folder `templates` dari ZIP ke folder proyek, lalu `git add .` → `git commit` → `git push` |
| Import Word: soal tidak terbaca | Nomor soal atau huruf pilihan tidak diikuti titik/kurung | Tulis `1. Teks soal` dan `A. pilihan`. Jangan hapus garis `=== MULAI SOAL ===` di template. |
| Import: "Format gambar EMF/WMF tidak didukung" | Gambar ditempel dari aplikasi lain dalam format lama | Simpan gambar sebagai PNG/JPG, lalu tempel ulang ke Word/Excel |
| Jadwal tidak muncul di dashboard guru/siswa | Jadwal belum diisi atau Kode.gs belum versi 2.2.0 | Cek `URL_EXEC?t=1`, lalu isi jadwal di menu Jadwal Pelajaran (Admin) |
| Import akun: *Kelas "XI-2" tidak dikenal* | Kolom `kelas` di berkas tidak cocok dengan nama kelas di **Data Akademik → Kelas** | Tulis nama kelas sesuai daftar di jendela Import (singkatan seperti `XI-2` atau `11-2` diterima bila hanya cocok dengan satu kelas). Bisa juga mengganti nama kelas di Data Akademik sesuai berkas. Template terbaru berisi lembar **Daftar Kelas**. |

Diagnosis kecepatan: buka aplikasi di laptop, tekan F12 → Console, lalu ketik `Perf.table()`. Kolom *server* menunjukkan waktu kerja Apps Script, sedangkan *net* adalah waktu jaringan ditambah pemanasan server.
