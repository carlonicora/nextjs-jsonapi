"use client";

import NextLink from "next/link";
import { cn } from "../../utils/cn";
import * as React from "react";

// Create our custom Link props interface that extends Next.js Link
export interface LinkProps extends React.ComponentPropsWithoutRef<typeof NextLink> {
  className?: string;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({ className, ...props }, ref) => {
  return <NextLink ref={ref} className={cn(`font-medium`, className)} {...props} />;
});

Link.displayName = "Link";

export { Link };
