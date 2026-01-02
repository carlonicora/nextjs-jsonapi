import { ApiResponseInterface } from "../../core/interfaces/ApiResponseInterface";
import { ApiDataInterface } from "../../core/interfaces/ApiDataInterface";

export interface CreateMockResponseOptions {
  data?: ApiDataInterface | ApiDataInterface[] | null;
  ok?: boolean;
  response?: number;
  error?: string;
  meta?: Record<string, any>;
  self?: string;
  next?: string;
  prev?: string;
}

/**
 * Creates a mock API response for testing.
 *
 * @example
 * ```ts
 * import { createMockResponse, createMockApiData } from '@carlonicora/nextjs-jsonapi/testing';
 *
 * const mockData = createMockApiData({ type: 'articles', id: '1' });
 * const response = createMockResponse({ data: mockData, ok: true });
 * ```
 *
 * @example With pagination
 * ```ts
 * const response = createMockResponse({
 *   data: [mockData],
 *   ok: true,
 *   next: '/articles?page=2',
 *   prev: '/articles?page=0',
 * });
 * ```
 */
export function createMockResponse(options: CreateMockResponseOptions = {}): ApiResponseInterface {
  const {
    data = null,
    ok = true,
    response = ok ? 200 : 500,
    error = ok ? "" : "Error",
    meta,
    self,
    next,
    prev,
  } = options;

  const mockResponse: ApiResponseInterface = {
    ok,
    response,
    data: data as ApiDataInterface | ApiDataInterface[],
    error,
    meta,
    self,
    next,
    prev,
  };

  // Add pagination methods if next/prev provided
  if (next) {
    mockResponse.nextPage = async () => createMockResponse({ ...options, next: undefined, prev: self });
  }

  if (prev) {
    mockResponse.prevPage = async () => createMockResponse({ ...options, prev: undefined, next: self });
  }

  return mockResponse;
}

/**
 * Creates a mock error response for testing error scenarios.
 *
 * @example
 * ```ts
 * import { createMockErrorResponse } from '@carlonicora/nextjs-jsonapi/testing';
 *
 * const errorResponse = createMockErrorResponse(404, 'Not Found');
 * ```
 */
export function createMockErrorResponse(statusCode: number, errorMessage: string): ApiResponseInterface {
  return createMockResponse({
    ok: false,
    response: statusCode,
    error: errorMessage,
    data: null,
  });
}
