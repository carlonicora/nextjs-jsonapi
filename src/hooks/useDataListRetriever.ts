"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClientAbstractService } from "../core/abstracts/ClientAbstractService";

export type PageInfo = {
  startItem: number;
  endItem: number;
  pageSize: number;
};

export type DataListRetriever<T> = {
  ready?: boolean;
  setReady: (state: boolean) => void;
  isLoaded: boolean;
  data: T[] | undefined;
  next?: (onlyNewRecords?: boolean) => Promise<void>;
  previous?: (onlyNewRecords?: boolean) => Promise<void>;
  search: (search: string) => Promise<void>;
  refresh: () => Promise<void>;
  addAdditionalParameter: (key: string, value: any | null) => void;
  removeAdditionalParameter: (key: string) => void;
  setRefreshedElement: (element: T) => void;
  removeElement: (element: T) => void;
  isSearch: boolean;
  pageInfo?: PageInfo;
};

export function useDataListRetriever<T>(params: {
  ready?: boolean;
  retriever: (params: any) => Promise<T[]>;
  retrieverParams?: any;
  search?: string;
  addAdditionalParameter?: (key: string, value: any | null) => void;
  requiresSearch?: boolean;
  module: any;
}): DataListRetriever<T> {
  const [data, setData] = useState<T[] | undefined>(undefined);
  const [nextPage, setNextPage] = useState<string | undefined>(undefined);
  const [previousPage, setPreviousPage] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ready, setReady] = useState<boolean>(params.ready ?? true);
  const searchTermRef = useRef<string>("");
  const additionalParamsRef = useRef<any>({});
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const isPaginatingRef = useRef(false);

  const resolvedType = params.module;
  const resolvedService = ClientAbstractService; // We'll just use ClientAbstractService directly for pagination

  // Helper to parse page params from pagination URLs
  const parsePageParams = useCallback((url: string | undefined): { offset: number; size: number } | null => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const offset = parseInt(urlObj.searchParams.get("page[offset]") || "0", 10);
      const size = parseInt(urlObj.searchParams.get("page[size]") || "25", 10);
      return { offset, size };
    } catch {
      return null;
    }
  }, []);

  // Helper to adjust pagination URL offset (used when removing elements)
  const adjustPaginationUrl = useCallback((url: string | undefined, delta: number): string | undefined => {
    if (!url) return undefined;
    try {
      const urlObj = new URL(url);
      const currentOffset = parseInt(urlObj.searchParams.get("page[offset]") || "0", 10);
      const newOffset = Math.max(0, currentOffset + delta);
      urlObj.searchParams.set("page[offset]", String(newOffset));
      return urlObj.toString();
    } catch {
      return url;
    }
  }, []);

  // Calculate pageInfo from pagination URLs and current data
  const pageInfo = useMemo((): PageInfo | undefined => {
    if (!data || data.length === 0) return undefined;

    // Try to determine current offset and page size from pagination URLs
    const nextParams = parsePageParams(nextPage);
    const prevParams = parsePageParams(previousPage);

    let currentOffset = 0;
    let pageSize = 25; // default

    if (nextParams) {
      // If we have a next page, current offset = next offset - page size
      pageSize = nextParams.size;
      currentOffset = Math.max(0, nextParams.offset - pageSize);
    } else if (prevParams) {
      // If we only have a previous page (we're on the last page)
      pageSize = prevParams.size;
      currentOffset = prevParams.offset + pageSize;
    }

    const startItem = currentOffset + 1;
    const endItem = currentOffset + data.length;

    return { startItem, endItem, pageSize };
  }, [data, nextPage, previousPage, parsePageParams]);

  const stableParams = useMemo(
    () => ({
      service: resolvedService,
      type: resolvedType,
      retriever: params.retriever,
      retrieverParams: params.retrieverParams,
      requiresSearch: params.requiresSearch,
    }),
    [resolvedService, resolvedType, params.retriever, params.retrieverParams, params.requiresSearch],
  );

  const fetchData = useCallback(
    async (fetchParams?: { isRefine?: boolean; isRefresh?: boolean; callNext?: boolean; callPrevious?: boolean }) => {
      if (ready === false) return;

      // Prevent concurrent pagination calls
      if ((fetchParams?.callNext || fetchParams?.callPrevious) && isPaginatingRef.current) {
        return;
      }

      // Prevent concurrent fetches (unless it's a pagination call)
      if (isFetchingRef.current && !fetchParams?.callNext && !fetchParams?.callPrevious) return;

      // Mark pagination in progress
      if (fetchParams?.callNext || fetchParams?.callPrevious) {
        isPaginatingRef.current = true;
      }

      const thisRequestId = ++requestIdRef.current;
      isFetchingRef.current = true;

      if (stableParams.requiresSearch === true && fetchParams?.isRefine !== true && fetchParams?.isRefresh !== true) {
        return;
      }

      if (
        !nextPage &&
        !previousPage &&
        isLoaded &&
        fetchParams?.callNext !== true &&
        fetchParams?.callPrevious !== true &&
        params.search === searchTermRef.current
      ) {
        return;
      }

      const currentSearchTerm = searchTermRef.current;

      setIsLoaded(false);

      try {
        let response: T[];
        const nextRef = { next: undefined };
        const previousRef = { previous: undefined };
        const selfRef = { self: undefined };

        if (nextPage && fetchParams?.callNext && fetchParams?.isRefine !== true) {
          const ServiceClass = stableParams.service as typeof ClientAbstractService;

          response = await ServiceClass.next<T[]>({
            type: stableParams.type,
            endpoint: nextPage,
            next: nextRef,
            previous: previousRef,
            self: selfRef,
          });
        } else if (previousPage && fetchParams?.callPrevious && fetchParams?.isRefine !== true) {
          const ServiceClass = stableParams.service as typeof ClientAbstractService;

          response = await ServiceClass.previous<T[]>({
            type: stableParams.type,
            endpoint: previousPage,
            next: nextRef,
            previous: previousRef,
            self: selfRef,
          });
        } else {
          let retrieverParams = stableParams.retrieverParams ? { ...stableParams.retrieverParams } : {};

          retrieverParams = {
            ...retrieverParams,
            ...additionalParamsRef.current,
          };

          retrieverParams.search = currentSearchTerm;
          retrieverParams.next = nextRef;
          retrieverParams.previous = previousRef;
          retrieverParams.self = selfRef;

          response = await stableParams.retriever(retrieverParams);
        }

        // Only update state if this is still the latest request and wasn't aborted
        if (thisRequestId === requestIdRef.current && !abortControllerRef.current?.signal.aborted) {
          if (fetchParams?.isRefresh === true) {
            setData(response);
          } else {
            setData((prevData) => [...(prevData ? (prevData as T[]) : []), ...response]);
          }
          setIsLoaded(true);
          setNextPage(nextRef.next ? nextRef.next : undefined);
          setPreviousPage(previousRef.previous ? previousRef.previous : undefined);
        }
      } catch (error) {
        if (thisRequestId === requestIdRef.current) {
          setIsLoaded(true);
          console.error("Error fetching data:", error);
        }
      } finally {
        if (thisRequestId === requestIdRef.current) {
          isFetchingRef.current = false;
          isPaginatingRef.current = false;
        }
      }
    },
    [stableParams, ready, params.search],
  );

  const setRefreshedElement = useCallback(
    (element: T) => {
      setData((prevData) => {
        if (!prevData) return prevData;

        const index = prevData.findIndex((data) => (data as any).id === (element as any).id);
        if (index === -1) return prevData;

        // Use immutable update pattern instead of mutation
        return prevData.map((item, i) => (i === index ? element : item));
      });
    },
    [setData],
  );

  const removeElement = useCallback(
    (element: T) => {
      setData((prevData) => {
        if (!prevData) return prevData;

        const index = prevData.findIndex((data) => (data as any).id === (element as any).id);

        if (index === -1) return prevData;

        // Adjust nextPage offset since we're removing an item
        setNextPage((prev) => adjustPaginationUrl(prev, -1));

        const newData = [...prevData];
        newData.splice(index, 1);
        return newData;
      });
    },
    [adjustPaginationUrl],
  );

  // Consolidated effect: Only fetch once when ready and not loaded
  // This prevents the duplicate API calls that occurred when both the mount effect
  // and ready effect fired simultaneously on initial render
  useEffect(() => {
    // Only fetch if ready and haven't loaded yet
    if (ready && !isLoaded) {
      fetchData({ isRefresh: true });
    }
  }, [ready, fetchData]);

  const loadNext = useCallback(
    async (onlyNewRecords?: boolean) => {
      if (nextPage) {
        fetchData({ isRefresh: onlyNewRecords, callNext: true });
      }
    },
    [fetchData, nextPage],
  );

  const loadPrevious = useCallback(
    async (onlyNewRecords?: boolean) => {
      if (previousPage) fetchData({ isRefresh: onlyNewRecords, callPrevious: true });
    },
    [fetchData, previousPage],
  );

  const addAdditionalParameter = useCallback(
    (key: string, value: any | null) => {
      if (value === null) {
        delete additionalParamsRef.current[key];
      } else {
        additionalParamsRef.current[key] = value;
      }

      setReady(true);
      setNextPage(undefined);
      setPreviousPage(undefined);
      fetchData({ isRefine: true, isRefresh: true });
    },
    [fetchData],
  );

  const removeAdditionalParameter = useCallback(
    (key: string) => {
      if (additionalParamsRef.current[key] !== undefined) {
        delete additionalParamsRef.current[key];
        setNextPage(undefined);
        setPreviousPage(undefined);
        fetchData({ isRefine: true, isRefresh: true });
      }
    },
    [fetchData],
  );

  const search = useCallback(
    async (search: string) => {
      if (search === searchTermRef.current) return;

      setNextPage(undefined);
      setPreviousPage(undefined);
      searchTermRef.current = search;
      fetchData({ isRefine: true, isRefresh: true });
    },
    [fetchData],
  );

  const isSearch = !!searchTermRef.current;

  const refresh = useCallback(async () => {
    setNextPage(undefined);
    setPreviousPage(undefined);
    setData(undefined); // Clear stale data immediately before fetching new data
    fetchData({ isRefresh: true });
  }, [fetchData]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ready,
    setReady,
    isLoaded: isLoaded,
    data: data as T[],
    next: nextPage ? loadNext : undefined,
    previous: previousPage ? loadPrevious : undefined,
    search: search,
    addAdditionalParameter: addAdditionalParameter,
    removeAdditionalParameter: removeAdditionalParameter,
    refresh: refresh,
    setRefreshedElement: setRefreshedElement,
    isSearch: isSearch,
    removeElement: removeElement,
    pageInfo: pageInfo,
  };
}
