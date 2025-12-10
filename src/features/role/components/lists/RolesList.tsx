"use client";

import { useTranslations } from "next-intl";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { RoleFields, RoleInterface, RoleService } from "../../data";

export function RolesList() {
  const t = useTranslations();

  const data: DataListRetriever<RoleInterface> = useDataListRetriever({
    retriever: (params) => RoleService.findAllRoles(params),
    retrieverParams: {},
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
