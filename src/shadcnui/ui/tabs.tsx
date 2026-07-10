"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { createContext, useContext, useState } from "react";

import { cn } from "@/lib/utils";

// Tracks the active tab value so keepMounted panels can lazy-mount on first
// activation. undefined = untracked (Tabs given neither value nor defaultValue).
const TabsActiveValueContext = createContext<unknown>(undefined);

function Tabs({
  className,
  orientation = "horizontal",
  value,
  defaultValue,
  onValueChange,
  ...props
}: TabsPrimitive.Root.Props) {
  const [uncontrolledValue, setUncontrolledValue] = useState<unknown>(defaultValue);
  const activeValue = value !== undefined ? value : uncontrolledValue;

  return (
    <TabsActiveValueContext.Provider value={activeValue}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        className={cn("gap-2 group/tabs flex data-[orientation=horizontal]:flex-col", className)}
        value={value}
        defaultValue={defaultValue}
        onValueChange={(newValue, eventDetails) => {
          setUncontrolledValue(newValue);
          onValueChange?.(newValue, eventDetails);
        }}
        {...props}
      />
    </TabsActiveValueContext.Provider>
  );
}

const tabsListVariants = cva(
  "rounded-lg p-[3px] group-data-horizontal/tabs:h-8 data-[variant=line]:rounded-none group/tabs-list text-muted-foreground inline-flex w-fit items-center justify-center group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-xs font-medium group-data-vertical/tabs:py-[calc(--spacing(1.25))] [&_svg:not([class*='size-'])]:size-3.5 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring text-foreground/60 hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center whitespace-nowrap transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background dark:data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 data-active:text-foreground",
        "after:bg-foreground after:absolute after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:bottom-[-5px] group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, value, keepMounted, children, ...props }: TabsPrimitive.Panel.Props) {
  const activeValue = useContext(TabsActiveValueContext);
  const isActive = activeValue !== undefined && activeValue === value;
  const [hasBeenActive, setHasBeenActive] = useState(isActive);
  if (isActive && !hasBeenActive) setHasBeenActive(true);

  // Lazy-mount-once: a keepMounted panel renders its children only after its
  // tab has been active at least once, then keeps them mounted so state and
  // data survive tab switches (hidden panels no longer fetch on page load).
  // Falls back to eager rendering when the active value is untracked.
  const shouldRenderChildren = !keepMounted || activeValue === undefined || hasBeenActive;

  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      value={value}
      keepMounted={keepMounted}
      className={cn("text-xs/relaxed flex-1 outline-none", className)}
      {...props}
    >
      {shouldRenderChildren ? children : null}
    </TabsPrimitive.Panel>
  );
}

export { Tabs, TabsContent, TabsList, tabsListVariants, TabsTrigger };
