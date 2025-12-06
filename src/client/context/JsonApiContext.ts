"use client";

import { createContext, useContext } from "react";

export type CacheProfile = "seconds" | "minutes" | "hours" | "days" | "weeks" | "max" | "default";

export interface JsonApiConfig {
  /**
   * The base URL for API requests (e.g., https://api.example.com)
   */
  apiUrl: string;

  /**
   * Custom token getter function. If not provided, will use default cookie-based token retrieval.
   */
  tokenGetter?: () => Promise<string | undefined>;

  /**
   * Custom language getter function. If not provided, will use browser locale or next-intl.
   */
  languageGetter?: () => Promise<string>;

  /**
   * Default headers to include in all requests
   */
  defaultHeaders?: Record<string, string>;

  /**
   * Global error handler for failed requests (client-side only)
   */
  onError?: (status: number, message: string) => void;

  /**
   * Cache configuration
   */
  cacheConfig?: {
    defaultProfile: CacheProfile;
  };

  /**
   * Function to bootstrap the data class registry.
   * Will be called automatically when needed.
   */
  bootstrapper?: () => void;
}

const JsonApiContext = createContext<JsonApiConfig | null>(null);

export function useJsonApiConfig(): JsonApiConfig {
  const config = useContext(JsonApiContext);
  if (!config) {
    throw new Error("useJsonApiConfig must be used within a JsonApiProvider");
  }
  return config;
}

export function useJsonApiConfigOptional(): JsonApiConfig | null {
  return useContext(JsonApiContext);
}

export { JsonApiContext };
