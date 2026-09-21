-- ============================================================================
-- Boso Jawa AI System — Skema awal PostgreSQL
-- Dokumentasi: docs/SCHEMA.md
-- Cara pakai: psql -U boso_user -d boso_jawa_db -f docs/schema.sql
-- ============================================================================

-- Ekstensi unaccent dan pg_trgm untuk pencarian cepat (fuzzy search)
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Tabel Aksara Jawa (referensi carakan, pasangan, sandhangan, dsb.)
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

CREATE INDEX IF NOT EXISTS idx_aksara_jenis ON aksara_jawa(jenis);
CREATE INDEX IF NOT EXISTS idx_aksara_latin ON aksara_jawa(latin_equivalent);

COMMENT ON TABLE aksara_jawa IS 'Referensi aksara Jawa: carakan, pasangan, sandhangan, murda, swara, rekan, pada';

-- 2. Tabel Kawruh Basa (padanan kata Undha-Usuk)
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

CREATE INDEX IF NOT EXISTS idx_kawruh_ngoko_trgm ON kawruh_basa USING gin (ngoko gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kawruh_krama_inggil_trgm ON kawruh_basa USING gin (krama_inggil gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kawruh_indonesia_trgm ON kawruh_basa USING gin (bahasa_indonesia gin_trgm_ops);

COMMENT ON TABLE kawruh_basa IS 'Kamus padanan kata: ngoko, krama lugu, krama inggil, bahasa Indonesia';

-- 3. Tabel Paribasan, Bebasan, lan Saloka
CREATE TABLE IF NOT EXISTS paribasan (
    id SERIAL PRIMARY KEY,
    teks TEXT NOT NULL,
    tegese TEXT NOT NULL,
    kategori VARCHAR(30) NOT NULL CHECK (kategori IN ('paribasan', 'bebasan', 'saloka')),
    padanan_indonesia TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_paribasan_kategori ON paribasan(kategori);
CREATE INDEX IF NOT EXISTS idx_paribasan_text_trgm ON paribasan USING gin (teks gin_trgm_ops);

COMMENT ON TABLE paribasan IS 'Paribasan, bebasan, dan saloka beserta tegese';

-- 4. Tabel Tembang Macapat (paugeran tiap tembang)
CREATE TABLE IF NOT EXISTS macapat (
    id SERIAL PRIMARY KEY,
    nama_tembang VARCHAR(50) NOT NULL UNIQUE,
    paugeran_gatra INT NOT NULL,
    paugeran_wilangan_lagu JSONB NOT NULL,
    watak TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contoh format JSONB paugeran_wilangan_lagu:
-- [
--   {"gatra": 1, "wilangan": 12, "lagu": "i"},
--   {"gatra": 2, "wilangan": 6, "lagu": "u"},
--   {"gatra": 3, "wilangan": 8, "lagu": "i"},
--   {"gatra": 4, "wilangan": 12, "lagu": "a"}
-- ]

COMMENT ON TABLE macapat IS 'Paugeran 11 tembang macapat: guru gatra, wilangan, dan lagu per gatra (JSONB)';

-- 5. Tabel Dataset AI & Fine-Tuning
CREATE TABLE IF NOT EXISTS ai_training_dataset (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    completion TEXT NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_kategori ON ai_training_dataset(kategori);
CREATE INDEX IF NOT EXISTS idx_ai_verified ON ai_training_dataset(is_verified);

COMMENT ON TABLE ai_training_dataset IS 'Dataset prompt-completion untuk fine-tuning LLM kebahasaan Jawa';
