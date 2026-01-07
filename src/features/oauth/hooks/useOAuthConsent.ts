"use client";

import { useCallback, useEffect, useState } from "react";
import { OAuthConsentInfo, OAuthConsentRequest } from "../interfaces/oauth.interface";
import { OAuthService } from "../data/oauth.service";

export interface UseOAuthConsentReturn {
  /** Client and scope info for consent display */
  clientInfo: OAuthConsentInfo | null;
  /** Whether consent info is being loaded */
  isLoading: boolean;
  /** Error from consent flow */
  error: Error | null;
  /** Approve the authorization request */
  approve: () => Promise<void>;
  /** Deny the authorization request */
  deny: () => Promise<void>;
  /** Whether approve/deny is in progress */
  isSubmitting: boolean;
}

/**
 * Hook for managing the OAuth consent flow
 *
 * @param params - OAuth authorization parameters from URL
 *
 * @example
 * ```tsx
 * const { clientInfo, isLoading, approve, deny } = useOAuthConsent({
 *   clientId: searchParams.client_id,
 *   redirectUri: searchParams.redirect_uri,
 *   scope: searchParams.scope,
 *   state: searchParams.state,
 * });
 *
 * // Render consent screen with clientInfo
 * // On button click: approve() or deny()
 * ```
 */
export function useOAuthConsent(params: OAuthConsentRequest): UseOAuthConsentReturn {
  const [clientInfo, setClientInfo] = useState<OAuthConsentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch client info on mount
  useEffect(() => {
    const fetchInfo = async () => {
      if (!params.clientId || !params.redirectUri || !params.scope) {
        setError(new Error("Missing required authorization parameters"));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const info = await OAuthService.getAuthorizationInfo(params);
        setClientInfo(info);
      } catch (err) {
        console.error("[useOAuthConsent] Failed to fetch authorization info:", err);
        setError(err instanceof Error ? err : new Error("Failed to load authorization info"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchInfo();
  }, [
    params.clientId,
    params.redirectUri,
    params.scope,
    params.state,
    params.codeChallenge,
    params.codeChallengeMethod,
  ]);

  const approve = useCallback(async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await OAuthService.approveAuthorization(params);

      // Redirect to client with authorization code
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      console.error("[useOAuthConsent] Failed to approve authorization:", err);
      setError(err instanceof Error ? err : new Error("Failed to approve authorization"));
      setIsSubmitting(false);
    }
    // Note: Don't set isSubmitting to false on success - we're redirecting
  }, [params]);

  const deny = useCallback(async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await OAuthService.denyAuthorization(params);

      // Redirect to client with error
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err) {
      console.error("[useOAuthConsent] Failed to deny authorization:", err);
      setError(err instanceof Error ? err : new Error("Failed to deny authorization"));
      setIsSubmitting(false);
    }
    // Note: Don't set isSubmitting to false on success - we're redirecting
  }, [params]);

  return {
    clientInfo,
    isLoading,
    error,
    approve,
    deny,
    isSubmitting,
  };
}
