/**
 * Test utilities for @carlonicora/nextjs-jsonapi
 *
 * Import from '@carlonicora/nextjs-jsonapi/testing'
 *
 * @example
 * ```ts
 * import {
 *   MockJsonApiProvider,
 *   renderWithProviders,
 *   createMockApiData,
 *   createMockResponse,
 *   createMockModule,
 *   createMockService,
 *   jsonApiMatchers,
 *   extendExpectWithJsonApiMatchers,
 * } from '@carlonicora/nextjs-jsonapi/testing';
 * ```
 */

// Providers
export { MockJsonApiProvider, defaultMockConfig, type MockJsonApiProviderProps } from "./providers/MockJsonApiProvider";

// Factories
export { createMockModule, type CreateMockModuleOptions } from "./factories/createMockModule";

export {
  createMockResponse,
  createMockErrorResponse,
  type CreateMockResponseOptions,
} from "./factories/createMockResponse";

export {
  createMockService,
  createMockErrorService,
  type MockService,
  type MockApiMethod,
  type CreateMockServiceOptions,
} from "./factories/createMockService";

export { createMockApiData, createMockApiDataList, type CreateMockApiDataOptions } from "./factories/createMockApiData";

// Matchers
export { jsonApiMatchers, extendExpectWithJsonApiMatchers } from "./matchers/jsonApiMatchers";

// Utilities
export {
  renderWithProviders,
  render,
  screen,
  waitFor,
  fireEvent,
  within,
  userEvent,
  type RenderWithProvidersOptions,
} from "./utils/renderWithProviders";
