/**
 * Registrasi service worker + deteksi kemungkinan install.
 *
 * `injectRegister: null` di `vite.config.ts` memindahkan tanggung jawab
 * pendaftaran ke modul ini, supaya event `needRefresh` bisa ditangani tanpa
 * menyuntik `<script>` ke dalam `index.html`.
 */

import { registerSW } from "virtual:pwa-register";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

type BeforeInstallPromptListener = (
  event: BeforeInstallPromptEvent | null,
) => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<BeforeInstallPromptListener>();

function publish(event: BeforeInstallPromptEvent | null): void {
  if (event !== null) {
    deferredPrompt = event;
  }
  for (const listener of listeners) {
    listener(event);
  }
}

// Event ini hanya dikirim sekali per muat halaman, jadi harus ditangkap di
// lingkup modul — bukan di dalam `useEffect` komponen, yang berjalan jauh
// setelah event-nya selesai.
//
// Tidak ada feature-detection `"onbeforeinstallprompt" in window` di sini:
// `addEventListener` untuk nama event yang tidak dikenal tidak error dan hanya
// tidak pernah dipanggil. Feature-detection itu justru membuat kode ini tidak
// bisa diuji, karena jsdom tidak mendeklarasikan event tersebut.
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    // Membatalkan event inilah yang memunculkan tombol "Install" bawaan di
    // address bar Chrome. Kalau tidak dibatalkan, prompt langsung tampil sendiri.
    event.preventDefault();
    publish(event as BeforeInstallPromptEvent);
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    publish(null);
  });
}

/** True kalau aplikasi sedang berjalan dalam mode app ter-install. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS tidak menyediakan `display-mode`; ia memakai
    // `navigator.standalone` sebagai gantinya.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Daftarkan listener untuk prompt install.
 *
 * @returns fungsi unsubscribe. Callback menerima `null` setelah aplikasi
 *          ter-install atau setelah prompt selesai dipakai.
 */
export function onInstallPrompt(
  listener: BeforeInstallPromptListener,
): () => void {
  listeners.add(listener);
  // Kalau event sudah datang sebelum komponen ini mount, teruskan sekarang.
  if (deferredPrompt !== null) {
    listener(deferredPrompt);
  }
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Tampilkan dialog install bawaan browser.
 *
 * @returns true kalau pengguna menerima install.
 */
export async function promptInstall(): Promise<boolean> {
  if (deferredPrompt === null) return false;
  await deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  // Sebuah prompt hanya bisa dipakai sekali, jadi harus di-defer ulang.
  deferredPrompt = null;
  return outcome === "accepted";
}

export function registerPwa(options: { onNeedRefresh?: () => void } = {}): void {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      options.onNeedRefresh?.();
      void updateSW(true);
    },
    onRegisteredSW(_swUrl, registration) {
      // Chrome biasanya hanya mengecek service worker baru saat navigasi.
      // Poll tiap jam supaya perangkat yang ditinggal terbuka tetap dapat
      // versi terbaru.
      if (registration) {
        setInterval(
          () => void registration.update(),
          60 * 60 * 1000,
        );
      }
    },
  });
}
