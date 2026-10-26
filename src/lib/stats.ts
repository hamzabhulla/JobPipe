import type { Job, JobStatus } from "./types";
import { addDays, todayLocal } from "./reminders";

export function statusCounts(jobs: Job[]): Record<JobStatus, number> {
  const counts: Record<JobStatus, number> = {
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
  };
  for (const job of jobs) counts[job.status] += 1;
  return counts;
}

function dateOfJob(job: Job): string {
  if (job.appliedAt !== null) return job.appliedAt;
  return todayLocal(new Date(job.createdAt));
}

/** Monday (YYYY-MM-DD) of the week containing `dateStr`. */
export function weekStart(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  // JS: Sunday = 0. Monday-start: shift Sunday back 6 days.
  const day = date.getDay();
  const shift = day === 0 ? -6 : 1 - day;
  return addDays(dateStr, shift);
}

export interface WeeklyCount {
  weekStart: string;
  count: number;
}

/** Applications per week for the last `weeks` weeks, ending this week. */
export function applicationsPerWeek(
  jobs: Job[],
  weeks: number,
  today: string = todayLocal(),
): WeeklyCount[] {
  const thisWeek = weekStart(today);
  const labels: string[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    labels.push(addDays(thisWeek, -7 * i));
  }
  const counts = new Map<string, number>(labels.map((l) => [l, 0]));
  for (const job of jobs) {
    const w = weekStart(dateOfJob(job));
    if (counts.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return labels.map((week) => ({
    weekStart: week,
    count: counts.get(week) ?? 0,
  }));
}

export interface RateResult {
  base: number;
  numerator: number;
  /** 0–100, 0 when base is 0 (not NaN, not a fake 100%). */
  rate: number;
}

/**
 * Response rate: jobs that got any response (interview, offer or
 * rejected) out of jobs actually submitted (everything except saved).
 */
export function responseRate(jobs: Job[]): RateResult {
  const submitted = jobs.filter((j) => j.status !== "saved");
  const responded = submitted.filter(
    (j) =>
      j.status === "interview" ||
      j.status === "offer" ||
      j.status === "rejected",
  );
  return {
    base: submitted.length,
    numerator: responded.length,
    rate:
      submitted.length === 0
        ? 0
        : Math.round((responded.length / submitted.length) * 100),
  };
}

/** Interview rate: interview or offer, out of submitted jobs. */
export function interviewRate(jobs: Job[]): RateResult {
  const submitted = jobs.filter((j) => j.status !== "saved");
  const interviewed = submitted.filter(
    (j) => j.status === "interview" || j.status === "offer",
  );
  return {
    base: submitted.length,
    numerator: interviewed.length,
    rate:
      submitted.length === 0
        ? 0
        : Math.round((interviewed.length / submitted.length) * 100),
  };
}
