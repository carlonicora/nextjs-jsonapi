"use client";

import { useTranslations } from "next-intl";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { RoleFields, RoleInterface } from "../../data";
import { RoleService } from "../../data/role.service";
import "../../hooks/useRoleTableStructure";

export function RolesList() {
  const t = useTranslations();

  const data: DataListRetriever<RoleInterface> = useDataListRetriever({
    retriever: (params) => RoleService.findAllRoles(params),
    retrieverParams: {},
    module: Modules.Role,
    // Display only (call C8): the server's own order when no sort is chosen.
    defaultSort: "name",
  });

  return (
    <ContentListTable
      data={data}
      fields={[RoleFields.name, RoleFields.description]}
      tableGeneratorType={Modules.Role}
      title={t(`entities.roles`, { count: 2 })}
    />
  );
}
