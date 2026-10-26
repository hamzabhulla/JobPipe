import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

const optionalUrl = z
  .string()
  .max(2048)
  .refine(
    (v) => v === "" || (() => {
      try {
        const url = new URL(v);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    })(),
    "link must be empty or a valid http(s) URL",
  );

export const jobSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(200),
  link: optionalUrl,
  platform: z.enum(["LinkedIn", "Upwork", "Fiverr", "Email", "Other"]),
  type: z.enum(["full-time", "contract", "freelance"]),
  rate: z.string().max(200),
  location: z.enum(["remote", "hybrid", "onsite"]),
  status: z.enum(["saved", "applied", "interview", "offer", "rejected"]),
  appliedAt: dateString.nullable(),
  followUpAt: dateString.nullable(),
  notes: z.string().max(5000),
  tags: z.array(z.string().min(1).max(30)).max(50),
  contactName: z.string().max(200),
  order: z.number().int().min(0),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export const templateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

/** Versioned export envelope. Version is a literal so a future
 *  format change is a new schema, not a silent reinterpretation. */
export const exportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.number().int(),
  jobs: z.array(jobSchema),
  templates: z.array(templateSchema),
});

export type ExportData = z.infer<typeof exportSchema>;

export type ValidationResult =
  | { ok: true; data: ExportData }
  | { ok: false; errors: string[] };

export function validateExport(data: unknown): ValidationResult {
  const parsed = exportSchema.safeParse(data);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors = parsed.error.issues.map(
    (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
  return { ok: false, errors };
}
