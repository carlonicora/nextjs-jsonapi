"use client";

import { useTranslations } from "next-intl";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { UserInterface } from "../../../user";
import { RoleFields, RoleInterface, RoleService } from "../../data";

type UserRolesListProps = {
  user: UserInterface;
};

export function UserRolesList({ user }: UserRolesListProps) {
  const t = useTranslations();

  const data: DataListRetriever<RoleInterface> = useDataListRetriever({
    retriever: (params) => RoleService.findAllRolesByUser(params),
    retrieverParams: { userId: user.id },
    module: Modules.Role,
  });

  return (
    <ContentListTable
      data={data}
      fields={[RoleFields.name, RoleFields.description]}
      tableGeneratorType={Modules.Role}
      title={t(`types.roles`, { count: 2 })}
    />
  );
}
