# Checklist Monitoring Grafana — Boso Jawa AI

Gunakan checklist ini ketika memantau aplikasi melalui Grafana di
[http://localhost:3300](http://localhost:3300). Login lokal bawaan: `admin` / `admin` -> password baru Le-83-fKGA-EFuH.

## 1. Kesehatan layanan

- [ ] Dashboard menerima data terbaru.
- [ ] Target Prometheus berstatus **UP**.
- [ ] Tidak ada jeda data yang tidak wajar.
- [ ] Endpoint `/health/live` dan `/health/ready` berhasil.
- [ ] Database berstatus siap.

## 2. Jumlah request

- [ ] Pantau panel **Requests / 5m**.
- [ ] Perhatikan lonjakan trafik mendadak.
- [ ] Perhatikan penurunan request hingga nol saat aplikasi seharusnya aktif.
- [ ] Identifikasi endpoint yang paling sering digunakan.
- [ ] Waspadai request berulang yang tidak normal.

## 3. Error rate

- [ ] Periksa respons HTTP `5xx`.
- [ ] Investigasi jika error rate melebihi **1% selama 5 menit**.
- [ ] Anggap kritis jika error rate melebihi **5%**.
- [ ] Periksa respons `401/403` untuk masalah autentikasi atau permission.
- [ ] Periksa respons `429` untuk rate limiting atau trafik berlebihan.
- [ ] Cocokkan waktu error dengan log backend dan Sentry.

## 4. Latency

- [ ] Pantau panel **P95 latency**.
- [ ] Target API biasa berada di bawah **500 ms**.
- [ ] Investigasi jika P95 melampaui **1 detik selama 5 menit**.
- [ ] Endpoint AI boleh lebih lambat, tetapi kenaikan dari baseline harus diperiksa.
- [ ] Cari endpoint yang terus-menerus menjadi paling lambat.
- [ ] Bandingkan latency API dengan database dan gateway AI.

## 5. Request per endpoint

- [ ] Periksa endpoint dengan trafik tertinggi.
- [ ] Periksa endpoint yang mengalami peningkatan error.
- [ ] Waspadai trafik tinggi ke login, AI chat, import, dan endpoint admin.
- [ ] Pastikan label endpoint tidak berisi ID unik yang menyebabkan cardinality tinggi.
- [ ] Investigasi endpoint yang tiba-tiba tidak lagi menerima request.

## 6. AI dan penggunaan token

- [ ] Pantau jumlah request AI berdasarkan model.
- [ ] Periksa latency gateway AI.
- [ ] Pantau request AI berstatus error atau rate-limited.
- [ ] Pantau token prompt dan completion.
- [ ] Waspadai lonjakan token yang dapat meningkatkan biaya.
- [ ] Periksa apakah satu model jauh lebih lambat atau lebih sering gagal.

## 7. Database

- [ ] Pantau latency query database.
- [ ] Waspadai query di atas **500 ms**.
- [ ] Periksa kenaikan latency saat trafik tidak berubah.
- [ ] Cocokkan lonjakan latency database dengan P95 API.
- [ ] Pastikan readiness tidak gagal karena koneksi database.

## 8. Tracing melalui Tempo

- [ ] Pastikan `OTEL_TRACING_ENABLED=true` pada `backend/.env`.
- [ ] Cari trace berdasarkan service `boso-jawa-api`.
- [ ] Buka trace untuk request yang lambat atau gagal.
- [ ] Periksa span yang menghabiskan waktu paling lama.
- [ ] Cocokkan trace dengan `X-Request-ID`.
- [ ] Perhatikan request yang memiliki gap waktu besar antarspan.
- [ ] Pastikan trace tidak memuat password, token, atau data sensitif.

## 9. Kapasitas dan anomali

- [ ] Waspadai jumlah request aktif yang terus meningkat.
- [ ] Perhatikan pola trafik di luar jam penggunaan normal.
- [ ] Periksa lonjakan error bersamaan dengan deployment baru.
- [ ] Bandingkan performa sebelum dan sesudah perubahan aplikasi.
- [ ] Catat baseline trafik, latency, dan error rate normal.

## 10. Pemeriksaan setelah deployment

- [ ] Dashboard masih menerima metrik.
- [ ] Error rate tidak meningkat.
- [ ] P95 latency tidak memburuk.
- [ ] Login pengguna dan admin berhasil.
- [ ] Endpoint AI tetap merespons.
- [ ] Database readiness tetap sehat.
- [ ] Trace dari versi terbaru muncul di Tempo.

## Urutan investigasi saat ada masalah

1. Periksa error rate dan respons `5xx`.
2. Periksa readiness database.
3. Periksa P95 latency dan endpoint yang terdampak.
4. Buka trace request gagal atau lambat di Tempo.
5. Periksa respons `429` dan kondisi rate limiter.
6. Periksa gateway AI dan penggunaan token.
7. Periksa pola trafik yang tidak normal.

## Perintah operasional

Menjalankan stack:

```bash
docker compose -f observability/docker-compose.yml up -d
```

Melihat status container:

```bash
docker compose -f observability/docker-compose.yml ps
```

Melihat log:

```bash
docker compose -f observability/docker-compose.yml logs --tail=100
```

Menghentikan stack:

```bash
docker compose -f observability/docker-compose.yml down
```
