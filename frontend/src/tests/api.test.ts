import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  adminRequest,
  chat,
  checkMacapat,
  correctUndhaUsuk,
  getModels,
  listParibasan,
  searchKawruh,
  transliterate,
} from "../services/api";
import type { TransliterateRequest } from "../types/basa";

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit];

const TRANSLITERATE_PAYLOAD: TransliterateRequest = {
  text: "ꦲ",
  direction: "latin_to_aksara",
  include_sandhangan: true,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function firstCall(mock: ReturnType<typeof vi.fn>): FetchArgs {
  return mock.mock.calls[0] as FetchArgs;
}

describe("klien API publik", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengirim chat ke /ai/chat dengan payload dan signal", async () => {
    const mock = vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({
        status: "success",
        data: { model: "deepseek-v4-flash", answer: "Sugeng dhedha!", sources: [] },
      }),
    );
    const controller = new AbortController();

    const result = await chat(
      { messages: [{ role: "user", content: "Sugeng dhedha" }] },
      controller.signal,
    );

    expect(result.data.answer).toBe("Sugeng dhedha!");
    const [url, init] = firstCall(mock);
    expect(url).toBe("/api/v1/ai/chat");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(JSON.parse(String(init?.body))).toEqual({
      messages: [{ role: "user", content: "Sugeng dhedha" }],
    });
    expect(init?.signal).toBe(controller.signal);
  });

  it("meneruskan max_tokens dari halaman chat", async () => {
    const mock = vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ status: "success", data: { model: "m", answer: "ok", sources: [] } }),
    );

    await chat({ messages: [{ role: "user", content: "hi" }], max_tokens: 600 });

    const [, init] = firstCall(mock);
    expect(JSON.parse(String(init?.body)).max_tokens).toBe(600);
  });

  it("mengambil daftar model tanpa body", async () => {
    const mock = vi
      .mocked(global.fetch)
      .mockResolvedValue(jsonResponse({ status: "success", data: ["deepseek-v4-flash"] }));

    const result = await getModels();

    expect(result.data).toEqual(["deepseek-v4-flash"]);
    const [url, init] = firstCall(mock);
    expect(url).toBe("/api/v1/ai/models");
    expect(init?.method).toBeUndefined();
    expect(init?.body).toBeUndefined();
  });

  it("mengubah query parameter pencarian menjadi URL yang benar", async () => {
    const mock = vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ status: "success", total: 0, page: 1, limit: 5, has_next: false, data: [] }),
    );

    await searchKawruh("basa jawa", 5, 2);

    const [url] = firstCall(mock);
    expect(url).toBe("/api/v1/kawruh/search?q=basa+jawa&limit=5&page=2");
  });

  it("mengirim arah transliterasi lengkap", async () => {
    const mock = vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({
        status: "success",
        data: { original: "ꦲ", aksara: "ha", latin: null, rules_applied: [] },
      }),
    );

    const result = await transliterate(TRANSLITERATE_PAYLOAD);

    expect(result.data.aksara).toBe("ha");
    const [url, init] = firstCall(mock);
    expect(url).toBe("/api/v1/aksara/transliterate");
    expect(JSON.parse(String(init?.body))).toEqual(TRANSLITERATE_PAYLOAD);
  });

  it("mengirim target_level snake_case ke korektor", async () => {
    const mock = vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({
        status: "success",
        original: "aku mangan",
        corrected: "kula nedha",
        target_level: "krama_lugu",
        changes: [],
        note: "",
      }),
    );

    await correctUndhaUsuk("aku mangan", "krama_lugu");

    const [url, init] = firstCall(mock);
    expect(url).toBe("/api/v1/kawruh/correct");
    expect(JSON.parse(String(init?.body))).toEqual({
      text: "aku mangan",
      target_level: "krama_lugu",
    });
  });

  it("memakai nilai default paribasan dan mengabaikan opsi kosong", async () => {
    // Pabrik Response baru: satu objek Response hanya bisa dibaca sekali.
    const mock = vi.mocked(global.fetch).mockImplementation(() =>
      Promise.resolve(
        jsonResponse({ status: "success", total: 0, page: 1, limit: 100, has_next: false, data: [] }),
      ),
    );

    await listParibasan();
    expect(firstCall(mock)[0]).toBe("/api/v1/paribasan?limit=100&page=1");

    vi.clearAllMocks();
    await listParibasan({ kategori: "paribasan", limit: 10, page: 3 });
    expect(firstCall(mock)[0]).toBe("/api/v1/paribasan?kategori=paribasan&limit=10&page=3");
  });

  it("mengirim lirik macapat sebagai array", async () => {
    const mock = vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({
        status: "success",
        nama_tembang: "Pocung",
        is_valid: true,
        analysis: [],
        errors: [],
      }),
    );

    await checkMacapat({ nama_tembang: "Pocung", lirik: ["dsa", "dsa"] });

    const [url, init] = firstCall(mock);
    expect(url).toBe("/api/v1/macapat/check");
    expect(JSON.parse(String(init?.body)).lirik).toEqual(["dsa", "dsa"]);
  });

  it("menerjemahkan detail error backend menjadi ApiError", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ detail: "AI_API_KEY belum dikonfigurasi." }, 503),
    );

    await expect(transliterate(TRANSLITERATE_PAYLOAD)).rejects.toMatchObject({
      status: 503,
      message: "AI_API_KEY belum dikonfigurasi.",
    });
    await expect(transliterate(TRANSLITERATE_PAYLOAD)).rejects.toBeInstanceOf(ApiError);
  });

  it("memakai pesan default bila body error bukan JSON", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response("<html>502</html>", { status: 502 }),
    );

    await expect(getModels()).rejects.toMatchObject({ status: 502, message: "HTTP 502" });
  });
});

describe("klien admin", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("mengirim X-Admin-Key pada setiap permintaan admin", async () => {
    const mock = vi
      .mocked(global.fetch)
      .mockResolvedValue(jsonResponse({ status: "success", data: [] }));

    await adminRequest("/kawruh", "rahasia-123");

    const [url, init] = firstCall(mock);
    expect(url).toBe("/api/v1/admin/kawruh");
    expect(init?.headers).toMatchObject({ "X-Admin-Key": "rahasia-123" });
  });

  it("menyerialkan payload pada metode selain GET", async () => {
    const mock = vi
      .mocked(global.fetch)
      .mockResolvedValue(jsonResponse({ status: "success", created: 1 }));

    await adminRequest("/kawruh", "k", "POST", { ngoko: "basa" });

    const [, init] = firstCall(mock);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ ngoko: "basa" });
  });

  it("mengembalikan stub sukses untuk respons 204", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(null, { status: 204 }));

    await expect(adminRequest("/kawruh/1", "k", "DELETE")).resolves.toEqual({
      status: "success",
    });
  });

  it("melempar ApiError saat kunci admin ditolak", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      jsonResponse({ detail: "Kunci admin tidak valid." }, 401),
    );

    await expect(adminRequest("/stats", "salah")).rejects.toMatchObject({
      status: 401,
      message: "Kunci admin tidak valid.",
    });
  });
});
