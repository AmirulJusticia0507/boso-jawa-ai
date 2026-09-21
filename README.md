# ꦧꦱꦗꦮ AI (Boso Jawa AI System)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.13-blue?logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?logo=vite)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-06B6D4.svg?logo=tailwindcss)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1.svg?logo=postgresql)](https://postgresql.org)
[![Mangum](https://img.shields.io/badge/Mangum-0.22-9B59B6.svg)](https://mangum.io)

Sistem AI Kebahasaan Jawa terpadu yang memadukan Engine Transliterasi Aksara Jawa, Sistem Pakar Kebudayaan Jawa (Kawruh Pepak, Paribasan, Macapat, Undha-Usuk Basa), serta Gateway LLM OpenAI-compatible (BazaarLink) untuk melestarikan dan mengolah Basa lan Sastra Jawa secara digital.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Teknologi](#-teknologi)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Panduan Instalasi](#-panduan-instalasi)
- [Struktur Direktori](#-struktur-direktori)
- [Dokumentasi API & Modul](#-dokumentasi-api--modul)
- [Deploy Vercel](#-deploy-vercel)
- [Lisensi](#-lisensi)

---

## ✨ Fitur Utama

### 1. Engine Transliterasi Aksara Jawa

- **Parsing Kontekstual Lengkap**: Mengolah Aksara Carakan (20 aksara dasar), Pasangan, Sandhangan Swara (Wulu, Suku, Taling, Pepet, Taling Tarung), Sandhangan Panyigeg Wanda (Wignyan, Layar, Cecak, Pangkon), Aksara Murda, Aksara Swara, dan Aksara Rekan.
- **Handling Taling Tarung (`ꦺ...ꦴ`)**: Penanganan otomatis tata letak Taling di depan konsonan dan Tarung di belakang konsonan untuk vokal 'o'.
- **Deteksi Pasangan Otomatis**: Pengubahan otomatis konsonan mati di tengah kata menjadi bentuk pasangan.
- **Roundtrip penuh**: Latin → Aksara → Latin terjaga konsistensinya.

### 2. Kawruh Pepak & Undha-Usuk Basa

- **Kamus Multi-Tingkat (Undha-Usuk)**: Padanan kata lengkap meliputi *Ngoko*, *Krama Lugu*, *Krama Inggil*, dan *Bahasa Indonesia*.
- **Pencarian Semantik**: Fuzzy search via trigram index (PostgreSQL `pg_trgm`).
- **Klasifikasi Kata**: Pengelompokan Tembung Kriya, Tembung Kahanan, Tembung Aran, dan contoh penggunaan dalam *ukara* (kalimat).

### 3. Paribasan, Bebasan, lan Saloka

- Repository peribahasa Jawa lengkap dengan *tegese* (makna kontekstual) dan padanan pribahasa dalam Bahasa Indonesia.

### 4. Checker & Engine Macapat

- Validator aturan *paugeran* Tembang Macapat (11 Tembang): **Guru Gatra** (jumlah baris), **Guru Wilangan** (jumlah suku kata/wanda per baris), dan **Guru Lagu** (vokal akhir di ujung baris).
- Paugeran 11 tembang termuat di database dan digunakan sebagai fallback bila tabel `macapat` kosong.

### 5. Gateway LLM (BazaarLink)

- **OpenAI-compatible**: Integrasi langsung ke [BazaarLink](https://bazaarlink.ai) — gateway LLM berbasis Taiwan dengan 190+ model (GPT, Claude, Gemini, DeepSeek, Llama, Qwen).
- **Model default**: `auto:free` (zero-cost inference, otomatis memilih model gratis).
- **Fitur**: List model, chat completion dengan system/user messages.

---

## 🏛️ Arsitektur Sistem

```text
               +----------------------------------+
               |  Frontend (Vite + React + TS)  |
               +-----------------+----------------+
                                 | REST (fetch)
                                 v
               +----------------------------------+
               |    Backend (Python / FastAPI)    |
               +--------+----------------+--------+
                        |                |
        SQLAlchemy 2.0 |                | Rule-based Engine
                        v                v
         +------------------+    +-------------------+
         | PostgreSQL 18 DB |    | Aksara Parser &   |
         | (pg_trgm index)  |    | Macapat Checker   |
         +------------------+    +-------------------+
                                 |
                                 v
               +----------------------------------+
               |  BazaarLink API Gateway          |
               |  (auto:free / openai/gpt-4o,     |
               |   anthropic/claude-*, dst.)       |
               +----------------------------------+
```

---

## 🔧 Teknologi

| Layer | Teknologi |
|-------|-----------|
| Backend | Python 3.13, FastAPI 0.110, SQLAlchemy 2.0, Pydantic v2 |
| Database | PostgreSQL 18, `pg_trgm`, `unaccent` extension, JSONB |
| LLM Gateway | BazaarLink (OpenAI-compatible), `openai` SDK |
| Serverless | Mangum adapter untuk Vercel |
| Frontend | TypeScript 5.6, React 18, Vite 6, React Router |
| Styling | Tailwind CSS 4.4, tema Sogan-Prada-Kawung, motif batik |
| Fonts | Noto Sans Javanese (self-host), Fraunces (self-host) |
| Lint/Format | ESLint, Prettier, Black, isort (backend) |

---

## 💻 Persyaratan Sistem

| Komponen | Versi |
|----------|-------|
| Node.js | v20.x atau lebih baru |
| Python | v3.11.x atau lebih baru |
| PostgreSQL | v15.x / v16.x / v18.x |
| Package Manager | pnpm (Frontend), pip (Backend) |

---

## 🚀 Panduan Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/AmirulJusticia0507/boso-jawa-ai.git
cd boso-jawa-ai
```

### 2. Konfigurasi Database (PostgreSQL)

Buat database dan user PostgreSQL baru:

```sql
CREATE DATABASE boso_jawa_db;
CREATE USER boso_user WITH PASSWORD 'PASSWORD_ANDA';
GRANT ALL PRIVILEGES ON DATABASE boso_jawa_db TO boso_user;
```

Jalankan DDL skema awal (lihat [`docs/schema.sql`](docs/schema.sql)):

```bash
psql -U boso_user -d boso_jawa_db -f docs/schema.sql
```

### 3. Setup Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Linux/macOS
# venv\Scripts\activate    # Windows

pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Server backend berjalan di `http://localhost:8000`. Dokumentasi Swagger OpenAPI tersedia di `http://localhost:8000/docs`.

### 4. Setup Frontend (TypeScript)

```bash
cd ../frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

Frontend berjalan di `http://localhost:3000`. API backend otomatis ter-proxy ke `localhost:8000`.

### 5. Seed Data Awal (opsional)

Jika ingin mengisi database dengan data contoh:

```bash
cd backend
python seed_db.py
```

Menyimpan 20 aksara carakan, 6 kamus kawruh basa, 3 paribasan, dan 11 paugeran tembang macapat.

---

## 📁 Struktur Direktori

```plaintext
boso-jawa-ai/
├── README.md
├── LICENSE
├── docs/
│   ├── SCHEMA.md          # Dokumentasi skema DDL
│   ├── schema.sql         # DDL executable (psql -f docs/schema.sql)
│   ├── API_SPEC.md        # Spesifikasi REST API v1
│   ├── RULES_AKSARA.md    # Aturan transliterasi Aksara Jawa
│   └── CONTRIBUTING.md    # Pedoman kontribusi
├── api/
│   └── index.py           # Vercel serverless handler (Mangum)
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   └── v1/
│   │   │       ├── api.py
│   │   │       └── endpoints/
│   │   │           ├── aksara.py
│   │   │           ├── kawruh.py
│   │   │           ├── macapat.py
│   │   │           └── ai.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── aksara.py
│   │   │   ├── kawruh.py
│   │   │   ├── paribasan.py
│   │   │   ├── macapat.py
│   │   │   └── ai_dataset.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── aksara.py
│   │   │   ├── kawruh.py
│   │   │   ├── macapat.py
│   │   │   ├── ai.py
│   │   │   └── common.py
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── aksara_engine.py
│   │       ├── macapat_checker.py
│   │       └── ai_client.py
│   ├── main.py
│   ├── .env.example
│   ├── .env               # Tidak di-commit (gitignored)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── fonts/        # Noto Sans Jawa + Fraunces (self-host)
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   └── ui.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Aksara.tsx
│   │   │   ├── Kawruh.tsx
│   │   │   ├── Macapat.tsx
│   │   │   └── AI.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── styles/
│   │   │   └── main.css      # Tailwind v4 + tema Jowo
│   │   ├── types/
│   │   │   └── basa.ts
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── .env.example
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   └── public/
├── requirements.txt           # Untuk deploy Vercel (root)
├── vercel.json                # Config deploy Vercel
├── .gitignore
└── pnpm-workspace.yaml
```

---

## 📖 Dokumentasi API & Modul

- 🗄️ **Dokumentasi Skema Database** — [`docs/SCHEMA.md`](docs/SCHEMA.md)
- 🔌 **Spesifikasi API RESTful** — [`docs/API_SPEC.md`](docs/API_SPEC.md)
- ✍️ **Aturan Transliterasi Aksara Jawa** — [`docs/RULES_AKSARA.md`](docs/RULES_AKSARA.md)
- 🤝 **Pedoman Kontribusi** — [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)
- 📜 **Lisensi** — [MIT License](LICENSE)

---

## 🚀 Deploy Vercel

Proyek ini siap deploy ke [Vercel](https://vercel.com). Backend menggunakan adapter Mangum untuk kompatibilitas serverless.

### Persiapan

1. Buat **PostgreSQL hosting** (Neon, Supabase, atau Railway — gratis).
2. Jalankan `docs/schema.sql` ke hosting tersebut.
3. Daftar model LLM di [BazaarLink](https://bazaarlink.ai/keys).

### 2 Project di Vercel

| Project | Root Directory | Env Variables |
|---------|---------------|---------------|
| `boso-jawa-be` | root | `DATABASE_URL`, `BAZAARLINK_BASE_URL`, `BAZAARLINK_API_KEY`, `AI_MODEL`, `CORS_ORIGINS` |
| `boso-jawa-fe` | `frontend` | `VITE_API_URL=https://<backend>.vercel.app` (origin saja, prefix `/api/v1` otomatis) |

> **Catatan**: File `.env` dan `backend/.env` **tidak pernah di-commit** — semua secret diatur melalui dashboard Vercel.

---

## 📜 Lisensi

Proyek ini dilisensikan di bawah MIT License — lihat berkas [LICENSE](LICENSE) untuk rincian selengkapnya.

**Font**: Noto Sans Javanese dan Fraunces (self-host) dilisensikan di bawah [SIL Open Font License 1.1](https://openfontlicense.org). Lihat [`frontend/src/assets/fonts/OFL-NOTICE.txt`](frontend/src/assets/fonts/OFL-NOTICE.txt).
