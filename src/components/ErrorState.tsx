interface Props {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: Props): React.JSX.Element {
  return (
    <section
      role="alert"
      className="rounded-card border border-red-200 bg-red-50 px-6 py-8 text-center dark:border-red-900 dark:bg-red-950"
    >
      <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
        Couldn&apos;t load your data
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-red-700 dark:text-red-200">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
      >
        Try again
      </button>
    </section>
  );
}
