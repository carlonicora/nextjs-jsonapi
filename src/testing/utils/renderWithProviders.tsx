"use client";

import React, { ReactElement } from "react";
import { render, RenderOptions, RenderResult } from "@testing-library/react";
import { MockJsonApiProvider, MockJsonApiProviderProps } from "../providers/MockJsonApiProvider";
import { JsonApiConfig } from "../../client/context/JsonApiContext";

export interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  /**
   * Custom JSON:API configuration to pass to the mock provider.
   */
  jsonApiConfig?: Partial<JsonApiConfig>;

  /**
   * Additional wrapper component to wrap around the providers.
   */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Renders a component wrapped with all necessary providers for testing.
 *
 * @example
 * ```tsx
 * import { renderWithProviders } from '@carlonicora/nextjs-jsonapi/testing';
 *
 * const { getByText } = renderWithProviders(<MyComponent />);
 * expect(getByText('Hello')).toBeInTheDocument();
 * ```
 *
 * @example With custom config
 * ```tsx
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   jsonApiConfig: { apiUrl: 'https://custom.api.com' },
 * });
 * ```
 *
 * @example With additional wrapper
 * ```tsx
 * const CustomWrapper = ({ children }) => (
 *   <ThemeProvider>{children}</ThemeProvider>
 * );
 *
 * const { getByText } = renderWithProviders(<MyComponent />, {
 *   wrapper: CustomWrapper,
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {}
): RenderResult {
  const { jsonApiConfig, wrapper: AdditionalWrapper, ...renderOptions } = options;

  function AllProviders({ children }: { children: React.ReactNode }) {
    const content = (
      <MockJsonApiProvider config={jsonApiConfig}>
        {children}
      </MockJsonApiProvider>
    );

    if (AdditionalWrapper) {
      return <AdditionalWrapper>{content}</AdditionalWrapper>;
    }

    return content;
  }

  return render(ui, { wrapper: AllProviders, ...renderOptions });
}

/**
 * Re-export render utilities from Testing Library for convenience.
 */
export { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";
