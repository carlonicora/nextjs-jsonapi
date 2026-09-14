import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { showError, showToast } from "../../../../utils/toast";
import { HowToService } from "../../data/HowToService";
import HowToReindexButton from "./HowToReindexButton";

vi.mock("../../data/HowToService", () => ({
  HowToService: { reindex: vi.fn() },
}));

vi.mock("../../../../utils/toast", () => ({
  showToast: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("HowToReindexButton", () => {
  beforeEach(() => {
    vi.mocked(HowToService.reindex).mockReset().mockResolvedValue(undefined);
    vi.mocked(showToast).mockReset();
    vi.mocked(showError).mockReset();
  });

  it("renders the action label", () => {
    render(<HowToReindexButton refresh={vi.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByRole("button")).toHaveTextContent("howto.reindex.action");
  });

  it("reindexes, then refreshes the list", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    render(<HowToReindexButton refresh={refresh} />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(HowToService.reindex).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("shows the running state while the reindex is in flight", async () => {
    let resolveReindex: () => void = () => {};
    vi.mocked(HowToService.reindex).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveReindex = resolve;
      }),
    );
    render(<HowToReindexButton refresh={vi.fn().mockResolvedValue(undefined)} />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("howto.reindex.running"));
    expect(screen.getByRole("button")).toBeDisabled();

    resolveReindex();
    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("howto.reindex.action"));
  });

  it("shows the done state once the reindex succeeds", async () => {
    render(<HowToReindexButton refresh={vi.fn().mockResolvedValue(undefined)} />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(showToast).toHaveBeenCalledWith("howto.reindex.done"));
    expect(showError).not.toHaveBeenCalled();
  });

  it("shows the failed state when the reindex rejects, and re-enables itself", async () => {
    vi.mocked(HowToService.reindex).mockRejectedValue(new Error("boom"));
    const refresh = vi.fn().mockResolvedValue(undefined);
    render(<HowToReindexButton refresh={refresh} />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(showError).toHaveBeenCalledWith("howto.reindex.failed"));
    expect(showToast).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
  });
});
