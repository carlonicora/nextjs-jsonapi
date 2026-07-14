"use client";

import { ReactNode } from "react";
import { cn } from "../../utils";

type EntityHeroProps = {
  avatar?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function EntityHero({ avatar, children, className }: EntityHeroProps) {
  return (
    <div className={cn("flex items-start gap-x-6", className)}>
      {avatar}
      <div className="flex flex-col gap-y-2">{children}</div>
    </div>
  );
}
