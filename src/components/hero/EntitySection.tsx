"use client";

import { ReactNode } from "react";
import { cn } from "../../utils";

type EntitySectionProps = {
  title: string;
  columns?: 2 | 3 | 4;
  children: ReactNode;
  className?: string;
};

export function EntitySection({ title, columns, children, className }: EntitySectionProps) {
  return (
    <div className={cn("flex w-full flex-col gap-y-3", className)}>
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">{title}</h3>
      {columns ? (
        <div
          className={cn(
            "grid grid-cols-1 gap-4",
            columns === 2 && "md:grid-cols-2",
            columns === 3 && "md:grid-cols-3",
            columns === 4 && "md:grid-cols-4",
          )}
        >
          {children}
        </div>
      ) : (
        <div className="flex flex-col gap-y-4">{children}</div>
      )}
    </div>
  );
}
