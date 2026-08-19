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
}

export function Logout({ storageKeys }: LogoutProps) {
  const generateUrl = usePageUrlGenerator();

  useEffect(() => {
    const logOut = async () => {
      // `CurrentUserProvider` persists the user in localStorage, so clearing the
      // cookies alone leaves the client believing the session is still alive:
      // the server renders as anonymous while every `useCurrentUserContext()`
      // consumer still reads the old user. The key belongs to this library, so
      // clearing it is this component's job — never the consuming app's.
      clearClientStorage([CURRENT_USER_STORAGE_KEY, ...(storageKeys ?? [])]);
      await AuthService.logout();
      window.location.href = generateUrl({ page: `/` });
    };
    logOut();
  }, []);

  return <></>;
}
