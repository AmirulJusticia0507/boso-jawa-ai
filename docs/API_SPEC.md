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
  "text_latin": "mangan soto ing jogja",
  "direction": "latin_to_aksara",
  "include_sandhangan": true
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `text_latin` / `text_aksara` | string | Ya | Teks sumber sesuai `direction` |
| `direction` | string | Ya | `latin_to_aksara` atau `aksara_to_latin` |
| `include_sandhangan` | boolean | Tidak | Default `true` |

Response (200 OK):

```json
{
  "status": "success",
  "data": {
    "original": "mangan soto ing jogja",
    "aksara": "ꦩꦔꦤ꧀ꦱꦺꦠꦺꦴꦲꦶꦁꦗꦺꦴꦒ꧀ꦗ",
    "rules_applied": [
      "Pangkon pada 'n' mati",
      "Taling Tarung pada 'so' dan 'to'",
      "Cecak pada 'ing'",
      "Pasangan 'ja' pada 'gj'"
    ]
  }
}
```

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
    "Sangkane ing sebrang",
    "Ngundhang titiyangan",
    "Mrih reksanipun"
  ]
}
```

Response (200 OK):

```json
{
  "status": "success",
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
    }
  ]
}
```

Daftar `nama_tembang` yang valid mengikuti isi tabel `macapat` (lihat [`SCHEMA.md`](SCHEMA.md)).

---

## 4. Modul Dataset AI (`/ai`) — rencana

Endpoint ekspor-impor dataset `ai_training_dataset` format JSONL/Parquet untuk pipeline fine-tuning LLM. Spesifikasi detail menyusul seiring implementasi backend.
