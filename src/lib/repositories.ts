import { db } from "./db";
import { newId } from "./ids";
import { toStorageError } from "./storage-errors";
import {
  DEFAULT_SETTINGS,
  type Job,
  type JobPatch,
  type JobStatus,
  type NewJobInput,
  type NewTemplateInput,
  type Settings,
  type Template,
  type TemplatePatch,
} from "./types";

/**
 * Repository layer — the ONLY code that talks to Dexie.
 * UI components import from here, never from db.ts directly, so:
 *  - every write gets the same error translation (storage-errors.ts),
 *  - `order` invariants are enforced in one place,
 *  - Step 3 import/export can reuse these functions unchanged.
 *
 * Invariant: within one status column, `order` is always dense
 * 0..n-1 with no duplicates. create/move/delete all maintain it
 * inside a single transaction, so a crash mid-operation cannot
 * leave a column half-renumbered.
 */

function renumber(jobsInColumn: Job[]): Job[] {
  return jobsInColumn.map((job, index) => ({ ...job, order: index }));
}

async function columnJobs(status: JobStatus): Promise<Job[]> {
  const jobs = await db.jobs.where("status").equals(status).sortBy("order");
  return renumber(jobs);
}

// ---------------------------------------------------------------- jobs

export async function listJobs(): Promise<Job[]> {
  try {
    // Newest first for lists; the Kanban board (Step 2) re-sorts
    // by status column, then `order`, so this order is display-only.
    return await db.jobs.orderBy("createdAt").reverse().toArray();
  } catch (error) {
    throw toStorageError(error);
  }
}

export async function getJob(id: string): Promise<Job | undefined> {
  try {
    return await db.jobs.get(id);
  } catch (error) {
    throw toStorageError(error);
  }
}

export async function createJob(input: NewJobInput): Promise<Job> {
  try {
    const now = Date.now();
    const job: Job = {
      ...input,
      id: newId(),
      // Appended at the end of its column.
      order: await db.jobs.where("status").equals(input.status).count(),
      createdAt: now,
      updatedAt: now,
    };
    await db.jobs.add(job);
    return job;
  } catch (error) {
    throw toStorageError(error);
  }
}

export async function updateJob(id: string, patch: JobPatch): Promise<void> {
  try {
    await db.transaction("rw", db.jobs, async () => {
      const existing = await db.jobs.get(id);
      if (existing === undefined) {
        throw new Error(`Job not found: ${id}`);
      }
      const now = Date.now();

      // A status change via the form (not drag-and-drop) moves the
      // card to the end of the new column and renumbers the old one.
      if (patch.status !== undefined && patch.status !== existing.status) {
        const newStatus = patch.status;
        const oldColumn = (await columnJobs(existing.status)).filter(
          (job) => job.id !== id,
        );
        const newOrder = await db.jobs
          .where("status")
          .equals(newStatus)
          .count();
        await db.jobs.bulkPut(renumber(oldColumn));
        await db.jobs.put({
          ...existing,
          ...patch,
          status: newStatus,
          order: newOrder,
          updatedAt: now,
        });
        return;
      }

      await db.jobs.put({ ...existing, ...patch, updatedAt: now });
    });
  } catch (error) {
    throw toStorageError(error);
  }
}

/**
 * Drag-and-drop move. `toIndex` is clamped, so dropping past the
 * end of a column appends instead of throwing. Same-column and
 * cross-column moves share one code path: remove, insert, renumber.
 */
export async function moveJob(
  id: string,
  toStatus: JobStatus,
  toIndex: number,
): Promise<void> {
  try {
    await db.transaction("rw", db.jobs, async () => {
      const moving = await db.jobs.get(id);
      if (moving === undefined) {
        throw new Error(`Job not found: ${id}`);
      }
      const now = Date.now();

      if (moving.status === toStatus) {
        const column = (await columnJobs(toStatus)).filter(
          (job) => job.id !== id,
        );
        const clamped = Math.max(0, Math.min(toIndex, column.length));
        column.splice(clamped, 0, { ...moving, updatedAt: now });
        await db.jobs.bulkPut(renumber(column));
        return;
      }

      const fromColumn = (await columnJobs(moving.status)).filter(
        (job) => job.id !== id,
      );
      const toColumn = await columnJobs(toStatus);
      const clamped = Math.max(0, Math.min(toIndex, toColumn.length));
      toColumn.splice(clamped, 0, {
        ...moving,
        status: toStatus,
        updatedAt: now,
      });
      await db.jobs.bulkPut([
        ...renumber(fromColumn),
        ...renumber(toColumn),
      ]);
    });
  } catch (error) {
    throw toStorageError(error);
  }
}

export async function deleteJob(id: string): Promise<void> {
  try {
    await db.transaction("rw", db.jobs, async () => {
      const existing = await db.jobs.get(id);
      if (existing === undefined) return; // Delete is idempotent.
      await db.jobs.delete(id);
      const remaining = await columnJobs(existing.status);
      await db.jobs.bulkPut(renumber(remaining));
    });
  } catch (error) {
    throw toStorageError(error);
  }
}

// ------------------------------------------------------------ templates

export async function listTemplates(): Promise<Template[]> {
  try {
    return await db.templates.orderBy("createdAt").toArray();
  } catch (error) {
    throw toStorageError(error);
  }
}

export async function createTemplate(
  input: NewTemplateInput,
): Promise<Template> {
  try {
    const now = Date.now();
    const template: Template = {
      ...input,
      id: newId(),
      createdAt: now,
      updatedAt: now,
    };
    await db.templates.add(template);
    return template;
  } catch (error) {
    throw toStorageError(error);
  }
}

export async function updateTemplate(
  id: string,
  patch: TemplatePatch,
): Promise<void> {
  try {
    const existing = await db.templates.get(id);
    if (existing === undefined) {
      throw new Error(`Template not found: ${id}`);
    }
    await db.templates.put({ ...existing, ...patch, updatedAt: Date.now() });
  } catch (error) {
    throw toStorageError(error);
  }
}

export async function deleteTemplate(id: string): Promise<void> {
  try {
    await db.templates.delete(id);
  } catch (error) {
    throw toStorageError(error);
  }
}

// ------------------------------------------------------------- settings

export async function getSettings(): Promise<Settings> {
  try {
    const existing = await db.settings.get("settings");
    if (existing !== undefined) return existing;
    await db.settings.put(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  } catch (error) {
    throw toStorageError(error);
  }
}

export async function saveSettings(
  patch: Partial<Omit<Settings, "id">>,
): Promise<Settings> {
  try {
    const current = await getSettings();
    const next: Settings = { ...current, ...patch };
    await db.settings.put(next);
    return next;
  } catch (error) {
    throw toStorageError(error);
  }
}
