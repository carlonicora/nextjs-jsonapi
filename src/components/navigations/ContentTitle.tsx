"use client";

import { ReactNode, useEffect, useState } from "react";
import { cn } from "../../utils";

type TitleProps = {
  type?: string | string[];
  element?: string;
  functions?: ReactNode;
  className?: string;
};

export function ContentTitle({ type, element, functions, className }: TitleProps) {
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
    <div className={cn(`mb-4 flex w-full flex-col`, className)}>
      {(type || isClient) && (
        <div className="flex flex-row items-center justify-between gap-x-4">
          {type && <div className={`text-muted-foreground text-xl font-light`}>{type}</div>}
          {isClient && clientFunctions && (
            <div className="flex flex-row items-center justify-start">{clientFunctions}</div>
          )}
        </div>
      )}
      <div className={`text-primary w-full text-3xl font-semibold`}>{element}</div>
    </div>
  );
}
