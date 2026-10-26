/** Template placeholder rendering. Pure functions — no DOM, no DB. */

export const TEMPLATE_PLACEHOLDERS = [
  "company",
  "role",
  "name",
  "skills",
] as const;

export type TemplatePlaceholder = (typeof TEMPLATE_PLACEHOLDERS)[number];

export interface TemplateValues {
  company: string;
  role: string;
  name: string;
  skills: string;
}

const PLACEHOLDER_RE = /\{(company|role|name|skills)\}/g;

/**
 * Replace {company} {role} {name} {skills} in `body`.
 * Unknown placeholders (e.g. {foo}) are left untouched so a typo
 * is visible instead of silently disappearing.
 */
export function renderTemplate(
  body: string,
  values: TemplateValues,
): string {
  return body.replace(PLACEHOLDER_RE, (match) => {
    const key = match.slice(1, -1) as TemplatePlaceholder;
    return values[key];
  });
}

/** Distinct placeholders used in `body`, in first-use order. */
export function extractPlaceholders(body: string): string[] {
  const found: string[] = [];
  for (const match of body.matchAll(PLACEHOLDER_RE)) {
    const key = match[1];
    if (key !== undefined && !found.includes(key)) found.push(key);
  }
  return found;
}

/** Build values for a job. `name`/`skills` come from the user, not the job. */
export function valuesForJob(
  job: { company: string; role: string },
  name: string,
  skills: string,
): TemplateValues {
  return { company: job.company, role: job.role, name, skills };
}
