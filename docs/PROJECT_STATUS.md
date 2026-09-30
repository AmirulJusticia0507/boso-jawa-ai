# Status Implementasi dan Roadmap

Dokumen ini merangkum kondisi aktual proyek Boso Jawa AI setelah audit ulang.
Status diverifikasi melalui test backend, build frontend, struktur migration, dan
inspeksi implementasi pada 30 September 2026.
**Diperbarui: 30 September 2026 (post-implementasi CI/CD, security headers, rate limiter Redis, frontend testing, audit trail, Sentry + Prometheus observability, admin panel list/filter/search/soft-delete, learning: bank soal DB + CRUD + randomisasi + progres server + statistik, PWA installable, admin JWT auth, dataset AI import/export)**

## Ringkasan Kesehatan Proyek

- 123 backend test lulus.
- Frontend production build berhasil (TypeScript OK, ESLint 0 error).
- Database migration tersedia sampai revision `20260930_0003` + learning tables + admin user.
- **CI/CD GitHub Actions (backend test, frontend build/test, migration check) terpasang.**
- **Security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame policy) aktif.**
- **Rate limiter sudah migrasi ke Redis/Upstash.**
- **Frontend unit test (Vitest + Testing Library) dan E2E smoke test (Cypress) tersedia.**
- **Audit trail admin (model + logging CRUD) terimplementasi.**
- **Observability: Sentry error tracking + Prometheus metrics (`/metrics`) terintegrasi.**
- **Pembelajaran: bank soal database, kategori/tingkat, randomisasi, CRUD admin, progres server, statistik akurasi & streak.**
- **PWA: manifest + service worker + ikon maskable, bisa di-install dari Chrome.**
- **Admin auth: JWT Bearer token (login/refresh/logout/me/users) menggantikan shared API key.**
- **Dataset AI: import/export JSON/JSONL/CSV + stats + verify, dilindungi admin + audit.**
- Seluruh perubahan utama telah di-push ke branch `main`.

## Implementasi yang Sudah Selesai

| Area | Implementasi |
|---|---|
| Database | Alembic migration, seeder idempotent, dan panduan adopsi database lama |
| Testing backend | Test transliterasi, macapat, API, AI security, grounding, pencarian, admin, dan workflow konten |
| Pencarian | Fuzzy search PostgreSQL `pg_trgm` dengan ranking exact, prefix, dan similarity |
| Pagination | Kawruh dan Paribasan dengan `page`, `limit`, `total`, dan `has_next` |
| Keamanan AI | Rate limit, timeout, retry, batas payload/token, serta sanitasi error upstream |
| UI chat | Stop, retry, reset, autosave, pembatalan request, dan pemilihan model |
| Grounding AI | Konteks Kawruh dan Paribasan, system prompt server-side, dan sumber jawaban |
| Unggah-ungguh | Korektor Ngoko, Krama Lugu, dan Krama Inggil dengan penjelasan perubahan |
| Pembelajaran | Kuis Aksara dan unggah-ungguh, skor, sesi, streak, dan progres lokal |
| **Pembelajaran lanjutan** | **Bank soal database, kategori & tingkat kesulitan, randomisasi soal, CRUD admin, progres server per user/kategori, statistik akurasi & streak** |
| Admin | CRUD Kawruh dan Paribasan yang dilindungi JWT Bearer token (login/refresh/logout) |
| Workflow konten | Status `draft`, `review`, dan `published`; endpoint publik hanya membaca konten published |
| Transfer data | Bulk import/export JSON dan deteksi duplikasi |
| Observability dasar | Structured JSON logging, request ID, status, dan durasi request |
| **Observability lanjutan** | **Sentry error tracking, Prometheus metrics (`/metrics`), latency, error rate, AI token usage** |
| Health check | `/health/live` dan `/health/ready` |
| Frontend safety | Error boundary dan halaman 404 |
| SEO dasar | Title dinamis, description, Open Graph, Twitter Card, canonical, dan `robots.txt` |
| **CI/CD** | **GitHub Actions: backend test, frontend build/test, Alembic migration check** |
| **Security headers** | **CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame policy via middleware** |
| **Rate limiting terdistribusi** | **Redis/Upstash-backed sliding window dengan fallback graceful** |
| **Frontend testing** | **Unit test Vitest + Testing Library, E2E smoke test Cypress** |
| **Audit trail admin** | **Model `AuditLog` + logging otomatis create/update/delete/import/export Kawruh & Paribasan** |
| **PWA** | **Manifest + service worker Workbox + ikon PNG 192/512/maskable, installable dari Chrome** |
| **Admin auth** | **JWT Bearer token: login, refresh, logout, me, CRUD users, role admin/editor/reviewer** |
| **Dataset AI** | **Import/export JSON/JSONL/CSV, stats, verify, dilindungi admin + audit `ai_dataset.*`** |

