"use client";

import { useIsMobile } from "@/utils";
import { useIsBreadcrumbRootHidden } from "../../contexts/BreadcrumbRootContext";
import { useHeaderRootLabel } from "../../contexts/HeaderChildrenContext";
import { useSharedContext } from "../../contexts/SharedContext";
import { SidebarTrigger, useOptionalSidebar } from "../../shadcnui";
import { BreadcrumbNavigation } from "./Breadcrumb";

type HeaderProps = {
  children?: React.ReactNode;
  /** Widgets kept on mobile, where there is no room for the full `children` set. */
  mobileChildren?: React.ReactNode;
  leftContent?: React.ReactNode;
  /** Rendered before everything else, on mobile only — where the sidebar (and its logo) is off-canvas. */
  logo?: React.ReactNode;
  className?: string;
  /**
   * Drop the sidebar toggle on mobile. Set by page shells that render the mobile
   * bottom bar, whose "Menu" slot opens the same drawer — two controls for one
   * drawer only cost header room on a phone. Desktop always keeps the toggle.
   */
  hideSidebarTriggerOnMobile?: boolean;
};

export function Header({
  children,
  mobileChildren,
  leftContent,
  logo,
  className,
  hideSidebarTriggerOnMobile,
}: HeaderProps) {
  const { breadcrumbs } = useSharedContext();
  const rootLabel = useHeaderRootLabel();
  const isRootHidden = useIsBreadcrumbRootHidden();
  const isMobile = useIsMobile();
  const sidebar = useOptionalSidebar();

  return (
    // Outer element owns the safe-area inset; the inner row keeps h-12 so the
    // content height is unchanged and only the notch padding is added above.
    // bg-sidebar: the outer element has no background of its own, and a padded
    // transparent strip would show scrolled content behind the status bar.
    // The fallback is MANDATORY in this package: other consumers (neural-erp)
    // never define --app-header-h, and a var() referencing an undefined
    // property invalidates the whole declaration. The fallback MUST include the
    // safe-area inset, because the padding below is unconditional: a consumer
    // that never defines the variable but does set viewportFit: "cover" would
    // otherwise get 3rem of height plus inset padding, squeezing the inner
    // h-12 row. (Tailwind arbitrary values need _ for spaces; CSS calc needs
    // whitespace around the +.)
    <header
      className={`bg-sidebar sticky top-0 z-10 flex h-[var(--app-header-h,calc(3rem_+_env(safe-area-inset-top)))] flex-col items-center justify-start gap-x-4 pt-[env(safe-area-inset-top)] ${className ?? ""}`}
    >
      <div className="bg-sidebar flex h-12 w-full flex-row items-center justify-between ps-2 pe-4">
        {isMobile && logo && <div className="flex shrink-0 flex-row items-center pe-1">{logo}</div>}
        {sidebar && !(isMobile && hideSidebarTriggerOnMobile) && (
          <SidebarTrigger aria-label="Toggle sidebar" id="sidebar-trigger" />
        )}
        {leftContent}
        <div className="flex w-full flex-row items-center justify-start max-md:min-w-0">
          <BreadcrumbNavigation items={breadcrumbs} rootLabel={rootLabel ?? undefined} showRoot={!isRootHidden} />
        </div>
        {isMobile
          ? mobileChildren && (
              <div className="flex shrink-0 flex-row items-center justify-end gap-x-2 whitespace-nowrap">
                {mobileChildren}
              </div>
            )
          : children && (
              // No fixed width: the widget slot sizes to its content and the
              // breadcrumb (w-full, above) takes the rest. A `w-64` cap here
              // clipped consumers whose widget set outgrew 256px.
              <div className="flex shrink-0 flex-row items-center justify-end gap-x-4 whitespace-nowrap">
                {children}
              </div>
            )}
      </div>
    </header>
  );
}
