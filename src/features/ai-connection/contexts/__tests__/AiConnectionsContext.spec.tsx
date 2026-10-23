import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSharedContext } from "../../../../contexts/SharedContext";
import { AiConnectionService } from "../../data";
import { AiConnectionsProvider } from "../AiConnectionsContext";

vi.mock("../../data", () => ({
  AiConnectionService: {
    listConnections: vi.fn(async () => ({ connections: [], providerRegistry: {}, envDefaults: {} })),
  },
}));

// next-intl is globally mocked in vitest.setup.ts with `t = (key) => key`, so a
// translated label renders as its own key.
function BreadcrumbProbe() {
  const { breadcrumbs } = useSharedContext();
  return <span data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</span>;
}

describe("AiConnectionsContext", () => {
  it("publishes the page as an unlinked breadcrumb, since it is the current page", async () => {
    render(
      <AiConnectionsProvider>
        <BreadcrumbProbe />
      </AiConnectionsProvider>,
    );

    await waitFor(() => expect(AiConnectionService.listConnections).toHaveBeenCalled());
    expect(screen.getByTestId("breadcrumbs")).toHaveTextContent(
      JSON.stringify([{ name: "ai_connections.admin.title" }]),
    );
  });
});
