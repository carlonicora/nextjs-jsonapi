import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

type Hooks = {
  onDestroyed?: () => void;
  steps: Array<{
    element?: () => Element | undefined;
    disableActiveInteraction?: boolean;
    popover: { side: string; align: string; onPopoverRender: (p: { wrapper: HTMLElement }) => void };
    onHighlightStarted?: () => void;
    onDeselected?: () => void;
  }>;
};

const driverMock = vi.hoisted(() => {
  const instance = {
    drive: vi.fn(),
    moveNext: vi.fn(),
    movePrevious: vi.fn(),
    moveTo: vi.fn(),
    destroy: vi.fn(),
  };
  const state: { config?: Hooks } = {};
  const driver = vi.fn((config: Hooks) => {
    state.config = config;
    return instance;
  });
  return { driver, instance, state };
});

vi.mock("driver.js", () => ({ driver: driverMock.driver }));
vi.mock("driver.js/dist/driver.css", () => ({}));
vi.mock("../styles/onboarding.css", () => ({}));

import { OnboardingProvider, useOnboarding } from "./OnboardingContext";
import type { OnboardingStepConfig } from "../interfaces";

const steps: OnboardingStepConfig[] = [
  { id: "a", title: "First", content: "one", selector: "[data-help='x']", side: "bottom-start" },
  { id: "b", title: "Second", content: "two" },
];

function wrap(onTourEnd = vi.fn()) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <OnboardingProvider onTourEnd={onTourEnd}>{children}</OnboardingProvider>
  );
  return { wrapper, onTourEnd };
}

describe("OnboardingProvider on driver.js", () => {
  beforeEach(() => {
    driverMock.driver.mockClear();
    driverMock.instance.drive.mockClear();
    driverMock.instance.destroy.mockClear();
    driverMock.instance.moveNext.mockClear();
    driverMock.state.config = undefined;
  });

  it("maps steps to driver steps and starts the tour", () => {
    const { wrapper } = wrap();
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    act(() => result.current.startTour("t", steps));

    const config = driverMock.state.config!;
    expect(driverMock.instance.drive).toHaveBeenCalledTimes(1);
    expect(config.steps).toHaveLength(2);
    const resolveElement = config.steps[0].element!;
    expect(typeof resolveElement).toBe("function");
    expect(resolveElement()).toBeUndefined();
    const target = document.createElement("div");
    target.setAttribute("data-help", "x");
    document.body.appendChild(target);
    // jsdom lays nothing out, so getClientRects() is always empty; the resolver
    // reads it to catch a display:none ancestor, so give it one box here.
    const rects = vi.spyOn(Element.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
    expect(resolveElement()).toBe(target);
    rects.mockRestore();
    target.remove();
    expect(resolveElement()).toBeUndefined();
    expect(config.steps[0].popover.side).toBe("bottom");
    expect(config.steps[0].popover.align).toBe("start");
    expect(config.steps[0].disableActiveInteraction).toBe(true);
    expect(config.steps[1].element).toBeUndefined();
    expect(config.steps[1].popover.align).toBe("center");
    expect(result.current.totalSteps).toBe(2);
    expect(result.current.activeTourId).toBe("t");
  });

  it("renders the card into the popover wrapper and tracks the active step", () => {
    const { wrapper } = wrap();
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    act(() => result.current.startTour("t", steps));
    const config = driverMock.state.config!;

    const popoverWrapper = document.createElement("div");
    act(() => {
      config.steps[0].onHighlightStarted?.();
      config.steps[0].popover.onPopoverRender({ wrapper: popoverWrapper });
    });

    expect(result.current.isTourActive).toBe(true);
    expect(result.current.currentStepIndex).toBe(0);
    expect(popoverWrapper.querySelector("[data-onboarding-card]")).not.toBeNull();
    expect(popoverWrapper.textContent).toContain("First");
  });

  it("mounts the card synchronously, before driver.js positions the popover", () => {
    const { wrapper } = wrap();
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    act(() => result.current.startTour("t", steps));
    const config = driverMock.state.config!;

    // driver.js calls onPopoverRender, then measures and positions the popover in the
    // same synchronous pass; the card must already be there at full size.
    const popoverWrapper = document.createElement("div");
    config.steps[0].popover.onPopoverRender({ wrapper: popoverWrapper });
    expect(popoverWrapper.querySelector("[data-onboarding-card]")).not.toBeNull();
    expect(popoverWrapper.textContent).toContain("First");
  });

  it("reports 'finished' when the last step's Finish is pressed", () => {
    const { wrapper, onTourEnd } = wrap();
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    act(() => result.current.startTour("t", steps));
    const config = driverMock.state.config!;
    const popoverWrapper = document.createElement("div");
    act(() => {
      config.steps[1].onHighlightStarted?.();
      config.steps[1].popover.onPopoverRender({ wrapper: popoverWrapper });
    });
    const finish = Array.from(popoverWrapper.querySelectorAll("button")).find((b) => b.textContent === "Finish")!;
    act(() => finish.click());
    act(() => config.onDestroyed?.());

    expect(driverMock.instance.destroy).toHaveBeenCalled();
    expect(onTourEnd).toHaveBeenCalledWith("t", "finished");
    expect(result.current.isTourActive).toBe(false);
    expect(result.current.activeTourId).toBeNull();
  });

  it("ends the tour even when driver.js never fires onDestroyed", () => {
    /* driver.js skips onDeselected/onDestroyed unless its 400ms transition callback has
       set __activeElement and __activeStep, so a fast Finish click destroys the tour
       without the hook ever running. The provider must still tear itself down. */
    const { wrapper, onTourEnd } = wrap();
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    act(() => result.current.startTour("t", steps));
    const config = driverMock.state.config!;
    const popoverWrapper = document.createElement("div");
    act(() => {
      config.steps[1].onHighlightStarted?.();
      config.steps[1].popover.onPopoverRender({ wrapper: popoverWrapper });
    });
    expect(result.current.isTourActive).toBe(true);

    const finish = Array.from(popoverWrapper.querySelectorAll("button")).find((b) => b.textContent === "Finish")!;
    act(() => finish.click());

    expect(driverMock.instance.destroy).toHaveBeenCalled();
    expect(result.current.isTourActive).toBe(false);
    expect(result.current.activeTourId).toBeNull();
    expect(onTourEnd).toHaveBeenCalledWith("t", "finished");

    // A late onDestroyed must not end the tour a second time.
    act(() => config.onDestroyed?.());
    expect(onTourEnd).toHaveBeenCalledTimes(1);
  });

  it("reports 'dismissed' when driver is destroyed without a card action", () => {
    const { wrapper, onTourEnd } = wrap();
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    act(() => result.current.startTour("t", steps));
    act(() => driverMock.state.config!.onDestroyed?.());
    expect(onTourEnd).toHaveBeenCalledWith("t", "dismissed");
  });

  it("warns and does nothing for an unknown tour id", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { wrapper } = wrap();
    const { result } = renderHook(() => useOnboarding(), { wrapper });
    act(() => result.current.startTour("missing"));
    expect(driverMock.driver).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useOnboarding())).toThrow(/OnboardingProvider/);
  });
});
