import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSharedContext } from "../../../../contexts/SharedContext";
import { RbacService } from "../../data/RbacService";
import { RbacProvider } from "../RbacContext";

vi.mock("../../data/RbacService", () => ({
  RbacService: {
    fetchMatrix: vi.fn(async () => ({ matrix: {}, modulePaths: {} })),
    saveMatrix: vi.fn(async () => undefined),
  },
}));

// The provider refetches whenever `t` changes identity, and the global next-intl
// mock in vitest.setup.ts builds a new `t` per call. A stable one keeps the fetch
// to a single run. Labels still render as their own key.
const { stableT } = vi.hoisted(() => ({ stableT: (key: string) => key }));
vi.mock("next-intl", () => ({
  useTranslations: () => stableT,
  useLocale: () => "en",
  useNow: () => new Date(),
  useTimeZone: () => "UTC",
  useFormatter: () => ({ dateTime: vi.fn(), number: vi.fn(), relativeTime: vi.fn() }),
}));

function BreadcrumbProbe() {
  const { breadcrumbs } = useSharedContext();
  return <span data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</span>;
}

describe("RbacContext", () => {
  it("publishes the page as an unlinked breadcrumb, since it is the current page", async () => {
    render(
      <RbacProvider>
        <BreadcrumbProbe />
      </RbacProvider>,
    );

    await waitFor(() => expect(RbacService.fetchMatrix).toHaveBeenCalled());
    expect(screen.getByTestId("breadcrumbs")).toHaveTextContent(JSON.stringify([{ name: "entities.rbac" }]));
  });
});
