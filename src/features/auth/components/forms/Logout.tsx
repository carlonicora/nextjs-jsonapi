"use client";

import { useEffect } from "react";
import { usePageUrlGenerator } from "../../../../hooks";
import { CURRENT_USER_STORAGE_KEY } from "../../../user/data/user.storage";
import { AuthService } from "../../data/auth.service";
import { clearClientStorage } from "../../utils/clearClientStorage";

interface LogoutProps {
  /**
   * Extra app-owned localStorage keys to drop alongside the session. The
   * library's own `user` key is always cleared and does not need listing.
   */
  storageKeys?: string[];
  /**
   * Awaited before anything is cleared (offline mode: warn about changes that
   * were not sent, then drop the device copy). Returning `false` cancels the
   * logout: storage, cookies and the current page are left as they are.
   */
  beforeLogout?: () => Promise<boolean>;
  /**
   * Where to go once logged out: a path inside this app, already locale-resolved
   * (the app's `getPathname` output), e.g. a link the user opened while logged in
   * with another account. Omitted, the home page.
   */
  redirectTo?: string;
}

export function Logout({ storageKeys, beforeLogout, redirectTo }: LogoutProps) {
  const generateUrl = usePageUrlGenerator();

  useEffect(() => {
    const logOut = async () => {
      if (beforeLogout && !(await beforeLogout())) return;
      // `CurrentUserProvider` persists the user in localStorage, so clearing the
      // cookies alone leaves the client believing the session is still alive:
      // the server renders as anonymous while every `useCurrentUserContext()`
      // consumer still reads the old user. The key belongs to this library, so
      // clearing it is this component's job — never the consuming app's.
      clearClientStorage([CURRENT_USER_STORAGE_KEY, ...(storageKeys ?? [])]);
      await AuthService.logout();
      window.location.href = redirectTo ?? generateUrl({ page: `/` });
    };
    logOut();
  }, []);

  return <></>;
}
