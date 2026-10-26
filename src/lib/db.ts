import Dexie, { type Table } from "dexie";
import {
  DEFAULT_SETTINGS,
  isJobLocation,
  isJobPlatform,
  isJobStatus,
  isJobType,
  type Job,
  type Settings,
  type Template,
} from "./types";

/**
 * JobPipe database — Dexie (IndexedDB wrapper).
 *
 * Tables: jobs, templates, settings (singleton, id === "settings").
 *
 * Versioned migrations — why three versions for a v0.1 app:
 * a shipped app cannot rewrite history. Once v1 is installed on a
 * user's machine, later releases must migrate, not recreate, their
 * data. These three versions document that discipline from day one:
 *
 *   v1 — initial schema. Jobs indexed by status/platform/createdAt
 *        plus per-column order. Templates, settings.
 *   v2 — adds appliedAt / followUpAt indexes and the multi-entry
 *        *tags index (needed for tag filtering in Step 3).
 *        Upgrade normalises old rows: missing dates become null,
 *        missing tags become [], missing updatedAt = createdAt.
 *   v3 — adds the updatedAt index (used by Step 4 stats: "recent
 *        activity" must sort by update, not creation).
 *        Upgrade backfills updatedAt where it is still missing.
 *
 * NEVER edit v1/v2 stores after release — add a new version instead.
 * NEVER use `db.delete()` / schema recreation as a "migration".
 */
export class JobPipeDatabase extends Dexie {
  jobs!: Table<Job, string>;
  templates!: Table<Template, string>;
  settings!: Table<Settings, "settings">;

  constructor() {
    super("jobpipe");

    this.version(1)
      .stores({
        jobs: "id, status, platform, createdAt, order",
        templates: "id, createdAt",
        settings: "id",
      })
      .upgrade((tx) => {
        // Seed the singleton settings row on first install.
        return tx.table("settings").put(DEFAULT_SETTINGS);
      });

    this.version(2)
      .stores({
        jobs: "id, status, platform, appliedAt, followUpAt, createdAt, order, *tags",
        templates: "id, createdAt",
        settings: "id",
      })
      .upgrade(async (tx) => {
        // Normalise rows written by v1 (no dates, no tags, no updatedAt).
        const raw = (await tx.table("jobs").toArray()) as unknown as Job[];
        const normalised: Job[] = raw.map((job) => ({
          ...job,
          appliedAt:
            typeof job.appliedAt === "string" ? job.appliedAt : null,
          followUpAt:
            typeof job.followUpAt === "string" ? job.followUpAt : null,
          tags: Array.isArray(job.tags) ? job.tags : [],
          status: isJobStatus(job.status) ? job.status : "saved",
          platform: isJobPlatform(job.platform)
            ? job.platform
            : "Other",
          type: isJobType(job.type) ? job.type : "freelance",
          location: isJobLocation(job.location)
            ? job.location
            : "remote",
          updatedAt:
            typeof job.updatedAt === "number"
              ? job.updatedAt
              : job.createdAt,
        }));
        await tx.table("jobs").bulkPut(normalised);
        const existing = await tx.table("settings").get("settings");
        if (existing === undefined) {
          await tx.table("settings").put(DEFAULT_SETTINGS);
        }
      });

    this.version(3)
      .stores({
        jobs: "id, status, platform, appliedAt, followUpAt, createdAt, updatedAt, order, *tags",
        templates: "id, createdAt",
        settings: "id",
      })
      .upgrade(async (tx) => {
        const raw = (await tx.table("jobs").toArray()) as unknown as Job[];
        const fixed: Job[] = raw.map((job) => ({
          ...job,
          updatedAt:
            typeof job.updatedAt === "number"
              ? job.updatedAt
              : job.createdAt,
        }));
        await tx.table("jobs").bulkPut(fixed);
      });
  }
}

/**
 * One shared instance. Dexie does not open the database at
 * construction — the first query opens it — so importing this
 * module is safe on the landing page build and in tests (where
 * fake-indexeddb is installed before import in setup.ts).
 */
export const db = new JobPipeDatabase();
