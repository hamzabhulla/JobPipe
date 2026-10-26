import { useCallback, useEffect, useRef, useState } from "react";
import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";
import { JobForm, type FormValues } from "./components/JobForm";
import { KanbanBoard } from "./components/KanbanBoard";
import { ReminderPanel } from "./components/ReminderPanel";
import { ShortcutsDialog } from "./components/ShortcutsDialog";
import { StatsPanel } from "./components/StatsPanel";
import { TemplatePanel } from "./components/TemplatePanel";
import {
  createJob,
  createTemplate,
  deleteJob,
  deleteTemplate,
  getSettings,
  listJobs,
  listTemplates,
  moveJob,
  replaceAll,
  saveSettings,
  updateJob,
} from "./lib/repositories";
import { JobPipeStorageError } from "./lib/storage-errors";
import { getReminders, todayLocal, addDays } from "./lib/reminders";
import {
  DEFAULT_FILTERS,
  allTags,
  filterJobs,
  sortJobs,
  type JobFilters,
  type JobSort,
} from "./lib/search";
import { downloadTextFile, parseExport, serializeExport } from "./lib/import-export";
import type { ExportData } from "./lib/schemas";
import { applyTheme, getStoredTheme, setStoredTheme } from "./lib/theme";
import { getSampleJobs, getSampleTemplates } from "./lib/sample-data";
import type { Job, JobStatus, Template, ThemePreference } from "./lib/types";
import { JOB_PLATFORMS, JOB_STATUSES } from "./lib/types";

type View = "board" | "templates" | "stats";

