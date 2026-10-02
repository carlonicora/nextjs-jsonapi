"use client";

import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { ContentTitle } from "../../../../components";
import { OAuthClientInterface } from "../../interfaces/oauth.interface";

export interface OAuthConsentHeaderProps {
  /** The requesting OAuth client */
  client: OAuthClientInterface;
  /** Optional logo URL override */
  logoUrl?: string;
  /** Application name shown in the header */
  appName: string;
}

/**
 * Header component for OAuth consent screen
 * Shows platform logo and requesting app information
 */
export function OAuthConsentHeader({ client, logoUrl, appName }: OAuthConsentHeaderProps) {
  const t = useTranslations();

  return (
    <div className="text-center space-y-4">
      {/* Platform Logo */}
      <div className="flex justify-center">
        {logoUrl ? (
          <img src={logoUrl} alt={appName} className="h-12 w-auto" />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Authorization Request */}
      <div className="space-y-2">
        <ContentTitle element={t("oauth.consent.title", { client: client.name })} className="mb-0 justify-center" />
        <p className="text-muted-foreground text-sm">
          {t("oauth.consent.wants_access", { client: client.name, appName })}
        </p>
      </div>
    </div>
  );
}