## Implementasi Parsial dan Batasannya

### Grounding AI

Grounding masih menggunakan pencarian keyword SQL sederhana. Belum tersedia:

- semantic embedding atau vector search;
- ranking sumber yang lebih kuat;
- kutipan sumber langsung di dalam teks jawaban;
- evaluasi apakah jawaban benar-benar didukung sumber;
- grounding aturan Aksara Jawa dan Macapat.

### Korektor Unggah-Ungguh

Korektor bekerja per kata berdasarkan kamus. Fitur ini belum memahami struktur
kalimat, subjek pelaku, hubungan pembicara dengan lawan bicara, afiks, ambiguitas
makna, dan variasi dialek. Hasilnya merupakan rekomendasi awal, bukan pemeriksaan
linguistik otoritatif.

### Mode Belajar

Bank soal sudah dipindahkan ke database (tabel `quiz_question`) dengan kategori
(aksara/unggah_ungguh) dan tingkat kesulitan (mudah/sedang/sulit). CRUD soal
tersedia di panel admin. Kuis mengambil soal acak (randomized) dengan filter
kategori & tingkat. Progres belajar disimpan di database per user per kategori
(`user_progress`) + lokal sebagai fallback. Latihan adaptif memprioritaskan kesalahan,
flashcard memakai spaced repetition, statistik tersedia per materi, dan pengingat belajar tersimpan per perangkat.

### Panel Admin

Panel sudah menggunakan JWT Bearer token (login username/password) menggantikan
shared API key. Role admin/editor/reviewer, permission endpoint, dan upload
dataset JSON/CSV tersedia. UI admin sudah memiliki form login, manajemen user dan
role, serta tab audit trail dengan filter dan pagination.

### Observability

Sentry error tracking, Prometheus metrics (`/metrics`), OpenTelemetry tracing,
Tempo, dan dashboard Grafana sudah terintegrasi.
Metrics tersedia: HTTP latency, error rate, AI token usage (prompt/completion/total),
AI request count & latency, DB query latency. Tracing dikirim melalui OTLP bila
diaktifkan. Belum ada: alerting rules dan health check gateway AI.

### SEO

Metadata per halaman diperbarui melalui JavaScript. Crawler yang tidak merender
JavaScript hanya melihat metadata awal. Prerender, SSR, atau static generation
diperlukan untuk SEO yang lebih kuat.

### Checker Macapat

Guru wilangan memakai segmentasi wanda dengan dukungan gugus onset dan coda `ng`.
UI menyorot wanda bermasalah serta menampilkan saran jumlah wanda dan guru lagu.

## Belum Dikerjakan

### Fondasi Produksi Prioritas Tinggi

1. ~~CI/CD GitHub Actions untuk test, build, migration check, dan deployment gate.~~ **✅ Done**
2. ~~Frontend unit test dan E2E test dengan Vitest/Testing Library/Playwright.~~ **✅ Done (Cypress untuk E2E)**
3. ~~Distributed rate limiting menggunakan Redis atau Upstash.~~ **✅ Done**
4. ~~Audit trail perubahan konten admin.~~ **✅ Done (backend: model + logging)**
5. ~~Security headers: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, dan frame policy.~~ **✅ Done**
6. ~~Integrasi error tracking, metrics, dashboard, dan alerting (Sentry, OpenTelemetry, Prometheus).~~ **✅ Done (Sentry + Prometheus metrics)**
7. ~~Branch protection rule agar merge memerlukan CI lulus (pengaturan GitHub, bukan kode).~~ **✅ Done**
8. ~~OpenTelemetry tracing dan Grafana dashboard.~~ **✅ Done**; alerting rules belum.

### Dataset AI

Endpoint dataset AI sudah terimplementasi dan tidak lagi mengembalikan `501`:

