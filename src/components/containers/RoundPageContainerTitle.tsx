"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@/components";
import { ActionBarProvider, useSharedContext } from "@/contexts";
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

  // A Tooltip on the toggle stays stuck on screen after a tap, so a phone gets
  // the bare button. The aria-label carries the same text the tooltip shows,
  // since the icon alone does not name the control.
  const detailsLabel = `${showDetails ? "Hide" : "Show"} ${typeof detailsTitle === "string" ? detailsTitle : "details"}`;
  const detailsToggle = details ? (
    isMobile ? (
      <Button
        data-help="page.details"
        variant={showDetails ? `ghost` : `default`}
        onClick={() => setShowDetails(!showDetails)}
        aria-label={detailsLabel}
        className="shrink-0"
      >
        {detailsIcon ?? <InfoIcon />}
      </Button>
    ) : (
      <Tooltip>
        {/* render prop, not a Button nested inside the trigger: the trigger
            renders its own <button>, and a button inside a button is invalid. */}
        <TooltipTrigger
          render={
            <Button
              data-help="page.details"
              variant={showDetails ? `ghost` : `default`}
              onClick={() => setShowDetails(!showDetails)}
              aria-label={detailsLabel}
              className={cn(`cursor-pointer`)}
            />
          }
        >
          {detailsIcon ?? <InfoIcon />}
        </TooltipTrigger>
        <TooltipContent>
          {showDetails ? "Hide" : "Show"} {detailsTitle ?? "details"}
        </TooltipContent>
      </Tooltip>
    )
  ) : null;

  return (
    <div className="flex w-full flex-col border-b">
      {isMobile ? (
        // Phone: "type · name" on one truncated line with the details toggle
        // beside it; the page controls drop to their own wrapping line below,
        // so they can never push the page wider than the screen.
        <div className={cn(`flex w-full flex-col gap-y-2 p-4`, HEADER_ROW_MIN_H)}>
          <div className="flex w-full min-w-0 items-center justify-between gap-x-2">
            <div className="text-muted-foreground flex min-w-0 items-center gap-x-2 text-base font-light">
              {title.titleActions}
              {module && module.icon ? <module.icon className="text-primary h-5 w-5 shrink-0" /> : title.icon}
              <span className="truncate">
                {title.type}
                {title.element && (
                  <>
                    <span aria-hidden> · </span>
                    <span className="text-primary font-semibold">{title.element}</span>
                  </>
                )}
              </span>
            </div>
            {detailsToggle}
          </div>
          {title.functions && (
            <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2">{title.functions}</div>
          )}
        </div>
      ) : (
        <div className={cn(`flex w-full flex-row items-center gap-x-2 p-4 justify-between`, HEADER_ROW_MIN_H)}>
          <div className="flex w-full gap-x-4">
            <div className={"text-muted-foreground flex items-center gap-x-2 text-lg font-light whitespace-nowrap"}>
              {title.titleActions}
              {module && module.icon ? <module.icon className="text-primary h-6 w-6" /> : title.icon}
              {title.type}
            </div>
            <div className={cn("text-primary w-full text-xl font-semibold")}>{title.element}</div>
          </div>
          {(title.functions || details) && (
            <div className="flex shrink-0 items-center gap-x-2">
              {title.functions}
              {detailsToggle}
            </div>
          )}
        </div>
      )}
      {title.actionBar && (
        <div
          data-testid="round-page-action-bar"
          data-help="page.action-bar"
          className="flex w-full items-center gap-x-2 border-t px-4 py-2 max-md:flex-wrap max-md:gap-y-2"
        >
          {/* The bar is the page's command row, so the commands inside it label
              themselves ("Edit", "Delete") instead of rendering the bare glyph
              they use in a table row. See ActionBarContext. */}
          <ActionBarProvider value={true}>{title.actionBar}</ActionBarProvider>
        </div>
      )}
    </div>
  );
}
