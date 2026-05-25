import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { configureJsonApi } from "../../../../client/config";
import { HelpProvider } from "../../contexts/HelpContext";
import { HelpAskAi } from "../HelpAskAi";

vi.mock("../../../user/contexts/CurrentUserContext", () => ({
  useCurrentUserContext: () => ({ currentUser: (globalThis as any).__mockUser ?? null }),
}));

// HelpAssistantSheet is intentionally rendered ONLY when logged-in to keep the
// disabled-state DOM minimal. We mock it to a marker so the test asserts presence.
vi.mock("../HelpAssistantSheet", () => ({
  HelpAssistantSheet: ({ open }: { open: boolean }) => (open ? <div data-testid="sheet" /> : null),
}));

function setupConfig() {
  configureJsonApi({
    apiUrl: "http://localhost",
    helpContent: { manifest: [], namespaceUuid: "00000000-0000-5000-8000-000000000000" },
  });
}

describe("HelpAskAi", () => {
  it("renders a disabled button + tooltip for anonymous users", () => {
    (globalThis as any).__mockUser = null;
    setupConfig();

    render(
      <HelpProvider>
        <HelpAskAi />
      </HelpProvider>,
    );

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("disabled");
    // vitest.setup.ts stubs next-intl's useTranslations to return the key as-is.
    // The TooltipTrigger renders as a <span>, so the disabled <button> is the
    // only <button> in the DOM (no nested-button hydration risk).
    expect(screen.queryByTestId("sheet")).toBeNull();
  });

  it("clicking the disabled button does not open the sheet", () => {
    (globalThis as any).__mockUser = null;
    setupConfig();
    render(
      <HelpProvider>
        <HelpAskAi />
      </HelpProvider>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByTestId("sheet")).toBeNull();
  });

  it("renders an enabled button for logged-in users; clicking opens the sheet", () => {
    (globalThis as any).__mockUser = { id: "u-1" };
    setupConfig();
    render(
      <HelpProvider>
        <HelpAskAi />
      </HelpProvider>,
    );
    const button = screen.getByRole("button");
    expect(button).not.toHaveAttribute("disabled");
    fireEvent.click(button);
    expect(screen.getByTestId("sheet")).toBeInTheDocument();
  });
});
