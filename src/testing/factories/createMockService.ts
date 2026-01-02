import { vi, type Mock } from "vitest";
import { ApiResponseInterface } from "../../core/interfaces/ApiResponseInterface";
import { createMockResponse } from "./createMockResponse";

export type MockApiMethod = Mock<(...args: any[]) => Promise<ApiResponseInterface>>;

export interface MockService {
  get: MockApiMethod;
  post: MockApiMethod;
  put: MockApiMethod;
  patch: MockApiMethod;
  delete: MockApiMethod;
}

export interface CreateMockServiceOptions {
  defaultResponse?: ApiResponseInterface;
}

/**
 * Creates a mock service with Vitest mock functions for all HTTP methods.
 *
 * @example
 * ```ts
 * import { createMockService, createMockResponse } from '@carlonicora/nextjs-jsonapi/testing';
 *
 * const mockService = createMockService();
 * mockService.get.mockResolvedValue(createMockResponse({ data: mockData }));
 *
 * // Use in test
 * expect(mockService.get).toHaveBeenCalled();
 * ```
 *
 * @example With default response
 * ```ts
 * const mockService = createMockService({
 *   defaultResponse: createMockResponse({ ok: true, data: [] }),
 * });
 * ```
 */
export function createMockService(options: CreateMockServiceOptions = {}): MockService {
  const defaultResponse = options.defaultResponse ?? createMockResponse({ ok: true });

  return {
    get: vi.fn().mockResolvedValue(defaultResponse),
    post: vi.fn().mockResolvedValue(defaultResponse),
    put: vi.fn().mockResolvedValue(defaultResponse),
    patch: vi.fn().mockResolvedValue(defaultResponse),
    delete: vi.fn().mockResolvedValue(defaultResponse),
  };
}

/**
 * Creates a mock service that returns errors for all methods.
 *
 * @example
 * ```ts
 * import { createMockErrorService } from '@carlonicora/nextjs-jsonapi/testing';
 *
 * const errorService = createMockErrorService(500, 'Internal Server Error');
 * ```
 */
export function createMockErrorService(
  statusCode: number = 500,
  errorMessage: string = "Error"
): MockService {
  const errorResponse = createMockResponse({
    ok: false,
    response: statusCode,
    error: errorMessage,
  });

  return {
    get: vi.fn().mockResolvedValue(errorResponse),
    post: vi.fn().mockResolvedValue(errorResponse),
    put: vi.fn().mockResolvedValue(errorResponse),
    patch: vi.fn().mockResolvedValue(errorResponse),
    delete: vi.fn().mockResolvedValue(errorResponse),
  };
}
