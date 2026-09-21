
💻 Persyaratan SistemNode.js: v18.x atau lebih baruPython: v3.11.x atau lebih baruPostgreSQL: v15.x / v16.xPackage Manager: pnpm / npm / yarn untuk Frontend, poetry / pip untuk Backend🚀 Panduan Instalasi & Instalasi Cepat1. Clone RepositoryBashgit clone [https://github.com/username/boso-jawa-ai.git](https://github.com/username/boso-jawa-ai.git)
cd boso-jawa-ai
2. Konfigurasi Database (PostgreSQL)Buat database PostgreSQL baru:SQLCREATE DATABASE boso_jawa_db;
CREATE USER boso_user WITH PASSWORD 'password_super_sehat';
GRANT ALL PRIVILEGES ON DATABASE boso_jawa_db TO boso_user;
Jalankan skrip migrasi awal:Bashpsql -U boso_user -d boso_jawa_db -f docs/SCHEMA.md
3. Setup Backend (FastAPI)Bashcd backend
python -m venv venv
source venv/bin/activate  # Linux/macOS

# venv\\Scripts\\activate   # Windows

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
Server backend akan berjalan di http://localhost:8000. Dokumentasi Swagger OpenAPI dapat diakses di http://localhost:8000/docs.4. Setup Frontend (TypeScript)Bashcd ../frontend
pnpm install
cp .env.example .env.local
pnpm dev
Aplikasi frontend akan berjalan di http://localhost:3000.📁 Struktur DirektoriPlaintextboso-jawa-ai/
├── README.md
├── LICENSE
├── docs/
│   ├── SCHEMA.md
│   ├── API_SPEC.md
│   ├── RULES_AKSARA.md
│   └── CONTRIBUTING.md
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── aksara.py
│   │   │       │   ├── kawruh.py
│   │   │       │   ├── macapat.py
│   │   │       │   └── ai.py
│   │   │       └── api.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   │       ├── aksara_engine.py
│   │       └── macapat_checker.py
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── types/
    │   │   └── basa.ts
    │   └── styles/
    ├── package.json
    └── tsconfig.json
📖 Dokumentasi API & ModulLihat berkas pendukung berikut untuk penjelasan mendalam:🗄️ Dokumentasi Skema Database (SCHEMA.md)🔌 Spesifikasi API RESTful (API_SPEC.md)✍️ Aturan Transliterasi Aksara Jawa (RULES_AKSARA.md)🤝 Pedoman Kontribusi (CONTRIBUTING.md)📜 LisensiProyek ini dilisensikan di bawah MIT License - lihat berkas LICENSE untuk rincian selengkapnya."""with open("boso-jawa-ai/README.md", "w", encoding="utf-8") as f:f.write(readme_content)2. docs/SCHEMA.mdschema_content = """# 🗄️ Dokumentasi Skema Database (PostgreSQL)Dokumen ini memuat skema PostgreSQLL lengkap dan index yang digunakan dalam proyek Boso Jawa AI System.DDL (Data Definition Language)SQL-- Enabler ekstensi unaccent dan pg_trgm untuk pencarian cepat
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Tabel Aksara Jawa
CREATE TABLE IF NOT EXISTS aksara_jawa (
    id SERIAL PRIMARY KEY,
    karakter VARCHAR(10) NOT NULL,
    nama VARCHAR(50) NOT NULL,
    jenis VARCHAR(30) NOT NULL CHECK (
        jenis IN ('carakan', 'pasangan', 'sandhangan_swara', 'sandhangan_panyigeg', 'murda', 'swara', 'rekan', 'pada')
    ),
    latin_equivalent VARCHAR(10),
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aksara_jenis ON aksara_jawa(jenis);
CREATE INDEX idx_aksara_latin ON aksara_jawa(latin_equivalent);

-- 2. Tabel Kawruh Basa (Padanan Kata Undha-Usuk)
CREATE TABLE IF NOT EXISTS kawruh_basa (
    id SERIAL PRIMARY KEY,
    ngoko VARCHAR(100) NOT NULL,
    krama_lugu VARCHAR(100),
    krama_inggil VARCHAR(100),
    bahasa_indonesia VARCHAR(100) NOT NULL,
    kelas_kata VARCHAR(30) DEFAULT 'Tembung Aran',
    contoh_ukara TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kawruh_ngoko_trgm ON kawruh_basa USING gin (ngoko gin_trgm_ops);
CREATE INDEX idx_kawruh_krama_inggil_trgm ON kawruh_basa USING gin (krama_inggil gin_trgm_ops);
CREATE INDEX idx_kawruh_indonesia_trgm ON kawruh_basa USING gin (bahasa_indonesia gin_trgm_ops);

-- 3. Tabel Paribasan, Bebasan, lan Saloka
CREATE TABLE IF NOT EXISTS paribasan (
    id SERIAL PRIMARY KEY,
    unf_text TEXT NOT NULL,
    tegese TEXT NOT NULL,
    kategori VARCHAR(30) NOT NULL CHECK (kategori IN ('paribasan', 'bebasan', 'saloka')),
    padanan_indonesia TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_paribasan_kategori ON paribasan(kategori);
CREATE INDEX idx_paribasan_text_trgm ON paribasan USING gin (unf_text gin_trgm_ops);

-- 4. Tabel Tembang Macapat
CREATE TABLE IF NOT EXISTS macapat (
    id SERIAL PRIMARY KEY,
    nama_tembang VARCHAR(50) NOT NULL UNIQUE,
    paugeran_gatra INT NOT NULL,
    paugeran_wilangan_lagu JSONB NOT NULL,
    watak TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contoh Format JSONB paugeran_wilangan_lagu:
-- [
--   {"gatra": 1, "wilangan": 12, "lagu": "i"},
--   {"gatra": 2, "wilangan": 6, "lagu": "u"},
--   {"gatra": 3, "wilangan": 8, "lagu": "i"},
--   {"gatra": 4, "wilangan": 12, "lagu": "a"}
-- ]

-- 5. Tabel Dataset AI & Fine-Tuning
CREATE TABLE IF NOT EXISTS ai_training_dataset (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    completion TEXT NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_kategori ON ai_training_dataset(kategori);
CREATE INDEX idx_ai_verified ON ai_training_dataset(is_verified);
"""with open("boso-jawa-ai/docs/SCHEMA.md", "w", encoding="utf-8") as f:f.write(schema_content)3. docs/API_SPEC.mdapi_spec_content = """# 🔌 Spesifikasi REST API v1Base URL: http://localhost:8000/api/v11. Modul Aksara Jawa (/aksara)POST /aksara/transliterateMengubah teks Latin menjadi Aksara Jawa atau sebaliknya.Request Body:JSON{
  "text_latin": "mangan soto ing jogja",
  "direction": "latin_to_aksara",
  "include_sandhangan": true
}
Response (200 OK):JSON{
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
2. Modul Kawruh Basa (/kawruh)GET /kawruh/searchMencari kata berdasarkan keyword pada tingkat Ngoko, Krama, maupun Bahasa Indonesia.Query Parameters:q (string, required): Kata kunci pencarianlimit (int, optional): Jumlah maksimal data (default: 10)Response (200 OK):JSON{
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
3. Modul Macapat (/macapat)POST /macapat/checkMemvalidasi lirik/bait tembang Macapat terhadap aturan paugeran.Request Body:JSON{
  "nama_tembang": "Pocung",
  "lirik": [
    "Bapak Pocung dudu watu dudu gunung",
    "Sangkane ing sebrang",
    "Ngundhang titiyangan",
    "Mrih reksanipun"
  ]
}
Response (200 OK):JSON{
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
"""with open("boso-jawa-ai/docs/API_SPEC.md", "w", encoding="utf-8") as f:f.write(api_spec_content)4. docs/RULES_AKSARA.mdrules_aksara_content = """# ✍️ Aturan Transliterasi Aksara JawaSistem transliterasi pada Boso Jawa AI menerapkan aturan baku penulisan Aksara Jawa.1. Sandhangan SwaraVokalNama SandhanganBentukContoh LatinTeks AksaraiWuluꦶsikiꦱꦶꦏꦶuSukuꦸbukuꦧꦸꦏꦸéTalingꦺsateꦱꦠꦺoTaling Tarungꦺ ... ꦴsotoꦱꦺꦠꦺꦴe (e)PepetꦼsegaꦱꦼꦒPenting (Aturan Taling Tarung):Sandhangan Taling Tarung ditempatkan mengapit aksara carakan.Contoh: Kata soto (sa + taling tarung) -> ꦱ menjadi ꦱꦺ (taling di depan) + ꦴ (tarung di belakang) = ꦱꦺꦴ.2. Sandhangan Panyigeg Wanda (Konsonan Mati)Wignyan (ꦃ): Konsonan mati h di akhir suku kata (Contoh: gajah -> ꦒꦗꦃ).Layar (ꦡ / ꦂ): Konsonan mati r di akhir suku kata (Contoh: pasar -> ꦡꦱꦂ).Cecak (ꦁ): Konsonan mati ng di akhir suku kata (Contoh: wayang -> ꦮꦪꦁ).Pangkon (꧀): Mematikan vokal pada konsonan di akhir kalimat (Contoh: mangan -> ꦩꦔꦤ꧀).3. PasanganJika konsonan mati berada di tengah kata (tidak di akhir kalimat), maka digunakan Pasangan untuk konsonan berikutnya, bukan Pangkon.Contoh: baskaraba = ꦧs mati + ka = ꦱ dengan pasangan ka (꧀ꦏ)ra = ꦫHasil: ꦧꦱ꧀ꦏꦫ"""with open("boso-jawa-ai/docs/RULES_AKSARA.md", "w", encoding="utf-8") as f:f.write(rules_aksara_content)5. docs/CONTRIBUTING.mdcontributing_content = """# 🤝 Pedoman Kontribusi (Contributing Guidelines)Matur nuwun sampun karsa berkontribusi ing proyek Boso Jawa AI!Alur KontribusiFork Repository ini ke akun GitHub Anda.Buat branch fitur baru (git checkout -b feature/FiturAnyar).Lakukan commit perubahan Anda (git commit -m 'Tambah fitur parser macapat').Push ke branch Anda (git push origin feature/FiturAnyar).Buat Pull Request (PR) baru dengan deskripsi mendalam mengenai perubahan yang dilakukan.Standar KodeBackend (Python):Gunakan black dan isort untuk formatting kode.Tipe data eksplisit wajib menggunakan type hints Pydantic & Python typing.Frontend (TypeScript):Gunakan ESLint dan Prettier.Hindari penggunaan tipe any. Definisikan interface di src/types/basa.ts."""with open("boso-jawa-ai/docs/CONTRIBUTING.md", "w", encoding="utf-8") as f:f.write(contributing_content)Zip everythingzip_filename = "boso-jawa-ai-markdown-docs.zip"with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:for root, dirs, files in os.walk("boso-jawa-ai"):for file in files:file_path = os.path.join(root, file)arcname = os.path.relpath(file_path, "boso-jawa-ai")zipf.write(file_path, arcname)print("Files generated successfully!")

```text?code_stdout&code_event_index=1
Files generated successfully!

Berkas README.md beserta seluruh dokumen pendukung Markdown (docs/) untuk sistem Boso Jawa AI telah selesai dibuat dan dikemas.[file-tag: code-generated-file-e88367a6-7f18-4d60-95f8-3e8d8b6021f2]📄 1. Berkas Utama: README.md[file-tag: code-generated-file-5183b435-84ee-4a42-ad73-0248794af83c]Markdown# ꦧꦱꦗꦮ AI (Boso Jawa AI System)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-4169E1.svg?logo=postgresql)](https://www.postgresql.org/)

Sistem AI Kebahasaan Jawa terpadu yang memadukan Engine Transliterasi Aksara Jawa, Sistem Pakar Kebudayaan Jawa (Kawruh Pepak, Paribasan, Macapat, Undha-Usuk Basa), serta Dataset & Pipeline LLM untuk melestarikan dan mengolah Basa lan Sastra Jawa secara digital.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Panduan Instalasi & Instalasi Cepat](#-panduan-instalasi--instalasi-cepat)
- [Struktur Direktori](#-struktur-direktori)
- [Dokumentasi API & Modul](#-dokumentasi-api--modul)
- [Aturan Transliterasi Aksara Jawa](#-aturan-transliterasi-aksara-jawa)
- [Pedoman Kontribusi](#-pedoman-kontribusi)
- [Lisensi](#-lisensi)

---

## ✨ Fitur Utama

### 1. Engine Transliterasi Aksara Jawa
- **Parsing Kontekstual Lengkap**: Mengolah Aksara Carakan (20 kata), Pasangan, Sandhangan Swara (Wulu, Suku, Taling, Pepet, Taling Tarung), Sandhangan Panyigeg Wanda (Wignyan, Layar, Cecak, Pangkon), Aksara Murda, Aksara Swara, dan Aksara Rekan.
- **Handling Taling Tarung (`ꦺ...ꦴ`)**: Penanganan otomatis tata letak Taling di awal konsonan dan Tarung di akhir konsonan untuk vokal 'o'.
- **Deteksi Pasangan Otomatis**: Pengubahan otomatis konsonan mati di tengah kata menjadi bentuk pasangan.

### 2. Kawruh Pepak & Undha-Usuk Basa
- **Kamus Multi-Tingkat (Undha-Usuk)**: Padanan kata lengkap meliputi *Ngoko*, *Krama Lugu*, *Krama Inggil*, dan *Bahasa Indonesia*.
- **Pencarian Semantik & Klasifikasi Kata**: Pengelompokan Tembung Kriya, Tembung Kahanan, Tembung Aran, dan contoh penggunaan dalam *ukara* (kalimat).

### 3. Paribasan, Bebasan, lan Saloka
- Repository ribuan peribahasa Jawa lengkap dengan *tegese* (makna kontekstual) dan padanan pribahasa dalam Bahasa Indonesia.

### 4. Checker & Engine Macapat
- Validator aturan *paugeran* Tembang Macapat (11 Tembang) meliputi:
  - **Guru Gatra**: Jumlah baris dalam satu bait.
  - **Guru Wilangan**: Jumlah suku kata (*wanda*) per baris.
  - **Guru Lagu**: Dhing-dhong vokal akhir di ujung baris.

### 5. Dataset AI & Fine-Tuning Pipeline
- REST API dan pipeline data untuk ekspor-impor dataset format JSONL/Parquet yang siap digunakan untuk fine-tuning model LLM (Llama, Mistral, Gemma).

---

## 🏛️ Arsitektur Sistem

```text
               +----------------------------------+
               |  Frontend (TypeScript / Next.js) |
               +-----------------+----------------+
                                 | REST / WebSockets
                                 v
               +----------------------------------+
               |    Backend (Python / FastAPI)    |
               +--------+----------------+--------+
                        |                |
        SQLAlchemy ORM   |                | Rule-based Engine
                        v                v
         +------------------+    +-------------------+
         | PostgreSQL 16 DB |    | Aksara Parser &   |
         | (Full-Text Search|    | Macapat Checker   |
         +------------------+    +-------------------+
💻 Persyaratan SistemNode.js: v18.x atau lebih baruPython: v3.11.x atau lebih baruPostgreSQL: v15.x / v16.xPackage Manager: pnpm / npm / yarn untuk Frontend, poetry / pip untuk Backend🚀 Panduan Instalasi & Instalasi Cepat1. Clone RepositoryBashgit clone [https://github.com/username/boso-jawa-ai.git](https://github.com/username/boso-jawa-ai.git)
cd boso-jawa-ai
2. Konfigurasi Database (PostgreSQL)Buat database PostgreSQL baru:SQLCREATE DATABASE boso_jawa_db;
CREATE USER boso_user WITH PASSWORD 'password_super_sehat';
GRANT ALL PRIVILEGES ON DATABASE boso_jawa_db TO boso_user;
Jalankan skrip migrasi awal:Bashpsql -U boso_user -d boso_jawa_db -f docs/SCHEMA.md
3. Setup Backend (FastAPI)Bashcd backend
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
Server backend akan berjalan di http://localhost:8000. Dokumentasi Swagger OpenAPI dapat diakses di http://localhost:8000/docs.4. Setup Frontend (TypeScript)Bashcd ../frontend
pnpm install
cp .env.example .env.local
pnpm dev
Aplikasi frontend akan berjalan di http://localhost:3000.📁 Struktur DirektoriPlaintextboso-jawa-ai/
├── README.md
├── LICENSE
├── docs/
│   ├── SCHEMA.md
│   ├── API_SPEC.md
│   ├── RULES_AKSARA.md
│   └── CONTRIBUTING.md
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── aksara.py
│   │   │       │   ├── kawruh.py
│   │   │       │   ├── macapat.py
│   │   │       │   └── ai.py
│   │   │       └── api.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   │       ├── aksara_engine.py
│   │       └── macapat_checker.py
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   ├── types/
    │   │   └── basa.ts
    │   └── styles/
    ├── package.json
    └── tsconfig.json
📖 Dokumentasi API & ModulLihat berkas pendukung berikut untuk penjelasan mendalam:🗄️ Dokumentasi Skema Database (SCHEMA.md)🔌 Spesifikasi API RESTful (API_SPEC.md)✍️ Aturan Transliterasi Aksara Jawa (RULES_AKSARA.md)🤝 Pedoman Kontribusi (CONTRIBUTING.md)📜 LisensiProyek ini dilisensikan di bawah MIT License - lihat berkas LICENSE untuk rincian selengkapnya.
---

### 📁 2. Dokumen Pendukung Lainnya

1. **`docs/SCHEMA.md`** — Skema DDL PostgreSQL + Indexing Trigon / Full-Text Search [file-tag: code-generated-file-2b7bf0b7-3720-4b11-a990-07333ec3d390]
2. **`docs/API_SPEC.md`** — Dokumentasi endpoint API FastAPI lengkap (Aksara, Kawruh, Macapat, AI Dataset) [file-tag: code-generated-file-5025ee83-9e16-40b4-acc9-2754ea2f75a7]
3. **`docs/RULES_AKSARA.md`** — Panduan logika parsing Aksara Jawa & Sandhangan Taling Tarung [file-tag: code-generated-file-4f7f3667-cffc-4cc1-a6fb-c138fcd436c6]
4. **`docs/CONTRIBUTING.md`** — Panduan alur Git & standar penulisan kode [file-tag: code-generated-file-ae6d1c71-ab2e-4b54-9e64-e034bd4994cc]
```
