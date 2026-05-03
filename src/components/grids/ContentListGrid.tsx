"use client";
import "../../client";

import { cn } from "@/index";
import { ComponentType, ReactNode, useEffect, useRef } from "react";
import { DataListRetriever } from "../../hooks";
import { ModuleWithPermissions } from "../../permissions";
import { ContentTableSearch } from "../tables/ContentTableSearch";

const DEFAULT_GRID_CLASSES = "grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

export type ContentListGridProps<T> = {
  title?: string;
  data: DataListRetriever<T>;
  /** Module identity — used for the header icon and consistency with ContentListTable. */
  tableGeneratorType: ModuleWithPermissions;
  /** Renders one cell per item. The component receives `{ item }`. */
  ItemComponent: ComponentType<{ item: T }>;
  functions?: ReactNode;
  filters?: ReactNode;
  /** Default false; when true, renders ContentTableSearch in the header. */
  allowSearch?: boolean;
  /** Drops the rounded outer border, matching ContentListTable's fullWidth behaviour. */
  fullWidth?: boolean;
  /** Replaces the default responsive grid classes entirely when set. */
  gridClassName?: string;
};

export function ContentListGrid<T>(props: ContentListGridProps<T>) {
  const { data, ItemComponent, allowSearch, fullWidth, gridClassName } = props;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data.next || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) data.next?.();
      },
      { threshold: 0.1, rootMargin: "200px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [data.next]);

  return (
    <div className="flex w-full flex-col">
      <div className={cn("overflow-clip", fullWidth ? "" : "rounded-md border")}>
        {props.title !== undefined && (
          <div className="bg-card text-primary flex items-center justify-between gap-x-2 rounded-t-lg border-b p-4 font-bold">
            <div className="w-full">
              <div
                className={cn(
                  "text-muted-foreground flex items-center gap-x-2 font-light whitespace-nowrap",
                  fullWidth ? "text-lg" : "text-sm",
                )}
              >
                {props.tableGeneratorType.icon && (
                  <props.tableGeneratorType.icon className={cn("text-primary", fullWidth ? "h-6 w-6" : "h-4 w-4")} />
                )}
                {props.title}
              </div>
            </div>
            {(props.functions || props.filters || allowSearch) && (
              <>
                {props.functions}
                {props.filters}
                {allowSearch && <ContentTableSearch data={data} />}
              </>
            )}
          </div>
        )}
        {data.data && data.data.length > 0 ? (
          <div className={gridClassName ?? DEFAULT_GRID_CLASSES}>
            {data.data.map((item) => {
              const id = (item as unknown as { id: string }).id;
              return <ItemComponent key={id} item={item} />;
            })}
          </div>
        ) : (
          <div className="text-muted-foreground p-8 text-center text-sm">No results.</div>
        )}
        {data.next && <div ref={sentinelRef} style={{ height: 1 }} />}
      </div>
    </div>
  );
}