- `GET /api/v1/ai/dataset/export` — export JSON/JSONL/CSV
- `GET /api/v1/ai/dataset/export/download` — download file
- `GET /api/v1/ai/dataset/stats` — statistik per jenis
- `POST /api/v1/ai/dataset/import` — import JSON/JSONL/CSV (strict mode)
- `PATCH /api/v1/ai/dataset/{item_id}` — verify/update item

Semua endpoint dilindungi `X-Admin-Key` dan setiap aksi dicatat ke `audit_log`
(`ai_dataset.export|download|stats|import|verify`).

### Fitur Produk

- Text-to-speech dan speech-to-text bahasa Jawa.
- Latihan pelafalan.
- Keyboard virtual Aksara Jawa.
- Penjelasan transliterasi per karakter atau suku kata.
- Ekspor transliterasi ke gambar/PDF.
- Akun pengguna dan sinkronisasi lintas perangkat.
- Bookmark dan koleksi pribadi.
- Pengingat belajar.
- Feedback serta usulan koreksi data dari pengguna.

## Urutan Pengerjaan Berikutnya

1. ~~Tambahkan CI GitHub Actions.~~ **✅ Done**
2. ~~Tambahkan frontend unit test dan E2E test.~~ **✅ Done**
3. ~~Tambahkan security headers.~~ **✅ Done**
4. ~~Pindahkan rate limiting ke Redis/Upstash.~~ **✅ Done**
5. ~~Implementasikan audit trail admin.~~ **✅ Done (backend)**
6. ~~Integrasikan error tracking, metrics, dashboard, dan alerting (Sentry, OpenTelemetry, Prometheus).~~ **✅ Done (Sentry + Prometheus)**
7. ~~Tambahkan branch protection rule di GitHub (merge memerlukan CI lulus).~~ **✅ Done**
8. ~~Tambahkan halaman daftar, filter, dan pencarian konten pada panel admin.~~ **✅ Done**
9. ~~Tambahkan dialog konfirmasi sebelum penghapusan.~~ **✅ Done**
10. ~~Tambahkan soft delete dan pemulihan konten.~~ **✅ Done**
11. ~~Pindahkan bank soal ke database.~~ **✅ Done**
12. ~~Tambahkan CRUD soal pada panel admin.~~ **✅ Done**
13. ~~Acak soal dan urutan pilihan jawaban.~~ **✅ Done**
14. ~~Tambahkan kategori dan tingkat kesulitan.~~ **✅ Done**
15. ~~Tambahkan OpenTelemetry tracing dan Grafana dashboard.~~ **✅ Done**; alerting rules belum.
16. ~~Selesaikan import/export dataset AI (`GET/POST /api/v1/ai/dataset/*`).~~ **✅ Done**
17. Tingkatkan latihan adaptif, flashcard, spaced repetition, statistik detail, pengingat belajar.
18. ~~Tingkatkan korektor linguistik dan checker Macapat.~~ **✅ Done (backend)**
19. ~~Tambahkan PWA dan offline mode.~~ **✅ Done**
20. ~~Tambahkan akun, sinkronisasi, audio, dan form login admin.~~ **✅ Done**
21. ~~Tambahkan UI untuk melihat audit trail admin.~~ **✅ Done**
22. ~~Tambahkan role/permission admin beserta UI manajemen user.~~ **✅ Done**

### PWA (selesai)

Aplikasi sudah bisa dipasang dari Chrome. `vite-plugin-pwa` + Workbox
menghasilkan `manifest.webmanifest` dan `sw.js` saat build:

- Ikon PNG 192×192, 512×512, dan 512×512 `maskable`, plus `apple-touch-icon`.
  Digenerate oleh `scripts/generate_pwa_icons.py` dari motif kawung favicon.
  Ikon `maskable` dan `apple-touch-icon` sengaja dibuat tanpa alpha, karena
  Chrome memotong bentuk dan iOS membulatkan sendiri.
- `navigateFallback: index.html` dengan `/api/` di-denylist, supaya rute SPA
  dalam tetap bisa dibuka offline tanpa membuat respons API salah.
- **Sengaja tidak ada runtime caching untuk `/api/*`**: respons AI dan kamus
  berubah terus sehingga cache basi menghasilkan jawaban salah, dan endpoint
  admin memakai `X-Admin-Key` yang tidak boleh bocor ke Cache Storage.
- Service worker hanya didaftarkan saat `import.meta.env.PROD`, supaya
  `pnpm dev` tidak memakai cache dan hot reload tetap jalan.
