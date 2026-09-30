# 🔌 Spesifikasi REST API v1

Base URL: `http://localhost:8000/api/v1`

Format respons umum:

```json
{
  "status": "success",
  "data": {}
}
```

Respons error:

```json
{
  "status": "error",
  "message": "Deskripsi kesalahan",
  "detail": {}
}
```

---

## 1. Modul Aksara Jawa (`/aksara`)

### POST `/aksara/transliterate`

Mengubah teks Latin menjadi Aksara Jawa atau sebaliknya.

Request Body:

```json
{
  "text": "mangan soto ing jogja",
  "direction": "latin_to_aksara",
  "include_sandhangan": true
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `text` | string | Ya | Teks sumber sesuai `direction` |
| `direction` | string | Ya | `latin_to_aksara` atau `aksara_to_latin` |
| `include_sandhangan` | boolean | Tidak | Default `true`; bila `false`, vokal ditulis carakan polos |

Konvensi huruf `e`: `e` = pepet (mis. "sega"), `é` = taling (mis. "saté"). Detail aturan: [`RULES_AKSARA.md`](RULES_AKSARA.md).

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "original": "mangan soto ing jogja",
    "aksara": "ꦩꦔꦤ꧀ ꦱꦺꦴꦠꦺꦴ ꦲꦶꦁ ꦗꦺꦴꦒ꧀ꦗ",
    "latin": null,
    "rules_applied": [
      "Pangkon pada 'n' mati",
      "Taling Tarung pada 'so'",
      "Taling Tarung pada 'to'",
      "Cecak pada 'ng'",
      "Taling Tarung pada 'jo'",
      "Pasangan 'j' pada 'gj'"
    ]
  }
}
```

Untuk `direction: aksara_to_latin`, field `latin` yang terisi (dan `aksara: null`).

Detail aturan transliterasi: lihat [`RULES_AKSARA.md`](RULES_AKSARA.md).

---

## 2. Modul Kawruh Basa (`/kawruh`)

### GET `/kawruh/search`

Mencari kata berdasarkan keyword pada tingkat Ngoko, Krama, maupun Bahasa Indonesia.

Query Parameters:

| Parameter | Tipe | Wajib | Keterangan |
|-----------|------|-------|------------|
| `q` | string | Ya | Kata kunci pencarian |
| `page` | int | Tidak | Nomor halaman, mulai dari 1 (default: 1) |
| `limit` | int | Tidak | Jumlah maksimal data (default: 10) |

Contoh: `GET /kawruh/search?q=mangan&limit=10`

Response (200 OK):

```json
{
  "status": "success",
  "total": 1,
  "page": 1,
  "limit": 10,
  "has_next": false,
  "data": [
    {
      "id": 12,
      "ngoko": "mangan",
      "krama_lugu": "nedha",
      "krama_inggil": "dhahar",
      "bahasa_indonesia": "makan",
      "kelas_kata": "Tembung Kriya",
      "contoh_ukara": "Bapak dhahar sekul goreng."
    }
  ]
}
```

---

### POST `/kawruh/correct`

Mengganti kata yang ditemukan dalam kamus ke tingkat bahasa tujuan sambil
mempertahankan kapitalisasi, spasi, dan tanda baca.

```json
{
  "text": "Aku arep mangan banjur lunga.",
  "target_level": "krama_inggil"
}
```

`target_level` menerima `ngoko`, `krama_lugu`, atau `krama_inggil`. Respons
memuat kalimat hasil, daftar perubahan kata, arti Indonesia, dan catatan bahwa
konteks sosial serta ragam daerah tetap perlu diperiksa penutur ahli.

---

## 3. Modul Macapat (`/macapat`)

### POST `/macapat/check`

Memvalidasi lirik/bait tembang Macapat terhadap aturan paugeran (guru gatra, guru wilangan, guru lagu).

Request Body:

```json
{
  "nama_tembang": "Pocung",
  "lirik": [
    "Bapak Pocung dudu watu dudu gunung",
    "Sangkane ing sabrang",
    "Elinga pepeling iki",
    "Mrih rahayu donya tumekan akhirat"
  ]
}
```

Response (200 OK):

```json
{
  "status": "success",
  "nama_tembang": "Pocung",
  "is_valid": true,
  "analysis": [
    {
      "gatra": 1,
      "text": "Bapak Pocung dudu watu dudu gunung",
      "target_wilangan": 12,
      "actual_wilangan": 12,
      "target_lagu": "u",
      "actual_lagu": "u",
      "valid": true
    },
    {
      "gatra": 2,
      "text": "Sangkane ing sabrang",
      "target_wilangan": 6,
      "actual_wilangan": 6,
      "target_lagu": "a",
      "actual_lagu": "a",
      "valid": true
    },
    {
      "gatra": 3,
      "text": "Elinga pepeling iki",
      "target_wilangan": 8,
      "actual_wilangan": 8,
      "target_lagu": "i",
      "actual_lagu": "i",
      "valid": true
    },
    {
      "gatra": 4,
      "text": "Mrih rahayu donya tumekan akhirat",
      "target_wilangan": 12,
      "actual_wilangan": 12,
      "target_lagu": "a",
      "actual_lagu": "a",
      "valid": true
    }
  ],
  "errors": []
}
```

