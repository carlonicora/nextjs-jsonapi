import { ApiDataInterface } from "../../core/interfaces/ApiDataInterface";

export interface CreateMockApiDataOptions {
  type: string;
  id?: string;
  attributes?: Record<string, any>;
  relationships?: Record<string, any>;
  included?: any[];
  createdAt?: Date;
  updatedAt?: Date;
  self?: string;
}

/**
 * Creates a mock ApiDataInterface object for testing.
 *
 * @example
 * ```ts
 * import { createMockApiData } from '@carlonicora/nextjs-jsonapi/testing';
 *
 * const mockArticle = createMockApiData({
 *   type: 'articles',
 *   id: '1',
 *   attributes: { title: 'Test Article', body: 'Content here' },
 * });
 * ```
 *
 * @example With relationships
 * ```ts
 * const mockArticle = createMockApiData({
 *   type: 'articles',
 *   id: '1',
 *   attributes: { title: 'Test' },
 *   relationships: {
 *     author: { data: { type: 'users', id: '42' } },
 *   },
 * });
 * ```
 */
export function createMockApiData(options: CreateMockApiDataOptions): ApiDataInterface {
  const {
    type,
    id = `mock-${type}-${Math.random().toString(36).substring(7)}`,
    attributes = {},
    relationships = {},
    included = [],
    createdAt = new Date(),
    updatedAt = new Date(),
    self,
  } = options;

  const jsonApiData = {
    type,
    id,
    attributes: {
      ...attributes,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    },
    relationships,
  };

  const mockData: ApiDataInterface = {
    get included() {
      return included;
    },
    get type() {
      return type;
    },
    get id() {
      return id;
    },
    get createdAt() {
      return createdAt;
    },
    get updatedAt() {
      return updatedAt;
    },
    get self() {
      return self;
    },
    get jsonApi() {
      return jsonApiData;
    },
    generateApiUrl: (params?: any) => {
      const baseUrl = `/${type}/${id}`;
      if (params) {
        const searchParams = new URLSearchParams(params);
        return `${baseUrl}?${searchParams.toString()}`;
      }
      return baseUrl;
    },
    dehydrate: () => ({
      jsonApi: jsonApiData,
      included,
      allData: [jsonApiData],
    }),
    rehydrate: function (_data: any) {
      return this;
    },
    createJsonApi: (data: any) => ({
      type,
      id,
      attributes: data,
    }),
  };

  // Add attribute accessors to the mock object
  Object.keys(attributes).forEach((key) => {
    Object.defineProperty(mockData, key, {
      get: () => attributes[key],
      enumerable: true,
    });
  });

  return mockData;
}

/**
 * Creates an array of mock ApiDataInterface objects.
 *
 * @example
 * ```ts
 * import { createMockApiDataList } from '@carlonicora/nextjs-jsonapi/testing';
 *
 * const mockArticles = createMockApiDataList('articles', 5, (index) => ({
 *   title: `Article ${index + 1}`,
 * }));
 * ```
 */
export function createMockApiDataList(
  type: string,
  count: number,
  attributesFactory?: (index: number) => Record<string, any>,
): ApiDataInterface[] {
  return Array.from({ length: count }, (_, index) =>
    createMockApiData({
      type,
      id: `${index + 1}`,
      attributes: attributesFactory?.(index) ?? {},
    }),
  );
}
