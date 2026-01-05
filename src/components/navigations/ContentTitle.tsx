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
};

export function ContentTitle({ module, type, element, functions, className }: TitleProps) {
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
    <div className={cn(`mb-4 flex items-center justify-between gap-x-4 w-full`, className)}>
      <div className="flex flex-col w-full">
        {type && (
          <div className={`text-muted-foreground text-xl font-light flex gap-x-2 items-center`}>
            {module && module.icon && <module.icon className="w-5 h-5 inline-block" />}
            {type}
          </div>
        )}
        <div className={`text-primary w-full text-3xl font-semibold`}>{element}</div>
      </div>
      {isClient && clientFunctions && <div className="flex flex-row items-center justify-start">{clientFunctions}</div>}
    </div>
  );
}