export function App(): React.JSX.Element {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("board");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<JobSort>("recent");
  const [theme, setTheme] = useState<ThemePreference>(getStoredTheme());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [pendingImport, setPendingImport] = useState<ExportData | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    try {
      const [j, t, s] = await Promise.all([
        listJobs(),
        listTemplates(),
        getSettings(),
      ]);
      setJobs(j);
      setTemplates(t);
      setNotificationsEnabled(s.notificationsEnabled);
      setError("");
    } catch (e) {
      setError(
        e instanceof JobPipeStorageError
          ? e.message
          : "Could not load your data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    applyTheme(theme);
    setStoredTheme(theme);
  }, [theme]);

  // Follow-up notification (in-app panel is the fallback and is
  // always shown — this only adds a system notification when the
  // user has already granted permission, at most once per day).
  useEffect(() => {
    if (!notificationsEnabled || jobs.length === 0) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    const today = todayLocal();
    try {
      if (localStorage.getItem("jobpipe-notified") === today) return;
      const { overdue, dueToday } = getReminders(jobs, today);
      const total = overdue.length + dueToday.length;
      if (total === 0) return;
      new Notification(`JobPipe: ${total} follow-up${total === 1 ? "" : "s"} due`, {
        body:
          overdue.length > 0
            ? `${overdue.length} overdue, ${dueToday.length} due today.`
            : `${dueToday.length} due today.`,
      });
      localStorage.setItem("jobpipe-notified", today);
    } catch {
      // Notification failures must never break the app.
    }
  }, [jobs, notificationsEnabled]);

  // Shortcuts: N new job, / search, Esc close.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      const target = e.target as HTMLElement | null;
      const inField =
        target !== null &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT");
      if (e.key === "Escape") {
        setShowForm(false);
        setShowShortcuts(false);
        setDeleteTarget(null);
        setPendingImport(null);
        return;
      }
      if (inField) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "n" || e.key === "N") {
        setEditing(null);
        setShowForm(true);
      } else if (e.key === "?") {
        setShowShortcuts(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleSubmit(values: FormValues): Promise<void> {
    try {
      if (editing === null) {
        await createJob(values);
      } else {
        await updateJob(editing.id, values);
      }
      setShowForm(false);
      setEditing(null);
      await reload();
    } catch (e) {
      setError(
        e instanceof JobPipeStorageError ? e.message : "Could not save.",
      );
    }
  }

  async function handleMove(
    jobId: string,
    toStatus: JobStatus,
    toIndex: number,
  ): Promise<void> {
    try {
      await moveJob(jobId, toStatus, toIndex);
      await reload();
    } catch (e) {
      setError(
        e instanceof JobPipeStorageError ? e.message : "Could not move.",
      );
    }
  }

  async function handleStatusChange(job: Job, status: JobStatus): Promise<void> {
    if (job.status === status) return;
    const targetCount = jobs.filter((j) => j.status === status).length;
    await handleMove(job.id, status, targetCount);
  }

  async function handleLoadSample(): Promise<void> {
    try {
      for (const job of getSampleJobs()) await createJob(job);
      for (const tpl of getSampleTemplates()) await createTemplate(tpl);
      await saveSettings({ sampleDataLoaded: true });
      await reload();
    } catch (e) {
      setError(
        e instanceof JobPipeStorageError
          ? e.message
          : "Could not load sample data.",
      );
    }
  }

  function handleExport(): void {
    downloadTextFile(
      `jobpipe-export-${todayLocal()}.json`,
      serializeExport(jobs, templates),
      "application/json",
    );
  }

  async function handleImportFile(file: File): Promise<void> {
    const text = await file.text();
    const result = parseExport(text);
    if (!result.ok) {
      setImportErrors(result.errors);
      return;
    }
    setImportErrors([]);
    setPendingImport(result.data);
  }

  async function confirmImport(): Promise<void> {
    if (pendingImport === null) return;
    try {
      await replaceAll(pendingImport.jobs, pendingImport.templates);
      setPendingImport(null);
      setNotice(
        `Imported ${pendingImport.jobs.length} jobs and ${pendingImport.templates.length} templates. Your previous data was replaced, as confirmed.`,
      );
      await reload();
    } catch (e) {
      setError(
        e instanceof JobPipeStorageError
          ? e.message
          : "Could not import.",
      );
    }
  }

  async function enableNotifications(): Promise<void> {
    if (typeof Notification === "undefined") {
      setNotice("This browser does not support notifications. The in-app follow-up panel still works.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await saveSettings({ notificationsEnabled: true });
      setNotificationsEnabled(true);
      setNotice("Notifications enabled.");
    } else {
      setNotice("Notifications were not granted. The in-app follow-up panel still works.");
    }
  }

  const filtered = sortJobs(filterJobs(jobs, filters), sort);
  const tags = allTags(jobs);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8" aria-label="Loading">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-zinc-800" />
          <div className="h-40 rounded bg-slate-100 dark:bg-zinc-900" />
          <div className="grid gap-3 md:grid-cols-5">
            {JOB_STATUSES.map((s) => (
              <div key={s} className="h-64 rounded bg-slate-100 dark:bg-zinc-900" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error !== "" && jobs.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <ErrorState message={error} onRetry={() => void reload()} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">JobPipe</h1>
          <p className="text-sm text-slate-500">
            {jobs.length} application{jobs.length === 1 ? "" : "s"} · stored
            only in this browser
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { setEditing(null); setShowForm(true); }} className="rounded bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700">
            + New job (N)
          </button>
          <button type="button" onClick={() => setShowShortcuts(true)} className="rounded border px-3 py-2 text-sm">
            Shortcuts (?)
          </button>
          <label className="sr-only" htmlFor="theme-select">Theme</label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemePreference)}
            className="rounded border px-2 py-2 text-sm dark:bg-zinc-800"
          >
            <option value="system">System theme</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </header>

      {error !== "" && (
        <p role="alert" className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}
      {notice !== "" && (
        <p role="status" className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          {notice} <button type="button" onClick={() => setNotice("")} className="underline">Dismiss</button>
        </p>
      )}

      <nav aria-label="Sections" className="mt-6 flex gap-2 border-b">
        {([
          ["board", "Board"],
          ["templates", "Templates"],
          ["stats", "Stats"],
        ] as [View, string][]).map(([v, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            aria-current={view === v ? "page" : undefined}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              view === v
                ? "border-accent-600 text-accent-700 dark:text-accent-300"
                : "border-transparent text-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-2 py-1 text-xs">
          <button type="button" onClick={handleExport} className="rounded border px-2 py-1">Export JSON</button>
          <button type="button" onClick={() => fileRef.current?.click()} className="rounded border px-2 py-1">Import JSON</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import JSON file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f !== undefined) void handleImportFile(f);
              e.target.value = "";
            }}
          />
          <button type="button" onClick={() => void enableNotifications()} className="rounded border px-2 py-1">
            {notificationsEnabled ? "Notifications on" : "Enable notifications"}
          </button>
        </span>
      </nav>

      {importErrors.length > 0 && (
        <div role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          <strong>Import failed — nothing was changed.</strong>
          <ul className="mt-1 list-disc pl-5">
            {importErrors.map((err) => <li key={err}>{err}</li>)}
          </ul>
        </div>
      )}

      {view === "board" && (
        <>
          <div className="mt-4">
            <ReminderPanel
              jobs={jobs}
              onSnooze={(job) => void updateJob(job.id, { followUpAt: addDays(todayLocal(), 7) }).then(() => reload())}
              onDone={(job) => void updateJob(job.id, { followUpAt: null }).then(() => reload())}
              onEdit={(job) => { setEditing(job); setShowForm(true); }}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="search">Search applications</label>
            <input
              ref={searchRef}
              id="search"
              type="search"
              placeholder="Search… ( / )"
              value={filters.query}
              onChange={(e) => setFilters({ ...filters, query: e.target.value })}
              className="min-w-[200px] flex-1 rounded border px-3 py-2 text-sm dark:bg-zinc-800"
            />
            <label className="sr-only" htmlFor="filter-status">Filter by status</label>
            <select id="filter-status" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as JobStatus | "all" })} className="rounded border px-2 py-2 text-sm dark:bg-zinc-800">
              <option value="all">All statuses</option>
              {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="sr-only" htmlFor="filter-platform">Filter by platform</label>
            <select id="filter-platform" value={filters.platform} onChange={(e) => setFilters({ ...filters, platform: e.target.value as (typeof JOB_PLATFORMS)[number] | "all" })} className="rounded border px-2 py-2 text-sm dark:bg-zinc-800">
              <option value="all">All platforms</option>
              {JOB_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <label className="sr-only" htmlFor="filter-tag">Filter by tag</label>
            <select id="filter-tag" value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })} className="rounded border px-2 py-2 text-sm dark:bg-zinc-800">
              <option value="all">All tags</option>
              {tags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <label className="sr-only" htmlFor="sort">Sort</label>
            <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as JobSort)} className="rounded border px-2 py-2 text-sm dark:bg-zinc-800">
              <option value="recent">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="company">Company A–Z</option>
              <option value="followUp">Follow-up soonest</option>
            </select>
          </div>

          <div className="mt-4">
            {jobs.length === 0 ? (
              <EmptyState
                onCreate={() => { setEditing(null); setShowForm(true); }}
                onLoadSample={() => void handleLoadSample()}
              />
            ) : filtered.length === 0 ? (
              <p className="rounded border px-4 py-8 text-center text-sm text-slate-500">
                No applications match these filters. Clear the search or filters to see all {jobs.length}.
              </p>
            ) : (
              <KanbanBoard
                jobs={filtered}
                onMove={(id, s, i) => void handleMove(id, s, i)}
                onEdit={(job) => { setEditing(job); setShowForm(true); }}
                onDelete={(job) => setDeleteTarget(job)}
                onStatusChange={(job, s) => void handleStatusChange(job, s)}
              />
            )}
          </div>
        </>
      )}

      {view === "templates" && (
        <div className="mt-4 max-w-3xl">
          <TemplatePanel
            jobs={jobs}
            templates={templates}
            onCreate={(title, body) => void createTemplate({ title, body }).then(() => reload())}
            onDelete={(id) => void deleteTemplate(id).then(() => reload())}
          />
        </div>
      )}

      {view === "stats" && (
        <div className="mt-4 max-w-3xl">
          <StatsPanel jobs={jobs} />
        </div>
      )}

      <footer className="mt-10 border-t pt-4 text-xs text-slate-500">
        <p>
          JobPipe is free, open source and local-first. Your data never
          leaves this browser. <a href="/" className="underline">About JobPipe</a> ·{" "}
          <a href="https://github.com/hamzabhulla/JobPipe" target="_blank" rel="noreferrer" className="underline">GitHub</a>
        </p>
      </footer>

      {showForm && (
        <div role="dialog" aria-modal="true" aria-label={editing === null ? "New job" : "Edit job"} className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="mx-auto my-8 max-w-2xl rounded-card bg-white p-6 shadow-card dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold">{editing === null ? "New job" : "Edit job"}</h2>
            <JobForm
              initial={editing}
              onSubmit={(v) => void handleSubmit(v)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {deleteTarget !== null && (
        <div role="dialog" aria-modal="true" aria-label="Confirm delete" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-card bg-white p-6 dark:bg-zinc-900">
            <h2 className="font-semibold">Delete this application?</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {deleteTarget.role} at {deleteTarget.company} will be permanently deleted from this browser.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => void deleteJob(deleteTarget.id).then(() => { setDeleteTarget(null); return reload(); })} className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white">Delete</button>
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded border px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {pendingImport !== null && (
        <div role="dialog" aria-modal="true" aria-label="Confirm import overwrite" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-card bg-white p-6 dark:bg-zinc-900">
            <h2 className="font-semibold">Replace all current data?</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              This import contains {pendingImport.jobs.length} jobs and {pendingImport.templates.length} templates.
              Importing will <strong>permanently replace</strong> your current {jobs.length} jobs and {templates.length} templates.
              Export first if you want a backup.
            </p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => void confirmImport()} className="rounded bg-red-700 px-4 py-2 text-sm font-medium text-white">Replace all data</button>
              <button type="button" onClick={() => setPendingImport(null)} className="rounded border px-4 py-2 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <ShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </main>
  );
}
