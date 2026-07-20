"use client";

import { useIsMobile } from "@/utils";
import { useHeaderRootLabel } from "../../contexts/HeaderChildrenContext";
import { useSharedContext } from "../../contexts/SharedContext";
import { SidebarTrigger } from "../../shadcnui";
import { BreadcrumbNavigation } from "./Breadcrumb";

type HeaderProps = {
  children?: React.ReactNode;
  leftContent?: React.ReactNode;
  /** Rendered before everything else, on mobile only — where the sidebar (and its logo) is off-canvas. */
  logo?: React.ReactNode;
  className?: string;
};

export function Header({ children, leftContent, logo, className }: HeaderProps) {
  const { breadcrumbs } = useSharedContext();
  const rootLabel = useHeaderRootLabel();
  const isMobile = useIsMobile();

  return (
    <header className={`sticky top-0 z-10 flex h-12 flex-col items-center justify-start gap-x-4 ${className ?? ""}`}>
      <div className="bg-sidebar flex h-12 w-full flex-row items-center justify-between pl-2 pr-4">
        {isMobile && logo && <div className="flex shrink-0 flex-row items-center pr-1">{logo}</div>}
        <SidebarTrigger aria-label="Toggle sidebar" id="sidebar-trigger" />
        {leftContent}
        <div className="flex w-full flex-row items-center justify-start">
          <BreadcrumbNavigation items={breadcrumbs} rootLabel={rootLabel ?? undefined} />
        </div>
        {!isMobile && children && (
          <div className="flex w-64 flex-row items-center justify-end gap-x-4 whitespace-nowrap">
            <div className="flex flex-row items-center justify-end gap-x-4 whitespace-nowrap">{children}</div>
          </div>
        )}
      </div>
    </header>
  );
}
