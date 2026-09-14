import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HandbookPageService } from "../../../data/HandbookPageService";
import HandbookSyncButton from "../HandbookSyncButton";

vi.mock("../../../data/HandbookPageService", () => ({
  HandbookPageService: { sync: vi.fn() },
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("HandbookSyncButton", () => {
  beforeEach(() => {
    vi.mocked(HandbookPageService.sync).mockReset().mockResolvedValue(undefined);
  });

  it("syncs, then refreshes the list", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    render(<HandbookSyncButton refresh={refresh} />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(HandbookPageService.sync).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("does not refresh when the sync fails, and re-enables itself", async () => {
    vi.mocked(HandbookPageService.sync).mockRejectedValue(new Error("no handbook path configured"));
    const refresh = vi.fn().mockResolvedValue(undefined);
    render(<HandbookSyncButton refresh={refresh} />);

    await userEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(HandbookPageService.sync).toHaveBeenCalledTimes(1));
    expect(refresh).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled());
  });
});
