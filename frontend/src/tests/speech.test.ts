import { describe, expect, it } from "vitest";
import { pronunciationScore } from "../services/speech";

describe("pronunciationScore", () => {
  it("membandingkan kata tanpa terpengaruh kapital dan tanda baca", () => {
    expect(pronunciationScore("Aku arep mangan.", "aku mangan")).toBe(67);
    expect(pronunciationScore("Sugeng enjing", "SUGENG ENJING!")).toBe(100);
  });

  it("memberi kredit sebagian untuk kata yang hampir benar", () => {
    // "mangn" kehilangan satu huruf -> tetap dapat poin, bukan nol
    const score = pronunciationScore("Aku mangan", "aku mangn");
    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThan(100);
  });

  it("tidak menghitung kata yang sama dua kali", () => {
    expect(pronunciationScore("mangan mangan mangan", "mangan")).toBe(33);
  });

  it("menangani diakritik dan NFKC", () => {
    expect(pronunciationScore("é/è", "é è")).toBe(100);
  });

  it("mengembalikan 0 untuk input kosong", () => {
    expect(pronunciationScore("", "aku")).toBe(0);
    expect(pronunciationScore("aku", "")).toBe(0);
  });
});
