import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

// Register the PWA service worker in production only. In dev,
// vite-plugin-pwa does not serve a worker, so registering would
// cache dev files and cause stale-app confusion.
if (
  typeof navigator !== "undefined" &&
  "serviceWorker" in navigator &&
  import.meta.env.PROD
) {
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // Offline support is a bonus, not a requirement — the app
    // works fully without a service worker.
  });
}

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("JobPipe: #root element missing in app/index.html");
}
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
