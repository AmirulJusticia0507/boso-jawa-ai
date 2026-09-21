# ✍️ Aturan Transliterasi Aksara Jawa

Sistem transliterasi pada Boso Jawa AI menerapkan aturan baku penulisan Aksara Jawa. Dokumen ini menjadi acuan bagi `aksara_engine` di backend.

## 1. Sandhangan Swara

| Vokal | Nama Sandhangan | Bentuk | Contoh Latin | Teks Aksara |
|-------|-----------------|--------|--------------|-------------|
| i | Wulu | ꦶ | siki | ꦱꦶꦏꦶ |
| u | Suku | ꦸ | buku | ꦧꦸꦏꦸ |
| é | Taling | ꦺ | sate | ꦱꦠꦺ |
| o | Taling Tarung | ꦺ ... ꦴ | soto | ꦱꦺꦠꦺꦴ |
| e (ê) | Pepet | ꦼ | sega | ꦱꦼꦒ |

### Penting — Aturan Taling Tarung

Sandhangan Taling Tarung ditempatkan **mengapit** aksara carakan: Taling (`ꦺ`) di depan konsonan, Tarung (`ꦴ`) di belakang konsonan.

Contoh: kata *soto* (sa + taling tarung) → `ꦱ` menjadi `ꦱꦺ` (taling di depan) + `ꦴ` (tarung di belakang) = `ꦱꦺꦴ`.

## 2. Sandhangan Panyigeg Wanda (Konsonan Mati di Akhir Suku Kata)

- **Wignyan (`ꦃ`)**: konsonan mati *h* di akhir suku kata. Contoh: *gajah* → `ꦒꦗꦃ`.
- **Layar (`ꦂ`)**: konsonan mati *r* di akhir suku kata. Contoh: *pasar* → `ꦥꦱꦂ`.
- **Cecak (`ꦁ`)**: konsonan mati *ng* di akhir suku kata. Contoh: *wayang* → `ꦮꦪꦁ`.
- **Pangkon (`꧀`)**: mematikan vokal pada konsonan di **akhir kata/kalimat**. Contoh: *mangan* → `ꦩꦔꦤ꧀`.

## 3. Pasangan vs Pangkon

Jika konsonan mati berada di **tengah kata** (diikuti konsonan lain, bukan di akhir kata), maka digunakan **Pasangan** untuk konsonan berikutnya — bukan Pangkon.

Contoh: *baskaraba*

- `ꦧ` (ba) + `ꦱ` mati + `ꦏ` (ka) → sa + pasangan ka (`꧀ꦏ`)
- `ꦫ` (ra)

Hasil: `ꦧꦱ꧀ꦏꦫ`

### Ringkasan keputusan engine

1. Vokal bawaan carakan adalah *a* — vokal lain memakai Sandhangan Swara.
2. Konsonan mati di akhir kata → Sandhangan Panyigeg Wanda / Pangkon.
3. Konsonan mati di tengah kata → Pasangan konsonan berikutnya.
4. Vokal *o* selalu diurai menjadi Taling + Tarung yang mengapit konsonan.
