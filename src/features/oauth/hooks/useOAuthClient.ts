"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import {
  oauthClientByIdAtom,
  removeOAuthClientAtom,
  setNewClientSecretAtom,
  updateOAuthClientAtom,
} from "../atoms/oauth.atoms";
import { OAuthClientInput, OAuthClientInterface } from "../interfaces/oauth.interface";
import { OAuthService } from "../data/oauth.service";

export interface UseOAuthClientReturn {
  /** The OAuth client (from store or fetched) */
  client: OAuthClientInterface | null;
  /** Whether the client is being loaded */
  isLoading: boolean;
  /** Error from last operation */
  error: Error | null;
  /** Update the client */
  update: (data: Partial<OAuthClientInput>) => Promise<void>;
  /** Delete the client */
  deleteClient: () => Promise<void>;
  /** Regenerate the client secret */
  regenerateSecret: () => Promise<string>;
  /** Refetch client from API */
  refetch: () => Promise<void>;
}

/**
 * Hook for managing a single OAuth client
 *
 * @param clientId - The client ID to manage
 *
 * @example
 * ```tsx
 * const { client, update, deleteClient, regenerateSecret } = useOAuthClient(clientId);
 *
 * const handleRegenerate = async () => {
 *   const newSecret = await regenerateSecret();
 *   // newSecret is shown only once!
 * };
 * ```
 */
export function useOAuthClient(clientId: string): UseOAuthClientReturn {
  // Try to get from store first (populated by useOAuthClients)
  const storedClient = useAtomValue(oauthClientByIdAtom(clientId));
  const updateClientInStore = useSetAtom(updateOAuthClientAtom);
  const removeClientFromStore = useSetAtom(removeOAuthClientAtom);
  const setNewClientSecret = useSetAtom(setNewClientSecretAtom);

  // Local state for fetched client (if not in store)
  const [fetchedClient, setFetchedClient] = useState<OAuthClientInterface | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const client = storedClient || fetchedClient;

  const fetchClient = useCallback(async () => {
    if (!clientId) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetched = await OAuthService.getClient({ clientId });
      setFetchedClient(fetched);
    } catch (err) {
      console.error("[useOAuthClient] Failed to fetch client:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch OAuth client"));
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);

  // Fetch if not in store
  useEffect(() => {
    if (!storedClient && clientId) {
      fetchClient();
    }
  }, [storedClient, clientId, fetchClient]);

  const update = useCallback(
    async (data: Partial<OAuthClientInput>): Promise<void> => {
      if (!clientId) throw new Error("No client ID");

      setIsLoading(true);
      setError(null);

      try {
        const updated = await OAuthService.updateClient({ clientId, data });
        updateClientInStore(updated);
        setFetchedClient(updated);
      } catch (err) {
        console.error("[useOAuthClient] Failed to update client:", err);
        const error = err instanceof Error ? err : new Error("Failed to update OAuth client");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [clientId, updateClientInStore],
  );

  const deleteClient = useCallback(async (): Promise<void> => {
    if (!clientId) throw new Error("No client ID");

    setIsLoading(true);
    setError(null);

    try {
      await OAuthService.deleteClient({ clientId });
      removeClientFromStore(clientId);
    } catch (err) {
      console.error("[useOAuthClient] Failed to delete client:", err);
      const error = err instanceof Error ? err : new Error("Failed to delete OAuth client");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clientId, removeClientFromStore]);

  const regenerateSecret = useCallback(async (): Promise<string> => {
    if (!clientId) throw new Error("No client ID");

    setIsLoading(true);
    setError(null);

    try {
      const result = await OAuthService.regenerateSecret({ clientId });

      // Store for one-time display
      setNewClientSecret({
        clientId,
        secret: result.clientSecret,
      });

      return result.clientSecret;
    } catch (err) {
      console.error("[useOAuthClient] Failed to regenerate secret:", err);
      const error = err instanceof Error ? err : new Error("Failed to regenerate client secret");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clientId, setNewClientSecret]);

  return {
    client,
    isLoading,
    error,
    update,
    deleteClient,
    regenerateSecret,
    refetch: fetchClient,
  };
}
