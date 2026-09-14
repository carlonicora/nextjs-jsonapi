import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { useSharedContext } from "../../../../contexts";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { HandbookProvider, useHandbookContext } from "../HandbookContext";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

// The provider builds its breadcrumbs with `generateUrl({ page: Modules.HandbookPage })`,
// and the `Modules` proxy throws for a key the registry does not hold. Registering is the
// package's spec convention — copied from HandbookAskContainer.spec.tsx, which registers
// the same module for the same reason.
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("HandbookPage", { name: "handbookpages", pageUrl: "/administration/handbook" } as any);
});

function Probe() {
  const { title, breadcrumbs } = useSharedContext();
  return (
    <>
      <span data-testid="type">{String(title.type)}</span>
      <span data-testid="element">{title.element ?? ""}</span>
      <span data-testid="crumbs">{breadcrumbs.map((b) => b.name).join(" / ")}</span>
    </>
  );
}

describe("HandbookProvider", () => {
  it("titles the contents surface with the handbook title and no element", () => {
    render(
      <HandbookProvider>
        <Probe />
      </HandbookProvider>,
    );
    expect(screen.getByTestId("type")).toHaveTextContent("handbook.title");
    expect(screen.getByTestId("element")).toHaveTextContent("");
  });

  it("titles the reader with the section as type and the page as element", () => {
    render(
      <HandbookProvider
        page={{ id: "p1", title: "Testing the API", section: "03-backend" } as any}
        section={{ key: "03-backend", title: "Backend" } as any}
      >
        <Probe />
      </HandbookProvider>,
    );
    expect(screen.getByTestId("type")).toHaveTextContent("Backend");
    expect(screen.getByTestId("element")).toHaveTextContent("Testing the API");
    expect(screen.getByTestId("crumbs")).toHaveTextContent("handbook.title / Testing the API");
  });

  it("falls back to the raw section key when no section resource resolved", () => {
    render(
      <HandbookProvider page={{ id: "p1", title: "X", section: "09-workflow" } as any}>
        <Probe />
      </HandbookProvider>,
    );
    expect(screen.getByTestId("type")).toHaveTextContent("09-workflow");
  });

  it("lets the ask surface override the type and passes functions through", () => {
    function FunctionsProbe() {
      const { title } = useSharedContext();
      return <span data-testid="functions">{title.functions}</span>;
    }

    render(
      <HandbookProvider titleType="handbook.chat.title" functions={<button type="button">ask</button>}>
        <FunctionsProbe />
      </HandbookProvider>,
    );
    expect(screen.getByTestId("functions")).toHaveTextContent("ask");
  });

  it("titles the reader with the translation when the page and section carry one", () => {
    render(
      <HandbookProvider
        page={{ id: "p1", title: "Testing the API", displayTitle: "Testare le API", section: "03-backend" } as any}
        section={{ key: "03-backend", title: "Backend", displayTitle: "Backend (API)" } as any}
      >
        <Probe />
      </HandbookProvider>,
    );
    expect(screen.getByTestId("type")).toHaveTextContent("Backend (API)");
    expect(screen.getByTestId("element")).toHaveTextContent("Testare le API");
    expect(screen.getByTestId("crumbs")).toHaveTextContent("handbook.title / Testare le API");
  });

  it("falls back to the English title when neither carries a translation", () => {
    render(
      <HandbookProvider
        page={{ id: "p1", title: "Testing the API", displayTitle: undefined, section: "03-backend" } as any}
        section={{ key: "03-backend", title: "Backend", displayTitle: undefined } as any}
      >
        <Probe />
      </HandbookProvider>,
    );
    expect(screen.getByTestId("type")).toHaveTextContent("Backend");
    expect(screen.getByTestId("element")).toHaveTextContent("Testing the API");
  });

  it("exposes the page and section to useHandbookContext", () => {
    function ContextProbe() {
      const { page, section } = useHandbookContext();
      return <span data-testid="context">{`${page?.title} / ${section?.title}`}</span>;
    }

    render(
      <HandbookProvider
        page={{ id: "p1", title: "Testing the API", section: "03-backend" } as any}
        section={{ key: "03-backend", title: "Backend" } as any}
      >
        <ContextProbe />
      </HandbookProvider>,
    );
    expect(screen.getByTestId("context")).toHaveTextContent("Testing the API / Backend");
  });
});
