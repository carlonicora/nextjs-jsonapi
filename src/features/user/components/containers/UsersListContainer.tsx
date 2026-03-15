"use client";

import { CompanyUsersList, RoundPageContainer } from "../../../../components";
import { Modules } from "../../../../core";
import { Action } from "../../../../permissions";
import { useCurrentUserContext } from "../../contexts";
import { UserInterface } from "../../data";

type UsersListContainerProps = {
  fullWidth?: boolean;
};

function UsersListContainerInternal({ fullWidth }: UsersListContainerProps) {
  return (
    <RoundPageContainer module={Modules.User} fullWidth={fullWidth}>
      <CompanyUsersList fullWidth={fullWidth} />
    </RoundPageContainer>
  );
}

export function UsersListContainer({ fullWidth }: UsersListContainerProps) {
  const { hasPermissionToModule } = useCurrentUserContext<UserInterface>();

  if (!hasPermissionToModule({ module: Modules.User, action: Action.Read })) return null;

  return <UsersListContainerInternal fullWidth={fullWidth} />;
}
