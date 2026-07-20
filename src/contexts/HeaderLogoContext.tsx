"use client";

import { createContext, useContext, ReactNode } from "react";

interface HeaderLogoContextType {
  headerLogo: ReactNode | null;
}

const HeaderLogoContext = createContext<HeaderLogoContextType>({
  headerLogo: null,
});

interface HeaderLogoProviderProps {
  children: ReactNode;
  content: ReactNode;
}

export function HeaderLogoProvider({ children, content }: HeaderLogoProviderProps) {
  return <HeaderLogoContext.Provider value={{ headerLogo: content }}>{children}</HeaderLogoContext.Provider>;
}

export function useHeaderLogo(): ReactNode | null {
  const context = useContext(HeaderLogoContext);
  return context.headerLogo;
}
