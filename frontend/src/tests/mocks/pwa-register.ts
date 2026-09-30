/**
 * Stub untuk `virtual:pwa-register`.
 *
 * Modul virtual itu hanya ada selama plugin Vite berjalan, sehingga tidak bisa
 * diimpor oleh test runner. Alias di `vite.config.ts` mengarahkan import di
 * mode test ke berkas ini; build produksi tetap memakai modul aslinya.
 */

export interface RegisterSWOptions {
  immediate?: boolean;
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegisteredSW?: (swUrl: string, registration: unknown) => void;
  onRegisterError?: (error: unknown) => void;
}

export function registerSW(_options: RegisterSWOptions = {}): (reloadPage?: boolean) => Promise<void> {
  return async () => {};
}
