"use client";

import { createContext, useContext, ReactNode } from "react";

interface HeaderChildrenContextType {
  headerChildren: ReactNode | null;
  headerMobileChildren: ReactNode | null;
  headerRootLabel: string | null;
}

const HeaderChildrenContext = createContext<HeaderChildrenContextType>({
  headerChildren: null,
  headerMobileChildren: null,
  headerRootLabel: null,
});

interface HeaderChildrenProviderProps {
  children: ReactNode;
  content: ReactNode;
  mobileContent?: ReactNode;
  rootLabel?: string;
}

/**
 * Provider to supply custom content to be rendered in the Header component.
 * Wrap your layout with this provider and pass the content you want in the header.
 * Optionally pass `rootLabel` to override the first breadcrumb entry (defaults to `common.home`).
 *
 * The header has far less room on mobile, so `content` is desktop-only. Pass `mobileContent`
 * to choose which widgets survive there; omit it and the header stays bare on mobile.
 */
export function HeaderChildrenProvider({ children, content, mobileContent, rootLabel }: HeaderChildrenProviderProps) {
  return (
    <HeaderChildrenContext.Provider
      value={{
        headerChildren: content,
        headerMobileChildren: mobileContent ?? null,
        headerRootLabel: rootLabel ?? null,
      }}
    >
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
 * Hook to get the header content the application wants kept on mobile.
 * Returns null when the application supplied none, in which case the Header shows no widgets there.
 */
export function useHeaderMobileChildren(): ReactNode | null {
  const context = useContext(HeaderChildrenContext);
  return context.headerMobileChildren;
}

/**
 * Hook to get the label of the first breadcrumb entry, when the application supplies one.
 * Returns null when no override was provided, in which case the Header falls back to `common.home`.
 */
export function useHeaderRootLabel(): string | null {
  const context = useContext(HeaderChildrenContext);
  return context.headerRootLabel;
}
