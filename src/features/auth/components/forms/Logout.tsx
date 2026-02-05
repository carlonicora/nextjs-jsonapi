"use client";

import { useEffect } from "react";
import { usePageUrlGenerator } from "../../../../hooks";
import { AuthService } from "../../data/auth.service";
import { clearClientStorage } from "../../utils/clearClientStorage";

interface LogoutProps {
  storageKeys?: string[];
}

export function Logout({ storageKeys }: LogoutProps) {
  const generateUrl = usePageUrlGenerator();

  useEffect(() => {
    const logOut = async () => {
      if (storageKeys?.length) {
        clearClientStorage(storageKeys);
      }
      await AuthService.logout();
      window.location.href = generateUrl({ page: `/` });
    };
    logOut();
  }, []);

  return <></>;
}