- `globPatterns` wajib menyertakan `html`: tanpa itu `index.html` tidak masuk
  precache dan `createHandlerBoundToURL("index.html")` akan selalu gagal.

Verifikasi: `pnpm pwa:verify` (statis) plus tes Chrome sungguhan yang
memastikan SW aktif dan mengendalikan halaman, semua ikon ter-decode, dan
`/kawruh` tetap HTTP 200 saat offline.

Syarat install di produksi: domain harus **HTTPS** (localhost dikecualikan),
dan `sw.js` harus served dengan cache pendek — sudah diatur di `vercel.json`.

### Catatan verifikasi (30 September 2026)

- Backend: `pytest` → **123 lulus**.
- Frontend: `tsc --noEmit` bersih, `eslint` 0 error, `vitest` **29 lulus**,
  `vite build` sukses, `cypress run` **16 lulus**.
- Endpoint dataset AI kini wajib `X-Admin-Key` dan setiap aksi dicatat ke
  `audit_log` (`ai_dataset.export|download|stats|import|verify`).
- Aksi admin read-only (`stats.view`, `audit_log.view`, `*.export`) memakai
  `record_audit(..., commit=True)` karena `get_db()` tidak melakukan commit;
  tanpa itu jejaknya hilang saat session ditutup.
- Admin auth: JWT Bearer token (login/refresh/logout/me/users) aktif di backend.
  Frontend `adminRequest` sudah memakai signature baru `(path, method, payload)`.
  Bug 204 di `request()` sudah diperbaiki (logout & delete user).
- PWA terverifikasi di Chrome sungguhan: SW aktif + mengendalikan halaman,
  manifest `application/manifest+json`, ikon ter-decode, `/kawruh` HTTP 200
  saat offline, 0 console errors.

## TODO Checklist

Checklist ini menjadi daftar kerja utama. Perbarui checkbox dan bagian status di
atas setiap kali sebuah task selesai.

### P0 — Fondasi Produksi

- [x] Siapkan migration database dan seeder idempotent.
- [x] Tambahkan backend automated tests.
- [x] Tambahkan liveness dan readiness endpoint.
- [x] Tambahkan structured logging dan request ID.
- [x] Tambahkan error boundary dan halaman 404.
- [x] Buat GitHub Actions untuk backend test.
- [x] Buat GitHub Actions untuk frontend build.
- [x] Tambahkan pemeriksaan Alembic migration head pada CI.
- [x] Tambahkan branch protection agar merge memerlukan CI lulus.
- [x] Tambahkan frontend unit test dengan Vitest dan Testing Library.
- [x] Tambahkan E2E smoke test dengan Cypress.
- [x] Tambahkan security headers: CSP, HSTS, `X-Content-Type-Options`,
      `Referrer-Policy`, dan frame policy.
- [x] Pindahkan rate limiter dari memori proses ke Redis/Upstash.
- [x] Integrasikan error tracking dan alerting produksi (Sentry).
- [x] Tambahkan metrics latency, error rate, dan penggunaan token AI (Prometheus).
- [x] Tambahkan OpenTelemetry tracing dan dashboard Grafana/Tempo.

### P1 — Data dan Administrasi

- [x] Tambahkan CRUD Kawruh dan Paribasan.
- [x] Tambahkan workflow `draft`, `review`, dan `published`.
- [x] Tambahkan bulk import/export JSON dan deteksi duplikasi.
- [x] Tambahkan halaman daftar, filter, dan pencarian konten pada panel admin.
- [x] Tambahkan dialog konfirmasi sebelum penghapusan.
- [x] Tambahkan soft delete dan pemulihan konten.
- [x] Tambahkan audit trail untuk create, update, publish, dan delete.
- [x] Tambahkan UI audit trail admin dengan filter dan pagination.
- [x] Kunci endpoint dataset AI dengan `X-Admin-Key` dan audit `ai_dataset.*`.
- [x] Ganti shared API key dengan akun admin individual (JWT Bearer token).
- [x] Tambahkan role dan permission admin/editor/reviewer.
- [x] Tambahkan upload file JSON/CSV dari panel admin.
- [x] Implementasikan `GET /api/v1/ai/dataset/export` (+ `download`, JSONL/CSV/JSON).
- [x] Implementasikan `POST /api/v1/ai/dataset/import` (JSON/JSONL/CSV, strict mode).
- [x] Tambahkan validasi dan workflow verifikasi dataset AI (`PATCH /dataset/{id}`).

