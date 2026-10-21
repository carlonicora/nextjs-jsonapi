"use client";

import type { ReactNode } from "react";

export function EmptyCanvas({ children }: { children: ReactNode }) {
  return (
    <div className="text-muted-foreground flex h-full w-full items-center justify-center px-6 text-center text-sm">
      {children}
    </div>
  );
}
