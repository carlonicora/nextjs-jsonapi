import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { AiConnectionsContainer } from "../AiConnectionsContainer";

const { CompanyService, selector, scope } = vi.hoisted(() => ({
  CompanyService: { findMany: vi.fn(), findOne: vi.fn() },
  selector: { props: null as null | Record<string, any> },
  scope: { initial: null as string | null, current: null as string | null },
}));

vi.mock("../../../../company/data/company.service", () => ({ CompanyService }));

vi.mock("../../../../../components", () => ({
  RoundPageContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

// The context is covered by AiConnectionsContext.spec: here it only holds the picked scope.
vi.mock("../../../contexts/AiConnectionsContext", async () => {
  const React = await import("react");
  const Ctx = React.createContext<{ scopeCompanyId: string | null; setScopeCompanyId: (id: string | null) => void }>({
    scopeCompanyId: null,
    setScopeCompanyId: () => {},
  });
  return {
    AiConnectionsProvider: ({ children }: { children: ReactNode }) => {
      const [scopeCompanyId, setScopeCompanyId] = React.useState<string | null>(scope.initial);
      scope.current = scopeCompanyId;
      return <Ctx.Provider value={{ scopeCompanyId, setScopeCompanyId }}>{children}</Ctx.Provider>;
    },
    useAiConnections: () => React.useContext(Ctx),
  };
});

// The cards are covered elsewhere: here they only show which type they render.
vi.mock("../../lists/AiConnectionTypeCard", () => ({
  AiConnectionTypeCard: ({ connectionType }: { connectionType: string }) => (
    <div data-testid="card">{connectionType}</div>
  ),
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

beforeAll(() => {
  for (const name of ["AiConnection", "Company"]) {
    try {
      ModuleRegistry.get(name as any);
    } catch {
      ModuleRegistry.register(name as any, { name } as any);
    }
  }
});

describe("AiConnectionsContainer company picker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selector.props = null;
    scope.initial = null;
    scope.current = null;
    CompanyService.findMany.mockResolvedValue([{ id: "c1", name: "Acme" }]);
    CompanyService.findOne.mockImplementation(async ({ companyId }: { companyId: string }) => {
      if (companyId === "c1") return { id: "c1", name: "Acme" };
      throw new Error("not found");
    });
  });

  it("defaults to the global chain with an empty picker and renders every connection type", () => {
    render(<AiConnectionsContainer />);

    expect(screen.getByTestId("picked")).toHaveTextContent("ai_connections.admin.scope.global");
    expect(screen.getAllByTestId("card")).toHaveLength(9);
    expect(CompanyService.findOne).not.toHaveBeenCalled();
  });

  it("the picker searches companies on the server, a page at a time, by name", async () => {
    render(<AiConnectionsContainer />);

    await selector.props!.retriever({ search: "ac" });
    expect(CompanyService.findMany).toHaveBeenCalledWith({ search: "ac", sort: "name" });
  });

  it("picking a company sets the scope; clearing the picker goes back to the global chain", async () => {
    render(<AiConnectionsContainer />);

    await userEvent.click(screen.getByText("pick-acme"));
    expect(scope.current).toBe("c1");

    await userEvent.click(screen.getByText("clear"));
    expect(scope.current).toBeNull();
    expect(screen.getByTestId("picked")).toHaveTextContent("ai_connections.admin.scope.global");
  });

  it("an initial company scope is resolved with findOne so its name shows", async () => {
    scope.initial = "c1";
    render(<AiConnectionsContainer />);

    await waitFor(() => expect(screen.getByTestId("picked")).toHaveTextContent("Acme"));
    expect(CompanyService.findOne).toHaveBeenCalledWith({ companyId: "c1" });
  });

  it("an initial scope that is not a company falls back to the global chain", async () => {
    scope.initial = "nope";
    render(<AiConnectionsContainer />);

    await waitFor(() => expect(scope.current).toBeNull());
    expect(screen.getByTestId("picked")).toHaveTextContent("ai_connections.admin.scope.global");
  });
});
