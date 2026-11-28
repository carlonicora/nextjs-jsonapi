import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SharedProvider } from "../../../contexts/SharedContext";
import { RoundPageContainerTitle } from "../RoundPageContainerTitle";

const mocks = vi.hoisted(() => ({ mobile: false }));

vi.mock("@/utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/utils")>()),
  useIsMobile: () => mocks.mobile,
}));

function renderTitle(title: { type: string; element?: string; elementSuffix?: ReactNode }) {
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

  it("draws the element suffix right after the page heading", () => {
    mocks.mobile = mobile;
    renderTitle({ type: "NPC", element: "Mara", elementSuffix: <span data-testid="suffix">Dead</span> });
    const heading = screen.getByRole("heading", { level: 1 });
    const suffix = screen.getByTestId("suffix");
    expect(suffix.textContent).toBe("Dead");
    expect(heading.contains(suffix)).toBe(false);
    expect(heading.compareDocumentPosition(suffix) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("without a suffix draws the same heading markup as before", () => {
    mocks.mobile = mobile;
    const { container } = renderTitle({ type: "Company", element: "Acme" });
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.outerHTML).toBe(
      mobile
        ? '<h1 class="truncate">Company<span aria-hidden="true"> · </span><span class="text-primary font-semibold">Acme</span></h1>'
        : '<h1 class="text-primary w-full text-xl font-semibold">Acme</h1>',
    );
    expect(container.querySelector("h1")?.parentElement?.className).toBe(
      mobile ? "text-muted-foreground flex min-w-0 items-center gap-x-2 text-base font-light" : "flex w-full gap-x-4",
    );
  });
});
