import { describe, expect, it } from "vitest";
import { parseExport, serializeExport } from "./import-export";
import { validateExport } from "./schemas";
import type { Job, Template } from "./types";

const validJob: Job = {
  id: "job-1",
  company: "Acme",
  role: "Dev",
  link: "",
  platform: "LinkedIn",
  type: "freelance",
  rate: "$50/hr",
  location: "remote",
  status: "applied",
  appliedAt: "2026-10-20",
  followUpAt: null,
  notes: "",
  tags: ["react"],
  contactName: "",
  order: 0,
  createdAt: 1000,
  updatedAt: 1000,
};

const validTemplate: Template = {
  id: "tpl-1",
  title: "Outreach",
  body: "Hi {name}",
  createdAt: 1000,
  updatedAt: 1000,
};

describe("validateExport", () => {
  it("accepts a valid export", () => {
    const result = validateExport({
      version: 1,
      exportedAt: 1000,
      jobs: [validJob],
      templates: [validTemplate],
    });
    expect(result.ok).toBe(true);
  });
  it("rejects an unknown status", () => {
    const result = validateExport({
      version: 1,
      exportedAt: 1000,
      jobs: [{ ...validJob, status: "hired" }],
      templates: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(" ")).toContain("status");
  });
  it("rejects a non-http link", () => {
    const result = validateExport({
      version: 1,
      exportedAt: 1000,
      jobs: [{ ...validJob, link: "ftp://example.com" }],
      templates: [],
    });
    expect(result.ok).toBe(false);
  });
  it("rejects the wrong version", () => {
    const result = validateExport({
      version: 2,
      exportedAt: 1000,
      jobs: [],
      templates: [],
    });
    expect(result.ok).toBe(false);
  });
});

describe("parseExport / serializeExport", () => {
  it("round-trips through JSON", () => {
    const text = serializeExport([validJob], [validTemplate]);
    const result = parseExport(text);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.jobs).toHaveLength(1);
      expect(result.data.templates).toHaveLength(1);
    }
  });
  it("reports invalid JSON without throwing", () => {
    const result = parseExport("{not json");
    expect(result.ok).toBe(false);
  });
});
