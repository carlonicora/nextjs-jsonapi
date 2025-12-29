"use client";

import { ModuleWithPermissions } from "../permissions/types";
import { setBootstrapper } from "../core/registry/bootstrapStore";

// Config storage for client-side contexts
let _clientConfig: {
  apiUrl: string;
  appUrl?: string;
  trackablePages?: ModuleWithPermissions[];
  bootstrapper?: () => void;
  additionalHeaders?: Record<string, string>;
  stripePublishableKey?: string;
} | null = null;

/**
 * Configure the JSON:API client. This is the main configuration function.
 * This is typically called during app initialization.
 */
export function configureJsonApi(config: {
  apiUrl: string;
  appUrl?: string;
  trackablePages?: ModuleWithPermissions[];
  bootstrapper?: () => void;
  additionalHeaders?: Record<string, string>;
  stripePublishableKey?: string;
}): void {
  _clientConfig = config;
  // Register and call bootstrapper to register all modules
  if (config.bootstrapper) {
    setBootstrapper(config.bootstrapper);
    config.bootstrapper();
  }
}

/**
 * Configure the client config. This is typically called during app initialization.
 * @deprecated Use configureJsonApi instead
 */
export function configureClientConfig(config: {
  apiUrl: string;
  appUrl?: string;
  trackablePages?: ModuleWithPermissions[];
}): void {
  _clientConfig = config;
}

/**
 * Get the configured API URL.
 */
export function getApiUrl(): string {
  if (_clientConfig?.apiUrl) {
    return _clientConfig.apiUrl;
  }
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "";
}

/**
 * Get the configured app URL.
 */
export function getAppUrl(): string {
  if (_clientConfig?.appUrl) {
    return _clientConfig.appUrl;
  }
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

/**
 * Get the configured trackable pages.
 */
export function getTrackablePages(): ModuleWithPermissions[] {
  return _clientConfig?.trackablePages ?? [];
}

/**
 * Get the configured Stripe publishable key.
 */
export function getStripePublishableKey(): string | undefined {
  return _clientConfig?.stripePublishableKey;
}
