"use client";

import { X } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle } from "../../../shadcnui";
import { OnboardingCardRenderProps } from "../interfaces";

// Matches a360ai ShepherdCard design exactly
export function OnboardingCard({
  step,
  currentIndex,
  totalSteps,
  labels,
  onNext,
  onPrevious,
  onClose,
  isFirst,
  isLast,
}: OnboardingCardRenderProps) {
  return (
    <Card className="w-[320px] relative" data-shepherd-card>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2"
        onClick={onClose}
        aria-label={labels.close}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{step.title}</CardTitle>
        <p className="text-xs text-muted-foreground">{labels.stepCounter(currentIndex + 1, totalSteps)}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>{step.content}</div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onPrevious} disabled={isFirst}>
            {labels.previous}
          </Button>
          <Button onClick={isLast ? onClose : onNext}>{isLast ? labels.finish : labels.next}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
