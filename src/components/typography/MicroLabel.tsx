import * as React from "react";
import { cn } from "../../utils/cn";

type MicroLabelProps = React.ComponentProps<"h4"> & {
  as?: "h3" | "h4" | "span";
};

function MicroLabel({ as: Tag = "h4", className, children, ...props }: MicroLabelProps) {
  return (
    <Tag
      data-slot="micro-label"
      className={cn("text-muted-foreground text-xs font-semibold tracking-wider uppercase", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

export { MicroLabel };
export type { MicroLabelProps };
