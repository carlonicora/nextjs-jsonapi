import { createContext, ReactNode, useContext } from "react";
import { BreadcrumbItemData } from "../interfaces";

const SharedContext = createContext<{
  breadcrumbs: BreadcrumbItemData[];
  title: {
    type: string | string[];
    element?: string;
    functions?: ReactNode;
  };
} | null>(null);

interface SharedProviderProps {
  children: ReactNode;
  value: {
    breadcrumbs: BreadcrumbItemData[];
    title: {
      type: string;
      element?: string;
      functions?: ReactNode;
    };
  };
}

export const SharedProvider = ({ children, value }: SharedProviderProps) => {
  return <SharedContext.Provider value={value}>{children}</SharedContext.Provider>;
};

export const useSharedContext = () => {
  const context = useContext(SharedContext);
  if (!context) {
    throw new Error("useSharedContext must be used within a SharedProvider");
  }
  return context;
};
