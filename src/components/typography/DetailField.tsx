import * as React from "react";
import { cn } from "../../utils/cn";

type DetailFieldProps = React.ComponentProps<"div"> & {
  label: string;
  value?: React.ReactNode;
  horizontal?: boolean;
  labelWidth?: string;
  /** Extra classes for the value element (e.g. "min-w-0 flex-1 break-words" so long values wrap in a horizontal row). */
  valueClassName?: string;
};

function DetailField({
  label,
  value,
  horizontal = false,
  labelWidth,
  valueClassName,
  className,
  children,
  ...props
}: DetailFieldProps) {
  return (
    <div
      data-slot="detail-field"
      className={cn(horizontal ? "flex items-baseline gap-2" : "flex flex-col gap-0.5", className)}
      {...props}
    >
      <span className={cn("text-muted-foreground text-xs", horizontal && labelWidth && cn("shrink-0", labelWidth))}>
        {label}
      </span>
      <div className={cn("text-sm", valueClassName)}>{value ?? children}</div>
    </div>
  );
}

export { DetailField };
export type { DetailFieldProps };
