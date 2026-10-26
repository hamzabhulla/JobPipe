/** @type {import('tailwindcss').Config} */
export default {
  // Class-based dark mode: the app toggles `dark` on <html>.
  // System default is resolved in Step 4 (theme.ts) and saved to
  // localStorage; the landing page is light-only static HTML.
  darkMode: "class",
  content: [
    "./index.html",
    "./app/index.html",
    "./privacy/index.html",
    "./about/index.html",
    "./changelog/index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // ONE accent colour, defined as a full scale so WCAG AA holds
      // at every use: 600+ for text on white, 500 for large UI
      // surfaces with white text, 50/100 for soft backgrounds.
      // Brand accent: violet-blue #5449d6 (not Tailwind's default
      // indigo — deliberately shifted so the UI does not look like
      // a stock Tailwind template).
      colors: {
        accent: {
          50: "#efedfd",
          100: "#e0ddfb",
          200: "#c6c1f7",
          300: "#a39af1",
          400: "#7e6de8",
          500: "#6350dc",
          600: "#5449d6",
          700: "#4636b8",
          800: "#3a2f94",
          900: "#312a77",
        },
      },
      // ONE font stack, no webfont download: Inter if installed,
      // otherwise the OS stack. This is a performance choice —
      // zero font requests keeps the landing page at Lighthouse 95+
      // and keeps the app fully offline-capable.
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgb(16 24 40 / 0.06), 0 1px 3px rgb(16 24 40 / 0.10)",
        "card-hover":
          "0 4px 12px rgb(16 24 40 / 0.08), 0 2px 6px rgb(16 24 40 / 0.06)",
      },
      borderRadius: {
        card: "0.75rem",
      },
    },
  },
  plugins: [],
};
