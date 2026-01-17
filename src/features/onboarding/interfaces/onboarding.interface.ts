import { ReactNode } from "react";

export type OnboardingStepSide =
  | "top"
  | "top-start"
  | "top-end"
  | "bottom"
  | "bottom-start"
  | "bottom-end"
  | "left"
  | "left-start"
  | "left-end"
  | "right"
  | "right-start"
  | "right-end";

export interface OnboardingStepConfig {
  id: string;
  title: string;
  content: ReactNode;
  selector?: string;
  side?: OnboardingStepSide;
  onShow?: () => void;
  onHide?: () => void;
  action?: { label: string; onClick: () => void };
  showDelay?: number;
  canClickTarget?: boolean;
  className?: string;
}

export interface OnboardingTourConfig {
  id: string;
  name: string;
  description?: string;
  steps: OnboardingStepConfig[];
  routes?: string[];
}

export interface OnboardingTourPaths {
  [routePattern: string]: string;
}

export interface OnboardingLabels {
  next: string;
  previous: string;
  finish: string;
  skip: string;
  close: string;
  stepCounter: (current: number, total: number) => string;
}

export const DEFAULT_ONBOARDING_LABELS: OnboardingLabels = {
  next: "Next",
  previous: "Previous",
  finish: "Finish",
  skip: "Skip",
  close: "Close",
  stepCounter: (current, total) => `${current} of ${total}`,
};

export interface OnboardingContextValue {
  startTour: (tourId: string, steps?: OnboardingStepConfig[]) => void;
  closeTour: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (index: number) => void;
  isTourActive: boolean;
  activeTourId: string | null;
  currentStepIndex: number;
  totalSteps: number;
}

export interface OnboardingProviderProps {
  children: React.ReactNode;
  tours?: OnboardingTourConfig[];
  tourPaths?: OnboardingTourPaths;
  labels?: OnboardingLabels;
  renderCard?: (props: OnboardingCardRenderProps) => ReactNode;
  zIndex?: number;
}

export interface OnboardingCardRenderProps {
  step: OnboardingStepConfig;
  currentIndex: number;
  totalSteps: number;
  labels: OnboardingLabels;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
}
