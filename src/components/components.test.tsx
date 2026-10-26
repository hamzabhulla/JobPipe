import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";
import { JobCard } from "./JobCard";
import { StatsPanel } from "./StatsPanel";
import type { Job } from "../lib/types";

function job(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    company: "Acme",
    role: "React Developer",
    link: "",
    platform: "Upwork",
    type: "freelance",
    rate: "$50/hr",
    location: "remote",
    status: "applied",
    appliedAt: null,
    followUpAt: null,
    notes: "",
    tags: ["react"],
    contactName: "",
    order: 0,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

describe("JobCard", () => {
  it("renders role, company, rate, and tags", () => {
    render(
      <DndContext>
        <SortableContext items={["job-1"]}>
          <JobCard
            job={job()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onStatusChange={vi.fn()}
          />
        </SortableContext>
      </DndContext>,
    );
    expect(screen.getByText("React Developer")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("$50/hr")).toBeInTheDocument();
    expect(screen.getByText("react")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("offers create and sample-data actions", () => {
    const onCreate = vi.fn();
    const onLoadSample = vi.fn();
    render(<EmptyState onCreate={onCreate} onLoadSample={onLoadSample} />);
    expect(screen.getByText("No applications yet")).toBeInTheDocument();
    screen.getByText("Add your first job").click();
    screen.getByText("Load sample data").click();
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onLoadSample).toHaveBeenCalledTimes(1);
  });
});

describe("StatsPanel", () => {
  it("shows total and rates for a mixed set of jobs", () => {
    render(
      <StatsPanel
        jobs={[
          job({ id: "a", status: "applied" }),
          job({ id: "b", status: "interview" }),
        ]}
      />,
    );
    expect(screen.getByText("Stats")).toBeInTheDocument();
    // Total = 2, response = 1/2 = 50%, interview = 1/2 = 50%.
    expect(screen.getAllByText("50%")).toHaveLength(2);
  });

  it("shows an empty message with no jobs", () => {
    render(<StatsPanel jobs={[]} />);
    expect(screen.getByText(/Stats appear once/)).toBeInTheDocument();
  });
});
