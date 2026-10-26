import type { Job } from "../lib/types";
import { getReminders, todayLocal, addDays } from "../lib/reminders";

interface Props {
  jobs: Job[];
  onSnooze: (job: Job) => void;
  onDone: (job: Job) => void;
  onEdit: (job: Job) => void;
}

export function ReminderPanel({ jobs, onSnooze, onDone, onEdit }: Props): React.JSX.Element {
  const { overdue, dueToday } = getReminders(jobs, todayLocal());
  if (overdue.length === 0 && dueToday.length === 0) {
    return (
      <section aria-label="Follow-up reminders" className="rounded-card border p-4">
        <h2 className="font-semibold">Follow-ups</h2>
        <p className="mt-1 text-sm text-slate-500">
          Nothing due today. Set a follow-up date on a job and it will
          appear here — in the app even if browser notifications are off.
        </p>
      </section>
    );
  }
  const renderRow = (job: Job, label: string): React.JSX.Element => (
    <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-2 text-sm">
      <span>
        <strong>{job.role}</strong> — {job.company}
        <span className="text-slate-500"> · follow-up {job.followUpAt} ({label})</span>
      </span>
      <span className="flex gap-1">
        <button type="button" onClick={() => onSnooze(job)} className="rounded border px-2 py-1 text-xs">Snooze +7 days</button>
        <button type="button" onClick={() => onDone(job)} className="rounded border px-2 py-1 text-xs">Done</button>
        <button type="button" onClick={() => onEdit(job)} className="rounded border px-2 py-1 text-xs">Edit</button>
      </span>
    </li>
  );
  return (
    <section aria-label="Follow-up reminders" className="rounded-card border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
      <h2 className="font-semibold">Follow-ups</h2>
      {overdue.length > 0 && (
        <>
          <h3 className="mt-3 text-sm font-semibold text-red-700 dark:text-red-300">Overdue ({overdue.length})</h3>
          <ul className="mt-1 space-y-1">{overdue.map((j) => renderRow(j, "overdue"))}</ul>
        </>
      )}
      {dueToday.length > 0 && (
        <>
          <h3 className="mt-3 text-sm font-semibold">Due today ({dueToday.length})</h3>
          <ul className="mt-1 space-y-1">{dueToday.map((j) => renderRow(j, "today"))}</ul>
        </>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Snooze moves the follow-up to {addDays(todayLocal(), 7)}. Done clears it.
      </p>
    </section>
  );
}
