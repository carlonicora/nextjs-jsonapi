"use client";

import { ReactNode, useEffect, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../../shadcnui";
import { useIsMobile } from "../../utils";

type PageContentContainerProps = {
  details: ReactNode;
  footer?: ReactNode;
  content?: ReactNode;
};

export function PageContentContainer({ details, footer, content }: PageContentContainerProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isReady = mounted && isMobile !== undefined;

  if (!isReady) {
    return <div className="flex h-[calc(100vh-(--spacing(16)))] w-full" />;
  }

  return (
    <div className="flex h-[calc(100vh-(--spacing(16)))] w-full transition-opacity duration-150 animate-in fade-in">
      <ResizablePanelGroup
        direction={isMobile ? "vertical" : "horizontal"}
        className="items-stretch"
        autoSaveId={isMobile ? undefined : "page-content-layout"}
      >
        <ResizablePanel
          id="left-panel"
          defaultSize={isMobile ? 10 : 32}
          minSize={isMobile ? 10 : 20}
          maxSize={isMobile ? 90 : 40}
        >
          <div className={`@container flex h-full flex-col ${isMobile ? "pb-4" : "pr-4"}`}>
            <div className="flex-1 overflow-y-auto">{details}</div>

            {/* Sticky footer - always visible at bottom */}
            {footer && <div className="flex flex-col gap-y-2 pt-2 pb-2">{footer}</div>}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="right-panel" className={isMobile ? "pt-4" : "pl-4"}>
          <div className="h-full overflow-y-auto">{content}</div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
