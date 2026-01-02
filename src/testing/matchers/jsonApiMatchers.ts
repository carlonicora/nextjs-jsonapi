import { expect } from "vitest";

interface JsonApiResponse {
  data?: {
    type?: string;
    id?: string;
    attributes?: Record<string, any>;
    relationships?: Record<string, any>;
  } | Array<{
    type?: string;
    id?: string;
    attributes?: Record<string, any>;
    relationships?: Record<string, any>;
  }>;
}

/**
 * Custom Vitest matchers for JSON:API assertions.
 *
 * @example
 * ```ts
 * import { jsonApiMatchers } from '@carlonicora/nextjs-jsonapi/testing';
 * import { expect } from 'vitest';
 *
 * expect.extend(jsonApiMatchers);
 *
 * // Then use in tests:
 * expect(response).toBeValidJsonApi();
 * expect(response).toHaveJsonApiType('articles');
 * expect(response).toHaveJsonApiAttribute('title', 'My Article');
 * expect(response).toHaveJsonApiRelationship('author');
 * ```
 */
export const jsonApiMatchers = {
  /**
   * Asserts that the response has a valid JSON:API structure with type and id.
   */
  toBeValidJsonApi(received: JsonApiResponse) {
    const data = Array.isArray(received?.data) ? received.data[0] : received?.data;
    const hasType = typeof data?.type === "string" && data.type.length > 0;
    const hasId = typeof data?.id === "string" && data.id.length > 0;
    const isValid = hasType && hasId;

    return {
      pass: isValid,
      message: () =>
        isValid
          ? `Expected response not to be valid JSON:API, but it has type "${data?.type}" and id "${data?.id}"`
          : `Expected response to be valid JSON:API with type and id, but got type: ${JSON.stringify(data?.type)}, id: ${JSON.stringify(data?.id)}`,
    };
  },

  /**
   * Asserts that the response data has the expected JSON:API type.
   */
  toHaveJsonApiType(received: JsonApiResponse, expectedType: string) {
    const data = Array.isArray(received?.data) ? received.data[0] : received?.data;
    const actualType = data?.type;
    const pass = actualType === expectedType;

    return {
      pass,
      message: () =>
        pass
          ? `Expected response not to have JSON:API type "${expectedType}"`
          : `Expected response to have JSON:API type "${expectedType}", but got "${actualType}"`,
    };
  },

  /**
   * Asserts that the response data has an attribute with the expected value.
   */
  toHaveJsonApiAttribute(
    received: JsonApiResponse,
    attributeName: string,
    expectedValue?: any
  ) {
    const data = Array.isArray(received?.data) ? received.data[0] : received?.data;
    const attributes = data?.attributes ?? {};
    const hasAttribute = attributeName in attributes;
    const actualValue = attributes[attributeName];

    if (expectedValue === undefined) {
      // Just check existence
      return {
        pass: hasAttribute,
        message: () =>
          hasAttribute
            ? `Expected response not to have JSON:API attribute "${attributeName}"`
            : `Expected response to have JSON:API attribute "${attributeName}", but it was not found. Available attributes: ${Object.keys(attributes).join(", ") || "none"}`,
      };
    }

    const valuesMatch = actualValue === expectedValue;
    return {
      pass: hasAttribute && valuesMatch,
      message: () =>
        hasAttribute && valuesMatch
          ? `Expected response not to have JSON:API attribute "${attributeName}" with value "${expectedValue}"`
          : !hasAttribute
            ? `Expected response to have JSON:API attribute "${attributeName}", but it was not found`
            : `Expected JSON:API attribute "${attributeName}" to be "${expectedValue}", but got "${actualValue}"`,
    };
  },

  /**
   * Asserts that the response data has the specified relationship.
   */
  toHaveJsonApiRelationship(received: JsonApiResponse, relationshipName: string) {
    const data = Array.isArray(received?.data) ? received.data[0] : received?.data;
    const relationships = data?.relationships ?? {};
    const hasRelationship = relationshipName in relationships;

    return {
      pass: hasRelationship,
      message: () =>
        hasRelationship
          ? `Expected response not to have JSON:API relationship "${relationshipName}"`
          : `Expected response to have JSON:API relationship "${relationshipName}", but it was not found. Available relationships: ${Object.keys(relationships).join(", ") || "none"}`,
    };
  },

  /**
   * Asserts that the response data array has the expected length.
   */
  toHaveJsonApiLength(received: JsonApiResponse, expectedLength: number) {
    const data = received?.data;
    const isArray = Array.isArray(data);
    const actualLength = isArray ? data.length : data ? 1 : 0;
    const pass = actualLength === expectedLength;

    return {
      pass,
      message: () =>
        pass
          ? `Expected response not to have ${expectedLength} items`
          : `Expected response to have ${expectedLength} items, but got ${actualLength}`,
    };
  },
};

// Type declarations for the custom matchers
declare module "vitest" {
  interface Assertion<T = any> {
    toBeValidJsonApi(): T;
    toHaveJsonApiType(expectedType: string): T;
    toHaveJsonApiAttribute(attributeName: string, expectedValue?: any): T;
    toHaveJsonApiRelationship(relationshipName: string): T;
    toHaveJsonApiLength(expectedLength: number): T;
  }
  interface AsymmetricMatchersContaining {
    toBeValidJsonApi(): any;
    toHaveJsonApiType(expectedType: string): any;
    toHaveJsonApiAttribute(attributeName: string, expectedValue?: any): any;
    toHaveJsonApiRelationship(relationshipName: string): any;
    toHaveJsonApiLength(expectedLength: number): any;
  }
}

/**
 * Extends Vitest's expect with JSON:API matchers.
 * Call this in your test setup file.
 *
 * @example
 * ```ts
 * // vitest.setup.ts
 * import { extendExpectWithJsonApiMatchers } from '@carlonicora/nextjs-jsonapi/testing';
 *
 * extendExpectWithJsonApiMatchers();
 * ```
 */
export function extendExpectWithJsonApiMatchers(): void {
  expect.extend(jsonApiMatchers);
}
