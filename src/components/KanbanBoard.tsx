import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useRef, useState } from "react";
import type { Job, JobStatus } from "../lib/types";
import { JOB_STATUSES, JOB_STATUS_LABELS } from "../lib/types";
import { JobCard } from "./JobCard";

interface Props {
  jobs: Job[];
  onMove: (jobId: string, toStatus: JobStatus, toIndex: number) => void;
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onStatusChange: (job: Job, status: JobStatus) => void;
}

function Column({
  status,
  jobs,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  status: JobStatus;
  jobs: Job[];
  onEdit: (job: Job) => void;
  onDelete: (job: Job) => void;
  onStatusChange: (job: Job, status: JobStatus) => void;
}): React.JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const sorted = [...jobs].sort((a, b) => a.order - b.order);
  return (
    <section
      aria-label={`${JOB_STATUS_LABELS[status]} column`}
      className={`flex min-h-[200px] flex-col rounded-card border p-2 ${
        isOver
          ? "border-accent-500 bg-accent-50 dark:bg-accent-900/30"
          : "border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900/50"
      }`}
    >
      <h2 className="px-1 py-2 text-sm font-semibold">
        {JOB_STATUS_LABELS[status]}{" "}
        <span className="text-slate-500">({sorted.length})</span>
      </h2>
      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2">
        <SortableContext
          items={sorted.map((j) => j.id)}
          strategy={verticalListSortingStrategy}
        >
          {sorted.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </SortableContext>
        {sorted.length === 0 && (
          <p className="px-1 py-4 text-center text-xs text-slate-500">
            No jobs here yet. Drag a card here, or use a card&apos;s
            status menu.
          </p>
        )}
      </div>
    </section>
  );
}

export function KanbanBoard({
  jobs,
  onMove,
  onEdit,
  onDelete,
  onStatusChange,
}: Props): React.JSX.Element {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [activeColumn, setActiveColumn] = useState<JobStatus>("applied");
  const touchX = useRef<number | null>(null);

  const byStatus = (status: JobStatus): Job[] =>
    jobs.filter((j) => j.status === status);

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (over === null) return;
    const jobId = String(active.id);
    const overId = String(over.id);
    const job = jobs.find((j) => j.id === jobId);
    if (job === undefined) return;
    // Dropping on a column container appends to that column.
    if ((JOB_STATUSES as readonly string[]).includes(overId)) {
      const toStatus = overId as JobStatus;
      const target = byStatus(toStatus);
      onMove(jobId, toStatus, target.length);
      return;
    }
    const targetJob = jobs.find((j) => j.id === overId);
    if (targetJob === undefined) return;
    const targetColumn = byStatus(targetJob.status).sort(
      (a, b) => a.order - b.order,
    );
    const toIndex = targetColumn.findIndex((j) => j.id === overId);
    if (toIndex >= 0) onMove(jobId, targetJob.status, toIndex);
  }

  const activeIndex = JOB_STATUSES.indexOf(activeColumn);
  const prevStatus = JOB_STATUSES[activeIndex - 1];
  const nextStatus = JOB_STATUSES[activeIndex + 1];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      {/* Mobile: one column at a time, swipe or buttons to switch. */}
      <div className="md:hidden">
        <div
          role="tablist"
          aria-label="Kanban columns"
          className="mb-2 flex flex-wrap gap-1"
        >
          {JOB_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={s === activeColumn}
              onClick={() => setActiveColumn(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                s === activeColumn
                  ? "bg-accent-600 text-white"
                  : "bg-slate-100 dark:bg-zinc-800"
              }`}
            >
              {JOB_STATUS_LABELS[s]} ({byStatus(s).length})
            </button>
          ))}
        </div>
        <div
          onTouchStart={(e) => {
            const t = e.touches[0];
            touchX.current = t === undefined ? null : t.clientX;
          }}
          onTouchEnd={(e) => {
            const t = e.changedTouches[0];
            if (touchX.current === null || t === undefined) return;
            const dx = t.clientX - touchX.current;
            if (dx < -50 && nextStatus !== undefined) {
              setActiveColumn(nextStatus);
            } else if (dx > 50 && prevStatus !== undefined) {
              setActiveColumn(prevStatus);
            }
            touchX.current = null;
          }}
        >
          <Column
            status={activeColumn}
            jobs={byStatus(activeColumn)}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        </div>
        <div className="mt-2 flex justify-between">
          <button
            type="button"
            disabled={prevStatus === undefined}
            onClick={() => {
              if (prevStatus !== undefined) setActiveColumn(prevStatus);
            }}
            className="rounded border px-3 py-1 text-xs disabled:opacity-40"
          >
            ← Previous column
          </button>
          <button
            type="button"
            disabled={nextStatus === undefined}
            onClick={() => {
              if (nextStatus !== undefined) setActiveColumn(nextStatus);
            }}
            className="rounded border px-3 py-1 text-xs disabled:opacity-40"
          >
            Next column →
          </button>
        </div>
      </div>

      {/* Desktop: all five columns side by side. */}
      <div className="hidden gap-3 md:grid md:grid-cols-5 md:items-start">
        {JOB_STATUSES.map((s) => (
          <Column
            key={s}
            status={s}
            jobs={byStatus(s)}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </DndContext>
  );
}
