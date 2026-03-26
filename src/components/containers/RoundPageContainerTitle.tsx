"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@/components";
import { useSharedContext } from "@/contexts";
import { ModuleWithPermissions } from "@/permissions";
import { cn } from "@/utils";
import { PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react";
import { ReactNode } from "react";

type RoundPageContainerTitleProps = {
  module?: ModuleWithPermissions;
  details?: ReactNode;
  showDetails: boolean;
  setShowDetails: (show: boolean) => void;
  fullWidth?: boolean;
};

export function RoundPageContainerTitle({
  module,
  details,
  showDetails,
  setShowDetails,
}: RoundPageContainerTitleProps) {
  const { title } = useSharedContext();

  return (
    <div className="flex w-full flex-row items-center justify-between border-b p-4">
      <div className="flex w-full gap-x-4">
        <div className={"text-muted-foreground flex items-center gap-x-2 text-lg font-light whitespace-nowrap"}>
          {module && module.icon ? <module.icon className="text-primary h-6 w-6" /> : title.icon}
          {title.type}
        </div>
        <div className={cn("text-primary w-full text-xl font-semibold")}>{title.element}</div>
      </div>
      {(title.functions || details) && (
        <div className="flex gap-x-2">
          {title.functions}
          {details && (
            <Tooltip>
              <TooltipTrigger>
                <Button
                  render={<div />}
                  nativeButton={false}
                  variant={`ghost`}
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? (
                    <PanelRightCloseIcon className="text-muted-foreground" />
                  ) : (
                    <PanelRightOpenIcon className="text-accent" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showDetails ? "Hide details" : "Show details"}</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}
