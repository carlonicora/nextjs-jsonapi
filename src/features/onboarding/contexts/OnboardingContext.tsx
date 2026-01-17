"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { OnboardingCard } from "../components/OnboardingCard";
import {
  DEFAULT_ONBOARDING_LABELS,
  OnboardingContextValue,
  OnboardingProviderProps,
  OnboardingStepConfig,
} from "../interfaces";
import "../styles/onboarding.css";

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({
  children,
  tours = [],
  tourPaths = {},
  labels = DEFAULT_ONBOARDING_LABELS,
  renderCard,
  zIndex = 9999,
}: OnboardingProviderProps) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  const tourRef = useRef<InstanceType<typeof Shepherd.Tour> | null>(null);
  const rootsRef = useRef<Map<string, Root>>(new Map());

  const cleanupRoots = useCallback(() => {
    rootsRef.current.forEach((root) => {
      try {
        root.unmount();
      } catch (e) {
        // Root may already be unmounted
      }
    });
    rootsRef.current.clear();
  }, []);

  const closeTour = useCallback(() => {
    if (tourRef.current) {
      tourRef.current.cancel();
      tourRef.current = null;
    }
    cleanupRoots();
    setIsTourActive(false);
    setActiveTourId(null);
    setCurrentStepIndex(0);
    setTotalSteps(0);
  }, [cleanupRoots]);

  const nextStep = useCallback(() => {
    if (tourRef.current) {
      tourRef.current.next();
    }
  }, []);

  const previousStep = useCallback(() => {
    if (tourRef.current) {
      tourRef.current.back();
    }
  }, []);

  const goToStep = useCallback((index: number) => {
    if (tourRef.current) {
      tourRef.current.show(index);
    }
  }, []);

  const startTour = useCallback(
    (tourId: string, steps?: OnboardingStepConfig[]) => {
      if (typeof window === "undefined") return;

      // Close any existing tour
      if (tourRef.current) {
        closeTour();
      }

      // Get steps from provided steps or find tour by ID
      let tourSteps = steps;
      if (!tourSteps) {
        const tour = tours.find((t) => t.id === tourId);
        tourSteps = tour?.steps;
      }

      if (!tourSteps || tourSteps.length === 0) {
        console.warn(`No steps found for tour: ${tourId}`);
        return;
      }

      setTotalSteps(tourSteps.length);
      setActiveTourId(tourId);

      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          classes: "shepherd-theme-custom",
          scrollTo: { behavior: "smooth", block: "center" },
          cancelIcon: { enabled: false },
        },
      });

      // Set up tour event listeners
      tour.on("show", () => setIsTourActive(true));
      tour.on("cancel", () => {
        cleanupRoots();
        setIsTourActive(false);
        setActiveTourId(null);
        setCurrentStepIndex(0);
        setTotalSteps(0);
        tourRef.current = null;
      });
      tour.on("complete", () => {
        cleanupRoots();
        setIsTourActive(false);
        setActiveTourId(null);
        setCurrentStepIndex(0);
        setTotalSteps(0);
        tourRef.current = null;
      });

      tourSteps.forEach((stepConfig, index) => {
        const stepId = stepConfig.id || `step-${index}`;

        tour.addStep({
          id: stepId,
          attachTo: stepConfig.selector ? { element: stepConfig.selector, on: stepConfig.side || "bottom" } : undefined,
          arrow: true,
          // Use text callback to return DOM element with React content
          text: () => {
            const container = document.createElement("div");
            const root = createRoot(container);
            rootsRef.current.set(stepId, root);

            const cardProps = {
              step: stepConfig,
              currentIndex: index,
              totalSteps: tourSteps!.length,
              labels,
              onNext: () => tour.next(),
              onPrevious: () => tour.back(),
              onClose: () => tour.cancel(),
              onSkip: () => tour.cancel(),
              isFirst: index === 0,
              isLast: index === tourSteps!.length - 1,
            };

            root.render(renderCard ? renderCard(cardProps) : <OnboardingCard {...cardProps} />);

            return container;
          },
          buttons: [], // Empty - our card handles navigation
          beforeShowPromise: stepConfig.showDelay
            ? () => new Promise((resolve) => setTimeout(resolve, stepConfig.showDelay))
            : undefined,
          canClickTarget: stepConfig.canClickTarget ?? false,
          modalOverlayOpeningPadding: 8,
          modalOverlayOpeningRadius: 8,
          when: {
            show: () => {
              setCurrentStepIndex(index);
              stepConfig.onShow?.();
            },
            hide: () => {
              stepConfig.onHide?.();
            },
          },
        });
      });

      tourRef.current = tour;
      tour.start();
    },
    [tours, labels, renderCard, closeTour, cleanupRoots],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tourRef.current) {
        tourRef.current.cancel();
      }
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
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
