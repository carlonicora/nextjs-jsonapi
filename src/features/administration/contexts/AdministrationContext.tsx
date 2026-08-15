"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useContext } from "react";
import { SharedProvider } from "../../../contexts/SharedContext";
import { BreadcrumbItemData } from "../../../interfaces";

interface AdministrationContextType {}

const AdministrationContext = createContext<AdministrationContextType | undefined>(undefined);

type AdministrationProviderProps = {
  children: ReactNode;
};

/**
 * Supplies the page chrome for every administration surface.
 *
 * `RoundPageContainerTitle` and the header breadcrumb both read
 * `useSharedContext()`, and that context is provided far up the tree by the
 * layout — so an administration page that provides nothing of its own silently
 * inherits whatever the *previously rendered* page put there (a company name, a
 * "Notifications" title). Wrapping in this provider replaces that value, which
 * is why every administration container mounts inside it.
 *
 * Mirrors CommonProvider (contexts/CommonContext.tsx), which does the same job
 * for the ordinary application shell.
 */
export const AdministrationProvider = ({ children }: AdministrationProviderProps) => {
  const t = useTranslations();

  const breadcrumbs: BreadcrumbItemData[] = [];

  return (
    <SharedProvider value={{ breadcrumbs, title: { type: t(`administration.title`) } }}>
      <AdministrationContext.Provider value={{}}>{children}</AdministrationContext.Provider>
    </SharedProvider>
  );
};

export const useAdministrationContext = (): AdministrationContextType => {
  const context = useContext(AdministrationContext);
  if (context === undefined) {
    throw new Error("useAdministrationContext must be used within an AdministrationProvider");
  }
  return context;
};
