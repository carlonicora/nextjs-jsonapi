import { ApiRequestDataTypeInterface } from "../../core/interfaces/ApiRequestDataTypeInterface";

export interface CreateMockModuleOptions {
  name: string;
  cache?: string;
  inclusions?: ApiRequestDataTypeInterface["inclusions"];
}

/**
 * Creates a mock module definition for testing.
 *
 * @example
 * ```ts
 * import { createMockModule } from '@carlonicora/nextjs-jsonapi/testing';
 *
 * const mockArticleModule = createMockModule({ name: 'articles' });
 * ```
 */
export function createMockModule(options: CreateMockModuleOptions): ApiRequestDataTypeInterface {
  // Create a mock model class
  class MockModel {
    id = "mock-id";
    type = options.name;
  }

  return {
    name: options.name,
    cache: options.cache,
    inclusions: options.inclusions,
    model: MockModel,
  };
}
