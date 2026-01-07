"use client";

import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import {
  addOAuthClientAtom,
  oauthClientsAtom,
  oauthClientsErrorAtom,
  oauthClientsLoadingAtom,
  setNewClientSecretAtom,
} from "../atoms/oauth.atoms";
import {
  OAuthClientCreateRequest,
  OAuthClientCreateResponse,
  OAuthClientInterface,
} from "../interfaces/oauth.interface";
import { OAuthService } from "../data/oauth.service";

export interface UseOAuthClientsReturn {
  /** List of OAuth clients */
  clients: OAuthClientInterface[];
  /** Whether clients are being loaded */
  isLoading: boolean;
  /** Error from last operation */
  error: Error | null;
  /** Refetch clients from API */
  refetch: () => Promise<void>;
  /** Create a new OAuth client */
  createClient: (data: OAuthClientCreateRequest) => Promise<OAuthClientCreateResponse>;
}

/**
 * Hook for managing OAuth clients list
 *
 * @example
 * ```tsx
 * const { clients, isLoading, createClient } = useOAuthClients();
 *
 * const handleCreate = async (data) => {
 *   const { client, clientSecret } = await createClient(data);
 *   // clientSecret is shown only once!
 * };
 * ```
 */
export function useOAuthClients(): UseOAuthClientsReturn {
  const [clients, setClients] = useAtom(oauthClientsAtom);
  const [isLoading, setIsLoading] = useAtom(oauthClientsLoadingAtom);
  const [error, setError] = useAtom(oauthClientsErrorAtom);
  const addClient = useSetAtom(addOAuthClientAtom);
  const setNewClientSecret = useSetAtom(setNewClientSecretAtom);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedClients = await OAuthService.listClients();
      setClients(fetchedClients);
    } catch (err) {
      console.error("[useOAuthClients] Failed to fetch clients:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch OAuth clients"));
    } finally {
      setIsLoading(false);
    }
  }, [setClients, setIsLoading, setError]);

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = useCallback(
    async (data: OAuthClientCreateRequest): Promise<OAuthClientCreateResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await OAuthService.createClient(data);

        // Add to local state
        addClient(result.client);

        // Store secret for one-time display
        if (result.clientSecret) {
          setNewClientSecret({
            clientId: result.client.clientId,
            secret: result.clientSecret,
          });
        }

        return result;
      } catch (err) {
        console.error("[useOAuthClients] Failed to create client:", err);
        const error = err instanceof Error ? err : new Error("Failed to create OAuth client");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [addClient, setNewClientSecret, setIsLoading, setError],
  );

  return {
    clients,
    isLoading,
    error,
    refetch: fetchClients,
    createClient,
  };
}
