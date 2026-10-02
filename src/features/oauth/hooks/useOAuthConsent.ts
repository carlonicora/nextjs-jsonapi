"use client";

import { useCallback, useEffect, useState } from "react";
import { OAuthConsentInfo, OAuthConsentRequest } from "../interfaces/oauth.interface";
import { OAuthService } from "../data/oauth.service";
import { useCurrentUserContextOptional } from "../../user/contexts/CurrentUserContext";

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
  /** The studio (company) the authorization is granted for */
  companyId: string | undefined;
  /** Select the studio (company) the authorization is granted for */
  setCompanyId: (id: string) => void;
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
export function useOAuthConsent(
  params: OAuthConsentRequest,
  options?: {
    /**
     * The studio open in the host app's session. Apps that keep the signed-in
     * user in their own context (not the package UserProvider) pass it here;
     * it wins over the package context.
     */
    defaultCompanyId?: string;
  },
): UseOAuthConsentReturn {
  const [clientInfo, setClientInfo] = useState<OAuthConsentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const contextCompanyId = useCurrentUserContextOptional()?.company?.id;
  const currentCompanyId = options?.defaultCompanyId ?? contextCompanyId;

  // Seed the studio choice once the user's companies arrive: the studio open in
  // the web session when it is in the list, otherwise the first one.
  useEffect(() => {
    const companies = clientInfo?.companies ?? [];
    if (companies.length === 0) return;
    if (companyId && companies.some((company) => company.id === companyId)) return;

    const current = currentCompanyId ? companies.find((company) => company.id === currentCompanyId) : undefined;
    setCompanyId(current?.id ?? companies[0]?.id);
  }, [clientInfo, currentCompanyId, companyId]);

  // Fetch client info on mount
  useEffect(() => {
    const fetchInfo = async () => {
      // scope is deliberately NOT required: RFC 6749 §3.3 makes it optional
      // and the server defaults to the client's registered scopes.
      if (!params.clientId || !params.redirectUri) {
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
      const result = await OAuthService.approveAuthorization({ ...params, companyId });

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
  }, [params, companyId]);

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
    companyId,
    setCompanyId,
  };
}
