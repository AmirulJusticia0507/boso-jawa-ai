# Status Implementasi dan Roadmap

Dokumen ini merangkum kondisi aktual proyek Boso Jawa AI setelah audit ulang.
Status diverifikasi melalui test backend, build frontend, struktur migration, dan
inspeksi implementasi pada 30 September 2026.
**Diperbarui: 30 September 2026 (post-implementasi CI/CD, security headers, rate limiter Redis, frontend testing, audit trail, Sentry + Prometheus observability)**

## Ringkasan Kesehatan Proyek

- 103 backend test lulus.
- Frontend production build berhasil.
- Database migration tersedia sampai revision `20260930_0003`.
- **CI/CD GitHub Actions (backend test, frontend build/test, migration check) terpasang.**
- **Security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, frame policy) aktif.**
- **Rate limiter sudah migrasi ke Redis/Upstash.**
- **Frontend unit test (Vitest + Testing Library) dan E2E smoke test (Cypress) tersedia.**
- **Audit trail admin (model + logging CRUD) terimplementasi.**
- **Observability: Sentry error tracking + Prometheus metrics (`/metrics`) terintegrasi.**
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
| Admin | CRUD Kawruh dan Paribasan yang dilindungi `ADMIN_API_KEY` |
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

Mode belajar memakai enam soal tetap dan progres lokal. Belum ada bank soal dari
database, randomisasi, tingkat kesulitan, latihan adaptif, spaced repetition,
sinkronisasi progres, atau pengelolaan soal melalui panel admin.

### Panel Admin

Panel menggunakan satu shared API key. Belum ada akun individual, role dan
permission, audit trail, halaman daftar konten lengkap, review/approval khusus,
konfirmasi penghapusan, pemulihan data, atau upload file langsung.
*(Catatan: audit trail backend sudah ada model & logging, belum ada UI untuk melihatnya)*

### Observability

Sentry error tracking dan Prometheus metrics (`/metrics`) sudah terintegrasi.
Metrics tersedia: HTTP latency, error rate, AI token usage (prompt/completion/total),
AI request count & latency, DB query latency. Belum ada: OpenTelemetry tracing,
dashboard visualisasi (Grafana), alerting rules, health check gateway AI.

### SEO

Metadata per halaman diperbarui melalui JavaScript. Crawler yang tidak merender
JavaScript hanya melihat metadata awal. Prerender, SSR, atau static generation
diperlukan untuk SEO yang lebih kuat.

### Checker Macapat

Guru wilangan masih dihitung dengan heuristik gugus vokal. Belum ada segmentasi
wanda linguistik, penyorotan bagian yang salah, saran perbaikan gatra, generator
alternatif, atau sumber variasi paugeran yang terstruktur.

## Belum Dikerjakan

### Fondasi Produksi Prioritas Tinggi

1. ~~CI/CD GitHub Actions untuk test, build, migration check, dan deployment gate.~~ **✅ Done**
2. ~~Frontend unit test dan E2E test dengan Vitest/Testing Library/Playwright.~~ **✅ Done (Cypress untuk E2E)**
3. ~~Distributed rate limiting menggunakan Redis atau Upstash.~~ **✅ Done**
4. ~~Audit trail perubahan konten admin.~~ **✅ Done (backend: model + logging)**
5. ~~Security headers: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, dan frame policy.~~ **✅ Done**
6. ~~Integrasi error tracking, metrics, dashboard, dan alerting (Sentry, OpenTelemetry, Prometheus).~~ **✅ Done (Sentry + Prometheus metrics)**
7. Branch protection rule agar merge memerlukan CI lulus (pengaturan GitHub, bukan kode).
8. OpenTelemetry tracing, Grafana dashboard, alerting rules.

### Dataset AI

Endpoint berikut masih mengembalikan `501`:

- `GET /api/v1/ai/dataset/export`
- `POST /api/v1/ai/dataset/import`

Format JSONL/Parquet, validasi dataset, dan workflow verifikasi fine-tuning belum
diimplementasikan.

### Fitur Produk

- Text-to-speech dan speech-to-text bahasa Jawa.
- Latihan pelafalan.
- Keyboard virtual Aksara Jawa.
- Penjelasan transliterasi per karakter atau suku kata.
- Ekspor transliterasi ke gambar/PDF.
- Akun pengguna dan sinkronisasi lintas perangkat.
- Bookmark dan koleksi pribadi.
- PWA dan offline mode.
- Pengingat belajar.
- Feedback serta usulan koreksi data dari pengguna.

## Urutan Pengerjaan Berikutnya

