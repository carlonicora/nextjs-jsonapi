import * as React from "react";
import { cn } from "../../utils/cn";

type SectionHeaderProps = React.ComponentProps<"h3"> & {
  level?: 2 | 3;
};

function SectionHeader({ level = 3, className, children, ...props }: SectionHeaderProps) {
  const Tag = level === 2 ? "h2" : "h3";
  return (
    <Tag data-slot="section-header" className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </Tag>
  );
}

export { SectionHeader };
export type { SectionHeaderProps };
