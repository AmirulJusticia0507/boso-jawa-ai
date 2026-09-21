/** Tipe bersama — mirror skema backend (app/schemas). */

export type Direction = "latin_to_aksara" | "aksara_to_latin";

export interface TransliterateRequest {
  text: string;
  direction: Direction;
  include_sandhangan: boolean;
}

export interface TransliterateData {
  original: string;
  aksara: string | null;
  latin: string | null;
  rules_applied: string[];
}

export interface TransliterateResponse {
  status: string;
  data: TransliterateData;
}

export interface KawruhItem {
  id: number;
  ngoko: string;
  krama_lugu: string | null;
  krama_inggil: string | null;
  bahasa_indonesia: string;
  kelas_kata: string | null;
  contoh_ukara: string | null;
}

export interface KawruhSearchResponse {
  status: string;
  total: number;
  data: KawruhItem[];
}

export interface MacapatCheckRequest {
  nama_tembang: string;
  lirik: string[];
}

export interface GatraAnalysis {
  gatra: number;
  text: string;
  target_wilangan: number | null;
  actual_wilangan: number;
  target_lagu: string | null;
  actual_lagu: string;
  valid: boolean;
}

export interface MacapatCheckResponse {
  status: string;
  nama_tembang: string;
  is_valid: boolean;
  analysis: GatraAnalysis[];
  errors: string[];
}

export interface ApiErrorBody {
  detail?: string;
  message?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatData {
  model: string;
  answer: string;
}

export interface ChatResponse {
  status: string;
  data: ChatData;
}

export interface ModelsResponse {
  status: string;
  data: string[];
}
