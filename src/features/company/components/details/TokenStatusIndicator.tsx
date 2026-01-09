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

  const monthlyTokens = company.monthlyTokens;
  const availableMonthlyTokens = company.availableMonthlyTokens;
  const availableExtraTokens = company.availableExtraTokens;

  // Calculate percentage of available monthly pages
  const percentage = monthlyTokens > 0 ? (availableMonthlyTokens / monthlyTokens) * 100 : 0;

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
      return <BatteryFull className={cn(iconSize, "text-green-500")} />;
    } else if (percentage >= 25) {
      return <BatteryMedium className={cn(iconSize, "text-yellow-500")} />;
    } else if (percentage >= 5) {
      return <BatteryLow className={cn(iconSize, "text-orange-500")} />;
    } else {
      return <Battery className={cn(iconSize, "text-destructive")} />;
    }
  };

  const getStatusColor = () => {
    if (percentage > 75) {
      return "text-green-500";
    } else if (percentage >= 25) {
      return "text-yellow-500";
    } else if (percentage >= 5) {
      return "text-orange-500";
    } else {
      return "text-destructive";
    }
  };

  const tooltipContent = (
    <div className="flex flex-col gap-2 p-1">
      <div className="font-semibold text-sm">{t("generic.tokens.status", { defaultValue: "Page Status" })}</div>
      <div className="flex flex-col gap-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">
            {t("generic.tokens.monthly", { defaultValue: "Monthly Pages" })}:
          </span>
          <span className={cn("font-medium", getStatusColor())}>
            {availableMonthlyTokens} / {monthlyTokens}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{t("generic.tokens.available", { defaultValue: "Available" })}:</span>
          <span className={cn("font-medium", getStatusColor())}>{percentage.toFixed(0)}%</span>
        </div>
        <Link href="/settings/billing?action=subscribe" className="w-full flex justify-end my-4">
          <Button variant="outline" size="sm">
            {t("generic.tokens.upgrade_plan", { defaultValue: "Upgrade plan" })}
          </Button>
        </Link>
        <Separator />
        <div className="flex items-center justify-between gap-4 pt-1 mt-1">
          <span className="text-muted-foreground">
            {t("generic.tokens.available_extra", { defaultValue: "Extra Pages" })}:
          </span>
          <span className="font-medium text-blue-500">{availableExtraTokens}</span>
        </div>
        <Link href="/settings/billing?action=subscribe" className="w-full flex justify-end my-4">
          <Button variant="outline" size="sm">
            {t("generic.tokens.purchase_extra", { defaultValue: "Purchase additional analysis" })}
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger>
        <div
          className={cn("inline-flex items-center gap-1.5 cursor-default", className)}
          aria-label={t("generic.tokens.status", { defaultValue: "Page Status" })}
        >
          {getBatteryIcon()}
          <span className={cn(textSize, "text-muted-foreground font-medium")}>{availableMonthlyTokens}</span>
          {showExtraPages && availableExtraTokens > 0 && (
            <div className="inline-flex items-center gap-0.5">
              <PlusCircle className={cn(smallIconSize, "text-blue-500")} />
              <span className={cn(textSize, "text-blue-500 font-medium")}>{availableExtraTokens}</span>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  );
}
