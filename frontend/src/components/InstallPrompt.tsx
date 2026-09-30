import { useEffect, useState } from "react";
import { isStandalone, onInstallPrompt, promptInstall } from "../pwa";

/**
 * Banner kecil yang menawarkan instalasi aplikasi.
 *
 * Chrome sudah menampilkan tombol install di address bar, tapi di Android
 * perilakunya tidak konsisten dan Banner ini memberi jalan yang jelas.
 * Banner disembunyikan saat aplikasi sudah berjalan dalam mode standalone.
 */
export default function InstallPrompt() {
  const [available, setAvailable] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setStandalone(isStandalone());
    return onInstallPrompt(() => {
      setAvailable(true);
    });
  }, []);

  if (dismissed || standalone || !available) return null;

  return (
    <div className="mx-auto mb-4 flex max-w-5xl items-center gap-3 rounded-xl border border-prada-500/40 bg-cream-50 px-4 py-3 text-sm text-ink-900 shadow-sm dark:border-prada-500/20 dark:bg-sogan-900 dark:text-cream-100">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Pasang Boso Jawa AI</p>
        <p className="text-xs text-sogan-700 dark:text-cream-200/70">
          Kabeh fitur bisa dibuka langsung tanpa mbuka browser.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          void promptInstall();
        }}
        className="shrink-0 rounded-lg bg-prada-600 px-3 py-1.5 font-medium text-cream-50 transition hover:bg-prada-500"
      >
        Pasang
      </button>
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
        }}
        aria-label="Tutup banner pasang aplikasi"
        className="shrink-0 rounded-lg p-1.5 text-sogan-700 transition hover:bg-prada-500/10 dark:text-cream-200/70"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  );
}
