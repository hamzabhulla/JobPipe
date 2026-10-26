import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const rootDir = dirname(fileURLToPath(import.meta.url));

/**
 * Build choice (decided in Step 1, implemented fully in Step 5):
 * Vite multi-page build — NOT a prerender plugin, NOT a JS-only SPA.
 *
 * Why: the landing page is hand-written, static HTML. A prerender plugin
 * would render React to HTML at build time, adding a fragile build step
 * and still leaving the landing content coupled to the React bundle.
 * With MPA, `/` is real HTML served as-is (crawlable with JS disabled),
 * and `/app` is a separate, independent React entry. There is no router
 * and no shared bundle between the two — the app bundle never ships
 * to a landing-page visitor, and the landing page never depends on JS.
 *
 * Step 5 inputs: landing + app + three static sub-pages, all
 * plain HTML. No JavaScript bundle is built for the static pages.
 */
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Step 4 wires the real icons + offline runtime caching.
      // These paths are referenced by the manifest now and the
      // icon files land in Step 4/5; a missing icon file does not
      // fail the build, it only means installability is incomplete
      // until Step 4 — which is exactly the Step 4 checklist item.
      includeAssets: ["favicon.ico", "favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "JobPipe — Job Application Tracker",
        short_name: "JobPipe",
        description:
          "Free, no-signup, local-first job and freelance application tracker. Your data stays in your browser.",
        theme_color: "#5449d6",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/app",
        scope: "/app",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Only the app shell is precached. The landing page is plain
        // HTML and is served fresh; caching it aggressively would
        // risk serving stale SEO content after a landing edit.
        globPatterns: ["app/**/*.{js,css,html,ico,png,svg}"],
      },
    }),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(rootDir, "index.html"),
        app: resolve(rootDir, "app/index.html"),
        privacy: resolve(rootDir, "privacy/index.html"),
        about: resolve(rootDir, "about/index.html"),
        changelog: resolve(rootDir, "changelog/index.html"),
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
