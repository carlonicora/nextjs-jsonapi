"use client";

import { AbstractService } from "../core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

  const resolvedType = params.module;
  const resolvedService = AbstractService; // We'll just use AbstractService directly for pagination

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

      const thisRequestId = ++requestIdRef.current;

      if (stableParams.requiresSearch === true && fetchParams?.isRefine !== true && fetchParams?.isRefresh !== true)
        return;

      if (
        !nextPage &&
        !previousPage &&
        isLoaded &&
        fetchParams?.callNext !== true &&
        fetchParams?.callPrevious !== true &&
        params.search === searchTermRef.current
      )
        return;

      const currentSearchTerm = searchTermRef.current;

      setIsLoaded(false);

      try {
        let response: T[];
        const nextRef = { next: undefined };
        const previousRef = { previous: undefined };

        if (nextPage && fetchParams?.callNext && fetchParams?.isRefine !== true) {
          const ServiceClass = stableParams.service as typeof AbstractService;

          response = await ServiceClass.next<T[]>({
            type: stableParams.type,
            endpoint: nextPage,
            next: nextRef,
            previous: previousRef,
          });
        } else if (previousPage && fetchParams?.callPrevious && fetchParams?.isRefine !== true) {
          const ServiceClass = stableParams.service as typeof AbstractService;

          response = await ServiceClass.previous<T[]>({
            type: stableParams.type,
            endpoint: previousPage,
            next: nextRef,
            previous: previousRef,
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
        // Don't update state if request was aborted (AbortController disabled)
        if (thisRequestId === requestIdRef.current) {
          setIsLoaded(true);
          console.error("Error fetching data:", error);
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

        prevData[index] = element;

        return [...prevData];
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

        prevData.splice(index, 1);

        return [...prevData];
      });
    },
    [setData],
  );

  useEffect(() => {
    if (!isLoaded || nextPage !== undefined || previousPage !== undefined) fetchData();
  }, []);

  useEffect(() => {
    if (ready) {
      fetchData({ isRefresh: true });
    }
  }, [ready]);

  const loadNext = useCallback(
    async (onlyNewRecords?: boolean) => {
      if (nextPage) fetchData({ isRefresh: onlyNewRecords, callNext: true });
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
  };
}
