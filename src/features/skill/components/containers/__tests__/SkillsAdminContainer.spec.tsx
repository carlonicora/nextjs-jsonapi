import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import SkillsAdminContainer from "../SkillsAdminContainer";

const { CompanyService, nav, router, selector } = vi.hoisted(() => ({
  CompanyService: { findMany: vi.fn(), findOne: vi.fn() },
  selector: { props: null as null | Record<string, any> },
  nav: { search: "" },
  router: { push: vi.fn(), replace: vi.fn() },
}));

vi.mock("../../../../company/data/company.service", () => ({ CompanyService }));

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(nav.search) }));

vi.mock("../../../../../i18n", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../i18n")>()),
  useI18nRouter: () => router,
}));

vi.mock("../../../../../components", () => ({
  RoundPageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

// EntitySelector is covered by its own spec: here it shows the picked value and lets a test pick or clear.
vi.mock("../../../../../components/forms/EntitySelector", () => ({
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

// The list is covered by SkillList.spec: here it only shows what it was given.
vi.mock("../../lists/SkillList", () => ({
  default: (props: { scope: string; companyId?: string; title?: string; toolbar?: ReactNode; fullWidth?: boolean }) => (
    <div>
      <div data-testid="list" data-scope={props.scope} data-company={props.companyId ?? ""}>
        {props.title ?? "default-title"}
        {props.fullWidth ? " full" : ""}
      </div>
      {props.toolbar}
    </div>
  ),
}));

beforeAll(() => {
  try {
    ModuleRegistry.get("Skill" as any);
  } catch {
    ModuleRegistry.register("Skill" as any, { name: "skills", pageUrl: "/administration/skills" } as any);
  }
  try {
    ModuleRegistry.get("Company" as any);
  } catch {
    ModuleRegistry.register("Company" as any, { name: "companies" } as any);
  }
});

const companies = [
  { id: "c2", name: "Zeta" },
  { id: "c1", name: "Acme" },
];

describe("SkillsAdminContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.search = "";
    selector.props = null;
    CompanyService.findMany.mockResolvedValue([{ id: "c1", name: "Acme" }]);
    CompanyService.findOne.mockImplementation(async ({ companyId }: { companyId: string }) => {
      if (companyId === "c1") return { id: "c1", name: "Acme" };
      throw new Error("not found");
    });
  });

  it("defaults to the global skills, full width, with an empty picker", async () => {
    render(<SkillsAdminContainer />);

    const list = await screen.findByTestId("list");
    expect(list).toHaveAttribute("data-scope", "global");
    expect(list).toHaveTextContent("full");
    expect(screen.getByTestId("picked")).toHaveTextContent("skill.admin.picker.global");
    expect(CompanyService.findOne).not.toHaveBeenCalled();
  });

  it("the picker searches companies on the server, a page at a time, by name", async () => {
    render(<SkillsAdminContainer />);
    await screen.findByTestId("list");

    await selector.props!.retriever({ search: "ac" });
    expect(CompanyService.findMany).toHaveBeenCalledWith({ search: "ac", sort: "name" });
  });

  it("reads ?company= and shows that company's list with its title", async () => {
    nav.search = "company=c1";
    render(<SkillsAdminContainer />);

    await waitFor(() => expect(screen.getByTestId("list")).toHaveAttribute("data-scope", "company"));
    const list = screen.getByTestId("list");
    expect(list).toHaveAttribute("data-company", "c1");
    expect(list).toHaveTextContent("skill.admin.title");
    expect(CompanyService.findOne).toHaveBeenCalledWith({ companyId: "c1" });
    expect(screen.getByTestId("picked")).toHaveTextContent("Acme");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("an unknown ?company= falls back to the global skills and clears the address", async () => {
    nav.search = "company=nope";
    render(<SkillsAdminContainer />);

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/administration/skills"));
  });

  it("does not read the global list while a ?company= is being read", () => {
    nav.search = "company=c1";
    CompanyService.findOne.mockReturnValue(new Promise(() => {}));
    render(<SkillsAdminContainer />);
    expect(screen.queryByTestId("list")).toBeNull();
  });

  it("picking a company writes ?company=<id>; clearing the picker removes it", async () => {
    render(<SkillsAdminContainer />);
    await screen.findByTestId("list");

    await userEvent.click(screen.getByText("pick-acme"));
    expect(router.replace).toHaveBeenCalledWith("/administration/skills?company=c1");

    await userEvent.click(screen.getByText("clear"));
    expect(router.replace).toHaveBeenLastCalledWith("/administration/skills");
  });
});
