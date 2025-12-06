"use client";

import { useMemo } from "react";
import { ApiDataInterface } from "../../core/interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../../core/interfaces/ApiRequestDataTypeInterface";
import { JsonApiHydratedDataInterface } from "../../core/interfaces/JsonApiHydratedDataInterface";
import { RehydrationFactory } from "../../core/factories/RehydrationFactory";

/**
 * Hook to rehydrate server-passed data into typed objects.
 * Use this when passing data from server components to client components.
 *
 * @example
 * ```tsx
 * // In server component
 * const article = await ArticleService.findOne(id);
 * return <ArticleDetails data={article.dehydrate()} />;
 *
 * // In client component
 * function ArticleDetails({ data }: { data: JsonApiHydratedDataInterface }) {
 *   const article = useRehydration<Article>(Modules.Article, data);
 *   return <div>{article.title}</div>;
 * }
 * ```
 */
export function useRehydration<T extends ApiDataInterface>(
  classKey: ApiRequestDataTypeInterface,
  data: JsonApiHydratedDataInterface | null | undefined,
): T | null {
  return useMemo(() => {
    if (!data) return null;
    return RehydrationFactory.rehydrate<T>(classKey, data);
  }, [classKey, data]);
}

/**
 * Hook to rehydrate a list of server-passed data into typed objects.
 */
export function useRehydrationList<T extends ApiDataInterface>(
  classKey: ApiRequestDataTypeInterface,
  data: JsonApiHydratedDataInterface[] | null | undefined,
): T[] {
  return useMemo(() => {
    if (!data || data.length === 0) return [];
    return RehydrationFactory.rehydrateList<T>(classKey, data);
  }, [classKey, data]);
}
