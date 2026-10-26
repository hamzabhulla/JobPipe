import { useState } from "react";
import type {
  Job,
  JobLocation,
  JobPlatform,
  JobStatus,
  JobType,
  NewJobInput,
} from "../lib/types";
import { JOB_LOCATIONS, JOB_PLATFORMS, JOB_STATUSES, JOB_TYPES } from "../lib/types";

export type FormValues = NewJobInput;

interface Props {
  initial: Job | null;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800";
const labelClass = "mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300";

export function JobForm({ initial, onSubmit, onCancel }: Props): React.JSX.Element {
  const [company, setCompany] = useState(initial?.company ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [platform, setPlatform] = useState<JobPlatform>(
    initial?.platform ?? "LinkedIn",
  );
  const [type, setType] = useState<JobType>(initial?.type ?? "freelance");
  const [rate, setRate] = useState(initial?.rate ?? "");
  const [location, setLocation] = useState<JobLocation>(
    initial?.location ?? "remote",
  );
  const [status, setStatus] = useState<JobStatus>(initial?.status ?? "saved");
  const [appliedAt, setAppliedAt] = useState(initial?.appliedAt ?? "");
  const [followUpAt, setFollowUpAt] = useState(initial?.followUpAt ?? "");
  const [contactName, setContactName] = useState(initial?.contactName ?? "");
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(", "));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (company.trim() === "" || role.trim() === "") {
      setError("Company and role are required.");
      return;
    }
    if (link.trim() !== "") {
      try {
        const url = new URL(link.trim());
        if (url.protocol !== "http:" && url.protocol !== "https:") {
          throw new Error("bad protocol");
        }
      } catch {
        setError("Link must be a valid http(s) URL, or left empty.");
        return;
      }
    }
    const tags = [...new Set(
      tagsText
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t !== ""),
    )];
    onSubmit({
      company: company.trim(),
      role: role.trim(),
      link: link.trim(),
      platform,
      type,
      rate: rate.trim(),
      location,
      status,
      appliedAt: appliedAt === "" ? null : appliedAt,
      followUpAt: followUpAt === "" ? null : followUpAt,
      notes: notes.trim(),
      tags,
      contactName: contactName.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Job form">
      {error !== "" && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="job-company">Company *</label>
          <input id="job-company" className={inputClass} value={company} onChange={(e) => setCompany(e.target.value)} required autoFocus />
        </div>
        <div>
          <label className={labelClass} htmlFor="job-role">Role *</label>
          <input id="job-role" className={inputClass} value={role} onChange={(e) => setRole(e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="job-link">Posting link</label>
          <input id="job-link" className={inputClass} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" inputMode="url" />
        </div>
        <div>
          <label className={labelClass} htmlFor="job-platform">Platform</label>
          <select id="job-platform" className={inputClass} value={platform} onChange={(e) => setPlatform(e.target.value as JobPlatform)}>
            {JOB_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="job-type">Type</label>
          <select id="job-type" className={inputClass} value={type} onChange={(e) => setType(e.target.value as JobType)}>
            {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="job-rate">Rate</label>
          <input id="job-rate" className={inputClass} value={rate} onChange={(e) => setRate(e.target.value)} placeholder="$50/hr or $70,000/year" />
        </div>
        <div>
          <label className={labelClass} htmlFor="job-location">Location</label>
          <select id="job-location" className={inputClass} value={location} onChange={(e) => setLocation(e.target.value as JobLocation)}>
            {JOB_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="job-status">Status</label>
          <select id="job-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as JobStatus)}>
            {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="job-applied">Applied on</label>
          <input id="job-applied" type="date" className={inputClass} value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="job-followup">Follow up on</label>
          <input id="job-followup" type="date" className={inputClass} value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="job-contact">Contact name</label>
          <input id="job-contact" className={inputClass} value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="job-tags">Tags (comma separated)</label>
          <input id="job-tags" className={inputClass} value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="react, remote" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="job-notes">Notes</label>
          <textarea id="job-notes" className={inputClass} rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700">
          {initial === null ? "Add job" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-slate-300 px-4 py-2 text-sm dark:border-zinc-700">
          Cancel
        </button>
      </div>
    </form>
  );
}
