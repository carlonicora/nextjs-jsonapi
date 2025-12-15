"use client";

import { useTranslations } from "next-intl";
import { CommonDeleter } from "../../../../components";
import { Modules } from "../../../../core";
import { useI18nRouter, usePageUrlGenerator } from "../../../../hooks";
import { Action } from "../../../../permissions";
import { getRoleId } from "../../../../roles";
import { useCurrentUserContext } from "../../contexts";
import { UserInterface } from "../../data";
import { UserService } from "../../data/user.service";

type UserDeleterProps = {
  user: UserInterface;
  companyId?: string;
  onDeleted?: () => void;
};

function UserDeleterInternal({ user, onDeleted, companyId }: UserDeleterProps) {
  const { currentUser, company } = useCurrentUserContext<UserInterface>();
  const generateUrl = usePageUrlGenerator();
  const router = useI18nRouter();
  const t = useTranslations();

  let cId;
  if (currentUser?.roles.find((role) => role.id === getRoleId().Administrator) && companyId) {
    cId = companyId;
  } else {
    if (!company) return;
    cId = company.id;
  }

  return (
    <CommonDeleter
      type={`users`}
      deleteFunction={() =>
        UserService.delete({ userId: user.id, companyId: cId }).then(() =>
          onDeleted ? onDeleted() : router.push(generateUrl({ page: Modules.User })),
        )
      }
    />
  );
}

export function UserDeleter(props: UserDeleterProps) {
  const { hasPermissionToModule } = useCurrentUserContext<UserInterface>();
  if (!hasPermissionToModule({ module: Modules.User, action: Action.Delete, data: props.user })) return null;

  return <UserDeleterInternal {...props} />;
}
