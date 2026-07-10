"use client";

import { ReactNode } from "react";
import { cn } from "../../utils";

type EntityHeroLayoutProps = {
  children: ReactNode;
  className?: string;
};

export function EntityHeroLayout({ children, className }: EntityHeroLayoutProps) {
  return <div className={cn("flex w-full flex-col gap-y-8", className)}>{children}</div>;
}
