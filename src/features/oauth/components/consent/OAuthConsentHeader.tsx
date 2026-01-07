"use client";

import { Shield } from "lucide-react";
import { OAuthClientInterface } from "../../interfaces/oauth.interface";

export interface OAuthConsentHeaderProps {
  /** The requesting OAuth client */
  client: OAuthClientInterface;
  /** Optional logo URL override */
  logoUrl?: string;
  /** Application name (e.g., "Only35") */
  appName?: string;
}

/**
 * Header component for OAuth consent screen
 * Shows platform logo and requesting app information
 */
export function OAuthConsentHeader({
  client,
  logoUrl,
  appName = "Only35",
}: OAuthConsentHeaderProps) {
  return (
    <div className="text-center space-y-4">
      {/* Platform Logo */}
      <div className="flex justify-center">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={appName}
            className="h-12 w-auto"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Authorization Request */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Authorize {client.name}</h1>
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">{client.name}</span>
          {" "}wants to access your {appName} account
        </p>
      </div>
    </div>
  );
}
