"use client";

import { ReactNode, useEffect, useState } from "react";
import { useDefaultLayout } from "react-resizable-panels";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../../shadcnui";
import { cn, useIsMobile } from "../../utils";

type PageContentContainerProps = {
  header?: ReactNode;
  details?: ReactNode;
  footer?: ReactNode;
  content?: ReactNode;
  fullBleed?: boolean;
};

export function PageContentContainer({ header, details, footer, content, fullBleed }: PageContentContainerProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isReady = mounted && isMobile !== undefined;

  // Create layout ID based on device type for separate persistence
  const layoutId = `page-content-container-${isMobile ? "mobile" : "desktop"}`;

  // v4 useDefaultLayout hook for localStorage persistence
  // Returns saved layout and callback to save changes
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: layoutId,
    panelIds: ["left-panel", "right-panel"],
    storage: typeof window !== "undefined" ? localStorage : undefined,
  });

  if (!isReady) {
    return <div className="flex h-[calc(100vh-4rem)] w-full flex-col" />;
  }

  // v4 CRITICAL: Use STRING percentages for Panel defaultSize, not numbers!
  // Numbers are interpreted as PIXELS in v4
  const leftPanelDefaultSize = isMobile ? "10%" : "32%";
  const leftPanelMinSize = isMobile ? "10%" : "20%";
  const leftPanelMaxSize = isMobile ? "90%" : "40%";
  const rightPanelDefaultSize = isMobile ? "90%" : "68%";

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col transition-opacity duration-150 animate-in fade-in">
      {header && <div className="mb-4 flex w-full shrink-0 border-b pr-4">{header}</div>}
      <div className="min-h-0 flex-1">
        {details || footer ? (
          <ResizablePanelGroup
            orientation={isMobile ? "vertical" : "horizontal"}
            className="h-full"
            defaultLayout={defaultLayout}
            onLayoutChanged={onLayoutChanged}
          >
            <ResizablePanel
              id="left-panel"
              defaultSize={leftPanelDefaultSize}
              minSize={leftPanelMinSize}
              maxSize={leftPanelMaxSize}
            >
              <div className={`@container flex h-full flex-col ${isMobile ? "pb-4" : "pr-4"}`}>
                <div className="flex-1 overflow-y-auto">{details}</div>
                {footer && <div className="flex flex-col gap-y-2 pt-2 pb-2">{footer}</div>}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              id="right-panel"
              defaultSize={rightPanelDefaultSize}
              className={cn("w-full", isMobile ? "pt-4" : "")}
            >
              <div className={cn("h-full overflow-x-hidden overflow-y-auto", fullBleed ? "" : "px-4 pb-20")}>
                {content}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className={cn("h-full overflow-x-hidden overflow-y-auto", fullBleed ? "" : "px-4 pb-20")}>{content}</div>
        )}
      </div>
    </div>
  );
}
