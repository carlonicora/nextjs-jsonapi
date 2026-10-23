"use client";

import { ReactNode, useEffect, useState } from "react";
import { ModuleWithPermissions } from "../../permissions";
import { cn } from "../../utils";

type TitleProps = {
  type?: string | string[];
  element?: string;
  functions?: ReactNode;
  className?: string;
  module?: ModuleWithPermissions;
  prioritizeFunctions?: boolean;
  /** Renders the title line as a real heading (public SEO pages). Omitted: a plain div, as before. */
  headingLevel?: 1 | 2;
};

export function ContentTitle({
  module,
  type,
  element,
  functions,
  className,
  prioritizeFunctions,
  headingLevel,
}: TitleProps) {
  const ElementTag = headingLevel === 1 ? "h1" : headingLevel === 2 ? "h2" : "div";
  const [clientFunctions, setClientFunctions] = useState<ReactNode>(null);
  const [isClient, setIsClient] = useState(false);

  // Defer function rendering to client-side only to prevent hydration mismatches
  // caused by Radix UI's dynamic ID generation in Dialog/AlertDialog components
  useEffect(() => {
    setIsClient(true);
    setClientFunctions(functions);
  }, [functions]);

  if (!element) return null;

  return (
    <div className={cn(`mb-4 flex items-start justify-between gap-x-4 w-full`, className)}>
      {/* Title section - shrinks when prioritizeFunctions is true */}
      <div className={cn("flex flex-col", prioritizeFunctions ? "min-w-0 shrink" : "w-full")}>
        {/* Type label - never shrinks (stays visible as minimum) */}
        {type && (
          <div
            className={cn(
              "text-muted-foreground text-xl font-light flex gap-x-2 items-center",
              prioritizeFunctions && "shrink-0 whitespace-nowrap",
            )}
          >
            {module && module.icon && <module.icon className="w-5 h-5 inline-block shrink-0" />}
            {type}
          </div>
        )}
        {/* Element (name) - truncates with ellipsis when space is limited */}
        <ElementTag className={cn("text-primary text-3xl font-semibold", prioritizeFunctions ? "truncate" : "w-full")}>
          {element}
        </ElementTag>
      </div>
      {/* Functions section - doesn't shrink when prioritizeFunctions is true */}
      {isClient && clientFunctions && (
        <div className={cn("flex flex-row items-center justify-start", prioritizeFunctions && "shrink-0")}>
          {clientFunctions}
        </div>
      )}
    </div>
  );
}
