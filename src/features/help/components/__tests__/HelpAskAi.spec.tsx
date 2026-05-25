import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { configureJsonApi } from "../../../../client/config";
import { HelpProvider } from "../../contexts/HelpContext";
import { HelpAskAi } from "../HelpAskAi";

// Mock the current-user context to control auth state per test.
// HelpAskAi imports directly from the user-feature path (not the contexts barrel)
// to avoid pulling in OnboardingContext at bundle time.
vi.mock("../../../user/contexts/CurrentUserContext", () => ({
  useCurrentUserContext: () => ({ currentUser: globalThis.__mockUser ?? null }),
}));

describe("HelpAskAi", () => {
  it("renders the login CTA for anonymous users", () => {
    globalThis.__mockUser = null;
    configureJsonApi({
      apiUrl: "http://localhost",
      helpContent: { manifest: [], namespaceUuid: "00000000-0000-5000-8000-000000000000" },
    });
    render(
      <HelpProvider>
        <HelpAskAi howToId="x" />
      </HelpProvider>,
    );
    // vitest.setup.ts stubs next-intl's useTranslations to return the key as-is.
    expect(screen.getByText("help.askAi.loginCta")).toBeTruthy();
  });

  it("renders null for logged-in users when onAskAi is missing", () => {
    globalThis.__mockUser = { id: "u" };
    configureJsonApi({
      apiUrl: "http://localhost",
      helpContent: { manifest: [], namespaceUuid: "00000000-0000-5000-8000-000000000000" },
    });
    const { container } = render(
      <HelpProvider>
        <HelpAskAi howToId="x" />
      </HelpProvider>,
    );
    expect(container.querySelector("button")).toBeNull();
  });

  it("invokes onAskAi(howToId) when the button is clicked", () => {
    globalThis.__mockUser = { id: "u" };
    const cb = vi.fn();
    configureJsonApi({
      apiUrl: "http://localhost",
      helpContent: { manifest: [], namespaceUuid: "00000000-0000-5000-8000-000000000000", onAskAi: cb },
    });
    render(
      <HelpProvider>
        <HelpAskAi howToId="article-1" />
      </HelpProvider>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(cb).toHaveBeenCalledWith("article-1");
  });
});
