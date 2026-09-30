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

// Token storage
const TOKEN_KEY = "boso-jawa-access-token";
const REFRESH_TOKEN_KEY = "boso-jawa-refresh-token";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Simpan access token hasil tempelan manual dan langsung terapkan ke header.
 *
 * Dipakai panel admin yang meminta operator menempelkan token, alih-alih punya
 * form login. Refresh token yang sudah ada tidak ditimpa; string kosong
 * berarti "tidak ada", jadi `getRefreshToken()` mengembalikan `null`.
 */
export function applyAccessToken(token: string): void {
  const trimmed = token.trim();
  if (trimmed === "") {
    clearTokens();
    return;
  }
  localStorage.setItem(TOKEN_KEY, trimmed);
}

/**
 * Baca body JSON hanya kalau memang ada isinya.
 *
 * Endpoint `DELETE /admin/auth/users/{id}` dan `POST /admin/auth/logout`
 * membalas `204 No Content`, dan `res.json()` pada respons kosong melempar
 * `SyntaxError: Unexpected end of JSON input`.
 */
async function readJson<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (text.trim() === "") return undefined as T;
  return JSON.parse(text) as T;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...init?.headers,
  };
  const res = await fetch(`${API_ORIGIN}${API_PREFIX}${path}`, {
    headers,
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
  return readJson<T>(res);
}

// Auth-specific request (without auto token, for login/refresh)
async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_ORIGIN}${API_PREFIX}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
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
  return readJson<T>(res);
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

// --- Learning API ---

export type QuestionCategory = "aksara" | "unggah_ungguh";
export type QuestionDifficulty = "mudah" | "sedang" | "sulit";

export interface QuizQuestion {
  id: number;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  prompt: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestionListResponse {
  status: string;
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  data: QuizQuestion[];
}

export interface QuizStartRequest {
  category?: QuestionCategory;
  difficulty?: QuestionDifficulty;
  limit?: number;
  adaptive?: boolean;
}

export interface QuizQuestionForQuiz {
  id: number;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  prompt: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
}

export interface QuizStartResponse {
  status: string;
  questions: QuizQuestionForQuiz[];
  total: number;
}

export interface QuizAnswer {
  question_id: number;
  selected_answer: string;
}

export interface QuizSubmitResponse {
  status: string;
  is_correct: boolean;
  correct_answer: string;
  explanation: string | null;
  score: number;
  total: number;
  progress: {
    results: Array<{
      question_id: number;
      is_correct: boolean;
      correct_answer: string;
      explanation: string | null;
    }>;
  };
}

export interface UserProgressItem {
  id: number;
  user_identifier: string;
  category: QuestionCategory;
  total_questions: number;
  correct_answers: number;
  best_streak: number;
  current_streak: number;
  last_studied_at: string | null;
  accuracy: number;
}

export interface UserProgressResponse {
  status: string;
  data: UserProgressItem[];
}

export interface LearningStatsResponse {
  status: string;
  data: {
    total_answered: number;
    total_correct: number;
    overall_accuracy: number;
    study_days: number;
    by_category: Record<QuestionCategory, {
      total: number;
      correct: number;
      accuracy: number;
      best_streak: number;
      current_streak: number;
    }>;
    mastery: Array<{
      category: QuestionCategory;
      difficulty: QuestionDifficulty;
      attempted: number;
      correct: number;
      accuracy: number;
      level: "dikuasai" | "berkembang" | "perlu_latihan";
    }>;
  };
}

export interface Flashcard {
  id: number;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  front: string;
  back: string;
  explanation: string | null;
  due_at: string | null;
}

const LEARNER_KEY = "boso-jawa-learner-id";

function learnerId(): string {
  let value = localStorage.getItem(LEARNER_KEY);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(LEARNER_KEY, value);
  }
  return value;
}

function learningRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, { ...init, headers: { "X-User-Identifier": learnerId(), ...init?.headers } });
}

export async function startQuiz(
  payload: QuizStartRequest
): Promise<QuizStartResponse> {
  return learningRequest<QuizStartResponse>("/learning/quiz/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitQuiz(
  answers: QuizAnswer[]
): Promise<QuizSubmitResponse> {
  return learningRequest<QuizSubmitResponse>("/learning/quiz/submit", {
    method: "POST",
    body: JSON.stringify(answers),
  });
}

export async function getProgress(category?: QuestionCategory): Promise<UserProgressResponse> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  return learningRequest<UserProgressResponse>(`/learning/progress${params.toString() ? `?${params.toString()}` : ""}`);
}

export async function getLearningStats(): Promise<LearningStatsResponse> {
  return learningRequest<LearningStatsResponse>("/learning/stats");
}

export function getDueFlashcards(limit = 10): Promise<{ status: string; data: Flashcard[]; due: number }> {
  return learningRequest(`/learning/flashcards/due?limit=${limit}`);
}

