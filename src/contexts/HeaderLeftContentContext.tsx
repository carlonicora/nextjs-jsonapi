"use client";

import { createContext, useContext, ReactNode } from "react";

interface HeaderLeftContentContextType {
  headerLeftContent: ReactNode | null;
}

const HeaderLeftContentContext = createContext<HeaderLeftContentContextType>({
  headerLeftContent: null,
});

interface HeaderLeftContentProviderProps {
  children: ReactNode;
  content: ReactNode;
}

export function HeaderLeftContentProvider({ children, content }: HeaderLeftContentProviderProps) {
  return (
    <HeaderLeftContentContext.Provider value={{ headerLeftContent: content }}>
      {children}
    </HeaderLeftContentContext.Provider>
  );
}

export function useHeaderLeftContent(): ReactNode | null {
  const context = useContext(HeaderLeftContentContext);
  return context.headerLeftContent;
}
