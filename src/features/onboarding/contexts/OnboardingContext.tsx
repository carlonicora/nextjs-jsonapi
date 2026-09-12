"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createRoot, Root } from "react-dom/client";
import { driver, type Driver, type DriveStep, type PopoverDOM } from "driver.js";
import "driver.js/dist/driver.css";
import { OnboardingCard } from "../components/OnboardingCard";
import {
  DEFAULT_ONBOARDING_LABELS,
  OnboardingContextValue,
  OnboardingProviderProps,
  OnboardingStepConfig,
  OnboardingStepSide,
  OnboardingTourEndReason,
} from "../interfaces";
import "../styles/onboarding.css";

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

type DriverSide = "top" | "right" | "bottom" | "left";
type DriverAlign = "start" | "center" | "end";

/** "bottom-start" → { side: "bottom", align: "start" }; bare side → align "center". */
export function mapOnboardingSide(side?: OnboardingStepSide): { side: DriverSide; align: DriverAlign } {
  if (!side) return { side: "bottom", align: "center" };
  const [s, a] = side.split("-") as [DriverSide, DriverAlign | undefined];
  return { side: s, align: a ?? "center" };
}

/**
 * Resolves a step's target, treating a hidden element as a missing one.
 *
 * driver.js only honours `skipMissingElement` when the element resolves to
 * nothing. A selector string cannot express "present in the DOM but not
 * displayed", so targets that exist yet are `display: none` (the section rail
 * below `md`, for instance) would otherwise highlight an empty box. Returning
 * `undefined` from the resolver takes the exact same path as an absent
 * selector, so the step is skipped.
 *
 * The check is `getClientRects()`, not the element's own computed style: an
 * element inherits invisibility from a `display: none` ancestor, whose own
 * style says nothing. An element with no client rects generates no boxes, so
 * it is not displayed, whatever its own `display` value is.
 *
 * The cast exists because driver.js types the resolver as `() => Element`,
 * while its runtime (`typeof e === "function" ? e() : ...`) treats any falsy
 * result as missing.
 */
function resolveVisibleElement(selector: string): DriveStep["element"] {
  return (() => {
    const element = document.querySelector(selector);
    if (!element) return undefined;
    if (element.getClientRects().length === 0) return undefined;
    return element;
  }) as DriveStep["element"];
}

