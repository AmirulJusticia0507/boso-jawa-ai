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
| `limit` | int | Tidak | Jumlah maksimal data (default: 10) |

Contoh: `GET /kawruh/search?q=mangan&limit=10`

Response (200 OK):

```json
{
  "status": "success",
  "total": 1,
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

Backend memakai gateway LLM OpenAI-compatible (BazaarLink). Konfigurasi via `.env`: `BAZAARLINK_BASE_URL`, `BAZAARLINK_API_KEY`, `AI_MODEL` (default `auto:free`). Tanpa key yang valid, endpoint mengembalikan `503`/`502` dengan pesan yang jelas.

### POST `/ai/chat`

Request Body:

```json
{
  "messages": [
    {"role": "system", "content": "Kowe asisten basa Jawa."},
    {"role": "user", "content": "Apa tegese 'becik ketitik ala ketara'?"}
  ],
  "model": "auto:free",
  "temperature": 0.7,
  "max_tokens": 1024
}
```

Field `model` opsional (default dari `AI_MODEL`); format id model `provider/nama`, mis. `openai/gpt-4o`.

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "model": "auto:free",
    "answer": "...jawaban model..."
  }
}
```

### GET `/ai/models`

Daftar id model yang tersedia di gateway.

### Dataset (stub)

`GET /ai/dataset/export` dan `POST /ai/dataset/import` masih `501` — ekspor-impor dataset `ai_training_dataset` format JSONL/Parquet untuk pipeline fine-tuning menyusul.
