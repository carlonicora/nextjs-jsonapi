import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { configureI18n } from "../../../../i18n";

// The provider's initial-load effect returns early on `!currentUser`. Tests set
// `userMock.currentUser` to choose whether the mount-time auto-load fires.
const userMock = vi.hoisted(() => ({ currentUser: undefined as any }));

vi.mock("../../../user/contexts/CurrentUserContext", () => ({
  useCurrentUserContext: () => userMock,
}));
vi.mock("../../data/notification.service", () => ({
  NotificationService: { findMany: vi.fn(), markAsRead: vi.fn() },
}));

import { NotificationContextProvider, useNotificationContext } from "../NotificationContext";
import { NotificationService } from "../../data/notification.service";

const stubRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

function wrapper({ children }: { children: React.ReactNode }) {
  return <NotificationContextProvider>{children}</NotificationContextProvider>;
}

describe("NotificationContext.loadNotifications", () => {
  beforeAll(() => {
    // useI18nRouter() throws unless i18n is configured; the provider calls it at mount.
    configureI18n({
      useRouter: () => stubRouter,
      useTranslations: () => (key: string) => key,
      usePathname: () => "/",
      Link: (({ children }: { children: React.ReactNode }) => children) as any,
    });
  });

  beforeEach(() => {
    userMock.currentUser = undefined;
    vi.mocked(NotificationService.findMany).mockReset();
  });

  it("coalesces concurrent loadNotifications calls into a single request", async () => {
    let release: (() => void) | undefined;
    vi.mocked(NotificationService.findMany).mockImplementation(
      () =>
        new Promise((resolve) => {
          release = () => resolve([] as never);
        }),
    );

    const { result } = renderHook(() => useNotificationContext(), { wrapper });

    // Three concurrent callers, mirroring the mount-time triggers (provider +
    // NotificationModal) plus any consumer that loads on mount, all firing
    // before the first request resolves.
    await act(async () => {
      result.current.loadNotifications();
      result.current.loadNotifications();
      result.current.loadNotifications();
      release?.();
    });

    expect(NotificationService.findMany).toHaveBeenCalledTimes(1);
  });
});

describe("NotificationContextProvider mount load", () => {
  beforeEach(() => {
    vi.mocked(NotificationService.findMany).mockReset();
    vi.mocked(NotificationService.findMany).mockResolvedValue([] as never);
  });

  it("loads notifications exactly once on mount when a user is present", async () => {
    userMock.currentUser = { id: "user-1", roles: [] };

    const { rerender } = renderHook(() => useNotificationContext(), { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    rerender();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(NotificationService.findMany).toHaveBeenCalledTimes(1);
  });
});
