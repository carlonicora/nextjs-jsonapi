"use client";

import { cn } from "../../utils";
import { Header } from "../navigations";

type PageContainerProps = { children: React.ReactNode; testId?: string; className?: string };

export function PageContainer({ children, testId, className }: PageContainerProps) {
  return (
    <div className={`flex h-full w-full flex-col`} data-testid={testId}>
      <Header />
      <main className={cn(`flex w-full flex-1 flex-col gap-y-4 pt-4 pl-4 pr-4 pb-20`, className)}>{children}</main>
    </div>
  );
}
