import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

/**
 * STEP 1 SHELL ONLY — replaced in Step 2 by the real App component
 * (Kanban board + job form). This file exists in Step 1 so that
 * `npm run dev`, `npm run typecheck` and `npm run build` already
 * pass on the Step 1 tree, proving the toolchain before any
 * feature code lands. It intentionally renders no features.
 */
function StepOneShell(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">JobPipe</h1>
      <p className="mt-4 text-base leading-relaxed text-slate-600">
        Step 1 complete: project setup and database layer are in place.
        The Kanban board, job form and all features arrive in Steps 2-4.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        Data stays in this browser — no account, no server.
      </p>
    </main>
  );
}

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("JobPipe: #root element missing in app/index.html");
}
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <StepOneShell />
  </React.StrictMode>,
);
