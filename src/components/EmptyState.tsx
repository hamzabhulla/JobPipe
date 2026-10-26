interface Props {
  onCreate: () => void;
  onLoadSample: () => void;
}

export function EmptyState({ onCreate, onLoadSample }: Props): React.JSX.Element {
  return (
    <section
      aria-label="No applications yet"
      className="rounded-card border border-dashed border-slate-300 px-6 py-12 text-center dark:border-zinc-700"
    >
      <h2 className="text-xl font-semibold">No applications yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
        Track your first application here. Everything is stored in
        this browser only — no account, no server, nothing leaves
        your device.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onCreate}
          className="rounded bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700"
        >
          Add your first job
        </button>
        <button
          type="button"
          onClick={onLoadSample}
          className="rounded border border-slate-300 px-4 py-2 text-sm dark:border-zinc-700"
        >
          Load sample data
        </button>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Sample data is only a demo — delete it any time, one card at a time.
      </p>
    </section>
  );
}
