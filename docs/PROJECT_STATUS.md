# Status Implementasi dan Roadmap

Dokumen ini merangkum kondisi aktual proyek Boso Jawa AI setelah audit ulang.
Status diverifikasi melalui test backend, build frontend, struktur migration, dan
inspeksi implementasi pada 30 September 2026.

## Ringkasan Kesehatan Proyek

- Working tree bersih saat audit dilakukan.
- 49 backend test lulus.
- Frontend production build berhasil.
- Database migration tersedia sampai revision `20260930_0003`.
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
| Health check | `/health/live` dan `/health/ready` |
| Frontend safety | Error boundary dan halaman 404 |
| SEO dasar | Title dinamis, description, Open Graph, Twitter Card, canonical, dan `robots.txt` |

## Implementasi Parsial dan Batasannya

### Rate Limiting

Rate limiter masih memakai memori proses. Kuota berbeda pada setiap instance,
hilang ketika instance restart, dan belum cocok untuk deployment multi-instance.
Gunakan Redis, Upstash, atau penyimpanan terdistribusi sebelum trafik besar.

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

### Observability

Log JSON dan request ID sudah tersedia, tetapi belum terhubung ke Sentry,
OpenTelemetry, Prometheus, atau layanan alerting. Belum ada dashboard latency,
error rate, biaya/token AI, maupun health check gateway AI.

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

1. CI/CD GitHub Actions untuk test, build, migration check, dan deployment gate.
2. Frontend unit test dan E2E test dengan Vitest/Testing Library/Playwright.
3. Distributed rate limiting menggunakan Redis atau Upstash.
4. Audit trail perubahan konten admin.
5. Security headers: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, dan frame policy.
6. Integrasi error tracking, metrics, dashboard, dan alerting.

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

1. Tambahkan CI GitHub Actions.
2. Tambahkan frontend unit test dan E2E test.
3. Tambahkan security headers.
4. Pindahkan rate limiting ke Redis/Upstash.
5. Implementasikan audit trail admin.
6. Selesaikan import/export dataset AI.
7. Tingkatkan bank soal dan pembelajaran adaptif.
8. Tingkatkan korektor linguistik dan checker macapat.
9. Tambahkan akun, sinkronisasi, audio, dan PWA sesuai kebutuhan pengguna.

## Kesimpulan

Proyek telah berkembang dari MVP kumpulan alat menjadi aplikasi beta yang cukup
lengkap. Fokus selanjutnya sebaiknya bukan memperbanyak halaman, melainkan
memperkuat CI, test frontend, keamanan deployment, observability, serta akurasi
linguistik.