Daftar `nama_tembang` yang valid mengikuti isi tabel `macapat` (lihat [`SCHEMA.md`](SCHEMA.md)); bila tabel kosong, backend memakai paugeran bawaan 11 tembang. Tembang yang tidak dikenal mengembalikan `404`.

---

## 4. Modul AI (`/ai`)

Backend memakai gateway LLM OpenAI-compatible. Konfigurasi via `.env`: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` (default `deepseek-v4-flash`). Tanpa key yang valid, endpoint mengembalikan `503`/`502` dengan pesan yang jelas. Nama env lama `BAZAARLINK_BASE_URL`/`BAZAARLINK_API_KEY` masih diterima sebagai alias.

### POST `/ai/chat`

Request Body:

```json
{
  "messages": [
    {"role": "system", "content": "Kowe asisten basa Jawa."},
    {"role": "user", "content": "Apa tegese 'becik ketitik ala ketara'?"}
  ],
  "model": "deepseek-v4-flash",
  "temperature": 0.7,
  "max_tokens": 1024
}
```

Field `model` opsional (default dari `AI_MODEL`); format id model `provider/nama`, mis. `openai/gpt-4o`.

Batas keamanan endpoint: maksimal 20 pesan, 4.000 karakter per pesan,
12.000 karakter per percakapan, dan 4.096 token keluaran. Permintaan chat juga
dibatasi per alamat IP; respons `429` menyertakan header `Retry-After`.

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "model": "deepseek-v4-flash",
    "answer": "...jawaban model...",
    "sources": [
      {
        "category": "kawruh_basa",
        "title": "mangan",
        "content": "Ngoko: mangan; Krama lugu: nedha; Krama inggil: dhahar; Indonesia: makan."
      }
    ]
  }
}
```

Backend mengambil konteks yang relevan dari kamus dan koleksi paribasan,
memasang instruksi sistem milik server, lalu mengembalikan sumber yang dipakai.
Pesan `system` dari klien tidak diteruskan ke model.

### GET `/ai/models`

Daftar id model yang tersedia di gateway.

### Dataset AI (khusus admin)

Seluruh endpoint dataset berada di `/ai/dataset/*` dan **wajib** mengirim header
`X-Admin-Key`. Tanpa kunci yang valid, server membalas `401`. Setiap berhasil
permintaan juga dicatat ke tabel `audit_log`.

#### `GET /ai/dataset/export`

Ekspor dataset fine-tuning. Query: `format` (`jsonl` | `csv` | `json`, default
`jsonl`), `kategori`, `is_verified`, `limit` (maks 10.000), `offset`.

```json
{
  "status": "success",
  "data": {
    "format": "jsonl",
    "count": 2,
    "verified": 1,
    "per_kategori": { "sapaan": 2 },
    "content": "{\"prompt\":\"...\",\"completion\":\"...\"}\n"
  }
}
```

#### `GET /ai/dataset/export/download`

Versi file langsung (body = isi file, bukan JSON). Cocok untuk diunduh browser.

```bash
curl -H "X-Admin-Key: $ADMIN_API_KEY" \
  "https://api.bosojawa.id/api/v1/ai/dataset/export/download?format=csv"
```

#### `GET /ai/dataset/stats`

Ringkasan dataset: `total`, `verified`, `unverified`, `verified_ratio`, dan
sebaran `per_kategori`.

#### `POST /ai/dataset/import`

Impor baris baru dari JSON, JSONL, atau CSV. Isi `items` (array of object) atau
`raw` (string) + `content_type`.

```json
{
  "raw": "{\"prompt\":\"apa kabar\",\"completion\":\"kabar apik\",\"kategori\":\"sapaan\"}",
  "content_type": "application/x-ndjson",
  "mode": "insert",
  "mark_verified": true
}
```

`content_type` yang diterima: `application/json`, `application/x-ndjson`,
`application/jsonl`, `text/jsonl`, `text/csv`, `application/csv`. Kosongkan
untuk mendeteksi format dari isi `raw`.

- Baris tidak valid bersifat non-fatal: dikembalikan di `errors` lengkap dengan
  nomor baris sumber, sementara baris yang sah tetap tersimpan.
- Tambahkan `?strict=true` untuk membatalkan seluruh impor bila ada satu baris
  pun gagal.
- `mode: "upsert"` memperbarui baris yang sudah ada; kunci pencocokan adalah
  pasangan `(kategori, prompt)`, sehingga impor bersifat idempoten.

#### `PATCH /ai/dataset/{id}`

Tandai satu baris terverifikasi atau belum.

```json
{ "is_verified": true, "note": "sudah diperiksa mentor" }
```

### Audit trail

#### `GET /admin/audit-logs`

Butuh `X-Admin-Key`. Query: `action`, `target_table`, `limit` (maks 200),
`offset`. Aksi yang tercatat mencakup `kawruh.*`, `paribasan.*`,
`ai_dataset.*`, `stats.view`, dan `audit_log.view`.

Kunci admin tidak pernah disimpan mentah — hanya sidik jari SHA-256 16 karakter
pada kolom `admin_key_fingerprint`, dan field sensitif pada `changes` ditulis
sebagai `[redacted]`.
