# ꦧꦱꦗꦮ AI (Boso Jawa AI System)

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
- [Panduan Instalasi](#-panduan-instalasi)
- [Struktur Direktori](#-struktur-direktori)
- [Dokumentasi API & Modul](#-dokumentasi-api--modul)
- [Lisensi](#-lisensi)

---

## ✨ Fitur Utama

### 1. Engine Transliterasi Aksara Jawa

- **Parsing Kontekstual Lengkap**: Mengolah Aksara Carakan (20 aksara dasar), Pasangan, Sandhangan Swara (Wulu, Suku, Taling, Pepet, Taling Tarung), Sandhangan Panyigeg Wanda (Wignyan, Layar, Cecak, Pangkon), Aksara Murda, Aksara Swara, dan Aksara Rekan.
- **Handling Taling Tarung (`ꦺ...ꦴ`)**: Penanganan otomatis tata letak Taling di depan konsonan dan Tarung di belakang konsonan untuk vokal 'o'.
- **Deteksi Pasangan Otomatis**: Pengubahan otomatis konsonan mati di tengah kata menjadi bentuk pasangan.

### 2. Kawruh Pepak & Undha-Usuk Basa

- **Kamus Multi-Tingkat (Undha-Usuk)**: Padanan kata lengkap meliputi *Ngoko*, *Krama Lugu*, *Krama Inggil*, dan *Bahasa Indonesia*.
- **Pencarian Semantik & Klasifikasi Kata**: Pengelompokan Tembung Kriya, Tembung Kahanan, Tembung Aran, dan contoh penggunaan dalam *ukara* (kalimat).

### 3. Paribasan, Bebasan, lan Saloka

- Repository peribahasa Jawa lengkap dengan *tegese* (makna kontekstual) dan padanan pribahasa dalam Bahasa Indonesia.

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
        SQLAlchemy ORM  |                | Rule-based Engine
                        v                v
         +------------------+    +-------------------+
         | PostgreSQL 16 DB |    | Aksara Parser &   |
         | (Full-Text Search|    | Macapat Checker   |
         +------------------+    +-------------------+
```

---

## 💻 Persyaratan Sistem

- Node.js: v18.x atau lebih baru
- Python: v3.11.x atau lebih baru
- PostgreSQL: v15.x / v16.x
- Package Manager: pnpm / npm / yarn untuk Frontend, poetry / pip untuk Backend

---

## 🚀 Panduan Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/AmirulJusticia0507/boso-jawa-ai.git
cd boso-jawa-ai
```

### 2. Konfigurasi Database (PostgreSQL)

Buat database dan user PostgreSQL baru (ganti `PASSWORD_ANDA` dengan password yang kuat, idealnya dimuat dari environment variable / secret manager):

```sql
CREATE DATABASE boso_jawa_db;
CREATE USER boso_user WITH PASSWORD 'PASSWORD_ANDA';
GRANT ALL PRIVILEGES ON DATABASE boso_jawa_db TO boso_user;
```

Jalankan DDL skema awal sesuai `docs/SCHEMA.md`:

```bash
psql -U boso_user -d boso_jawa_db -f docs/schema.sql
```

> Catatan: berkas migrasi `docs/schema.sql` dan dokumen pendukung di `docs/` menyusul — lihat [Dokumentasi API & Modul](#-dokumentasi-api--modul).

### 3. Setup Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Server backend akan berjalan di `http://localhost:8000`. Dokumentasi Swagger OpenAPI dapat diakses di `http://localhost:8000/docs`.

> Sesuaikan entry point (`app.main:app`) dengan struktur proyek saat implementasi backend.

### 4. Setup Frontend (TypeScript)

```bash
cd ../frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

Aplikasi frontend akan berjalan di `http://localhost:3000`.

---

## 📁 Struktur Direktori

```plaintext
boso-jawa-ai/
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
```

---

## 📖 Dokumentasi API & Modul

Lihat berkas pendukung berikut untuk penjelasan mendalam *(menyusul)*:

- 🗄️ Dokumentasi Skema Database (`docs/SCHEMA.md`)
- 🔌 Spesifikasi API RESTful (`docs/API_SPEC.md`)
- ✍️ Aturan Transliterasi Aksara Jawa (`docs/RULES_AKSARA.md`)
- 🤝 Pedoman Kontribusi (`docs/CONTRIBUTING.md`)

---

## 📜 Lisensi

Proyek ini dilisensikan di bawah MIT License — lihat berkas [LICENSE](LICENSE) untuk rincian selengkapnya.
