import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
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
  // The push prompt state the bell row reads; tests replace `current`.
  push: { current: null as null | Record<string, unknown> },
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

// `Modules` is a Proxy that throws for any module the app has not registered,
// and the "view all" link reads `Modules.Notification` while rendering. Only
// that key is replaced — the rest of the barrel stays real, because the data
// layer imported alongside it still extends `AbstractApiData`.
vi.mock("../../../../../core", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("../../../../../core");
  return { ...actual, Modules: { Notification: { name: "notifications", pageUrl: "/notifications" } } };
});
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

vi.mock("../../../contexts/PushPromptContext", () => ({
  usePushPrompt: () => mocks.push.current,
}));

// The popover and card primitives are irrelevant here; render their children.
// The Popover stub exposes a plain button that opens it, so `handleOpenChange`
// can be driven; `Button` renders a real button so its props reach the DOM.
vi.mock("../../../../../shadcnui", () => {
  const passthrough = ({ children }: { children?: React.ReactNode }) => <div>{children}</div>;
  return mocks.barrel({
    Button: ({ children, size: _size, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: string }) => (
      <button type="button" {...rest}>
        {children}
      </button>
    ),
    Link: passthrough,
    Popover: ({ children, onOpenChange }: { children?: React.ReactNode; onOpenChange?: (open: boolean) => void }) => (
      <div>
        <button type="button" data-testid="test-open-popover" onClick={() => onOpenChange?.(true)} />
        {children}
      </div>
    ),
    PopoverContent: passthrough,
    PopoverHeader: passthrough,
    PopoverTitle: passthrough,
    PopoverTrigger: passthrough,
    ScrollArea: passthrough,
    SidebarMenuButton: passthrough,
    Tooltip: passthrough,
    TooltipContent: passthrough,
    TooltipTrigger: passthrough,
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

describe("NotificationModal push prompt row", () => {
  const state = (overrides: Record<string, unknown> = {}) => ({
    supported: true,
    permission: "default",
    busy: false,
    enable: vi.fn(() => Promise.resolve()),
    refreshPermission: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    mocks.queue.current = [];
    mocks.push.current = null;
  });

  it("renders when asked for, supported and the permission is not yet answered", () => {
    mocks.push.current = state();

    render(<NotificationModal isOpen={true} setIsOpen={vi.fn()} showPushPrompt />);

    expect(screen.queryAllByTestId("push-prompt-row")).toHaveLength(1);
  });

  it("is absent when showPushPrompt is false or omitted", () => {
    mocks.push.current = state();

    const { unmount } = render(<NotificationModal isOpen={true} setIsOpen={vi.fn()} showPushPrompt={false} />);
    expect(screen.queryAllByTestId("push-prompt-row")).toHaveLength(0);
    unmount();

    render(<NotificationModal isOpen={true} setIsOpen={vi.fn()} />);
    expect(screen.queryAllByTestId("push-prompt-row")).toHaveLength(0);
  });

  it("is absent when there is no push prompt state", () => {
    mocks.push.current = null;

    render(<NotificationModal isOpen={true} setIsOpen={vi.fn()} showPushPrompt />);

    expect(screen.queryAllByTestId("push-prompt-row")).toHaveLength(0);
  });

  it("is absent when push is not supported", () => {
    mocks.push.current = state({ supported: false });

    render(<NotificationModal isOpen={true} setIsOpen={vi.fn()} showPushPrompt />);

    expect(screen.queryAllByTestId("push-prompt-row")).toHaveLength(0);
  });

  it.each(["granted", "denied"])("is absent when the permission is %s", (permission) => {
    mocks.push.current = state({ permission });

    render(<NotificationModal isOpen={true} setIsOpen={vi.fn()} showPushPrompt />);

    expect(screen.queryAllByTestId("push-prompt-row")).toHaveLength(0);
  });

  it("re-reads the permission when the popover opens", () => {
    const current = state();
    mocks.push.current = current;

    render(<NotificationModal isOpen={false} setIsOpen={vi.fn()} showPushPrompt />);
    fireEvent.click(screen.getByTestId("test-open-popover"));

    expect(current.refreshPermission).toHaveBeenCalledTimes(1);
  });

  it("calls enable when the button is clicked", () => {
    const current = state();
    mocks.push.current = current;

    render(<NotificationModal isOpen={true} setIsOpen={vi.fn()} showPushPrompt />);
    fireEvent.click(screen.getByTestId("push-prompt-enable"));

    expect(current.enable).toHaveBeenCalledTimes(1);
  });

  it("disables the button while busy", () => {
    mocks.push.current = state({ busy: true });

    render(<NotificationModal isOpen={true} setIsOpen={vi.fn()} showPushPrompt />);

    expect((screen.getByTestId("push-prompt-enable") as HTMLButtonElement).disabled).toBe(true);
  });

  it("hides the row right after enable resolves", async () => {
    const current = state();
    current.enable = vi.fn(async () => {
      mocks.push.current = { ...current, permission: "granted" };
    });
    mocks.push.current = current;

    const { rerender } = render(<NotificationModal isOpen={true} setIsOpen={vi.fn()} showPushPrompt />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("push-prompt-enable"));
    });
    rerender(<NotificationModal isOpen={true} setIsOpen={vi.fn()} showPushPrompt />);

    expect(current.enable).toHaveBeenCalledTimes(1);
    expect(screen.queryAllByTestId("push-prompt-row")).toHaveLength(0);
  });

  it("shows the title and the button text from the package messages", () => {
    mocks.push.current = state();

    render(<NotificationModal isOpen={true} setIsOpen={vi.fn()} showPushPrompt />);

    expect(screen.getByTestId("push-prompt-row").textContent).toContain("notification.push.title");
    expect(screen.getByTestId("push-prompt-enable").textContent).toBe("notification.push.enable");
  });
});
