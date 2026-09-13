"use client";

import { createContext, ReactNode, useContext } from "react";

const BreadcrumbRootContext = createContext<boolean>(false);

interface BreadcrumbRootProviderProps {
  children: ReactNode;
  /** When true, the header breadcrumb drops its root ("home") entry for everything below. */
  hidden: boolean;
}

/**
 * Suppresses the root breadcrumb entry for a whole section of the app.
 *
 * Deliberately NOT part of SharedContext: every page-level provider replaces the
 * SharedContext value wholesale, so a flag stored there would be lost as soon as a
 * nested entity provider (scene, npc, …) supplied its own breadcrumbs. This provider
 * sits above those and survives them.
 */
export function BreadcrumbRootProvider({ children, hidden }: BreadcrumbRootProviderProps) {
  return <BreadcrumbRootContext.Provider value={hidden}>{children}</BreadcrumbRootContext.Provider>;
}

/** True when the surrounding section asked for the root breadcrumb entry to be hidden. */
export function useIsBreadcrumbRootHidden(): boolean {
  return useContext(BreadcrumbRootContext);
}
