# Evaluasi Prerender/SSR

## Keputusan

Tetap gunakan SPA + metadata dinamis untuk saat ini. Prerender/SSR belum sebanding dengan biaya operasionalnya karena halaman interaktif bergantung pada API, aplikasi juga dipasang sebagai PWA, dan konten utama sudah memiliki metadata, canonical URL, sitemap, serta teks HTML dasar pada `index.html`.

## Kapan dievaluasi ulang

Tambahkan prerender untuk halaman publik statis (`/kawruh`, `/paribasan`, dan `/macapat`) bila Search Console menunjukkan halaman tidak terindeks atau trafik organik menjadi target utama. Gunakan snapshot statis saat build; SSR penuh baru diperlukan bila konten per permintaan harus terlihat oleh crawler.

## Ukuran keberhasilan

- URL publik terindeks dan canonical benar.
- Judul serta deskripsi per rute terbaca oleh crawler.
- Tidak ada penurunan fungsi PWA atau waktu build yang berarti.
