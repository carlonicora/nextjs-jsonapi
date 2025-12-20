"use client";

import { useLocale } from "next-intl";
import { useCallback } from "react";
import { ModuleWithPermissions } from "../permissions";
import { usePageUrlGenerator } from "./usePageUrlGenerator";

export function useUrlRewriter() {
  const locale = useLocale();
  const generateUrl = usePageUrlGenerator();

  return useCallback(
    (params: {
      page: ModuleWithPermissions | string;
      id?: string;
      childPage?: ModuleWithPermissions | string;
      childId?: string;
    }): void => {
      window.history.replaceState(
        null,
        "",
        generateUrl({
          page: params.page,
          id: params.id,
          childPage: params.childPage,
          childId: params.childId,
          language: locale,
        }),
      );
    },
    [locale, generateUrl],
  );
}
