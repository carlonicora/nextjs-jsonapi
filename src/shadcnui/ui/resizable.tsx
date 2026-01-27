"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full",
        // v4 uses aria-orientation instead of data-panel-group-direction
        "aria-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  );
}

function ResizablePanel({ ...props }: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        "bg-border relative flex items-center justify-center",
        "focus-visible:ring-ring focus-visible:ring-1 focus-visible:ring-offset-1",
        // v4: Separator aria-orientation is OPPOSITE of Group orientation
        // Group horizontal → Separator vertical (vertical line between left/right panels)
        // Group vertical → Separator horizontal (horizontal line between top/bottom panels)
        "aria-[orientation=vertical]:h-full aria-[orientation=vertical]:w-px",
        "aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full",
        // Hit area for dragging (wider than visible line)
        "after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:-translate-x-1/2",
        "aria-[orientation=vertical]:after:inset-y-0 aria-[orientation=vertical]:after:w-3",
        "aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:h-3 aria-[orientation=horizontal]:after:inset-y-auto",
        // Rotate grip icon for horizontal separator
        "[&[aria-orientation=horizontal]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-sm border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizablePrimitive.Separator>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
