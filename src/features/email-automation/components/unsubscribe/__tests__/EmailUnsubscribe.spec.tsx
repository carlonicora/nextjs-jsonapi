import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmailUnsubscribe } from "../EmailUnsubscribe";

const { unsubscribe } = vi.hoisted(() => ({
  unsubscribe: vi.fn(),
}));

vi.mock("../../../data/EmailAutomationEnrollmentService", () => ({
  EmailAutomationEnrollmentService: {
    unsubscribe: (params: unknown) => unsubscribe(params),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EmailUnsubscribe", () => {
  it("stops the automation and offers to stop every marketing email", async () => {
    unsubscribe.mockResolvedValue({ automation: { name: "Welcome" } });

    render(<EmailUnsubscribe token="tok" scope="automation" />);

    expect(await screen.findByText("emailAutomations.unsubscribe.stoppedAutomation")).toBeInTheDocument();
    expect(unsubscribe).toHaveBeenCalledWith({ token: "tok", scope: "automation" });

    fireEvent.click(screen.getByRole("button", { name: "emailAutomations.unsubscribe.alsoStopAll" }));

    expect(await screen.findByText("emailAutomations.unsubscribe.stoppedAll")).toBeInTheDocument();
    expect(unsubscribe).toHaveBeenLastCalledWith({ token: "tok", scope: "all" });
    expect(screen.queryByRole("button", { name: "emailAutomations.unsubscribe.alsoStopAll" })).not.toBeInTheDocument();
  });

  it("shows only the stopped-all message when the link already asks for every email", async () => {
    unsubscribe.mockResolvedValue({ automation: { name: "Welcome" } });

    render(<EmailUnsubscribe token="tok" scope="all" />);

    expect(await screen.findByText("emailAutomations.unsubscribe.stoppedAll")).toBeInTheDocument();
    expect(unsubscribe).toHaveBeenCalledWith({ token: "tok", scope: "all" });
    expect(screen.queryByRole("button", { name: "emailAutomations.unsubscribe.alsoStopAll" })).not.toBeInTheDocument();
  });

  it("shows the invalid-link state when the call is rejected", async () => {
    unsubscribe.mockRejectedValue(new Error("Not found"));

    render(<EmailUnsubscribe token="unknown" scope="automation" />);

    await waitFor(() => {
      expect(screen.getByText("emailAutomations.unsubscribe.invalidTitle")).toBeInTheDocument();
    });
    expect(screen.getByText("emailAutomations.unsubscribe.invalidBody")).toBeInTheDocument();
  });
});
