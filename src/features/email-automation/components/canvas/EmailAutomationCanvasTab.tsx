"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { useEffect } from "react";
import { useSidebar } from "../../../../shadcnui";
import { EmailAutomationCanvas } from "./EmailAutomationCanvas";

export function EmailAutomationCanvasTab() {
  const { open, setOpen } = useSidebar();

  // Performance mode: collapse the app sidebar on mount; restore on unmount.
  // Mirrors the app's ScenarioCanvasPage shell.
  useEffect(() => {
    const prev = open;
    if (prev) setOpen(false);
    return () => {
      if (prev) setOpen(true);
    };
  }, []);

  return (
    <main className="flex h-full w-full overflow-hidden">
      {/* The canvas column keeps `relative` so CanvasToolbar's absolute
          positioning anchors to the canvas, not to the whole row. */}
      <div className="relative h-full min-w-0 flex-1">
        <ReactFlowProvider>
          <EmailAutomationCanvas />
        </ReactFlowProvider>
      </div>
    </main>
  );
}
