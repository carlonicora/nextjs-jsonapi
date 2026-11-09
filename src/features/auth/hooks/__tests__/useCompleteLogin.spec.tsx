import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthComponent } from "../../enums";
import { useCompleteLogin } from "../useCompleteLogin";

const mocks = vi.hoisted(() => ({
  setUser: vi.fn(),
  setComponentType: vi.fn(),
  setPendingTwoFactor: vi.fn(),
  i18nRouter: { replace: vi.fn(), push: vi.fn() },
  nativeRouter: { replace: vi.fn(), push: vi.fn() },
  search: { value: "" },
}));

vi.mock(
  "../../../user/contexts",
  () => new Proxy({ useCurrentUserContext: () => ({ setUser: mocks.setUser }) }, { has: () => true }),
);

vi.mock(
  "../../contexts",
  () =>
    new Proxy(
      {
        useAuthContext: () => ({
          setComponentType: mocks.setComponentType,
          setPendingTwoFactor: mocks.setPendingTwoFactor,
        }),
      },
      { has: () => true },
    ),
);

vi.mock(
  "../../../../hooks",
  () =>
    new Proxy(
      {
        usePageUrlGenerator:
          () =>
          ({ page }: { page: string }) =>
            page,
        useI18nRouter: () => mocks.i18nRouter,
      },
      { has: () => true },
    ),
);

vi.mock("next/navigation", () => ({
  useRouter: () => mocks.nativeRouter,
  useSearchParams: () => new URLSearchParams(mocks.search.value),
}));

describe("useCompleteLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.search.value = "";
  });

  it("a user response sets the user and goes home", () => {
    const { result } = renderHook(() => useCompleteLogin());
    const user = { id: "u1" } as any;
    result.current(user);
    expect(mocks.setUser).toHaveBeenCalledWith(user);
    expect(mocks.i18nRouter.replace).toHaveBeenCalledWith("/");
    expect(mocks.nativeRouter.replace).not.toHaveBeenCalled();
  });

  it("a callbackUrl wins over home", () => {
    mocks.search.value = "callbackUrl=/it/campaigns";
    const { result } = renderHook(() => useCompleteLogin());
    result.current({ id: "u1" } as any);
    expect(mocks.nativeRouter.replace).toHaveBeenCalledWith("/it/campaigns");
    expect(mocks.i18nRouter.replace).not.toHaveBeenCalled();
  });

  it("a two-factor challenge opens the challenge", () => {
    const { result } = renderHook(() => useCompleteLogin());
    const challenge = { pendingToken: "p" } as any;
    result.current(challenge);
    expect(mocks.setPendingTwoFactor).toHaveBeenCalledWith(challenge);
    expect(mocks.setComponentType).toHaveBeenCalledWith(AuthComponent.TwoFactorChallenge);
    expect(mocks.setUser).not.toHaveBeenCalled();
  });
});
