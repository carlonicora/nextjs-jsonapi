"use client";

import { useState, useCallback } from "react";
import { ApiDataInterface } from "../../core/interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../../core/interfaces/ApiRequestDataTypeInterface";
import { ApiResponseInterface } from "../../core/interfaces/ApiResponseInterface";

export type MutationMethod = "POST" | "PUT" | "PATCH" | "DELETE";

export interface UseJsonApiMutationResult<T> {
  /**
   * The result data from the mutation, or null if not yet executed.
   */
  data: T | null;
  /**
   * Whether the mutation is currently in progress.
   */
  loading: boolean;
  /**
   * Error message if the mutation failed.
   */
  error: string | null;
  /**
   * The full API response.
   */
  response: ApiResponseInterface | null;
  /**
   * Execute the mutation.
   */
  mutate: (params: MutationParams) => Promise<T | null>;
  /**
   * Reset the mutation state.
   */
  reset: () => void;
}

export interface MutationParams {
  /**
   * The endpoint to call.
   */
  endpoint: string;
  /**
   * The request body.
   */
  body?: any;
  /**
   * Files to upload.
   */
  files?: { [key: string]: File | Blob } | File | Blob;
  /**
   * Company ID for multi-tenant requests.
   */
  companyId?: string;
  /**
   * Override the default JSON:API body creation.
   */
  overridesJsonApiCreation?: boolean;
  /**
   * Response type if different from the request type.
   */
  responseType?: ApiRequestDataTypeInterface;
}

/**
 * Hook for making mutations (POST, PUT, PATCH, DELETE) to a JSON:API endpoint.
 *
 * @example
 * ```tsx
 * const { mutate, loading, error } = useJsonApiMutation<Article>({
 *   method: "POST",
 *   classKey: Modules.Article,
 * });
 *
 * const handleSubmit = async (data: ArticleInput) => {
 *   const result = await mutate({
 *     endpoint: "/articles",
 *     body: data,
 *   });
 *   if (result) {
 *     // Success!
 *   }
 * };
 * ```
 */
export function useJsonApiMutation<T extends ApiDataInterface>(config: {
  method: MutationMethod;
  classKey: ApiRequestDataTypeInterface;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}): UseJsonApiMutationResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponseInterface | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
    setResponse(null);
  }, []);

  const mutate = useCallback(
    async (params: MutationParams): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const { JsonApiPost, JsonApiPut, JsonApiPatch, JsonApiDelete } = await import("../../unified/JsonApiRequest");
        const language = navigator.language.split("-")[0] || "en";

        let apiResponse: ApiResponseInterface;

        switch (config.method) {
          case "POST":
            apiResponse = await JsonApiPost({
              classKey: config.classKey,
              endpoint: params.endpoint,
              companyId: params.companyId,
              body: params.body,
              overridesJsonApiCreation: params.overridesJsonApiCreation,
              files: params.files,
              language,
              responseType: params.responseType,
            });
            break;
          case "PUT":
            apiResponse = await JsonApiPut({
              classKey: config.classKey,
              endpoint: params.endpoint,
              companyId: params.companyId,
              body: params.body,
              files: params.files,
              language,
              responseType: params.responseType,
            });
            break;
          case "PATCH":
            apiResponse = await JsonApiPatch({
              classKey: config.classKey,
              endpoint: params.endpoint,
              companyId: params.companyId,
              body: params.body,
              overridesJsonApiCreation: params.overridesJsonApiCreation,
              files: params.files,
              language,
              responseType: params.responseType,
            });
            break;
          case "DELETE":
            apiResponse = await JsonApiDelete({
              classKey: config.classKey,
              endpoint: params.endpoint,
              companyId: params.companyId,
              language,
              responseType: params.responseType,
            });
            break;
        }

        setResponse(apiResponse);

        if (apiResponse.ok) {
          const resultData = apiResponse.data as T;
          setData(resultData);
          config.onSuccess?.(resultData);
          return resultData;
        } else {
          setError(apiResponse.error);
          config.onError?.(apiResponse.error);
          return null;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        config.onError?.(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [config],
  );

  return {
    data,
    loading,
    error,
    response,
    mutate,
    reset,
  };
}
