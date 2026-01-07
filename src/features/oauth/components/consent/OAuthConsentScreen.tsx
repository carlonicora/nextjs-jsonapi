"use client";

import { ExternalLink, AlertTriangle, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  Separator,
  Alert,
  AlertDescription,
} from "../../../../shadcnui";
import { OAuthConsentHeader } from "./OAuthConsentHeader";
import { OAuthScopeList } from "./OAuthScopeList";
import { OAuthConsentActions } from "./OAuthConsentActions";
import { useOAuthConsent } from "../../hooks/useOAuthConsent";
import { OAuthConsentRequest } from "../../interfaces/oauth.interface";

export interface OAuthConsentScreenProps {
  /** OAuth authorization parameters */
  params: OAuthConsentRequest;
  /** Optional platform logo URL */
  logoUrl?: string;
  /** Platform name */
  appName?: string;
  /** Terms of Service URL */
  termsUrl?: string;
  /** Privacy Policy URL */
  privacyUrl?: string;
}

/**
 * Main OAuth consent screen component
 * Displays client info, requested scopes, and approve/deny buttons
 *
 * @example
 * ```tsx
 * <OAuthConsentScreen
 *   params={{
 *     clientId: searchParams.client_id,
 *     redirectUri: searchParams.redirect_uri,
 *     scope: searchParams.scope,
 *     state: searchParams.state,
 *   }}
 * />
 * ```
 */
export function OAuthConsentScreen({
  params,
  logoUrl,
  appName = "Only35",
  termsUrl = "/terms",
  privacyUrl = "/privacy",
}: OAuthConsentScreenProps) {
  const { clientInfo, isLoading, error, approve, deny, isSubmitting } = useOAuthConsent(params);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Loading authorization request...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !clientInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error?.message || "Invalid authorization request. Please try again."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { client, scopes } = clientInfo;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-6">
          {/* Header */}
          <OAuthConsentHeader
            client={client}
            logoUrl={logoUrl}
            appName={appName}
          />

          <Separator />

          {/* Scopes */}
          <OAuthScopeList scopes={scopes} />

          <Separator />

          {/* Redirect URI Notice */}
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <span>Authorizing will redirect you to:</span>
              <p className="font-mono text-xs mt-1 break-all">{params.redirectUri}</p>
            </div>
          </div>

          {/* Actions */}
          <OAuthConsentActions
            onApprove={approve}
            onDeny={deny}
            isLoading={isSubmitting}
          />
        </CardContent>

        {/* Footer */}
        <CardFooter className="justify-center">
          <p className="text-xs text-center text-muted-foreground">
            By authorizing, you agree to the app's{" "}
            <a href={termsUrl} className="underline hover:text-foreground" target="_blank" rel="noopener">
              Terms of Service
            </a>
            {" "}and{" "}
            <a href={privacyUrl} className="underline hover:text-foreground" target="_blank" rel="noopener">
              Privacy Policy
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
