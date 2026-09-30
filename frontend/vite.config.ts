import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
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
  plugins: [react(), tailwindcss()],
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
    coverage: {
      reporter: ["text", "html"],
      include: ["src/services/**", "src/components/**"],
    },
  },
});
