/** Klien HTTP untuk backend FastAPI. */

import type {
  ApiErrorBody,
  ChatRequest,
  ChatResponse,
  KawruhSearchResponse,
  MacapatCheckRequest,
  MacapatCheckResponse,
  ModelsResponse,
  TransliterateRequest,
  TransliterateResponse,
} from "../types/basa";

const API_URL =
  import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
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
): Promise<KawruhSearchResponse> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return request<KawruhSearchResponse>(`/kawruh/search?${params.toString()}`);
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
): Promise<ChatResponse> {
  return request<ChatResponse>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getModels(): Promise<ModelsResponse> {
  return request<ModelsResponse>("/ai/models");
}
