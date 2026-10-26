import "@testing-library/jest-dom/vitest";
// fake-indexeddb must load BEFORE any module imports db.ts, so this
// file is listed as a Vitest setupFile (see vite.config.ts) and
// Step 6 repository tests import the DB only after this runs.
import "fake-indexeddb/auto";
