import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isStandalone,
  onInstallPrompt,
  promptInstall,
  type BeforeInstallPromptEvent,
} from "../pwa";

/**
 * `pwa.ts` menyimpan `deferredPrompt` di lingkup modul dan mengisinya dari
 * listener `beforeinstallprompt` yang didaftarkan saat modul di-import. Jadi
 * untuk mengujinya kita harus benar-benar mendispatch event, bukantrying
 * memanipulasi state internal.
 */
function dispatchInstallPrompt(outcome: "accepted" | "dismissed") {
  let settle: (value: { outcome: string; platform: string }) => void = () => {};
  const userChoice = new Promise<{ outcome: string; platform: string }>((res) => {
    settle = res;
  });

  const event = new Event("beforeinstallprompt", {
    cancelable: true,
  }) as unknown as BeforeInstallPromptEvent;
  Object.assign(event, {
    platforms: ["web"],
    prompt: vi.fn(() => {
      settle({ outcome, platform: "web" });
      return Promise.resolve();
    }),
    userChoice,
  });

  window.dispatchEvent(event);
  return event;
}

describe("isStandalone", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("true bila display-mode standalone", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true }));
    expect(isStandalone()).toBe(true);
  });

  it("true bila navigator.standalone (Safari iOS)", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
    vi.stubGlobal("navigator", { standalone: true });
    expect(isStandalone()).toBe(true);
  });

  it("false di browser biasa", () => {
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
    expect(isStandalone()).toBe(false);
  });
});

describe("onInstallPrompt", () => {
  it("meneruskan event prompt ke listener yang baru mendaftar", () => {
    const event = dispatchInstallPrompt("accepted");
    const seen: (BeforeInstallPromptEvent | null)[] = [];
    onInstallPrompt((e) => seen.push(e));

    expect(seen).toHaveLength(1);
    expect(seen[0]).toBe(event);
  });

  it("unsubscribe menghentikan pemanggilan listener", () => {
    dispatchInstallPrompt("accepted");
    const seen: (BeforeInstallPromptEvent | null)[] = [];
    const unsubscribe = onInstallPrompt((e) => seen.push(e));
    expect(seen).toHaveLength(1);

    unsubscribe();
    dispatchInstallPrompt("accepted");
    expect(seen).toHaveLength(1);
  });

  it("listener yang terlambat tetap mendapat prompt yang sudah tertunda", () => {
    const event = dispatchInstallPrompt("accepted");
    const seen: (BeforeInstallPromptEvent | null)[] = [];
    onInstallPrompt((e) => seen.push(e));

    // Listener kedua kelewat event pertama, tapi harus tetap menerimanya
    // karena prompt disimpan di lingkup modul.
    const late: (BeforeInstallPromptEvent | null)[] = [];
    onInstallPrompt((e) => late.push(e));
    expect(late[0]).toBe(event);
    expect(seen).toHaveLength(1);
  });
});

describe("promptInstall", () => {
  it("true saat pengguna menerima install", async () => {
    const event = dispatchInstallPrompt("accepted");
    await expect(promptInstall()).resolves.toBe(true);
    expect(event.prompt).toHaveBeenCalledTimes(1);
  });

  it("false saat pengguna menolak install", async () => {
    dispatchInstallPrompt("dismissed");
    await expect(promptInstall()).resolves.toBe(false);
  });

  it("satu prompt tidak bisa dipakai dua kali", async () => {
    const event = dispatchInstallPrompt("accepted");
    await promptInstall();
    // Setelah dipakai, prompt dibuang sehingga panggilan kedua tidak
    // menampilkan dialog lagi.
    await expect(promptInstall()).resolves.toBe(false);
    expect(event.prompt).toHaveBeenCalledTimes(1);
  });

  it("listener diberi null setelah appinstalled", () => {
    dispatchInstallPrompt("accepted");
    const seen: (BeforeInstallPromptEvent | null)[] = [];
    onInstallPrompt((e) => seen.push(e));
    expect(seen).toHaveLength(1);

    window.dispatchEvent(new Event("appinstalled"));
    expect(seen).toHaveLength(2);
    expect(seen[1]).toBeNull();
  });
});
