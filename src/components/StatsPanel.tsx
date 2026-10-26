import type { Job } from "../lib/types";
import {
  applicationsPerWeek,
  interviewRate,
  responseRate,
  statusCounts,
} from "../lib/stats";
import { JOB_STATUS_LABELS } from "../lib/types";

/** Lightweight SVG bar chart — no chart library, no canvas. */
export function StatsPanel({ jobs }: { jobs: Job[] }): React.JSX.Element {
  const weeks = applicationsPerWeek(jobs, 8);
  const max = Math.max(1, ...weeks.map((w) => w.count));
  const resp = responseRate(jobs);
  const interv = interviewRate(jobs);
  const counts = statusCounts(jobs);
  const barW = 400 / Math.max(1, weeks.length);

  return (
    <section aria-label="Statistics" className="rounded-card border p-4">
      <h2 className="font-semibold">Stats</h2>
      {jobs.length === 0 ? (
        <p className="mt-1 text-sm text-slate-500">
          Stats appear once you add applications.
        </p>
      ) : (
        <>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div className="rounded bg-slate-50 p-2 dark:bg-zinc-900">
              <dt className="text-xs text-slate-500">Total</dt>
              <dd className="text-xl font-bold">{jobs.length}</dd>
            </div>
            <div className="rounded bg-slate-50 p-2 dark:bg-zinc-900">
              <dt className="text-xs text-slate-500">Response rate</dt>
              <dd className="text-xl font-bold">{resp.rate}%</dd>
              <dd className="text-xs text-slate-500">{resp.numerator}/{resp.base} responded</dd>
            </div>
            <div className="rounded bg-slate-50 p-2 dark:bg-zinc-900">
              <dt className="text-xs text-slate-500">Interview rate</dt>
              <dd className="text-xl font-bold">{interv.rate}%</dd>
              <dd className="text-xs text-slate-500">{interv.numerator}/{interv.base} interviewed</dd>
            </div>
          </dl>

          <h3 className="mt-4 text-sm font-semibold">Applications per week (last 8 weeks)</h3>
          <svg
            viewBox="0 0 400 140"
            role="img"
            aria-label={`Bar chart of applications per week: ${weeks.map((w) => `${w.weekStart}: ${w.count}`).join(", ")}`}
            className="mt-2 w-full"
          >
            {weeks.map((w, i) => {
              const h = (w.count / max) * 100;
              const x = i * barW + 4;
              return (
                <g key={w.weekStart}>
                  <rect
                    x={x}
                    y={120 - h}
                    width={Math.max(8, barW - 8)}
                    height={h}
                    rx={3}
                    fill="#5449d6"
                  >
                    <title>{`${w.weekStart}: ${w.count}`}</title>
                  </rect>
                  <text x={x + (barW - 8) / 2} y={135} fontSize="9" textAnchor="middle" fill="currentColor">
                    {w.count}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="text-xs text-slate-500">
            Weeks start Monday. Counts use applied date, or creation date when no applied date is set.
          </p>

          <h3 className="mt-4 text-sm font-semibold">By status</h3>
          <ul className="mt-1 space-y-1 text-sm">
            {(Object.keys(counts) as (keyof typeof counts)[]).map((s) => (
              <li key={s} className="flex justify-between">
                <span>{JOB_STATUS_LABELS[s]}</span>
                <span>{counts[s]}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
