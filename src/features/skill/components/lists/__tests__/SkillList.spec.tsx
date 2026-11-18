import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import type { SkillInterface } from "../../../data/SkillInterface";
import SkillList from "../SkillList";

const { SkillService, retrieverState } = vi.hoisted(() => ({
  SkillService: {
    findMany: vi.fn().mockResolvedValue([]),
    findGlobal: vi.fn().mockResolvedValue([]),
    findOne: vi.fn(),
    findOneGlobal: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    enableGlobal: vi.fn(),
    disableGlobal: vi.fn(),
  },
  retrieverState: { data: [] as unknown[], params: undefined as any },
}));

vi.mock("../../../data/SkillService", () => ({ SkillService }));

vi.mock("../../../../../hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../hooks")>()),
  useDataListRetriever: (params: any) => {
    retrieverState.params = params;
    return {
      ready: true,
      setReady: vi.fn(),
      isLoaded: true,
      data: retrieverState.data,
      search: vi.fn(),
      refresh: vi.fn(),
      addAdditionalParameter: vi.fn(),
      removeAdditionalParameter: vi.fn(),
      setRefreshedElement: vi.fn(),
      removeElement: vi.fn(),
      isSearch: false,
    };
  },
}));

vi.mock("../../../../../hooks/usePageUrlGenerator", () => ({
  usePageUrlGenerator: () => () => "/test",
}));

vi.mock("../../../../../i18n", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../i18n")>()),
  useI18nRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

beforeAll(() => {
  ModuleRegistry.register("Skill" as any, { name: "skills", pageUrl: "/administration/skills" } as any);
});

function makeSkill(overrides: Partial<Record<keyof SkillInterface, unknown>> = {}): SkillInterface {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "quote",
    description: "How we write quotes",
    instructions: "",
    isActive: true,
    isGlobal: false,
    origin: "company",
    isEnabled: true,
    isHidden: false,
    canRestore: false,
    ...overrides,
  } as unknown as SkillInterface;
}

describe("SkillList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    retrieverState.data = [];
    retrieverState.params = undefined;
  });

  it("company scope: reads SkillService.findMany and shows Name, Description, From, On", async () => {
    retrieverState.data = [
      makeSkill({ id: "a", name: "email", origin: "copy" }),
      makeSkill({ id: "b", name: "quote", origin: "company" }),
      makeSkill({ id: "c", name: "quote-global", origin: "global", isHidden: true }),
    ];
    render(<SkillList scope="company" />);

    await retrieverState.params.retriever({});
    expect(SkillService.findMany).toHaveBeenCalled();
    expect(SkillService.findGlobal).not.toHaveBeenCalled();

    expect(screen.getByText("skill.columns.name")).toBeInTheDocument();
    expect(screen.getByText("skill.columns.description")).toBeInTheDocument();
    expect(screen.getByText("skill.columns.origin")).toBeInTheDocument();
    expect(screen.getByText("skill.columns.active")).toBeInTheDocument();

    expect(screen.getByTestId("skill-origin-email")).toHaveTextContent("skill.origin.copy");
    expect(screen.getByTestId("skill-origin-quote")).toHaveTextContent("skill.origin.company");
    expect(screen.getByTestId("skill-origin-quote-global")).toHaveTextContent("skill.origin.global");
    expect(screen.getByTestId("skill-switch-email")).toBeInTheDocument();
    expect(screen.getByTestId("skill-hidden-quote-global")).toHaveTextContent("skill.hidden");
    expect(screen.queryByTestId("skill-switch-quote-global")).toBeNull();
  });

  it("global scope: reads SkillService.findGlobal and has no From column", async () => {
    retrieverState.data = [makeSkill({ name: "email", origin: "global", isGlobal: true })];
    render(<SkillList scope="global" />);

    await retrieverState.params.retriever({});
    expect(SkillService.findGlobal).toHaveBeenCalled();
    expect(SkillService.findMany).not.toHaveBeenCalled();

    expect(screen.getByText("skill.columns.name")).toBeInTheDocument();
    expect(screen.getByText("skill.columns.active")).toBeInTheDocument();
    expect(screen.queryByText("skill.columns.origin")).toBeNull();
    expect(screen.queryByTestId("skill-origin-email")).toBeNull();
  });

  it("shows the New skill button, and a name cell opens the editor for that skill", async () => {
    const skill = makeSkill({ id: "b", name: "quote" });
    retrieverState.data = [skill];
    SkillService.findOne.mockResolvedValue({ ...skill, instructions: "Write it well." });
    render(<SkillList scope="company" />);

    expect(screen.getByTestId("skill-new-button")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("skill-name-quote"));
    await waitFor(() => expect(SkillService.findOne).toHaveBeenCalledWith({ id: "b" }));
    expect(await screen.findByText("skill.editor.edit")).toBeInTheDocument();
  });

  it("company scope with companyId: list, editor and switch call the picked company's routes", async () => {
    const skill = makeSkill({ id: "b", name: "quote", isEnabled: true });
    retrieverState.data = [skill];
    SkillService.findOne.mockResolvedValue({ ...skill, instructions: "Write it well." });
    SkillService.disable.mockResolvedValue({ ...skill, isEnabled: false });
    render(<SkillList scope="company" companyId="c1" title="Skills · Acme" toolbar={<span>picker</span>} />);

    await retrieverState.params.retriever({ search: "qu" });
    expect(SkillService.findMany).toHaveBeenCalledWith({ search: "qu", companyId: "c1" });

    expect(screen.getByText("Skills · Acme")).toBeInTheDocument();
    expect(screen.getByText("picker")).toBeInTheDocument();
    expect(screen.getByText("skill.columns.origin")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("skill-switch-quote"));
    await waitFor(() => expect(SkillService.disable).toHaveBeenCalledWith({ id: "b", companyId: "c1" }));

    await userEvent.click(screen.getByTestId("skill-name-quote"));
    await waitFor(() => expect(SkillService.findOne).toHaveBeenCalledWith({ id: "b", companyId: "c1" }));
  });

  it("company scope without companyId calls the caller's own routes", async () => {
    render(<SkillList scope="company" />);
    await retrieverState.params.retriever({});
    expect(SkillService.findMany).toHaveBeenCalledWith({});
  });

  it("empty company list shows the company empty state", () => {
    render(<SkillList scope="company" />);
    expect(screen.getByText("skill.empty.title")).toBeInTheDocument();
    expect(screen.getByText("skill.empty.body")).toBeInTheDocument();
  });

  it("empty global list shows the global empty state", () => {
    render(<SkillList scope="global" />);
    expect(screen.getByText("skill.empty.global")).toBeInTheDocument();
    expect(screen.queryByText("skill.empty.title")).toBeNull();
  });
});
