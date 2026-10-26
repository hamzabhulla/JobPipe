interface Props {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsDialog({ open, onClose }: Props): React.JSX.Element | null {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-card bg-white p-6 shadow-card dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Keyboard shortcuts</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt>New job</dt><dd><kbd className="rounded border px-2 py-0.5">N</kbd></dd></div>
          <div className="flex justify-between"><dt>Focus search</dt><dd><kbd className="rounded border px-2 py-0.5">/</kbd></dd></div>
          <div className="flex justify-between"><dt>Close dialog / form</dt><dd><kbd className="rounded border px-2 py-0.5">Esc</kbd></dd></div>
          <div className="flex justify-between"><dt>Reorder a card (keyboard)</dt><dd><span className="text-slate-500">Focus the drag handle, Space, arrows, Space</span></dd></div>
        </dl>
        <button type="button" onClick={onClose} className="mt-6 rounded bg-accent-600 px-4 py-2 text-sm font-medium text-white">
          Close
        </button>
      </div>
    </div>
  );
}
