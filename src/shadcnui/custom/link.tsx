"use client";

import * as React from "react";
import { getI18nLink } from "../../i18n";
import { cn } from "../../utils/cn";

// Create our custom Link props interface
// Note: We use 'any' for now since the actual Link is retrieved at runtime
export interface LinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({ className, href, children, ...props }, ref) => {
  // Get the configured next-intl Link component at runtime (after i18n is configured)
  const NextIntlLink = getI18nLink();
  return (
    <NextIntlLink prefetch={false} ref={ref} href={href} className={cn(`font-medium`, className)} {...props}>
      {children}
    </NextIntlLink>
  );
});

Link.displayName = "Link";

export { Link };
