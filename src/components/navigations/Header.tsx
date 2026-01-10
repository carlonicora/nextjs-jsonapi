"use client";

import { getRoleId } from "@/roles";
import { RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSharedContext } from "../../contexts/SharedContext";
import { TokenStatusIndicator } from "../../features/company/components/details";
import { useCurrentUserContext } from "../../features/user/contexts";
import { Button, SidebarTrigger, Tooltip, TooltipContent, TooltipTrigger } from "../../shadcnui";
import { BreadcrumbNavigation } from "./Breadcrumb";

type HeaderProps = {
  children?: React.ReactNode;
};

export function Header({ children }: HeaderProps) {
  const t = useTranslations();
  const { breadcrumbs } = useSharedContext();
  const { company, hasRole, refreshUser, isRefreshing } = useCurrentUserContext();
  const showTokenStatus = !hasRole(getRoleId().Administrator) && company;

  return (
    <header className={`sticky top-0 z-10 flex h-12 flex-col items-center justify-start gap-x-4 border-b`}>
      <div className="bg-sidebar flex h-12 w-full flex-row items-center justify-between pl-2 pr-4">
        <SidebarTrigger aria-label="Toggle sidebar" />
        <div className="flex w-full flex-row items-center justify-start">
          <BreadcrumbNavigation items={breadcrumbs} />
        </div>
        <div className="flex w-64 flex-row items-center justify-end gap-x-4 whitespace-nowrap">
          <div className="flex flex-row items-center justify-end gap-x-4 whitespace-nowrap">
            {showTokenStatus && (
              <div className="flex items-center gap-x-2">
                <TokenStatusIndicator size="sm" showExtraPages={true} />
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => refreshUser()}
                        disabled={isRefreshing}
                        aria-label={t("common.refresh", { defaultValue: "Refresh" })}
                      />
                    }
                  >
                    <RefreshCwIcon className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t("common.refresh", { defaultValue: "Refresh" })}</TooltipContent>
                </Tooltip>
              </div>
            )}
            {children ? children : null}
          </div>
        </div>
      </div>
    </header>
  );
}
