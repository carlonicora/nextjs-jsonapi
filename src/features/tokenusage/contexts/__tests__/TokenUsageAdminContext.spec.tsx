import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TokenUsageAdminService } from "../../data/TokenUsageAdminService";
import { TokenUsageAdminProvider, useTokenUsageAdmin } from "../TokenUsageAdminContext";

vi.mock("../../data/TokenUsageAdminService", () => ({
  TokenUsageAdminService: {
    getSummary: vi.fn(async () => []),
    getTimeline: vi.fn(async () => []),
    getBreakdown: vi.fn(async () => []),
  },
}));

function Probe() {
  const ctx = useTokenUsageAdmin();
  return <span data-testid="mode">{String(ctx.singleCustomerMode)}</span>;
}

describe("TokenUsageAdminContext", () => {
  // The mocked service is module-level, so its call counts survive across tests.
  // Without this reset the per-test `toHaveBeenCalledTimes` assertions would
  // measure the whole file rather than one render.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when used outside its provider", () => {
    expect(() => render(<Probe />)).toThrow();
  });

  it("requests every panel on mount and reports not-single-customer by default", async () => {
    render(
      <TokenUsageAdminProvider>
        <Probe />
      </TokenUsageAdminProvider>,
    );

    await waitFor(() => expect(TokenUsageAdminService.getSummary).toHaveBeenCalled());

    // Four ranked panels: company, user, customer-by-operation, platform-by-operation.
    // Asserted by dimension+scope rather than by count alone, so a wrong pairing
    // fails here instead of silently rendering the wrong data.
    const calls = (TokenUsageAdminService.getBreakdown as ReturnType<typeof vi.fn>).mock.calls.map(([args]) => [
      args.dimension,
      args.scope,
    ]);
    expect(calls).toEqual(
      expect.arrayContaining([
        ["company", "customer"],
        ["user", "customer"],
        ["operation", "customer"],
        ["operation", "platform"],
      ]),
    );
    expect(calls).toHaveLength(4);
    expect(screen.getByTestId("mode")).toHaveTextContent("false");
  });

  it("skips only the PLATFORM operation breakdown once a company filter is applied", async () => {
    render(
      <TokenUsageAdminProvider initialCompanyId="c1">
        <Probe />
      </TokenUsageAdminProvider>,
    );

    await waitFor(() => expect(TokenUsageAdminService.getSummary).toHaveBeenCalled());

    const calls = (TokenUsageAdminService.getBreakdown as ReturnType<typeof vi.fn>).mock.calls.map(([args]) => [
      args.dimension,
      args.scope,
    ]);
    // Platform spend has no owning company, so filtering it is meaningless and
    // the call is skipped. The CUSTOMER operation panel is still meaningful and
    // must survive — that distinction is the point of this test.
    expect(calls).toContainEqual(["operation", "customer"]);
    expect(calls).not.toContainEqual(["operation", "platform"]);
    expect(calls).toHaveLength(3);
    expect(screen.getByTestId("mode")).toHaveTextContent("true");
  });
});
