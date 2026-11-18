import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { TokenUsageAdminFilterBar } from "../TokenUsageAdminFilterBar";

const { CompanyService, selector } = vi.hoisted(() => ({
  CompanyService: { findMany: vi.fn(), findOne: vi.fn() },
  selector: { props: null as null | Record<string, any> },
}));

vi.mock("../../../company/data/company.service", () => ({ CompanyService }));

vi.mock("../../../../components/forms/DateRangeSelector", () => ({ DateRangeSelector: () => <div /> }));

// EntitySelector is covered by its own spec: here it shows the picked value and lets a test pick or clear.
vi.mock("../../../../components/forms/EntitySelector", () => ({
  default: (props: any) => {
    selector.props = props;
    const value = props.form.watch(props.id);
    return (
      <div>
        <span data-testid="picked">{value?.name ?? props.noneLabel ?? props.placeholder}</span>
        <button onClick={() => props.onChange({ id: "c1", name: "Acme" })}>pick-acme</button>
        <button onClick={() => props.onChange(undefined)}>clear</button>
      </div>
    );
  },
}));

beforeAll(() => {
  try {
    ModuleRegistry.get("Company" as any);
  } catch {
    ModuleRegistry.register("Company" as any, { name: "companies" } as any);
  }
});

const base = {
  from: "2026-11-01T00:00:00.000Z",
  to: "2026-11-18T00:00:00.000Z",
  granularity: "day",
  metric: "cost",
} as const;

describe("TokenUsageAdminFilterBar company picker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selector.props = null;
    CompanyService.findMany.mockResolvedValue([{ id: "c1", name: "Acme" }]);
    CompanyService.findOne.mockImplementation(async ({ companyId }: { companyId: string }) => {
      if (companyId === "c1") return { id: "c1", name: "Acme" };
      throw new Error("not found");
    });
  });

  it("defaults to all companies with an empty picker", () => {
    render(<TokenUsageAdminFilterBar {...base} onChange={vi.fn()} />);
    expect(screen.getByTestId("picked")).toHaveTextContent("token_usage.admin.all_companies");
    expect(CompanyService.findOne).not.toHaveBeenCalled();
  });

  it("searches every company on the server, a page at a time, by name", async () => {
    render(<TokenUsageAdminFilterBar {...base} onChange={vi.fn()} />);
    await selector.props!.retriever({ search: "ac" });
    expect(CompanyService.findMany).toHaveBeenCalledWith({ search: "ac", sort: "name" });
  });

  it("an initial companyId is read so its name shows", async () => {
    render(<TokenUsageAdminFilterBar {...base} companyId="c1" onChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId("picked")).toHaveTextContent("Acme"));
    expect(CompanyService.findOne).toHaveBeenCalledWith({ companyId: "c1" });
  });

  it("an unknown initial companyId falls back to all companies", async () => {
    const onChange = vi.fn();
    render(<TokenUsageAdminFilterBar {...base} companyId="nope" onChange={onChange} />);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ companyId: undefined }));
  });

  it("picking reports the company id; clearing reports undefined (all companies)", async () => {
    const onChange = vi.fn();
    render(<TokenUsageAdminFilterBar {...base} onChange={onChange} />);

    await userEvent.click(screen.getByText("pick-acme"));
    expect(onChange).toHaveBeenLastCalledWith({ companyId: "c1" });

    await userEvent.click(screen.getByText("clear"));
    expect(onChange).toHaveBeenLastCalledWith({ companyId: undefined });
  });
});
