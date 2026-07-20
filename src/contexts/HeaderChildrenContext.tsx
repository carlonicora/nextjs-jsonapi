"use client";

import { createContext, useContext, ReactNode } from "react";

interface HeaderChildrenContextType {
  headerChildren: ReactNode | null;
  headerRootLabel: string | null;
}

const HeaderChildrenContext = createContext<HeaderChildrenContextType>({
  headerChildren: null,
  headerRootLabel: null,
});

interface HeaderChildrenProviderProps {
  children: ReactNode;
  content: ReactNode;
  rootLabel?: string;
}

/**
 * Provider to supply custom content to be rendered in the Header component.
 * Wrap your layout with this provider and pass the content you want in the header.
 * Optionally pass `rootLabel` to override the first breadcrumb entry (defaults to `common.home`).
 */
export function HeaderChildrenProvider({ children, content, rootLabel }: HeaderChildrenProviderProps) {
  return (
    <HeaderChildrenContext.Provider value={{ headerChildren: content, headerRootLabel: rootLabel ?? null }}>
      {children}
    </HeaderChildrenContext.Provider>
  );
}

/**
 * Hook to get the header children content from context.
 * Used internally by PageContainer to pass children to Header.
 */
export function useHeaderChildren(): ReactNode | null {
  const context = useContext(HeaderChildrenContext);
  return context.headerChildren;
}

/**
 * Hook to get the label of the first breadcrumb entry, when the application supplies one.
 * Returns null when no override was provided, in which case the Header falls back to `common.home`.
 */
export function useHeaderRootLabel(): string | null {
  const context = useContext(HeaderChildrenContext);
  return context.headerRootLabel;
}
