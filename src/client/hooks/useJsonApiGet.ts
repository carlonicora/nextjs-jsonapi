"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ApiDataInterface } from "../../core/interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../../core/interfaces/ApiRequestDataTypeInterface";
import { ApiResponseInterface } from "../../core/interfaces/ApiResponseInterface";

export interface UseJsonApiGetOptions {
  /**
   * Whether to enable the query. If false, the query won't run.
   */
  enabled?: boolean;
  /**
   * Dependencies that trigger a refetch when changed.
   */
  deps?: any[];
}

export interface UseJsonApiGetResult<T> {
  /**
   * The fetched data, or null if not yet fetched.
   */
  data: T | null;
  /**
   * Whether the query is currently loading.
   */
  loading: boolean;
  /**
   * Error message if the query failed.
   */
  error: string | null;
  /**
   * The full API response (includes raw data, pagination, etc.)
   */
  response: ApiResponseInterface | null;
  /**
   * Function to manually refetch the data.
   */
  refetch: () => Promise<void>;
  /**
   * Whether there is a next page available.
   */
  hasNextPage: boolean;
  /**
   * Whether there is a previous page available.
   */
  hasPreviousPage: boolean;
  /**
   * Function to fetch the next page.
   */
  fetchNextPage: () => Promise<void>;
  /**
   * Function to fetch the previous page.
   */
  fetchPreviousPage: () => Promise<void>;
}

/**
 * Hook for fetching data from a JSON:API endpoint.
 *
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useJsonApiGet<Article>({
 *   classKey: Modules.Article,
 *   endpoint: `/articles/${id}`,
 * });
 *
 * if (loading) return <Loading />;
 * if (error) return <Error message={error} />;
 * return <ArticleView article={data} />;
 * ```
 */
export function useJsonApiGet<T extends ApiDataInterface>(params: {
  classKey: ApiRequestDataTypeInterface;
  endpoint: string;
  companyId?: string;
  options?: UseJsonApiGetOptions;
}): UseJsonApiGetResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ApiResponseInterface | null>(null);
  const isMounted = useRef(true);

  const fetchData = useCallback(async () => {
    if (params.options?.enabled === false) return;

    setLoading(true);
    setError(null);

    try {
      const { JsonApiGet } = await import("../../unified/JsonApiRequest");
      const language = navigator.language.split("-")[0] || "en";

      const apiResponse = await JsonApiGet({
        classKey: params.classKey,
        endpoint: params.endpoint,
        companyId: params.companyId,
        language,
      });

      if (!isMounted.current) return;

      setResponse(apiResponse);

      if (apiResponse.ok) {
        setData(apiResponse.data as T);
      } else {
        setError(apiResponse.error);
      }
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [params.classKey, params.endpoint, params.companyId, params.options?.enabled]);

  const fetchNextPage = useCallback(async () => {
    if (!response?.nextPage) return;

    setLoading(true);
    try {
      const nextResponse = await response.nextPage();
      if (!isMounted.current) return;

      setResponse(nextResponse);
      if (nextResponse.ok) {
        setData(nextResponse.data as T);
      } else {
        setError(nextResponse.error);
      }
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [response]);

  const fetchPreviousPage = useCallback(async () => {
    if (!response?.prevPage) return;

    setLoading(true);
    try {
      const prevResponse = await response.prevPage();
      if (!isMounted.current) return;

      setResponse(prevResponse);
      if (prevResponse.ok) {
        setData(prevResponse.data as T);
      } else {
        setError(prevResponse.error);
      }
    } catch (err) {
      if (!isMounted.current) return;
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [response]);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
    };
  }, [fetchData, ...(params.options?.deps || [])]);

  return {
    data,
    loading,
    error,
    response,
    refetch: fetchData,
    hasNextPage: !!response?.next,
    hasPreviousPage: !!response?.prev,
    fetchNextPage,
    fetchPreviousPage,
  };
}