export function reviewFlashcard(id: number, quality: "again" | "hard" | "good" | "easy"): Promise<unknown> {
  return learningRequest(`/learning/flashcards/${id}/review`, {
    method: "POST",
    body: JSON.stringify({ quality }),
  });
}

// --- Admin Learning API ---

export interface AdminQuizQuestionCreate {
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  prompt: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  is_active?: boolean;
}

export interface AdminQuizQuestionUpdate {
  category?: QuestionCategory;
  difficulty?: QuestionDifficulty;
  prompt?: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
  is_active?: boolean;
}

export async function listAdminQuizQuestions(
  params: AdminListParams = {}
): Promise<QuizQuestionListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status) searchParams.set("category", params.status); // reuse status for category filter
  if (params.q) searchParams.set("difficulty", params.q); // reuse q for difficulty filter
  if (params.include_deleted) searchParams.set("is_active", "false");
  const qs = searchParams.toString();
  return adminRequest(`/learning/questions${qs ? `?${qs}` : ""}`, "GET") as Promise<QuizQuestionListResponse>;
}

export async function createAdminQuizQuestion(
  payload: AdminQuizQuestionCreate
): Promise<QuizQuestion> {
  return adminRequest("/learning/questions", "POST", payload) as Promise<QuizQuestion>;
}

export async function updateAdminQuizQuestion(
  questionId: number,
  payload: AdminQuizQuestionUpdate
): Promise<QuizQuestion> {
  return adminRequest(`/learning/questions/${questionId}`, "PUT", payload) as Promise<QuizQuestion>;
}

export async function deleteAdminQuizQuestion(
  questionId: number
): Promise<void> {
  await adminRequest(`/learning/questions/${questionId}`, "DELETE");
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

/** Admin request menggunakan Bearer token (JWT). */
export async function adminRequest(
  path: string,
  method = "GET",
  payload?: unknown,
): Promise<unknown> {
  return request(`/admin${path}`, { method, body: payload === undefined ? undefined : JSON.stringify(payload) });
}

export interface AdminSession {
  status: string;
  data: { role: "admin" | "editor" | "reviewer"; permissions: string[] };
}

export function getAdminSession(): Promise<AdminSession> {
  return adminRequest("/session") as Promise<AdminSession>;
}

/** Auth endpoints */

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RegisterUserRequest {
  username: string;
  password: string;
  role: "admin" | "editor" | "reviewer";
}

export interface UserItem {
  id: number;
  username: string;
  role: "admin" | "editor" | "reviewer";
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  status: string;
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  data: UserItem[];
}

export async function login(payload: LoginRequest): Promise<TokenResponse> {
  return authRequest<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function refreshToken(payload: RefreshTokenRequest): Promise<TokenResponse> {
  return authRequest<TokenResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout(): Promise<void> {
  await adminRequest("/auth/logout", "POST");
  clearTokens();
}

export async function getCurrentUser(): Promise<UserItem> {
  return adminRequest("/auth/me") as Promise<UserItem>;
}

export async function listAdminUsers(
  page = 1,
  limit = 20,
  role?: string,
  is_active?: boolean,
): Promise<UserListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (role) params.set("role", role);
  if (is_active !== undefined) params.set("is_active", String(is_active));
  return adminRequest(`/auth/users?${params.toString()}`) as Promise<UserListResponse>;
}

export async function createAdminUser(payload: RegisterUserRequest): Promise<UserItem> {
  return adminRequest("/auth/users", "POST", payload) as Promise<UserItem>;
}

export async function getAdminUser(userId: number): Promise<UserItem> {
  return adminRequest(`/auth/users/${userId}`) as Promise<UserItem>;
}

export async function updateAdminUser(
  userId: number,
  payload: { password?: string; role?: "admin" | "editor" | "reviewer"; is_active?: boolean },
): Promise<UserItem> {
  return adminRequest(`/auth/users/${userId}`, "PUT", payload) as Promise<UserItem>;
}

export async function deleteAdminUser(userId: number): Promise<void> {
  await adminRequest(`/auth/users/${userId}`, "DELETE");
}

export async function importAdminDataset(
  raw: string,
  contentType: "application/json" | "text/csv",
): Promise<unknown> {
  return request("/ai/dataset/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw, content_type: contentType }),
  });
}

export async function listAdminKawruh(
  params: AdminListParams = {}
): Promise<AdminListResponse<KawruhAdminItem>> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.status) searchParams.set("status", params.status);
  if (params.q) searchParams.set("q", params.q);
  if (params.include_deleted) searchParams.set("include_deleted", "true");
  const qs = searchParams.toString();
  return adminRequest(`/kawruh${qs ? `?${qs}` : ""}`, "GET") as Promise<AdminListResponse<KawruhAdminItem>>;
}

export async function listAdminParibasan(
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
  return adminRequest(`/paribasan${qs ? `?${qs}` : ""}`, "GET") as Promise<AdminListResponse<ParibasanAdminItem>>;
}
