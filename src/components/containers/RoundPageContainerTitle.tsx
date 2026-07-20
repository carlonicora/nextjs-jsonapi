"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@/components";
import { useSharedContext } from "@/contexts";
import { ModuleWithPermissions } from "@/permissions";
import { cn, useIsMobile } from "@/utils";
import { InfoIcon } from "lucide-react";
import { ReactNode } from "react";

/**
 * Shared height floor for the card's top row. Applied BOTH here and to the
 * `details` panel header in RoundPageContainer, so the two line up across the
 * card's top edge. Expressed in px on purpose: the app scales its root
 * font-size (14px), so a rem value would drift between the two rows.
 */
export const HEADER_ROW_MIN_H = "min-h-[53px]";

type RoundPageContainerTitleProps = {
  module?: ModuleWithPermissions;
  details?: ReactNode;
  /** Names what the toggle reveals, so the control is not an unlabelled icon. */
  detailsTitle?: ReactNode;
  /** Overrides the default info glyph — see `RoundPageContainer.detailsIcon`. */
  detailsIcon?: ReactNode;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
  fullWidth?: boolean;
};

export function RoundPageContainerTitle({
  module,
  details,
  detailsTitle,
  detailsIcon,
  showDetails,
  setShowDetails,
}: RoundPageContainerTitleProps) {
  const { title } = useSharedContext();
  const isMobile = useIsMobile();

  return (
    <div className="flex w-full flex-col border-b">
      <div className={cn(`flex w-full flex-row items-center gap-x-2 p-4 justify-between`, HEADER_ROW_MIN_H)}>
        {!isMobile ? (
          <div className="flex w-full gap-x-4">
            <div className={"text-muted-foreground flex items-center gap-x-2 text-lg font-light whitespace-nowrap"}>
              {title.titleActions}
              {module && module.icon ? <module.icon className="text-primary h-6 w-6" /> : title.icon}
              {title.type}
            </div>
            <div className={cn("text-primary w-full text-xl font-semibold")}>{title.element}</div>
          </div>
        ) : (
          <div className="text-muted-foreground flex min-w-0 items-center gap-x-2 text-base font-light">
            {title.titleActions}
            {module && module.icon ? <module.icon className="text-primary h-5 w-5 shrink-0" /> : title.icon}
            <span className="truncate">{title.type}</span>
          </div>
        )}
        {(title.functions || details) && (
          <div className="flex shrink-0 items-center gap-x-2">
            {title.functions}
            {details && (
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    render={<div />}
                    nativeButton={false}
                    variant={showDetails ? `ghost` : `default`}
                    onClick={() => setShowDetails(!showDetails)}
                    className={cn(`cursor-pointer`)}
                  >
                    {detailsIcon ?? <InfoIcon />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showDetails ? "Hide" : "Show"} {detailsTitle ?? "details"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
      {title.actionBar && (
        <div data-testid="round-page-action-bar" className="flex w-full items-center border-t px-4 py-2">
          {title.actionBar}
        </div>
      )}
    </div>
  );
}
