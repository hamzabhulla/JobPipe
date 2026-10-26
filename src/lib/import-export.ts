import type { Job, Template } from "./types";
import { validateExport, type ValidationResult } from "./schemas";

export function serializeExport(
  jobs: Job[],
  templates: Template[],
): string {
  return JSON.stringify(
    { version: 1, exportedAt: Date.now(), jobs, templates },
    null,
    2,
  );
}

/** Parse + validate an export file's text. Never throws. */
export function parseExport(text: string): ValidationResult {
  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, errors: ["File is not valid JSON."] };
  }
  return validateExport(data);
}

export function downloadTextFile(
  filename: string,
  content: string,
  mime: string,
): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
