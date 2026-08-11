"use client";

import { Battery, BatteryFull, BatteryLow, BatteryMedium, PlusCircle } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Button, Separator, Tooltip, TooltipContent, TooltipTrigger } from "../../../../shadcnui";
import { useCurrentUserContext } from "../../../user/contexts";

interface TokenStatusIndicatorProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showExtraPages?: boolean;
}

/**
 * Credit balances are consumed fractionally server-side, so a raw balance reads
 * as noise in the UI ("999.48"). Every credit figure is shown as a whole number.
 *
 * Truncate rather than round: rounding 999.6 up to 1000 would advertise capacity
 * the company does not have. Truncation is used instead of Math.floor because a
 * balance can go negative (overdrawn extra credits), and floor(-1.09) is -2 —
 * which overstates the debt. trunc keeps it at -1 and matches floor for
 * non-negative values.
 */
const asWholeCredits = (value: number): string => Math.trunc(value).toLocaleString();

/**
 * TokenStatusIndicator displays the current status of available monthly and extra pages
 * using battery icons to represent the percentage of monthly pages remaining.
 *
 * Battery levels:
 * - BatteryFull: >75% available
 * - BatteryMedium: 25-75% available
 * - BatteryLow: 5-25% available
 * - Battery (empty): <5% available
 */
export function TokenStatusIndicator({ className, size = "md", showExtraPages = true }: TokenStatusIndicatorProps) {
  const { company } = useCurrentUserContext();
  const t = useTranslations();

  // Don't render if no company data
  if (!company) return null;

  const monthlyCredits = company.monthlyCredits;
  const availableMonthlyCredits = company.availableMonthlyCredits;
  const availableExtraCredits = company.availableExtraCredits;

  // Calculate percentage of available monthly pages
  const percentage = monthlyCredits > 0 ? (availableMonthlyCredits / monthlyCredits) * 100 : 0;

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const smallIconSizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const iconSize = sizeClasses[size];
  const smallIconSize = smallIconSizeClasses[size];
  const textSize = textSizeClasses[size];

  const getBatteryIcon = () => {
    if (percentage > 75) {
      return <BatteryFull className={cn(iconSize, "text-success")} />;
    } else if (percentage > 50) {
      return <BatteryMedium className={cn(iconSize, "text-success")} />;
    } else if (percentage >= 25) {
      return <BatteryLow className={cn(iconSize, "text-warning")} />;
    } else {
      return <Battery className={cn(iconSize, "text-destructive")} />;
    }
  };

  const getStatusColor = () => {
    if (percentage > 50) {
      return "text-success";
    } else if (percentage >= 25) {
      return "text-warning";
    } else {
      return "text-destructive";
    }
  };

  const tooltipContent = (
    <div className="flex flex-col gap-2 p-1">
      <div className="font-semibold text-sm">{t("billing.tokens.status", { defaultValue: "Page Status" })}</div>
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">
            {t("billing.tokens.monthly", { defaultValue: "Monthly Pages" })}:
          </span>
          <span className={cn("font-medium", getStatusColor())}>
            {asWholeCredits(availableMonthlyCredits)} / {asWholeCredits(monthlyCredits)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{t("billing.tokens.available", { defaultValue: "Available" })}:</span>
          <span className={cn("font-medium", getStatusColor())}>{percentage.toFixed(0)}%</span>
        </div>
        <Link href="/settings/billing?action=subscribe" className="w-full flex justify-end my-4">
          <Button variant="outline" size="sm">
            {t("billing.tokens.upgrade_plan", { defaultValue: "Upgrade plan" })}
          </Button>
        </Link>
        <Separator />
        <div className="flex items-center justify-between gap-4 pt-1 mt-1">
          <span className="text-muted-foreground">
            {t("billing.tokens.available_extra", { defaultValue: "Extra Pages" })}:
          </span>
          <span className="font-medium text-blue-500">{asWholeCredits(availableExtraCredits)}</span>
        </div>
        <Link href="/settings/billing?action=subscribe" className="w-full flex justify-end my-4">
          <Button variant="outline" size="sm">
            {t("billing.tokens.purchase_extra", { defaultValue: "Purchase additional analysis" })}
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <Tooltip>
      {/* The layout classes live on the trigger itself, which renders the
          <button>. Wrapping them in a nested inline-flex div instead makes that
          child sit on the button's text baseline, so the button reserves
          descender space below it and the icons render ~2px above the centre of
          any flex row the indicator is placed in (e.g. the app header). */}
      <TooltipTrigger
        className={cn("inline-flex items-center gap-1.5 cursor-default", className)}
        aria-label={t("billing.tokens.status", { defaultValue: "Page Status" })}
      >
        {getBatteryIcon()}
        <span className={cn(textSize, "text-muted-foreground font-medium leading-none")}>
          {asWholeCredits(availableMonthlyCredits)}
        </span>
        {showExtraPages && availableExtraCredits > 0 && (
          <span className="inline-flex items-center gap-0.5">
            <PlusCircle className={cn(smallIconSize, "text-blue-500")} />
            <span className={cn(textSize, "text-blue-500 font-medium leading-none")}>
              {asWholeCredits(availableExtraCredits)}
            </span>
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}
