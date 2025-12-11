"use client";

import { useTranslations } from "next-intl";
import { CompanyUsersList, Tab, TabsContainer } from "../../../../components";
import { Modules } from "../../../../core";
import { Action } from "../../../../permissions";
import { useCurrentUserContext } from "../../contexts";
import { UserInterface } from "../../data";

function UsersListContainerInternal() {
  const { hasPermissionToModule } = useCurrentUserContext<UserInterface>();
  const t = useTranslations();

  if (!hasPermissionToModule({ module: Modules.User, action: Action.Delete })) return <CompanyUsersList />;

  const tabs: Tab[] = [
    {
      label: t(`types.users`, { count: 2 }),
      content: <CompanyUsersList />,
      modules: [Modules.Company],
      action: Action.Read,
    },
    {
      label: t(`foundations.user.deleted`),
      content: <CompanyUsersList isDeleted={true} />,
      modules: [Modules.Company],
      action: Action.Update,
    },
  ];

  return <TabsContainer tabs={tabs} />;
}

export function UsersListContainer() {
  return <UsersListContainerInternal />;
}
