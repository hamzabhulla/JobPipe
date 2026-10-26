import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Job, JobStatus } from "../lib/types";
import { JOB_STATUSES } from "../lib/types";

interface Props {
  job: Job;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onStatusChange: (job: Job, status: JobStatus) => void;
}

export function JobCard({ job, onEdit, onDelete, onStatusChange }: Props): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded-card bg-white p-3 shadow-card dark:bg-zinc-900"
      aria-label={`${job.role} at ${job.company}`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded px-1 py-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          aria-label={`Drag ${job.role} at ${job.company} to reorder`}
          title="Drag to reorder (keyboard: focus, Space to pick up, arrows to move, Space to drop)"
        >
          ⠿
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{job.role}</h3>
          <p className="truncate text-sm text-slate-600 dark:text-slate-300">
            {job.company}
          </p>
        </div>
      </div>

      <dl className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-slate-500">Platform</dt>
          <dd>{job.platform} · {job.type} · {job.location}</dd>
        </div>
        {job.rate !== "" && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-500">Rate</dt>
            <dd>{job.rate}</dd>
          </div>
        )}
        {job.followUpAt !== null && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-500">Follow-up</dt>
            <dd>{job.followUpAt}</dd>
          </div>
        )}
        {job.contactName !== "" && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-slate-500">Contact</dt>
            <dd>{job.contactName}</dd>
          </div>
        )}
      </dl>

      {job.tags.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1" aria-label="Tags">
          {job.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-accent-50 px-2 py-0.5 text-xs text-accent-700 dark:bg-accent-900 dark:text-accent-200"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      {job.link !== "" && (
        <a
          href={job.link}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs font-medium text-accent-600 underline hover:text-accent-700"
        >
          Open posting
        </a>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`status-${job.id}`}>
          Move {job.role} to status
        </label>
        <select
          id={`status-${job.id}`}
          value={job.status}
          onChange={(e) =>
            onStatusChange(job, e.target.value as JobStatus)
          }
          className="rounded border border-slate-300 bg-white px-1 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
        >
          {JOB_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onEdit(job)}
          className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(job)}
          className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
