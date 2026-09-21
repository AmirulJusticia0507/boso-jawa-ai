# 🤝 Pedoman Kontribusi (Contributing Guidelines)

Matur nuwun sampun karsa berkontribusi ing proyek Boso Jawa AI!

## Alur Kontribusi

1. Fork repository ini ke akun GitHub Anda.
2. Buat branch fitur baru (`git checkout -b feature/FiturAnyar`).
3. Lakukan commit perubahan Anda (`git commit -m 'Tambah fitur parser macapat'`).
4. Push ke branch Anda (`git push origin feature/FiturAnyar`).
5. Buat Pull Request (PR) baru dengan deskripsi yang jelas mengenai perubahan yang dilakukan.

## Standar Kode

### Backend (Python)

- Gunakan `black` dan `isort` untuk formatting kode.
- Tipe data eksplisit wajib menggunakan type hints (`typing`) dan skema Pydantic.
- Satu endpoint = satu fungsi service yang dapat diuji; sertakan unit test bila menambah logika engine (aksara/macapat).

### Frontend (TypeScript)

- Gunakan ESLint dan Prettier.
- Hindari tipe `any` — definisikan tipe bersama di `src/types/` (mis. `basa.ts`).
- Komponen UI diletakkan di `src/components/`, pemanggilan API di `src/services/`.

## Pesan Commit

Gunakan gaya Conventional Commits agar riwayat mudah dibaca:

- `feat:` fitur baru
- `fix:` perbaikan bug
- `docs:` perubahan dokumentasi
- `refactor:`, `test:`, `chore:` sesuai kebutuhan

Contoh: `docs: tambah RULES_AKSARA`, `feat: endpoint transliterasi aksara`.

## Checklist Pull Request

- [ ] Kode sudah diformat (`black`/`isort` atau ESLint/Prettier lolos).
- [ ] Tidak ada secret/credential yang ikut ter-commit (gunakan `.env`).
- [ ] Dokumentasi terkait diperbarui (`docs/` atau README bila perlu).
- [ ] Untuk perubahan aturan bahasa (aksara, macapat, undha-usuk): cantumkan sumber/rujukan pustaka Jawa yang dipakai.
