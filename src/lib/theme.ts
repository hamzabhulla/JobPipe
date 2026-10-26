import type { ThemePreference } from "./types";

export const THEME_STORAGE_KEY = "jobpipe-theme";

export function getStoredTheme(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // Private mode / blocked storage: fall through to system default.
  }
  return "system";
}

export function setStoredTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable — theme still applies for this session.
  }
}

/** Resolve to a concrete theme. System = OS preference at call time. */
export function resolveTheme(
  pref: ThemePreference,
  systemDark: boolean,
): "light" | "dark" {
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  return systemDark ? "dark" : "light";
}

/** Apply to <html> (Tailwind darkMode: 'class'). Returns resolved theme. */
export function applyTheme(pref: ThemePreference): "light" | "dark" {
  const systemDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = resolveTheme(pref, systemDark);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
}
