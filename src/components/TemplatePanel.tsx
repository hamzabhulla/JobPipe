import { useState } from "react";
import type { Job, Template } from "../lib/types";
import { renderTemplate } from "../lib/templates";

interface Props {
  jobs: Job[];
  templates: Template[];
  onCreate: (title: string, body: string) => void;
  onDelete: (id: string) => void;
}

const inputClass =
  "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";

export function TemplatePanel({ jobs, templates, onCreate, onDelete }: Props): React.JSX.Element {
  const [templateId, setTemplateId] = useState("");
  const [jobId, setJobId] = useState("");
  const [name, setName] = useState("Hamza Bhulla");
  const [skills, setSkills] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const template = templates.find((t) => t.id === templateId);
  const job = jobs.find((j) => j.id === jobId);
  const rendered =
    template !== undefined && job !== undefined
      ? renderTemplate(template.body, {
          company: job.company,
          role: job.role,
          name,
          skills,
        })
      : "";

  async function handleCopy(): Promise<void> {
    setCopyError("");
    try {
      await navigator.clipboard.writeText(rendered);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(
        "Clipboard blocked by the browser. Select the text below and copy it manually.",
      );
    }
  }

  return (
    <section aria-label="Proposal templates" className="space-y-4">
      <h2 className="text-lg font-semibold">Proposal templates</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Placeholders: <code>{"{company}"}</code> <code>{"{role}"}</code>{" "}
        <code>{"{name}"}</code> <code>{"{skills}"}</code>. Pick a template
        and a job, fill in your name and skills, then copy the result.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="tpl-select">Template</label>
          <select id="tpl-select" className={inputClass} value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Choose a template…</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="tpl-job">Job</label>
          <select id="tpl-job" className={inputClass} value={jobId} onChange={(e) => setJobId(e.target.value)}>
            <option value="">Choose a job…</option>
            {jobs.map((j) => <option key={j.id} value={j.id}>{j.role} — {j.company}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="tpl-name">Your name</label>
          <input id="tpl-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="tpl-skills">Skills</label>
          <input id="tpl-skills" className={inputClass} value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, Tailwind" />
        </div>
      </div>

      {rendered !== "" && (
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="tpl-output">Ready to send</label>
          <textarea id="tpl-output" className={inputClass} rows={5} readOnly value={rendered} />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => void handleCopy()} className="rounded bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700">
              {copied ? "Copied ✓" : "Copy to clipboard"}
            </button>
          </div>
          {copyError !== "" && <p role="alert" className="mt-2 text-sm text-red-700">{copyError}</p>}
        </div>
      )}

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold">Your templates</h3>
        {templates.length === 0 && <p className="mt-1 text-sm text-slate-500">No templates yet. Create one below.</p>}
        <ul className="mt-2 space-y-2">
          {templates.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-2 rounded border p-2 text-sm">
              <span><strong>{t.title}</strong><br /><span className="text-slate-500">{t.body.slice(0, 120)}{t.body.length > 120 ? "…" : ""}</span></span>
              <button type="button" onClick={() => onDelete(t.id)} className="shrink-0 rounded border border-red-200 px-2 py-1 text-xs text-red-700">Delete</button>
            </li>
          ))}
        </ul>
        <form
          className="mt-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim() === "" || body.trim() === "") return;
            onCreate(title.trim(), body.trim());
            setTitle("");
            setBody("");
          }}
        >
          <label className="mb-1 block text-xs font-medium" htmlFor="tpl-new-title">New template title</label>
          <input id="tpl-new-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className="mb-1 block text-xs font-medium" htmlFor="tpl-new-body">Body (use {"{company}"} {"{role}"} {"{name}"} {"{skills}"})</label>
          <textarea id="tpl-new-body" className={inputClass} rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          <button type="submit" className="rounded border px-4 py-2 text-sm">Save template</button>
        </form>
      </div>
    </section>
  );
}
