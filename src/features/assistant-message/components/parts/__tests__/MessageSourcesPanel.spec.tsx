import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { MessageSourcesPanel } from "../MessageSourcesPanel";

const baseMessage: any = {
  id: "m1",
  role: "assistant",
  content: "x",
  references: [],
  citations: [],
  suggestedQuestions: [],
};

beforeAll(() => {
  // Register a stub Order module so reference filtering by `pageUrl` succeeds in tests.
  ModuleRegistry.register("Order" as any, { name: "orders", pageUrl: "/orders" } as any);
});

afterAll(() => {
  // No public unregister; safe to leave the stub since other suites do not collide on this name.
});

describe("MessageSourcesPanel", () => {
  it("renders nothing when message has no sources", () => {
    const { container } = render(
      <MessageSourcesPanel message={baseMessage} isLatestAssistant={false} onSelectFollowUp={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the toggle when at least one source exists", () => {
    const msg = {
      ...baseMessage,
      references: [{ id: "r1", type: "orders", identifier: "ORD-001" }],
    };
    render(<MessageSourcesPanel message={msg} isLatestAssistant={false} onSelectFollowUp={vi.fn()} />);
    // Mocked next-intl returns the translation key verbatim,
    // so the toggle button name contains "sources.toggle".
    expect(screen.getByRole("button", { name: /sources\.toggle/i })).toBeInTheDocument();
  });

  it("hides references whose module has no pageUrl (middle entities)", () => {
    ModuleRegistry.register("BomItem" as any, { name: "bom-items" } as any);
    const msg = {
      ...baseMessage,
      references: [{ id: "b1", type: "bom-items", identifier: "BI-1" }],
    };
    const { container } = render(
      <MessageSourcesPanel message={msg} isLatestAssistant={false} onSelectFollowUp={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("auto-opens with Suggested questions tab when isLatestAssistant and questions exist", () => {
    const msg = { ...baseMessage, suggestedQuestions: ["Why?"] };
    render(<MessageSourcesPanel message={msg} isLatestAssistant={true} onSelectFollowUp={vi.fn()} />);
    const tab = screen.getByRole("tab", { name: /suggested/i });
    expect(tab).toBeInTheDocument();
    // Base UI uses data-active on the active tab/panel; aria-selected reflects active state too.
    expect(tab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Why?")).toBeInTheDocument();
  });

  it("does not show Suggested questions tab on non-latest message", () => {
    const msg = { ...baseMessage, suggestedQuestions: ["Why?"] };
    render(<MessageSourcesPanel message={msg} isLatestAssistant={false} onSelectFollowUp={vi.fn()} />);
    expect(screen.queryByRole("tab", { name: /suggested/i })).not.toBeInTheDocument();
  });
});
