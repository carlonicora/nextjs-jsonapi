"use client";

import { useTranslations } from "next-intl";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { RoleInterface } from "../../../role";
import { UserFields, UserInterface } from "../../data";
import { UserService } from "../../data/user.service";

type RoleUsersListProps = {
  role: RoleInterface;
};

export function RoleUsersList({ role }: RoleUsersListProps) {
  const t = useTranslations();

  const data: DataListRetriever<UserInterface> = useDataListRetriever({
    retriever: (params) => UserService.findAllUsersByRole(params),
    retrieverParams: { roleId: role.id },
    module: Modules.User,
  }) as DataListRetriever<UserInterface>;

  return (
    <ContentListTable
      data={data}
      fields={[UserFields.name, UserFields.email]}
      tableGeneratorType={Modules.User}
      title={t(`types.users`, { count: 2 })}
    />
  );
}
