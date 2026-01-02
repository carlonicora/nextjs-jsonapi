"use client";

import React from "react";
import { JsonApiConfig, JsonApiContext } from "../../client/context/JsonApiContext";

export interface MockJsonApiProviderProps {
  children: React.ReactNode;
  config?: Partial<JsonApiConfig>;
}

const defaultMockConfig: JsonApiConfig = {
  apiUrl: "https://api.test.com",
  tokenGetter: async () => "mock-token-for-testing",
  languageGetter: async () => "en",
  defaultHeaders: {},
  onError: () => {},
  cacheConfig: {
    defaultProfile: "default",
  },
};

/**
 * A test-friendly provider that wraps components with mock JSON:API context.
 *
 * @example
 * ```tsx
 * import { MockJsonApiProvider } from '@carlonicora/nextjs-jsonapi/testing';
 *
 * render(
 *   <MockJsonApiProvider>
 *     <MyComponent />
 *   </MockJsonApiProvider>
 * );
 * ```
 *
 * @example With custom config
 * ```tsx
 * render(
 *   <MockJsonApiProvider config={{ apiUrl: 'https://custom.api.com' }}>
 *     <MyComponent />
 *   </MockJsonApiProvider>
 * );
 * ```
 */
export function MockJsonApiProvider({ children, config }: MockJsonApiProviderProps) {
  const mergedConfig: JsonApiConfig = {
    ...defaultMockConfig,
    ...config,
  };

  return (
    <JsonApiContext.Provider value={mergedConfig}>
      {children}
    </JsonApiContext.Provider>
  );
}

export { defaultMockConfig };
