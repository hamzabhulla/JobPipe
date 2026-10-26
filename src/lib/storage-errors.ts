/**
 * Storage errors, translated once, here — never in UI components.
 *
 * IndexedDB fails in exactly three ways users actually hit:
 *  1. Unavailable — private/incognito mode in some browsers, or
 *     IndexedDB disabled. The app cannot store anything.
 *  2. Quota — the browser storage budget is exhausted.
 *  3. Unknown — anything else (version errors, aborted transactions).
 * The UI (Step 2 error state) only ever sees `code` + `message`,
 * which is why this layer exists: components must not parse
 * DOMException names or Dexie error strings themselves.
 */
export type StorageErrorCode = "unavailable" | "quota" | "unknown";

export class JobPipeStorageError extends Error {
  readonly code: StorageErrorCode;
  readonly cause: unknown;

  constructor(code: StorageErrorCode, message: string, cause: unknown) {
    super(message);
    this.name = "JobPipeStorageError";
    this.code = code;
    this.cause = cause;
  }
}

function errorName(error: unknown): string {
  if (error instanceof Error) return error.name;
  if (typeof error === "object" && error !== null && "name" in error) {
    const name = (error as { name: unknown }).name;
    return typeof name === "string" ? name : "";
  }
  return "";
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "";
}

/** Map any thrown value to a JobPipeStorageError. Never rethrows raw. */
export function toStorageError(error: unknown): JobPipeStorageError {
  if (error instanceof JobPipeStorageError) return error;
  const name = errorName(error);
  const message = errorMessage(error);

  if (name === "QuotaExceededError" || name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return new JobPipeStorageError(
      "quota",
      "Browser storage is full. Free up space or export your data, then try again.",
      error,
    );
  }
  if (
    name === "InvalidStateError" ||
    name === "SecurityError" ||
    name === "UnknownError" ||
    /indexeddb|private mode|not allowed/i.test(message)
  ) {
    return new JobPipeStorageError(
      "unavailable",
      "Local storage is not available in this browser (for example in private mode). JobPipe cannot save data here — try a normal browser window.",
      error,
    );
  }
  return new JobPipeStorageError(
    "unknown",
    "Something went wrong saving your data. Your existing data is untouched — please try again.",
    error,
  );
}

/** Cheap pre-flight check before the first write: is IndexedDB
 *  even present? This catches disabled storage without opening
 *  the database. A `true` here does NOT guarantee a later write
 *  succeeds (quota can still hit) — writes still go through
 *  toStorageError. */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}
