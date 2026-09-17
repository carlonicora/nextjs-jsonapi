import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// The modal competes with `useNotificationSync` for the same socket queue; the
// parent hook drains it in the same commit. These specs pin the property that
// makes the toast possible at all: the modal takes the queue synchronously
// when it renders with socket notifications, never on a deferred timer.

// Vitest hoists every `vi.mock` factory above the module body, so anything a
// factory touches has to be created by `vi.hoisted` — including the mutable
// socket queue, which lives in a holder object the tests reassign the contents
// of (`mocks.queue.current = [...]`) rather than rebinding.
//
// `contexts`, `hooks` and `shadcnui` are large barrels: Vitest throws
// `No "X" export is defined on the … mock` for any key a factory omits, so
// `barrel` wraps the returned object in a Proxy that claims to have every key
// and answers the unstubbed ones with `undefined` (`then` included, so the
// mocked module is never mistaken for a thenable).
const mocks = vi.hoisted(() => ({
  showToast: vi.fn(),
  clearSocketNotifications: vi.fn(),
  addNotification: vi.fn(),
  generateToastNotification: vi.fn(
    (): { title: string; description: string; action?: { label: string; onClick: () => void } } => ({
      title: "Transcript ready",
      description: "Session 12",
    }),
  ),
  queue: { current: [] as unknown[] },
  barrel: function <T extends object>(exports: T): T {
    return new Proxy({ then: undefined, ...exports }, { has: () => true }) as T;
  },
}));

vi.mock("../../../../../utils/toast", () => ({ showToast: (...args: unknown[]) => mocks.showToast(...args) }));

vi.mock("../../../../../contexts", () =>
  mocks.barrel({
    useSocketContext: () => ({
      socketNotifications: mocks.queue.current,
      removeSocketNotification: vi.fn(),
      clearSocketNotifications: mocks.clearSocketNotifications,
    }),
  }),
);

vi.mock("../../../../../hooks", () => mocks.barrel({ usePageUrlGenerator: () => (p: unknown) => String(p) }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

vi.mock("../../../contexts/NotificationContext", () => ({
  useNotificationContext: () => ({
    notifications: [],
    addNotification: mocks.addNotification,
    generateNotification: () => null,
    generateToastNotification: mocks.generateToastNotification,
    markNotificationsAsRead: vi.fn(),
    isLoading: false,
    error: null,
    loadNotifications: vi.fn(),
    shouldRefresh: false,
  }),
}));

// The popover and card primitives are irrelevant here; render their children.
vi.mock("../../../../../shadcnui", () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return mocks.barrel({
    Card: passthrough,
    CardHeader: passthrough,
    CardTitle: passthrough,
    Popover: passthrough,
    PopoverContent: passthrough,
    PopoverTrigger: passthrough,
    ScrollArea: passthrough,
    Separator: () => null,
    SidebarMenuButton: passthrough,
  });
});

import { NotificationModal } from "../NotificationModal";

const notification = { id: "n-1", notificationType: "transcript_ready", isRead: false } as never;

describe("NotificationModal socket queue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.showToast.mockClear();
    mocks.clearSocketNotifications.mockClear();
    mocks.addNotification.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("takes the socket queue synchronously on render, before any timer runs", () => {
    mocks.queue.current = [notification];

    render(<NotificationModal isOpen={false} setIsOpen={vi.fn()} />);

    // Same commit: the queue is already claimed, so a sibling drain finds it empty.
    expect(mocks.clearSocketNotifications).toHaveBeenCalledTimes(1);
  });

  it("adds the notification and shows its toast once the batch timer fires", () => {
    mocks.queue.current = [notification];

    render(<NotificationModal isOpen={false} setIsOpen={vi.fn()} />);
    vi.runAllTimers();

    expect(mocks.addNotification).toHaveBeenCalledWith(notification);
    expect(mocks.showToast).toHaveBeenCalledTimes(1);
    expect(mocks.showToast).toHaveBeenCalledWith(
      "Transcript ready",
      expect.objectContaining({ description: "Session 12" }),
    );
  });

  it("does nothing when the queue is empty", () => {
    mocks.queue.current = [];

    render(<NotificationModal isOpen={false} setIsOpen={vi.fn()} />);
    vi.runAllTimers();

    expect(mocks.clearSocketNotifications).not.toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it("keeps a toast that has something to press on screen until it is dismissed", () => {
    mocks.queue.current = [notification];
    const action = { label: "Open", onClick: vi.fn() };
    mocks.generateToastNotification.mockReturnValueOnce({
      title: "Transcript ready",
      description: "Session 12",
      action,
    });

    render(<NotificationModal isOpen={false} setIsOpen={vi.fn()} />);
    vi.runAllTimers();

    expect(mocks.showToast).toHaveBeenCalledWith(
      "Transcript ready",
      expect.objectContaining({ action, duration: Infinity }),
    );
  });

  it("leaves the usual timeout on a toast with nothing to press", () => {
    mocks.queue.current = [notification];

    render(<NotificationModal isOpen={false} setIsOpen={vi.fn()} />);
    vi.runAllTimers();

    expect(mocks.showToast).toHaveBeenCalledWith("Transcript ready", expect.objectContaining({ duration: undefined }));
  });
});
