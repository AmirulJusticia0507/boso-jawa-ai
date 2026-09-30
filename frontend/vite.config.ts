import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

// `defineConfig` diambil dari `vitest/config` (bukan `vite`) supaya blok `test`
// ikut ter-typecheck. Proxy `/api` tetap dipakai saat dev/preview lokal.
const apiProxy = {
  "/api": {
    target: "http://localhost:8000",
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Saat ada build baru, SW lama langsung ambil alih lalu muat ulang satu
      // kali agar pengguna tidak terjebak di versi usang.
      registerType: "autoUpdate",
      // Daftar ulang dikontrol manual dari `src/pwa.ts` supaya bisa bereaksi
      // ke event `needRefresh` tanpa menyuntik `<script>` ke `index.html`.
      injectRegister: null,
      // Bawaan plugin menambahkan ikon yang dirujuk `manifest` ke precache
      // sebagai `additionalManifestEntries`. Karena `globPatterns` di bawah
      // sudah mencakup semuanya, ini hanya bikin entri kembar.
      includeManifestIcons: false,
      // `includeAssets` sengaja tidak dipakai: semua ikon ada di `public/`,
      // yang sudah disalin Vite ke `dist`, lalu ikut ter-precache lewat
      // `globPatterns` di bawah. Kalau keduanya dipakai, Workbox mendaftarkan
      // berkas yang sama dua kali.
      manifest: {
        id: "/",
        name: "Boso Jawa AI — Nguri-uri Basa Jawa",
        short_name: "Boso Jawa",
        description:
          "Sinau basa lan sastra Jawa: transliterasi Aksara Jawa, kamus unggah-ungguh, paribasan, macapat, lan asisten AI.",
        lang: "jv-ID",
        dir: "ltr",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#3a1410",
        background_color: "#3a1410",
        categories: ["education", "reference", "books"],
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            // `maskable` wajib ada agar Chrome bisa memotong ikon ke bentuk apa
            // saja (lingkaran/squircle) tanpa sudut yang terpotong kasar.
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // WAJIB menyertakan `html`: `navigateFallback` memakai
        // `createHandlerBoundToURL("index.html")`. Kalau `index.html` tidak
        // ada di precache, setiap navigasi offline akan gagal.
        // `webmanifest` sengaja tidak dicakup: plugin selalu menambahkannya
        // sendiri, jadi ikut dicakup di sini akan jadi entri kembar.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        // Wajib untuk SPA: `/kawruh`, `/macapat`, dan seteunya adalah rute
        // client-side. Tanpa ini, refresh di URL dalam akan 404 dan service
        // worker tidak bisa menyajikan halaman secara offline.
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        // Sengaja TIDAK ada `runtimeCaching` untuk `/api/*`:
        //   - respons AI/kamus berubah terus, cache basi bikin jawaban salah;
        //   - endpoint admin membawa `X-Admin-Key`; kalau bocor ke Cache Storage
        //     bisa tersaji ke profil lain di browser yang sama.
        // Hasilnya: app shell bisa dibuka offline, data tetap selalu live.
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      // Saat dev, SW + cache membuat hot-reload kacau; hanya aktif di build.
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 3000, proxy: apiProxy },
  preview: { port: 4173, proxy: apiProxy },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Folder E2E milik Cypress; jangan ikut dikoleksi Vitest.
    exclude: ["node_modules/**", "dist/**", "cypress/**"],
    restoreMocks: true,
    // `virtual:pwa-register` hanya hidup selama plugin Vite berjalan, jadi test
    // runner tidak bisa me-import-nya. Alias mode-test ini TIDAK berlaku
    // untuk build produksi karena build tetap memakai modul virtual plugin.
    alias: {
      "virtual:pwa-register": fileURLToPath(
        new URL("./src/tests/mocks/pwa-register.ts", import.meta.url),
      ),
    },
    coverage: {
      reporter: ["text", "html"],
      include: ["src/services/**", "src/components/**"],
    },
  },
});
