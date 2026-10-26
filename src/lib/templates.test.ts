import { describe, expect, it } from "vitest";
import {
  extractPlaceholders,
  renderTemplate,
  valuesForJob,
} from "./templates";

describe("renderTemplate", () => {
  it("replaces all four placeholders", () => {
    expect(
      renderTemplate("Hi {name}, the {role} role at {company} needs {skills}.", {
        company: "Acme",
        role: "Designer",
        name: "Hamza",
        skills: "React",
      }),
    ).toBe("Hi Hamza, the Designer role at Acme needs React.");
  });

  it("replaces the same placeholder more than once", () => {
    expect(
      renderTemplate("{company} and {company}", {
        company: "Acme",
        role: "",
        name: "",
        skills: "",
      }),
    ).toBe("Acme and Acme");
  });

  it("leaves unknown placeholders untouched", () => {
    expect(
      renderTemplate("Hello {foo} at {company}", {
        company: "Acme",
        role: "",
        name: "",
        skills: "",
      }),
    ).toBe("Hello {foo} at Acme");
  });

  it("leaves text without placeholders unchanged", () => {
    expect(
      renderTemplate("Plain text.", {
        company: "Acme",
        role: "Dev",
        name: "Hamza",
        skills: "TS",
      }),
    ).toBe("Plain text.");
  });
});

describe("extractPlaceholders", () => {
  it("returns distinct placeholders in first-use order", () => {
    expect(extractPlaceholders("{role} at {company}, {role} again")).toEqual([
      "role",
      "company",
    ]);
  });
});

describe("valuesForJob", () => {
  it("maps a job plus user details to template values", () => {
    expect(
      valuesForJob({ company: "Acme", role: "Designer" }, "Hamza", "Figma"),
    ).toEqual({
      company: "Acme",
      role: "Designer",
      name: "Hamza",
      skills: "Figma",
    });
  });
});
