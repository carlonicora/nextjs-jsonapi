"use client";

import { useHeaderChildren } from "../../contexts/HeaderChildrenContext";
import { useHeaderLeftContent } from "../../contexts/HeaderLeftContentContext";
import { useHeaderLogo } from "../../contexts/HeaderLogoContext";
import { cn } from "../../utils";
import { Header } from "../navigations";

type PageContainerProps = { children: React.ReactNode; testId?: string; className?: string };

export function PageContainer({ children, testId, className }: PageContainerProps) {
  const headerChildren = useHeaderChildren();
  const headerLeftContent = useHeaderLeftContent();
  const headerLogo = useHeaderLogo();

  return (
    <div className={`flex h-full w-full flex-col`} data-testid={testId}>
      <Header leftContent={headerLeftContent} logo={headerLogo}>
        {headerChildren}
      </Header>
      <main className={cn(`flex w-full flex-1 flex-col gap-y-4 pt-4 pl-4 pr-0`, className)}>{children}</main>
    </div>
  );
}
