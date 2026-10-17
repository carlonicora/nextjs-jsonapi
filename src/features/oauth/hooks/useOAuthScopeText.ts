"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { OAUTH_SCOPE_DISPLAY, OAuthScopeInfo } from "../interfaces/oauth.interface";

export type OAuthScopeText = { name: string; description: string };

/**
 * Returns a function that words a scope in the active language.
 *
 * The scopes defined in `OAUTH_SCOPE_DISPLAY` read their name and description
 * from `oauth.ui.scopes.<id>.*`; the English text in that constant stays as
 * data only. Any other scope (an app's own, or one the server describes) keeps
 * the name and description it carries, falling back to its id.
 */
export function useOAuthScopeText(): (scope: string | OAuthScopeInfo) => OAuthScopeText {
  const t = useTranslations();
  return useCallback(
    (scope: string | OAuthScopeInfo): OAuthScopeText => {
      const id = typeof scope === "string" ? scope : scope.scope;
      if (Object.prototype.hasOwnProperty.call(OAUTH_SCOPE_DISPLAY, id)) {
        return {
          name: t(`oauth.ui.scopes.${id}.name`),
          description: t(`oauth.ui.scopes.${id}.description`),
        };
      }
      const info = typeof scope === "string" ? undefined : scope;
      return { name: info?.name || id, description: info?.description ?? "" };
    },
    [t],
  );
}
