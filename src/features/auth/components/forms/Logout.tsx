"use client";

import { useEffect } from "react";
import { usePageUrlGenerator } from "../../../../hooks";
import { AuthService } from "../../data";

export function Logout() {
  const generateUrl = usePageUrlGenerator();

  useEffect(() => {
    const logOut = async () => {
      await AuthService.logout();
      window.location.href = generateUrl({ page: `/` });
    };
    logOut();
  }, []);

  return <></>;
}
