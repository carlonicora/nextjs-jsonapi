import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { configureJsonApi } from "../../../../client/config";
import { HelpProvider } from "../../contexts/HelpContext";
import { HelpHeader } from "../HelpHeader";

// Not under test here, and it pulls in its own data context.
vi.mock("../HelpAskAi", () => ({ HelpAskAi: () => null }));

const currentUserContext = vi.fn();
vi.mock("../../../user/contexts/CurrentUserContext", () => ({
  useCurrentUserContext: () => currentUserContext(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  currentUserContext.mockReturnValue({ currentUser: null });
  configureJsonApi({
    apiUrl: "http://localhost",
    helpContent: { brand: { label: "narr8", appHref: "/app" } },
  } as any);
});

const renderHeader = () =>
  render(
    <HelpProvider>
      <HelpHeader />
    </HelpProvider>,
  );

describe("HelpHeader", () => {
  // Both controls navigate. Rendering them as Base UI Buttons required
  // nativeButton={false} to silence the primitive's warning, which stamps
  // role="button" onto the anchor — so a navigating control announced as a
  // button. They must stay plain links that only borrow the button styling.
  it("renders the login control as a link, with no button role", () => {
    renderHeader();

    const link = screen.getByRole("link", { name: "help.header.login" });
    expect(link).toHaveAttribute("href", "/login");
    expect(link).not.toHaveAttribute("role");
  });

  it("renders the open-app control as a link, with no button role", () => {
    currentUserContext.mockReturnValue({ currentUser: { id: "u1" } });

    renderHeader();

    const link = screen.getByRole("link", { name: "help.header.openApp" });
    expect(link).toHaveAttribute("href", "/app");
    expect(link).not.toHaveAttribute("role");
  });

  it("renders no button element among the header actions", () => {
    renderHeader();

    expect(screen.queryByRole("button")).toBeNull();
  });
});
