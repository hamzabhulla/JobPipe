import type { Job, JobPlatform, JobStatus } from "./types";

export interface JobFilters {
  query: string;
  status: JobStatus | "all";
  platform: JobPlatform | "all";
  tag: string | "all";
}

export const DEFAULT_FILTERS: JobFilters = {
  query: "",
  status: "all",
  platform: "all",
  tag: "all",
};

export type JobSort = "recent" | "oldest" | "company" | "followUp";

/** Case-insensitive match across company, role, notes, contact, tags. */
export function filterJobs(jobs: Job[], filters: JobFilters): Job[] {
  const q = filters.query.trim().toLowerCase();
  return jobs.filter((job) => {
    if (filters.status !== "all" && job.status !== filters.status) {
      return false;
    }
    if (filters.platform !== "all" && job.platform !== filters.platform) {
      return false;
    }
    if (filters.tag !== "all" && !job.tags.includes(filters.tag)) {
      return false;
    }
    if (q === "") return true;
    const haystack = [
      job.company,
      job.role,
      job.notes,
      job.contactName,
      ...job.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function sortJobs(jobs: Job[], sort: JobSort): Job[] {
  const copy = [...jobs];
  switch (sort) {
    case "recent":
      return copy.sort((a, b) => b.createdAt - a.createdAt);
    case "oldest":
      return copy.sort((a, b) => a.createdAt - b.createdAt);
    case "company":
      return copy.sort((a, b) =>
        a.company.localeCompare(b.company),
      );
    case "followUp": {
      // Jobs with a follow-up first (earliest first), then the rest.
      return copy.sort((a, b) => {
        if (a.followUpAt === null && b.followUpAt === null) return 0;
        if (a.followUpAt === null) return 1;
        if (b.followUpAt === null) return -1;
        return a.followUpAt < b.followUpAt ? -1 : 1;
      });
    }
  }
}

/** All distinct tags across jobs, alphabetically sorted. */
export function allTags(jobs: Job[]): string[] {
  const set = new Set<string>();
  for (const job of jobs) {
    for (const tag of job.tags) set.add(tag);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}
