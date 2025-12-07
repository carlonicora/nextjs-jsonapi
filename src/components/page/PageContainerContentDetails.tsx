"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { useUrlRewriter } from "../../hooks/url.rewriter";
import { ModuleWithPermissions } from "../../permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../shadcnui";

export type PageContainerItems = {
  title: string;
  content: ReactNode;
};

type PageContainerContentDetailsProps = {
  items: PageContainerItems[];
  section?: string;
  module: ModuleWithPermissions;
  id: string;
};

export function PageContainerContentDetails({ items, section, module, id }: PageContainerContentDetailsProps) {
  const rewriteUrl = useUrlRewriter();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Use IntersectionObserver to detect when content scrolls past the TabsList
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is not visible (scrolled past), show border
        setIsScrolled(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: "0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Tabs
      defaultValue={section || items[0].title}
      onValueChange={(a) => rewriteUrl({ page: module, id: id, childPage: a })}
    >
      {/* Sentinel element - invisible, used to detect scroll position */}
      <div ref={sentinelRef} className="h-0" />

      {/* Sticky TabsList with conditional border */}
      <div className={`bg-background sticky top-0 z-10 mb-2 pb-2 transition-shadow ${isScrolled ? "border-b" : ""}`}>
        <TabsList>
          {items.map((item) => (
            <TabsTrigger key={item.title} value={item.title}>
              {item.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <div className="pr-4">
        {items.map((item) => (
          <TabsContent key={item.title} value={item.title}>
            {item.content}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
