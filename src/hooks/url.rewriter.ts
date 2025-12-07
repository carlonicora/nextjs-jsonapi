"use client";

import { useLocale } from "next-intl";
import { useCallback } from "react";
import { ModuleWithPermissions } from "../permissions";
import { usePageUrlGenerator } from "./usePageUrlGenerator";

export function useUrlRewriter() {
  const locale = useLocale();
  const generateUrl = usePageUrlGenerator();

  return useCallback(
    (params: { page: ModuleWithPermissions | string; id?: string; childPage?: string }): void => {
      window.history.replaceState(
        null,
        "",
        generateUrl({ page: params.page, id: params.id, childPage: params.childPage, language: locale }),
      );
    },
    [locale, generateUrl],
  );
}
