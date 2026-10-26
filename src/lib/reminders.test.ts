import { describe, expect, it } from "vitest";
import {
  addDays,
  getReminders,
  reminderBucket,
  todayLocal,
} from "./reminders";
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

describe("addDays / todayLocal", () => {
  it("adds days across a month boundary", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
  });

  it("formats a local date as YYYY-MM-DD", () => {
    expect(todayLocal(new Date(2026, 9, 26))).toBe("2026-10-26");
  });
});

describe("reminderBucket", () => {
  const today = "2026-10-26";
  it("is overdue before today", () => {
    expect(
      reminderBucket(job({ followUpAt: "2026-10-25" }), today),
    ).toBe("overdue");
  });
  it("is dueToday on today", () => {
    expect(
      reminderBucket(job({ followUpAt: "2026-10-26" }), today),
    ).toBe("dueToday");
  });
  it("is upcoming after today", () => {
    expect(
      reminderBucket(job({ followUpAt: "2026-10-27" }), today),
    ).toBe("upcoming");
  });
  it("is none without a follow-up date", () => {
    expect(reminderBucket(job({}), today)).toBe("none");
  });
  it("is none for closed jobs even with a date", () => {
    expect(
      reminderBucket(
        job({ status: "offer", followUpAt: "2026-10-25" }),
        today,
      ),
    ).toBe("none");
  });
});

describe("getReminders", () => {
  it("sorts overdue oldest-first and excludes upcoming", () => {
    const jobs = [
      job({ id: "a", followUpAt: "2026-10-24" }),
      job({ id: "b", followUpAt: "2026-10-26" }),
      job({ id: "c", followUpAt: "2026-10-20" }),
      job({ id: "d", followUpAt: "2026-10-30" }),
    ];
    const { overdue, dueToday } = getReminders(jobs, "2026-10-26");
    expect(overdue.map((j) => j.id)).toEqual(["c", "a"]);
    expect(dueToday.map((j) => j.id)).toEqual(["b"]);
  });
});
