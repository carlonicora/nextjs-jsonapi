"use client";

import { useIsMobile } from "@/utils";
import { useHeaderRootLabel } from "../../contexts/HeaderChildrenContext";
import { useSharedContext } from "../../contexts/SharedContext";
import { SidebarTrigger } from "../../shadcnui";
import { BreadcrumbNavigation } from "./Breadcrumb";

type HeaderProps = {
  children?: React.ReactNode;
  /** Widgets kept on mobile, where there is no room for the full `children` set. */
  mobileChildren?: React.ReactNode;
  leftContent?: React.ReactNode;
  /** Rendered before everything else, on mobile only — where the sidebar (and its logo) is off-canvas. */
  logo?: React.ReactNode;
  className?: string;
};

export function Header({ children, mobileChildren, leftContent, logo, className }: HeaderProps) {
  const { breadcrumbs } = useSharedContext();
  const rootLabel = useHeaderRootLabel();
  const isMobile = useIsMobile();

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
      <div className="bg-sidebar flex h-12 w-full flex-row items-center justify-between pl-2 pr-4">
        {isMobile && logo && <div className="flex shrink-0 flex-row items-center pr-1">{logo}</div>}
        <SidebarTrigger aria-label="Toggle sidebar" id="sidebar-trigger" />
        {leftContent}
        <div className="flex w-full flex-row items-center justify-start">
          <BreadcrumbNavigation items={breadcrumbs} rootLabel={rootLabel ?? undefined} />
        </div>
        {isMobile
          ? mobileChildren && (
              <div className="flex shrink-0 flex-row items-center justify-end gap-x-2 whitespace-nowrap">
                {mobileChildren}
              </div>
            )
          : children && (
              <div className="flex w-64 flex-row items-center justify-end gap-x-4 whitespace-nowrap">
                <div className="flex flex-row items-center justify-end gap-x-4 whitespace-nowrap">{children}</div>
              </div>
            )}
      </div>
    </header>
  );
}
