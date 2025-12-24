"use client";

import { ReactNode, useEffect, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../../shadcnui";

type PageContentContainerProps = {
  details: ReactNode;
  footer?: ReactNode;
  content?: ReactNode;
};

export function PageContentContainer({ details, footer, content }: PageContentContainerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`flex h-[calc(100vh-(--spacing(16)))] w-full transition-opacity duration-150 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      <ResizablePanelGroup direction="horizontal" className="items-stretch" autoSaveId="page-content-layout">
        <ResizablePanel id="left-panel" defaultSize={32} minSize={20} maxSize={40}>
          <div className="@container flex h-full flex-col pr-4">
            <div className="flex-1 overflow-y-auto">{details}</div>

            {/* Sticky footer - always visible at bottom */}
            {footer && <div className="flex flex-col gap-y-2 pt-2 pb-2">{footer}</div>}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="right-panel" className="pl-4">
          <div className="h-full overflow-y-auto">{content}</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
