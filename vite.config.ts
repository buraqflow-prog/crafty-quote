// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    target: "static",
    spa: {
      enabled: true,
    },
  },
  vite: {
    plugins: [
      {
        name: "tanstack-shell-to-index",
        closeBundle() {
          const clientDir = resolve(process.cwd(), "dist/client");
          const shellPath = resolve(clientDir, "_shell.html");
          const indexPath = resolve(clientDir, "index.html");

          if (existsSync(shellPath)) {
            cpSync(shellPath, indexPath);
          }
        },
      },
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Devis / Facture",
          short_name: "Factures",
          description: "Générateur de devis et factures pour artisans",
          theme_color: "#0f172a",
          background_color: "#0f172a",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallbackDenylist: [/^\/~oauth/],
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        },
      }),
    ],
  },
});
