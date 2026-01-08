"use client";

import { createContext, useContext, ReactNode } from "react";

interface HeaderChildrenContextType {
  headerChildren: ReactNode | null;
}

const HeaderChildrenContext = createContext<HeaderChildrenContextType>({
  headerChildren: null,
});

interface HeaderChildrenProviderProps {
  children: ReactNode;
  content: ReactNode;
}

/**
 * Provider to supply custom content to be rendered in the Header component.
 * Wrap your layout with this provider and pass the content you want in the header.
 */
export function HeaderChildrenProvider({ children, content }: HeaderChildrenProviderProps) {
  return <HeaderChildrenContext.Provider value={{ headerChildren: content }}>{children}</HeaderChildrenContext.Provider>;
}

/**
 * Hook to get the header children content from context.
 * Used internally by PageContainer to pass children to Header.
 */
export function useHeaderChildren(): ReactNode | null {
  const context = useContext(HeaderChildrenContext);
  return context.headerChildren;
}