export function OnboardingProvider({
  children,
  tours = [],
  tourPaths: _tourPaths = {},
  labels = DEFAULT_ONBOARDING_LABELS,
  renderCard,
  zIndex: _zIndex = 9999,
  onTourEnd,
}: OnboardingProviderProps) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  const driverRef = useRef<Driver | null>(null);
  const rootsRef = useRef<Map<number, Root>>(new Map());
  const endReasonRef = useRef<OnboardingTourEndReason>("dismissed");
  const activeTourIdRef = useRef<string | null>(null);

  // Unmount on the next tick: a root cannot unmount synchronously from inside
  // an event handler it rendered (React warns and skips the unmount).
  const unmountRoot = (root: Root) => setTimeout(() => root.unmount(), 0);

  const cleanupRoots = useCallback(() => {
    rootsRef.current.forEach((root) => unmountRoot(root));
    rootsRef.current.clear();
  }, []);

  const resetState = useCallback(() => {
    setIsTourActive(false);
    setActiveTourId(null);
    setCurrentStepIndex(0);
    setTotalSteps(0);
    driverRef.current = null;
    activeTourIdRef.current = null;
  }, []);

  /**
   * Ends the tour on our side: unmount the cards, reset the state, report the reason.
   *
   * It cannot be left to driver.js's `onDestroyed`: driver only fires that hook when
   * it holds both an active element and an active step, and both are set by a step's
   * 400ms transition callback. A Next/Finish click that lands before the animation
   * settles therefore destroys the DOM without ever calling the hook, and the provider
   * would stay `isTourActive` forever. Every path that calls `destroy()` calls this
   * straight after; `resetState()` nulls `driverRef.current`, so a later `onDestroyed`
   * is a no-op.
   */
  const teardown = useCallback(
    (reason: OnboardingTourEndReason) => {
      if (!driverRef.current) return;
      const id = activeTourIdRef.current;
      cleanupRoots();
      resetState();
      if (id) onTourEnd?.(id, reason);
    },
    [cleanupRoots, resetState, onTourEnd],
  );

  const closeTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
      teardown("dismissed");
      return;
    }
    cleanupRoots();
    resetState();
  }, [cleanupRoots, resetState, teardown]);

  const nextStep = useCallback(() => driverRef.current?.moveNext(), []);
  const previousStep = useCallback(() => driverRef.current?.movePrevious(), []);
  const goToStep = useCallback((index: number) => driverRef.current?.moveTo(index), []);

  const startTour = useCallback(
    (tourId: string, steps?: OnboardingStepConfig[]) => {
      if (typeof window === "undefined") return;
      if (driverRef.current) closeTour();

      const tourSteps = steps ?? tours.find((t) => t.id === tourId)?.steps;
      if (!tourSteps || tourSteps.length === 0) {
        console.warn(`No steps found for tour: ${tourId}`);
        return;
      }

      setTotalSteps(tourSteps.length);
      setActiveTourId(tourId);
      activeTourIdRef.current = tourId;
      endReasonRef.current = "dismissed";

      const move = (direction: "next" | "previous", from: number) => {
        const target = tourSteps[direction === "next" ? from + 1 : from - 1];
        const go = () => (direction === "next" ? driverRef.current?.moveNext() : driverRef.current?.movePrevious());
        if (target?.showDelay) setTimeout(go, target.showDelay);
        else go();
      };

      const end = (reason: OnboardingTourEndReason) => {
        endReasonRef.current = reason;
        driverRef.current?.destroy();
        teardown(reason);
      };

      const driveSteps: DriveStep[] = tourSteps.map((stepConfig, index) => {
        const { side, align } = mapOnboardingSide(stepConfig.side);
        return {
          element: stepConfig.selector ? resolveVisibleElement(stepConfig.selector) : undefined,
          disableActiveInteraction: !(stepConfig.canClickTarget ?? false),
          popover: {
            side,
            align,
            showButtons: [],
            popoverClass: ["onboarding-popover", stepConfig.className].filter(Boolean).join(" "),
            onPopoverRender: (popover: PopoverDOM) => {
              popover.wrapper.querySelectorAll("[data-onboarding-root]").forEach((n) => n.remove());
              const container = document.createElement("div");
              container.setAttribute("data-onboarding-root", "");
              const root = createRoot(container);
              /* driver.js re-renders the popover on refresh(), so the same step can
                 render twice; drop the root the previous render left behind. */
              const prev = rootsRef.current.get(index);
              if (prev) unmountRoot(prev);
              rootsRef.current.set(index, root);
              const cardProps = {
                step: stepConfig,
                currentIndex: index,
                totalSteps: tourSteps.length,
                labels,
                onNext: () => move("next", index),
                onPrevious: () => move("previous", index),
                onClose: () => end(index === tourSteps.length - 1 ? "finished" : "skipped"),
                onSkip: () => end("skipped"),
                isFirst: index === 0,
                isLast: index === tourSteps.length - 1,
              };
              /* driver.js positions the popover right after this hook returns (renderPopover
                 calls onRender, then repositionPopover), so the card has to be in the DOM at
                 its real size by then — an async render would be measured as an empty box and
                 the card would overflow the viewport near a page edge. */
              flushSync(() => {
                root.render(renderCard ? renderCard(cardProps) : <OnboardingCard {...cardProps} />);
              });
              popover.wrapper.appendChild(container);
            },
          },
          onHighlightStarted: () => {
            setIsTourActive(true);
            setCurrentStepIndex(index);
            stepConfig.onShow?.();
          },
          onDeselected: () => {
            stepConfig.onHide?.();
            const root = rootsRef.current.get(index);
            if (root) {
              rootsRef.current.delete(index);
              unmountRoot(root);
            }
          },
        };
      });

      const instance = driver({
        steps: driveSteps,
        animate: true,
        allowClose: true,
        overlayOpacity: 0.75,
        stagePadding: 8,
        stageRadius: 8,
        smoothScroll: true,
        skipMissingElement: true,
        showButtons: [],
        onDestroyed: () => teardown(endReasonRef.current),
      });

      driverRef.current = instance;
      instance.drive();
    },
    [tours, labels, renderCard, closeTour, teardown],
  );

  useEffect(() => {
    return () => {
      driverRef.current?.destroy();
      cleanupRoots();
    };
  }, [cleanupRoots]);

  const value: OnboardingContextValue = {
    startTour,
    closeTour,
    nextStep,
    previousStep,
    goToStep,
    isTourActive,
    activeTourId,
    currentStepIndex,
    totalSteps,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used within an OnboardingProvider");
  return context;
}
