/**
 * Domain types for JobPipe. These are the single source of truth for
 * the shape of every record — the Dexie tables (db.ts), the repository
 * functions (repositories.ts) and, in Step 3, the zod import/export
 * schemas all derive from these types. Change a field here first.
 *
 * Dates: `appliedAt` / `followUpAt` are `YYYY-MM-DD` strings (or null),
 * NOT timestamps. Reason: a follow-up is a calendar date, not a moment.
 * Storing a date-only string avoids every timezone-shift bug where a
 * "2026-10-27" follow-up renders as 26 Oct in another timezone.
 * `createdAt` / `updatedAt` are epoch milliseconds — those ARE moments.
 */

export const JOB_STATUSES = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_PLATFORMS = [
  "LinkedIn",
  "Upwork",
  "Fiverr",
  "Email",
  "Other",
] as const;
export type JobPlatform = (typeof JOB_PLATFORMS)[number];

export const JOB_TYPES = ["full-time", "contract", "freelance"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_LOCATIONS = ["remote", "hybrid", "onsite"] as const;
export type JobLocation = (typeof JOB_LOCATIONS)[number];

/** Human labels for the Kanban columns, in board order. */
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export interface Job {
  /** UUID (crypto.randomUUID, see ids.ts). Primary key. */
  id: string;
  company: string;
  role: string;
  /** Full URL, or "" when unknown. Validated on input, never assumed. */
  link: string;
  platform: JobPlatform;
  type: JobType;
  /** Free text, e.g. "$50/hr" or "PKR 400,000/month". Not a number:
   *  freelance rates mix currencies and units, and forcing a number
   *  would lose that information. Stats never parse this field. */
  rate: string;
  location: JobLocation;
  status: JobStatus;
  /** YYYY-MM-DD or null when not yet applied / unknown. */
  appliedAt: string | null;
  /** YYYY-MM-DD or null when no follow-up is planned. */
  followUpAt: string | null;
  notes: string;
  tags: string[];
  contactName: string;
  /** Position inside its status column, 0-based, dense (0..n-1).
   *  Rebuilt by move/delete so it never has gaps or duplicates. */
  order: number;
  createdAt: number;
  updatedAt: number;
}

/** Everything a caller supplies to create a job. id, order and
 *  timestamps are assigned by the repository, never by the UI. */
export type NewJobInput = Omit<
  Job,
  "id" | "order" | "createdAt" | "updatedAt"
>;

/** Fields the UI may patch. id/createdAt are never patchable;
 *  order is owned by moveJob; updatedAt is set by the repository. */
export type JobPatch = Partial<
  Omit<Job, "id" | "order" | "createdAt" | "updatedAt">
>;

export interface Template {
  id: string;
  title: string;
  /** Body with placeholders {company} {role} {name} {skills}.
   *  Placeholder substitution lives in Step 3 (templates.ts) and is
   *  deliberately NOT done here — storage must keep the raw text. */
  body: string;
  createdAt: number;
  updatedAt: number;
}

export type NewTemplateInput = Omit<Template, "id" | "createdAt" | "updatedAt">;
export type TemplatePatch = Partial<
  Omit<Template, "id" | "createdAt" | "updatedAt">
>;

export type ThemePreference = "system" | "light" | "dark";

/**
 * Singleton settings row. Dexie has no singleton concept, so the
 * convention is fixed: exactly one row, id === "settings".
 * Repositories enforce this; no other id is ever written.
 */
export interface Settings {
  id: "settings";
  theme: ThemePreference;
  /** Notification API opt-in. Default true means "ask when a
   *  reminder is due", not "spam" — permission is only ever
   *  requested from a user gesture (Step 3). */
  notificationsEnabled: boolean;
  /** True once "Load sample data" has run, so the first-run empty
   *  state never offers it twice after the user dismissed it. */
  sampleDataLoaded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  id: "settings",
  theme: "system",
  notificationsEnabled: true,
  sampleDataLoaded: false,
};

/** Type guards used by migrations and import validation (Step 3). */
export function isJobStatus(value: string): value is JobStatus {
  return (JOB_STATUSES as readonly string[]).includes(value);
}

export function isJobPlatform(value: string): value is JobPlatform {
  return (JOB_PLATFORMS as readonly string[]).includes(value);
}

export function isJobType(value: string): value is JobType {
  return (JOB_TYPES as readonly string[]).includes(value);
}

export function isJobLocation(value: string): value is JobLocation {
  return (JOB_LOCATIONS as readonly string[]).includes(value);
}
