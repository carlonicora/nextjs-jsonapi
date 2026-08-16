"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SharedProvider } from "../../../contexts";
import { usePageUrlGenerator } from "../../../hooks";
import { BreadcrumbItemData } from "../../../interfaces";
import { AiConnectionEnvDefaults, AiConnectionInterface, AiConnectionService, AiProviderRegistry } from "../data";

/**
 * Route the breadcrumb links back to. Constant rather than a prop for the same
 * reason TOKEN_USAGE_ADMIN_PAGE_URL is
 * (features/tokenusage/contexts/TokenUsageAdminContext.tsx): the breadcrumb is
 * built here, not by the consuming app, and the path convention IS the contract.
 */
export const AI_CONNECTIONS_ADMIN_PAGE_URL = "/administration/ai-connections";

export interface AiConnectionsContextType {
  /** Every connection, both scopes — the cards filter per scope themselves. */
  connections: AiConnectionInterface[];
  /** `meta.providerRegistry` from the list endpoint: connectionType → provider rows. */
  providerRegistry: AiProviderRegistry;
  /** `meta.envDefaults` from the list endpoint: the read-only final chain link. */
  envDefaults: AiConnectionEnvDefaults;
  /** `null` = the global chain; a company id = that company's chain. */
  scopeCompanyId: string | null;
  setScopeCompanyId: (companyId: string | null) => void;
  /** Re-reads the whole list. Called after every mutation. */
  refresh: () => Promise<void>;
  isLoading: boolean;
}

const defaultContextValue: AiConnectionsContextType = {
  connections: [],
  providerRegistry: {},
  envDefaults: {},
  scopeCompanyId: null,
  setScopeCompanyId: () => {},
  refresh: async () => {},
  isLoading: false,
};

const AiConnectionsContext = createContext<AiConnectionsContextType | undefined>(undefined);

export type AiConnectionsProviderProps = {
  children: ReactNode;
};

/**
 * Owns the single list request behind the AI-connections admin page and the
 * scope the page is looking at.
 *
 * It also publishes the page chrome, exactly as TokenUsageAdminContext does:
 * RoundPageContainerTitle and the header breadcrumb read `useSharedContext()`,
 * and that value is supplied far up the tree — a page that publishes nothing
 * silently inherits the previous page's title.
 */
export const AiConnectionsProvider = ({ children }: AiConnectionsProviderProps) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const [connections, setConnections] = useState<AiConnectionInterface[]>([]);
  const [providerRegistry, setProviderRegistry] = useState<AiProviderRegistry>({});
  const [envDefaults, setEnvDefaults] = useState<AiConnectionEnvDefaults>({});
  const [scopeCompanyId, setScopeCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await AiConnectionService.listConnections();
      setConnections(response.connections);
      setProviderRegistry(response.providerRegistry);
      setEnvDefaults(response.envDefaults);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<AiConnectionsContextType>(
    () => ({
      connections,
      providerRegistry,
      envDefaults,
      scopeCompanyId,
      setScopeCompanyId,
      refresh,
      isLoading,
    }),
    [connections, providerRegistry, envDefaults, scopeCompanyId, refresh, isLoading],
  );

  const breadcrumbs: BreadcrumbItemData[] = [
    {
      name: t("ai_connections.admin.title"),
      href: generateUrl({ page: AI_CONNECTIONS_ADMIN_PAGE_URL }),
    },
  ];

  return (
    <SharedProvider value={{ breadcrumbs, title: { type: t("ai_connections.admin.title") } }}>
      <AiConnectionsContext.Provider value={value}>{children}</AiConnectionsContext.Provider>
    </SharedProvider>
  );
};

export const useAiConnections = (): AiConnectionsContextType => useContext(AiConnectionsContext) ?? defaultContextValue;
