import type { Job } from "./types";

/** Today's date as a local YYYY-MM-DD string (never UTC — see types.ts). */
export function todayLocal(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Add `days` to a YYYY-MM-DD string, returning YYYY-MM-DD. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return todayLocal(date);
}

export type ReminderBucket = "overdue" | "dueToday" | "upcoming" | "none";

/**
 * String comparison works for YYYY-MM-DD dates (lexicographic =
 * chronological) — no Date parsing, no timezone drift.
 * Closed jobs (offer/rejected) never count as reminders.
 */
export function reminderBucket(
  job: Job,
  today: string,
): ReminderBucket {
  if (job.followUpAt === null) return "none";
  if (job.status === "offer" || job.status === "rejected") return "none";
  if (job.followUpAt < today) return "overdue";
  if (job.followUpAt === today) return "dueToday";
  return "upcoming";
}

export interface Reminders {
  overdue: Job[];
  dueToday: Job[];
}

function byFollowUp(a: Job, b: Job): number {
  const fa = a.followUpAt ?? "";
  const fb = b.followUpAt ?? "";
  if (fa < fb) return -1;
  if (fa > fb) return 1;
  return 0;
}

/** Overdue first (oldest first), then due today. Both sorted by date. */
export function getReminders(jobs: Job[], today: string): Reminders {
  const overdue: Job[] = [];
  const dueToday: Job[] = [];
  for (const job of jobs) {
    const bucket = reminderBucket(job, today);
    if (bucket === "overdue") overdue.push(job);
    else if (bucket === "dueToday") dueToday.push(job);
  }
  overdue.sort(byFollowUp);
  dueToday.sort(byFollowUp);
  return { overdue, dueToday };
}
