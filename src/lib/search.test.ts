import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  allTags,
  filterJobs,
  sortJobs,
} from "./search";
import type { Job } from "./types";

function job(overrides: Partial<Job>): Job {
  return {
    id: "1",
    company: "Acme",
    role: "Dev",
    link: "",
    platform: "LinkedIn",
    type: "freelance",
    rate: "",
    location: "remote",
    status: "applied",
    appliedAt: null,
    followUpAt: null,
    notes: "",
    tags: [],
    contactName: "",
    order: 0,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

const jobs = [
  job({ id: "a", company: "Acme", role: "React Dev", platform: "Upwork", status: "applied", tags: ["react"], createdAt: 3, followUpAt: "2026-10-28" }),
  job({ id: "b", company: "Beta", role: "Designer", platform: "LinkedIn", status: "interview", tags: ["design"], createdAt: 1, followUpAt: null }),
  job({ id: "c", company: "Acme", role: "Writer", platform: "Upwork", status: "applied", tags: ["react", "writing"], createdAt: 2, followUpAt: "2026-10-27" }),
];

describe("filterJobs", () => {
  it("matches query across company, role, and tags", () => {
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, query: "react" }).map((j) => j.id)).toEqual(["a", "c"]);
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, query: "beta" }).map((j) => j.id)).toEqual(["b"]);
  });
  it("filters by status", () => {
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, status: "interview" }).map((j) => j.id)).toEqual(["b"]);
  });
  it("filters by platform", () => {
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, platform: "Upwork" }).map((j) => j.id)).toEqual(["a", "c"]);
  });
  it("filters by tag", () => {
    expect(filterJobs(jobs, { ...DEFAULT_FILTERS, tag: "design" }).map((j) => j.id)).toEqual(["b"]);
  });
  it("returns all jobs for default filters", () => {
    expect(filterJobs(jobs, DEFAULT_FILTERS)).toHaveLength(3);
  });
});

describe("sortJobs", () => {
  it("sorts by company A–Z", () => {
    expect(sortJobs(jobs, "company").map((j) => j.id)).toEqual(["a", "c", "b"]);
  });
  it("sorts follow-up soonest first, undated last", () => {
    expect(sortJobs(jobs, "followUp").map((j) => j.id)).toEqual(["c", "a", "b"]);
  });
});

describe("allTags", () => {
  it("returns distinct tags sorted alphabetically", () => {
    expect(allTags(jobs)).toEqual(["design", "react", "writing"]);
  });
});
