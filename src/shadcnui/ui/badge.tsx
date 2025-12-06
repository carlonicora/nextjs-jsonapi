import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",

        blue: "border-transparent bg-sky-500 text-primary-foreground rounded-full",
        green: "border-transparent bg-emerald-500 text-primary-foreground rounded-full",
        red: "border-transparent bg-red-500 text-primary-foreground rounded-full",
        yellow: "border-transparent bg-yellow-500 text-primary-foreground rounded-full",
        purple: "border-transparent bg-purple-500 text-primary-foreground rounded-full",
        pink: "border-transparent bg-pink-500 text-primary-foreground rounded-full",
        gray: "border-transparent bg-gray-500 text-primary-foreground rounded-full",
        orange: "border-transparent bg-orange-500 text-primary-foreground rounded-full",
        teal: "border-transparent bg-teal-500 text-primary-foreground rounded-full",
        lime: "border-transparent bg-lime-500 text-primary-foreground rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