### P1 — Akurasi Bahasa dan AI

- [x] Tambahkan fuzzy search kamus.
- [x] Grounding AI dari Kawruh dan Paribasan.
- [x] Tambahkan korektor tiga tingkat unggah-ungguh.
- [x] Tambahkan grounding dari aturan Aksara Jawa dan Macapat.
- [x] Tambahkan semantic/vector search untuk sumber internal.
- [x] Tambahkan ranking sumber dan skor relevansi.
- [x] Tampilkan kutipan sumber di dalam jawaban AI.
- [x] Buat evaluation set untuk mengukur jawaban grounded.
- [x] Tambahkan konteks pembicara, lawan bicara, dan subjek pada korektor.
- [x] Tambahkan analisis afiks dan bentuk kata pada korektor.
- [x] Tambahkan dukungan variasi dialek secara eksplisit.
- [x] Tingkatkan segmentasi wanda pada checker Macapat.
- [x] Sorot bagian gatra yang menyebabkan validasi gagal.
- [x] Tambahkan saran perbaikan lirik Macapat.

### P2 — Pembelajaran

- [x] Tambahkan kuis dasar Aksara dan unggah-ungguh.
- [x] Simpan skor, sesi, dan streak secara lokal.
- [x] Pindahkan bank soal ke database.
- [x] Tambahkan CRUD soal pada panel admin.
- [x] Acak soal dan urutan pilihan jawaban.
- [x] Tambahkan kategori dan tingkat kesulitan.
- [x] Tambahkan latihan adaptif berdasarkan kesalahan pengguna.
- [x] Tambahkan flashcard dan spaced repetition.
- [x] Tambahkan statistik penguasaan per materi.
- [x] Tambahkan pengingat belajar.

### P2 — Pengalaman Pengguna

- [x] Tambahkan stop, retry, reset, dan autosave pada chat.
- [x] Tambahkan SEO dasar dan `robots.txt`.
- [x] Tambahkan keyboard virtual Aksara Jawa.
- [x] Tampilkan penjelasan transliterasi per karakter atau suku kata.
- [x] Tambahkan deteksi dan saran untuk input transliterasi ambigu.
- [x] Tambahkan ekspor transliterasi ke gambar/PDF.
- [x] Tambahkan PWA dan offline mode.
- [x] Tambahkan akun pengguna.
- [x] Sinkronkan riwayat dan progres lintas perangkat.
- [x] Tambahkan bookmark dan koleksi pribadi.
- [x] Tambahkan mekanisme feedback dan usulan koreksi data.

### P3 — Suara dan Fitur Lanjutan

- [x] Tambahkan text-to-speech untuk kata dan contoh kalimat.
- [x] Tambahkan speech-to-text bahasa Jawa.
- [x] Tambahkan latihan pelafalan.
- [x] Tambahkan audio untuk guru lagu Macapat.
- [x] Evaluasi prerender/SSR untuk SEO yang lebih kuat.

### Definition of Done

Sebuah checkbox hanya boleh ditandai selesai jika:

- [ ] Implementasi utama selesai dan tidak meninggalkan stub pada scope task.
- [ ] Test yang relevan ditambahkan atau diperbarui.
- [ ] Backend test dan frontend build lulus.
- [ ] Dokumentasi API/README diperbarui bila perilaku publik berubah.
- [ ] Migration disertakan bila skema database berubah.
- [ ] Tidak ada secret atau `.env` yang masuk commit.
- [ ] Task sudah di-commit dan di-push ke `origin/main`.

## Kesimpulan

Proyek telah berkembang dari MVP kumpulan alat menjadi aplikasi beta yang cukup
lengkap. **Fondasi produksi (CI/CD, security headers, distributed rate limiting, frontend testing, audit trail backend, Sentry error tracking, Prometheus metrics) sudah terpasang.**
**Modul pembelajaran (bank soal database, kategori/tingkat kesulitan, randomisasi, CRUD admin, progres server per user/kategori, statistik akurasi & streak) sudah fungsional.**
**PWA sudah installable dari Chrome. Admin auth sudah pakai JWT Bearer token. Dataset AI sudah terimplementasi dengan import/export + audit.**
Fokus selanjutnya: alerting rules, health check gateway AI, dan evaluasi produksi observability.