1. ~~Tambahkan CI GitHub Actions.~~ **✅ Done**
2. ~~Tambahkan frontend unit test dan E2E test.~~ **✅ Done**
3. ~~Tambahkan security headers.~~ **✅ Done**
4. ~~Pindahkan rate limiting ke Redis/Upstash.~~ **✅ Done**
5. ~~Implementasikan audit trail admin.~~ **✅ Done (backend)**
6. ~~Integrasikan error tracking, metrics, dashboard, dan alerting (Sentry, OpenTelemetry, Prometheus).~~ **✅ Done (Sentry + Prometheus)**
7. Tambahkan branch protection rule di GitHub (merge memerlukan CI lulus).
8. Tambahkan OpenTelemetry tracing, Grafana dashboard, alerting rules.
9. Selesaikan import/export dataset AI (`GET/POST /api/v1/ai/dataset/*`).
10. Tingkatkan bank soal dan pembelajaran adaptif.
11. Tingkatkan korektor linguistik dan checker Macapat.
12. Tambahkan akun, sinkronisasi, audio, dan PWA sesuai kebutuhan pengguna.
13. Tambahkan UI untuk melihat audit trail admin.
14. Tambahkan soft delete & pemulihan konten, role/permission admin.

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
- [ ] Tambahkan branch protection agar merge memerlukan CI lulus.
- [x] Tambahkan frontend unit test dengan Vitest dan Testing Library.
- [x] Tambahkan E2E smoke test dengan Cypress.
- [x] Tambahkan security headers: CSP, HSTS, `X-Content-Type-Options`,
      `Referrer-Policy`, dan frame policy.
- [x] Pindahkan rate limiter dari memori proses ke Redis/Upstash.
- [x] Integrasikan error tracking dan alerting produksi (Sentry).
- [x] Tambahkan metrics latency, error rate, dan penggunaan token AI (Prometheus).

### P1 — Data dan Administrasi

- [x] Tambahkan CRUD Kawruh dan Paribasan.
- [x] Tambahkan workflow `draft`, `review`, dan `published`.
- [x] Tambahkan bulk import/export JSON dan deteksi duplikasi.
- [ ] Tambahkan halaman daftar, filter, dan pencarian konten pada panel admin.
- [ ] Tambahkan dialog konfirmasi sebelum penghapusan.
- [ ] Tambahkan soft delete dan pemulihan konten.
- [x] Tambahkan audit trail untuk create, update, publish, dan delete.
- [ ] Ganti shared API key dengan akun admin individual.
- [ ] Tambahkan role dan permission admin/editor/reviewer.
- [ ] Tambahkan upload file JSON/CSV dari panel admin.
- [ ] Implementasikan `GET /api/v1/ai/dataset/export`.
- [ ] Implementasikan `POST /api/v1/ai/dataset/import`.
- [ ] Tambahkan validasi dan workflow verifikasi dataset AI.

### P1 — Akurasi Bahasa dan AI

- [x] Tambahkan fuzzy search kamus.
- [x] Grounding AI dari Kawruh dan Paribasan.
- [x] Tambahkan korektor tiga tingkat unggah-ungguh.
- [ ] Tambahkan grounding dari aturan Aksara Jawa dan Macapat.
- [ ] Tambahkan semantic/vector search untuk sumber internal.
- [ ] Tambahkan ranking sumber dan skor relevansi.
- [ ] Tampilkan kutipan sumber di dalam jawaban AI.
- [ ] Buat evaluation set untuk mengukur jawaban grounded.
- [ ] Tambahkan konteks pembicara, lawan bicara, dan subjek pada korektor.
- [ ] Tambahkan analisis afiks dan bentuk kata pada korektor.
- [ ] Tambahkan dukungan variasi dialek secara eksplisit.
- [ ] Tingkatkan segmentasi wanda pada checker Macapat.
- [ ] Sorot bagian gatra yang menyebabkan validasi gagal.
- [ ] Tambahkan saran perbaikan lirik Macapat.

### P2 — Pembelajaran

- [x] Tambahkan kuis dasar Aksara dan unggah-ungguh.
- [x] Simpan skor, sesi, dan streak secara lokal.
- [ ] Pindahkan bank soal ke database.
- [ ] Tambahkan CRUD soal pada panel admin.
- [ ] Acak soal dan urutan pilihan jawaban.
- [ ] Tambahkan kategori dan tingkat kesulitan.
- [ ] Tambahkan latihan adaptif berdasarkan kesalahan pengguna.
- [ ] Tambahkan flashcard dan spaced repetition.
- [ ] Tambahkan statistik penguasaan per materi.
- [ ] Tambahkan pengingat belajar.

### P2 — Pengalaman Pengguna

- [x] Tambahkan stop, retry, reset, dan autosave pada chat.
- [x] Tambahkan SEO dasar dan `robots.txt`.
- [ ] Tambahkan keyboard virtual Aksara Jawa.
- [ ] Tampilkan penjelasan transliterasi per karakter atau suku kata.
- [ ] Tambahkan deteksi dan saran untuk input transliterasi ambigu.
- [ ] Tambahkan ekspor transliterasi ke gambar/PDF.
- [ ] Tambahkan PWA dan offline mode.
- [ ] Tambahkan akun pengguna.
- [ ] Sinkronkan riwayat dan progres lintas perangkat.
- [ ] Tambahkan bookmark dan koleksi pribadi.
- [ ] Tambahkan mekanisme feedback dan usulan koreksi data.

### P3 — Suara dan Fitur Lanjutan

- [ ] Tambahkan text-to-speech untuk kata dan contoh kalimat.
- [ ] Tambahkan speech-to-text bahasa Jawa.
- [ ] Tambahkan latihan pelafalan.
- [ ] Tambahkan audio untuk guru lagu Macapat.
- [ ] Evaluasi prerender/SSR untuk SEO yang lebih kuat.

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
Fokus selanjutnya: OpenTelemetry tracing, Grafana dashboard, alerting rules, AI dataset import/export, bank soal adaptif, korektor linguistik, checker Macapat, serta fitur user-facing (akun, sinkronisasi, audio, PWA).
