import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SharedProvider } from "../../../contexts/SharedContext";
import { RoundPageContainerTitle } from "../RoundPageContainerTitle";

const mocks = vi.hoisted(() => ({ mobile: false }));

vi.mock("@/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  useIsMobile: () => mocks.mobile,
}));

function renderTitle(title: { type: string; element?: string }) {
  return render(
    <SharedProvider value={{ breadcrumbs: [], title }}>
      <RoundPageContainerTitle showDetails={false} setShowDetails={() => {}} />
    </SharedProvider>,
  );
}

describe.each([
  ["desktop", false],
  ["phone", true],
])("RoundPageContainerTitle heading on %s", (_layout, mobile) => {
  it("draws the page name as the page heading", () => {
    mocks.mobile = mobile;
    renderTitle({ type: "Company", element: "Acme" });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Acme");
  });

  it("draws no heading when the page sets no name", () => {
    mocks.mobile = mobile;
    renderTitle({ type: "Administration" });
    expect(screen.getByText("Administration")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });
});
