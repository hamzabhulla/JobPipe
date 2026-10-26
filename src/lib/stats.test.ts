import { describe, expect, it } from "vitest";
import {
  applicationsPerWeek,
  interviewRate,
  responseRate,
  statusCounts,
  weekStart,
} from "./stats";
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

describe("weekStart", () => {
  it("returns the Monday of the week", () => {
    expect(weekStart("2026-10-28")).toBe("2026-10-26");
    expect(weekStart("2026-10-26")).toBe("2026-10-26");
    expect(weekStart("2026-11-01")).toBe("2026-10-26");
  });
});

describe("statusCounts", () => {
  it("counts every status, including zeros", () => {
    const jobs = [
      job({ status: "applied" }),
      job({ status: "applied" }),
      job({ status: "offer" }),
    ];
    expect(statusCounts(jobs)).toEqual({
      saved: 0,
      applied: 2,
      interview: 0,
      offer: 1,
      rejected: 0,
    });
  });
});

describe("applicationsPerWeek", () => {
  it("buckets by Monday week over the last N weeks", () => {
    const jobs = [
      job({ appliedAt: "2026-10-26" }),
      job({ appliedAt: "2026-10-27" }),
      job({ appliedAt: "2026-10-20" }),
      job({ appliedAt: "2026-09-01" }),
    ];
    expect(applicationsPerWeek(jobs, 2, "2026-10-28")).toEqual([
      { weekStart: "2026-10-19", count: 1 },
      { weekStart: "2026-10-26", count: 2 },
    ]);
  });
});

describe("responseRate / interviewRate", () => {
  it("returns 0, not NaN, when nothing was submitted", () => {
    const jobs = [job({ status: "saved" })];
    expect(responseRate(jobs)).toEqual({ base: 0, numerator: 0, rate: 0 });
    expect(interviewRate(jobs)).toEqual({ base: 0, numerator: 0, rate: 0 });
  });
  it("counts interview, offer, and rejected as responses", () => {
    const jobs = [
      job({ status: "applied" }),
      job({ status: "interview" }),
      job({ status: "offer" }),
      job({ status: "rejected" }),
      job({ status: "saved" }),
    ];
    expect(responseRate(jobs)).toEqual({ base: 4, numerator: 3, rate: 75 });
    expect(interviewRate(jobs)).toEqual({ base: 4, numerator: 2, rate: 50 });
  });
});
