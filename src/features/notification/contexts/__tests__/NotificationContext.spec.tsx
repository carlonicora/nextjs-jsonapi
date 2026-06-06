import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { configureI18n } from "../../../../i18n";

// currentUser undefined → the provider's initial-load effect is a no-op
// (it returns early on `!currentUser`), so the ONLY fetches in this test come
// from the explicit loadNotifications() calls below. This isolates the
// in-flight de-duplication behaviour from the mount-time auto-load.
vi.mock("../../../user/contexts/CurrentUserContext", () => ({
  useCurrentUserContext: () => ({ currentUser: undefined }),
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

    // Three concurrent callers, mirroring the three mount-time triggers
    // (provider + LayoutDetails + NotificationModal) firing before the first
    // request resolves.
    await act(async () => {
      result.current.loadNotifications();
      result.current.loadNotifications();
      result.current.loadNotifications();
      release?.();
    });

    expect(NotificationService.findMany).toHaveBeenCalledTimes(1);
  });
});
