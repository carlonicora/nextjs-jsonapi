import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PushNotificationProvider } from "../PushNotificationProvider";

// Hoisted so the vi.mock factories below can read it (Vitest hoists factories
// above module-scope consts).
const mocks = vi.hoisted(() => ({
  hook: vi.fn(),
  context: {
    currentUser: { id: "u1" } as { id: string } | undefined,
    hasRole: (() => false) as (roleId: string) => boolean,
  },
}));

vi.mock("../../../../../hooks/usePushNotifications", () => ({ default: mocks.hook }));

vi.mock("../../../../../contexts", () => ({
  useCurrentUserContext: () => mocks.context,
}));

vi.mock("../../../../../roles", () => ({
  getRoleId: () => ({ Administrator: "administrator" }),
}));

describe("PushNotificationProvider", () => {
  beforeEach(() => {
    mocks.hook.mockReset();
    mocks.context.currentUser = { id: "u1" };
    mocks.context.hasRole = () => false;
  });

  it("passes the current user and canSubscribe=true for a non-administrator", () => {
    render(<PushNotificationProvider>child</PushNotificationProvider>);
    expect(mocks.hook).toHaveBeenCalledWith({ currentUser: { id: "u1" }, canSubscribe: true });
  });

  it("passes canSubscribe=false for an administrator", () => {
    mocks.context.hasRole = (roleId: string) => roleId === "administrator";
    render(<PushNotificationProvider>child</PushNotificationProvider>);
    expect(mocks.hook).toHaveBeenCalledWith({ currentUser: { id: "u1" }, canSubscribe: false });
  });

  it("renders its children", () => {
    render(
      <PushNotificationProvider>
        <span>inside the provider</span>
      </PushNotificationProvider>,
    );
    expect(screen.getByText("inside the provider")).toBeInTheDocument();
  });
});
