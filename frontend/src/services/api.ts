/** Klien HTTP untuk backend FastAPI. */

import type {
  ApiErrorBody,
  ChatRequest,
  ChatResponse,
  BasaLevel,
  CorrectionResponse,
  KawruhSearchResponse,
  MacapatCheckRequest,
  MacapatCheckResponse,
  ModelsResponse,
  ParibasanListResponse,
  TransliterateRequest,
  TransliterateResponse,
} from "../types/basa";

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_ORIGIN}${API_PREFIX}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as ApiErrorBody;
      message = body.detail ?? body.message ?? message;
    } catch {
      /* pakai pesan default */
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as T;
}

export function transliterate(
  payload: TransliterateRequest,
): Promise<TransliterateResponse> {
  return request<TransliterateResponse>("/aksara/transliterate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function searchKawruh(
  q: string,
  limit = 10,
  page = 1,
): Promise<KawruhSearchResponse> {
  const params = new URLSearchParams({ q, limit: String(limit), page: String(page) });
  return request<KawruhSearchResponse>(`/kawruh/search?${params.toString()}`);
}

export function correctUndhaUsuk(
  text: string,
  targetLevel: BasaLevel,
): Promise<CorrectionResponse> {
  return request<CorrectionResponse>("/kawruh/correct", {
    method: "POST",
    body: JSON.stringify({ text, target_level: targetLevel }),
  });
}

export function listParibasan(
  opts: { kategori?: string; q?: string; limit?: number; page?: number } = {},
): Promise<ParibasanListResponse> {
  const params = new URLSearchParams();
  if (opts.kategori) params.set("kategori", opts.kategori);
  if (opts.q) params.set("q", opts.q);
  params.set("limit", String(opts.limit ?? 100));
  params.set("page", String(opts.page ?? 1));
  const qs = params.toString();
  return request<ParibasanListResponse>(
    `/paribasan${qs ? `?${qs}` : ""}`,
  );
}

export function checkMacapat(
  payload: MacapatCheckRequest,
): Promise<MacapatCheckResponse> {
  return request<MacapatCheckResponse>("/macapat/check", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function chat(
  payload: ChatRequest,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  return request<ChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

export function getModels(): Promise<ModelsResponse> {
  return request<ModelsResponse>("/ai/models");
}

export interface AdminListParams {
  page?: number;
  limit?: number;
  status?: string;
  kategori?: string;
  q?: string;
  include_deleted?: boolean;
}

export interface AdminListResponse<T> {
  status: string;
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  data: T[];
}

export interface KawruhAdminItem {
  id: number;
  ngoko: string;
  krama_lugu: string | null;
  krama_inggil: string | null;
  bahasa_indonesia: string;
  kelas_kata: string | null;
  contoh_ukara: string | null;
  status: string;
  deleted_at: string | null;
  created_at: string | null;
}

export interface ParibasanAdminItem {
  id: number;
  teks: string;
  tegese: string;
  kategori: string;
  padanan_indonesia: string | null;
  status: string;
  deleted_at: string | null;
  created_at: string | null;
}

export async function adminRequest(
  path: string,
  apiKey: string,
  method = "GET",
  payload?: unknown,
): Promise<unknown> {
  const res = await fetch(`${API_ORIGIN}${API_PREFIX}/admin${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Admin-Key": apiKey },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as ApiErrorBody;
      message = body.detail ?? body.message ?? message;
    } catch { /* pakai pesan default */ }
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? { status: "success" } : res.json();
}

export async function listAdminKawruh(
  apiKey: string,
  params: AdminListParams = {}
): Promise<AdminListResponse<KawruhAdminItem>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status) searchParams.set("status", params.status);
  if (params.q) searchParams.set("q", params.q);
  if (params.include_deleted) searchParams.set("include_deleted", "true");
  const qs = searchParams.toString();
  return adminRequest(`/kawruh${qs ? `?${qs}` : ""}`, apiKey, "GET") as Promise<AdminListResponse<KawruhAdminItem>>;
}

export async function listAdminParibasan(
  apiKey: string,
  params: AdminListParams = {}
): Promise<AdminListResponse<ParibasanAdminItem>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status) searchParams.set("status", params.status);
  if (params.kategori) searchParams.set("kategori", params.kategori);
  if (params.q) searchParams.set("q", params.q);
  if (params.include_deleted) searchParams.set("include_deleted", "true");
  const qs = searchParams.toString();
  return adminRequest(`/paribasan${qs ? `?${qs}` : ""}`, apiKey, "GET") as Promise<AdminListResponse<ParibasanAdminItem>>;
}
