"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Loader2Icon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";
import { useUiText } from "./use-ui-text";

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "size-3.5",
      default: "size-4",
      lg: "size-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

function Spinner({
  className,
  size,
  ...props
}: React.ComponentProps<typeof Loader2Icon> & VariantProps<typeof spinnerVariants>) {
  // An explicit `aria-label` in `props` is spread below and wins over this.
  const uiText = useUiText();
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label={uiText("ui.labels.loading", "Loading")}
      className={cn(spinnerVariants({ size, className }))}
      {...props}
    />
  );
}

export { Spinner, spinnerVariants };
