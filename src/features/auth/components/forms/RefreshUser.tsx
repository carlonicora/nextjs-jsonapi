"use client";

import { deleteCookie, getCookie } from "cookies-next";
import { useEffect } from "react";
import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { UserService } from "../../../user/data/user.service";
import { getTokenHandler } from "../../config";

export function RefreshUser() {
  const { setUser } = useCurrentUserContext<UserInterface>();

  const loadFullUser = async () => {
    const fullUser = await UserService.findFullUser();

    if (fullUser) {
      setUser(fullUser);
      const token = {
        userId: fullUser.id,
        companyId: fullUser.company?.id,
        roles: fullUser.roles.map((role) => role.id),
        features: fullUser.company?.features?.map((feature) => feature.id) ?? [],
      };

      await getTokenHandler()?.updateToken(token);
      deleteCookie("reloadData");
    }
  };

  useEffect(() => {
    const reloadData = getCookie("reloadData");
    if (reloadData !== undefined) loadFullUser();
  }, []);

  return null;
}
