"use client";

import { ComponentType, ReactNode } from "react";
import { cn } from "../../utils";

type EntityHeroMetaRowProps = {
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
};

export function EntityHeroMetaRow({ icon: Icon, children, className }: EntityHeroMetaRowProps) {
  return (
    <div className={cn("text-muted-foreground flex items-center gap-x-2 text-sm", className)}>
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {children}
    </div>
  );
}
