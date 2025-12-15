"use client";

import { useSharedContext } from "../../contexts/SharedContext";
import { SidebarTrigger } from "../../shadcnui";
import { BreadcrumbNavigation } from "./Breadcrumb";

type HeaderProps = {
  children?: React.ReactNode;
};

export function Header({ children }: HeaderProps) {
  const { breadcrumbs } = useSharedContext();

  return (
    <header className={`sticky top-0 z-10 flex h-12 flex-col items-center justify-start gap-x-4 border-b`}>
      <div className="bg-sidebar flex h-12 w-full flex-row items-center justify-between pl-2 pr-4">
        <SidebarTrigger aria-label="Toggle sidebar" />
        <div className="flex w-full flex-row items-center justify-start">
          <BreadcrumbNavigation items={breadcrumbs} />
        </div>
        <div className="flex w-64 flex-row items-center justify-end gap-x-4 whitespace-nowrap">
          {children ? children : null}
        </div>
      </div>
    </header>
  );
}
