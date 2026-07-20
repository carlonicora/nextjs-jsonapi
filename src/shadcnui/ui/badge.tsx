import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "h-5 gap-1 rounded-full border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&>svg]:size-2.5! inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-colors overflow-hidden group/badge",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 [a]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground bg-input/20 dark:bg-input/30",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary",
        warning: "bg-warning text-warning-foreground [a]:hover:bg-warning/80",
        softGreen: "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-400",
        softRed: "bg-red-500/10 text-red-700 dark:bg-red-500/15 dark:text-red-400",
        softBlue: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
        softYellow: "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400",
        softGray: "bg-gray-500/10 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400",
        softOrange: "bg-orange-500/10 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
        softAmber: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
        blue: "bg-sky-500 text-primary-foreground [a]:hover:bg-sky-500/80",
        green: "bg-emerald-500 text-primary-foreground [a]:hover:bg-emerald-500/80",
        red: "bg-red-500 text-primary-foreground [a]:hover:bg-red-500/80",
        yellow: "bg-yellow-500 text-primary-foreground [a]:hover:bg-yellow-500/80",
        purple: "bg-purple-500 text-primary-foreground [a]:hover:bg-purple-500/80",
        pink: "bg-pink-500 text-primary-foreground [a]:hover:bg-pink-500/80",
        gray: "bg-gray-500 text-primary-foreground [a]:hover:bg-gray-500/80",
        orange: "bg-orange-500 text-primary-foreground [a]:hover:bg-orange-500/80",
        teal: "bg-teal-500 text-primary-foreground [a]:hover:bg-teal-500/80",
        lime: "bg-lime-500 text-primary-foreground [a]:hover:bg-lime-500/80",
        none: "border-input bg-transparent text-muted-foreground min-w-20 min-h-5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ className, variant })),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

type BadgeProps = useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export { Badge, badgeVariants };
export type { BadgeProps };
