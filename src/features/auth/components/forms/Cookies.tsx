"use client";

import { useEffect, useState } from "react";
import { JsonApiHydratedDataInterface, Modules, rehydrate } from "../../../../core";
import { useI18nRouter } from "../../../../i18n";
import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { AuthInterface, AuthService } from "../../data";

export function Cookies({ dehydratedAuth, page }: { dehydratedAuth: JsonApiHydratedDataInterface; page?: string }) {
  const { setUser } = useCurrentUserContext<UserInterface>();
  const router = useI18nRouter();
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (hasSaved) return;
    async function saveTokenOnServer() {
      await AuthService.saveToken({ dehydratedAuth });
      const auth: AuthInterface = rehydrate(Modules.Auth, dehydratedAuth) as AuthInterface;
      setUser(auth.user as UserInterface);
      setHasSaved(true);

      if (page) {
        if (page.startsWith("/")) router.push(page ?? "/");
        window.location.href = page;
      }
    }
    saveTokenOnServer();
  }, [dehydratedAuth, setUser, hasSaved, router]);

  return null;
}
