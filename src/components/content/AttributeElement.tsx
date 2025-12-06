"use client";

import { ReactElement } from "react";
import { cn } from "../../utils";

type AttributeElementProps = {
  inline?: boolean;
  title?: string | ReactElement<any>;
  value?: string | ReactElement<any>;
  className?: string;
};

export function AttributeElement({ inline, title, value, className }: AttributeElementProps) {
  return (
    <div className={cn(`flex ${inline === true ? "flex-row" : "flex-col"} my-1 justify-start`, className)}>
      {title && <div className={`${inline === true ? "min-w-48 pr-4" : "w-full"} text-sm font-semibold`}>{title}</div>}
      {value && <div className="flex w-full flex-col text-sm">{value}</div>}
    </div>
  );
}
