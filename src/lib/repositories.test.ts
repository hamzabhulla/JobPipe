import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  createJob,
  createTemplate,
  deleteJob,
  getSettings,
  listJobs,
  moveJob,
  updateJob,
} from "./repositories";
import type { NewJobInput } from "./types";

function input(overrides: Partial<NewJobInput> = {}): NewJobInput {
  return {
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
    ...overrides,
  };
}

beforeEach(async () => {
  await db.jobs.clear();
  await db.templates.clear();
  await db.settings.clear();
});

describe("jobs repository", () => {
  it("appends new jobs at the end of their column", async () => {
    const a = await createJob(input());
    const b = await createJob(input({ company: "Beta" }));
    expect(a.order).toBe(0);
    expect(b.order).toBe(1);
  });

  it("moves a job across columns and renumbers both columns", async () => {
    const a = await createJob(input());
    const b = await createJob(input({ company: "Beta" }));
    await moveJob(a.id, "interview", 0);
    const jobs = await listJobs();
    const moved = jobs.find((j) => j.id === a.id);
    const remaining = jobs.find((j) => j.id === b.id);
    expect(moved?.status).toBe("interview");
    expect(moved?.order).toBe(0);
    expect(remaining?.order).toBe(0);
  });

  it("reorders within a column", async () => {
    const a = await createJob(input());
    const b = await createJob(input({ company: "Beta" }));
    const c = await createJob(input({ company: "Gamma" }));
    await moveJob(c.id, "applied", 0);
    const column = (await db.jobs.where("status").equals("applied").sortBy("order"))
      .map((j) => j.id);
    expect(column).toEqual([c.id, a.id, b.id]);
  });

  it("renumbers a column after delete", async () => {
    const a = await createJob(input());
    const b = await createJob(input({ company: "Beta" }));
    await deleteJob(a.id);
    const remaining = await db.jobs.where("status").equals("applied").sortBy("order");
    expect(remaining.map((j) => j.id)).toEqual([b.id]);
    expect(remaining[0]?.order).toBe(0);
  });

  it("moves a job to the end of a new column on status change via update", async () => {
    const a = await createJob(input());
    await createJob(input({ company: "Beta", status: "interview" }));
    await updateJob(a.id, { status: "interview" });
    const updated = await db.jobs.get(a.id);
    expect(updated?.status).toBe("interview");
    expect(updated?.order).toBe(1);
  });

  it("throws for a missing job on move", async () => {
    await expect(moveJob("missing", "applied", 0)).rejects.toThrow();
  });
});

describe("templates and settings", () => {
  it("creates and lists templates", async () => {
    await createTemplate({ title: "Outreach", body: "Hi {name}" });
    const templates = await db.templates.toArray();
    expect(templates).toHaveLength(1);
    expect(templates[0]?.title).toBe("Outreach");
  });

  it("returns default settings and reseeds when missing", async () => {
    const settings = await getSettings();
    expect(settings.id).toBe("settings");
    expect(settings.theme).toBe("system");
    expect(settings.notificationsEnabled).toBe(true);
  });
});
