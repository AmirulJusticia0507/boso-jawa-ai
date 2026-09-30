import { describe, expect, it } from "vitest";
import { pronunciationScore } from "../services/speech";

describe("pronunciationScore", () => {
  it("membandingkan kata tanpa terpengaruh kapital dan tanda baca", () => {
    expect(pronunciationScore("Aku arep mangan.", "aku mangan")).toBe(67);
    expect(pronunciationScore("Sugeng enjing", "SUGENG ENJING!")).toBe(100);
  });
});
