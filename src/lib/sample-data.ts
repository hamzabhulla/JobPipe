import type { NewJobInput, NewTemplateInput } from "./types";
import { addDays, todayLocal } from "./reminders";

/** Sample data is generated relative to today so reminders always
 *  show a realistic mix (one overdue, one due today) on first run. */
export function getSampleJobs(): NewJobInput[] {
  const today = todayLocal();
  return [
    {
      company: "Northwind Studio",
      role: "Frontend Developer (React)",
      link: "https://example.com/jobs/frontend",
      platform: "LinkedIn",
      type: "full-time",
      rate: "$70,000/year",
      location: "remote",
      status: "interview",
      appliedAt: addDays(today, -9),
      followUpAt: addDays(today, 2),
      notes: "Second interview with the design lead. Prepare portfolio walkthrough.",
      tags: ["react", "remote"],
      contactName: "Sara Khan",
    },
    {
      company: "BrightCart",
      role: "Shopify Developer",
      link: "",
      platform: "Upwork",
      type: "freelance",
      rate: "$45/hr",
      location: "remote",
      status: "applied",
      appliedAt: addDays(today, -4),
      followUpAt: today,
      notes: "Proposal sent. Follow up today if no reply.",
      tags: ["shopify", "freelance"],
      contactName: "",
    },
    {
      company: "PixelForge",
      role: "UI Designer",
      link: "https://example.com/jobs/ui",
      platform: "Email",
      type: "contract",
      rate: "$3,000/month",
      location: "hybrid",
      status: "applied",
      appliedAt: addDays(today, -6),
      followUpAt: addDays(today, -1),
      notes: "Overdue follow-up — send a short check-in.",
      tags: ["design"],
      contactName: "Ali Raza",
    },
    {
      company: "DataNest",
      role: "Full-Stack Developer",
      link: "",
      platform: "LinkedIn",
      type: "full-time",
      rate: "$85,000/year",
      location: "onsite",
      status: "saved",
      appliedAt: null,
      followUpAt: null,
      notes: "Interesting role, apply after updating CV.",
      tags: ["node", "react"],
      contactName: "",
    },
    {
      company: "Loopwork",
      role: "React Native Developer",
      link: "",
      platform: "Fiverr",
      type: "freelance",
      rate: "$60/hr",
      location: "remote",
      status: "offer",
      appliedAt: addDays(today, -18),
      followUpAt: null,
      notes: "Offer received — review contract terms.",
      tags: ["react-native"],
      contactName: "Maya Chen",
    },
    {
      company: "OldBridge Co",
      role: "WordPress Developer",
      link: "",
      platform: "Other",
      type: "contract",
      rate: "$25/hr",
      location: "remote",
      status: "rejected",
      appliedAt: addDays(today, -25),
      followUpAt: null,
      notes: "Went with an in-house hire. Ask for feedback.",
      tags: ["wordpress"],
      contactName: "",
    },
  ];
}

export function getSampleTemplates(): NewTemplateInput[] {
  return [
    {
      title: "Short outreach",
      body: "Hi, I'm {name}. I saw the {role} role at {company} and I'd love to help — my skills include {skills}. Would you be open to a short intro call this week?",
    },
    {
      title: "Follow-up",
      body: "Hi, following up on my application for {role} at {company}. I'm {name}, and I work with {skills}. Happy to share recent work or jump on a quick call.",
    },
  ];
}
