"use client";

import { Header } from "../navigation";

type PageContainerProps = { children: React.ReactNode; testId?: string };

export function PageContainer({ children, testId }: PageContainerProps) {
  return (
    <div className="flex h-full w-full flex-col" data-testid={testId}>
      <Header />
      <main className={`flex min-h-[calc(100vh_-_theme(spacing.48))] w-full flex-col gap-y-4 p-4`}>{children}</main>
    </div>
  );
}
