"use client";

import { useCallback } from "react";
import { ModuleWithPermissions } from "../permissions";
import { usePageUrlGenerator } from "./usePageUrlGenerator";

export function useUrlRewriter() {
  const generateUrl = usePageUrlGenerator();

  return useCallback(
    (params: {
      page: ModuleWithPermissions | string;
      id?: string;
      childPage?: ModuleWithPermissions | string;
      childId?: string;
      additionalParameters?: { [key: string]: string | string[] | undefined };
      /** "push" adds a browser history step (Back returns to the previous URL); default "replace". */
      mode?: "replace" | "push";
    }): void => {
      const write = params.mode === "push" ? window.history.pushState : window.history.replaceState;
      write.call(
        window.history,
        null,
        "",
        generateUrl({
          page: params.page,
          id: params.id,
          childPage: params.childPage,
          childId: params.childId,
          additionalParameters: params.additionalParameters,
        }),
      );
    },
    [generateUrl],
  );
}
