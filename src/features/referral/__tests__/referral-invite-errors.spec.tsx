import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sendReferralEmail: vi.fn(),
  sendInvite: vi.fn(),
  showError: vi.fn(),
  showToast: vi.fn(),
}));

// Echoes the key, so an assertion names the message the user would read.
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("../../../utils", async () => ({
  ...(await vi.importActual<object>("../../../utils")),
  showError: mocks.showError,
  showToast: mocks.showToast,
}));
vi.mock("../data/ReferralService", () => ({ ReferralService: { sendReferralEmail: mocks.sendReferralEmail } }));
vi.mock("../hooks/useReferralStats", () => ({
  useReferralStats: () => ({ stats: { referralCode: "abc", completedReferrals: 0 }, loading: false, error: null }),
}));
vi.mock("../hooks/useReferralInvite", async () => ({
  ...(await vi.importActual<object>("../hooks/useReferralInvite")),
  useReferralInvite: () => ({ sendInvite: mocks.sendInvite, sending: false }),
}));

import { ReferralWidget } from "../components/ReferralWidget";
import { configureReferral } from "../config";

/** The error callApi throws when suppressGlobalError is set: the JSON:API body rides on `body`. */
const apiError = (code?: string) =>
  Object.assign(new Error("400:English text from the API"), {
    status: 400,
    body: { errors: [{ status: "400", ...(code ? { code } : {}), detail: "English text from the API" }] },
  });

const sendTo = (email: string) => {
  fireEvent.change(screen.getByPlaceholderText("referral.emailPlaceholder"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "referral.send" }));
};

describe("referral invite errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureReferral({ enabled: true });
  });

  it.each([
    ["REFERRAL_ALREADY_INVITED", "referral.alreadyInvited"],
    ["REFERRAL_ALREADY_REGISTERED", "referral.alreadyRegistered"],
    [undefined, "referral.inviteFailed"],
  ])("code %s shows %s, never the API text", async (code, message) => {
    mocks.sendInvite.mockRejectedValue(apiError(code));
    render(<ReferralWidget isDialog />);

    await act(async () => sendTo("gm@example.com"));

    expect(mocks.showError).toHaveBeenCalledWith(message);
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it("a sent invite shows the translated confirmation", async () => {
    mocks.sendInvite.mockResolvedValue(undefined);
    render(<ReferralWidget isDialog />);

    await act(async () => sendTo("gm@example.com"));

    expect(mocks.showToast).toHaveBeenCalledWith("referral.inviteSent");
    expect(mocks.showError).not.toHaveBeenCalled();
  });

  it("useReferralInvite rethrows a refused invite", async () => {
    const { useReferralInvite } =
      await vi.importActual<typeof import("../hooks/useReferralInvite")>("../hooks/useReferralInvite");
    mocks.sendReferralEmail.mockRejectedValue(apiError("REFERRAL_ALREADY_INVITED"));
    const { result } = renderHook(() => useReferralInvite());

    await act(async () => {
      await expect(result.current.sendInvite("gm@example.com")).rejects.toMatchObject({ status: 400 });
    });
  });
});
