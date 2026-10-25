import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StripeSubscriptionInterface, SubscriptionStatus } from "../../../data";
import { CancelDialogRenderProps, SubscriptionDetails } from "../SubscriptionDetails";

vi.mock("../../forms/CancelSubscriptionDialog", () => ({
  CancelSubscriptionDialog: () => <div data-testid="default-cancel" />,
}));

vi.mock("../../../../stripe-customer", () => ({
  StripeCustomerService: { createPortalSession: vi.fn() },
}));

afterEach(cleanup);

const sub = {
  id: "sub-1",
  status: SubscriptionStatus.ACTIVE,
  cancelAtPeriodEnd: false,
  currentPeriodStart: new Date("2026-10-01T00:00:00Z"),
  currentPeriodEnd: new Date("2026-11-01T00:00:00Z"),
} as unknown as StripeSubscriptionInterface;

function renderDetails(props: Partial<Parameters<typeof SubscriptionDetails>[0]> = {}) {
  const onOpenChange = vi.fn();
  const onSubscriptionChange = vi.fn();
  render(
    <SubscriptionDetails
      subscription={sub}
      open
      onOpenChange={onOpenChange}
      onSubscriptionChange={onSubscriptionChange}
      {...props}
    />,
  );
  fireEvent.click(screen.getByText("ui.buttons.cancel"));
  return { onOpenChange, onSubscriptionChange };
}

describe("SubscriptionDetails cancel dialog", () => {
  it("renders the library dialog when no renderCancelDialog is given", () => {
    renderDetails();
    expect(screen.getByTestId("default-cancel")).toBeInTheDocument();
  });

  it("renders the app dialog with the subscription when renderCancelDialog is given", () => {
    const renderCancelDialog = vi.fn((_props: CancelDialogRenderProps) => <div data-testid="app-cancel" />);
    renderDetails({ renderCancelDialog });
    expect(screen.getByTestId("app-cancel")).toBeInTheDocument();
    expect(screen.queryByTestId("default-cancel")).not.toBeInTheDocument();
    const props = renderCancelDialog.mock.calls.at(-1)![0];
    expect(props.subscription).toBe(sub);
    expect(props.open).toBe(true);
  });

  it("openChangePlan opens the wizard for this subscription and closes the details", () => {
    const renderCancelDialog = vi.fn((_props: CancelDialogRenderProps) => <div data-testid="app-cancel" />);
    const onChangePlan = vi.fn();
    const { onOpenChange } = renderDetails({ renderCancelDialog, onChangePlan });
    const props = renderCancelDialog.mock.calls.at(-1)![0];
    expect(props.openChangePlan).toBeTypeOf("function");
    props.openChangePlan!();
    expect(onChangePlan).toHaveBeenCalledWith(sub);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("openChangePlan is undefined when no onChangePlan is given", () => {
    const renderCancelDialog = vi.fn((_props: CancelDialogRenderProps) => <div data-testid="app-cancel" />);
    renderDetails({ renderCancelDialog });
    expect(renderCancelDialog.mock.calls.at(-1)![0].openChangePlan).toBeUndefined();
  });

  it("onSuccess refreshes the subscriptions", () => {
    const renderCancelDialog = vi.fn((_props: CancelDialogRenderProps) => <div data-testid="app-cancel" />);
    const { onSubscriptionChange } = renderDetails({ renderCancelDialog });
    renderCancelDialog.mock.calls.at(-1)![0].onSuccess();
    expect(onSubscriptionChange).toHaveBeenCalledTimes(1);
  });
});
