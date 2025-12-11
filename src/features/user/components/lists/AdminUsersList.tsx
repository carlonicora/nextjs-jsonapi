"use client";

import { useTranslations } from "next-intl";
import { ContentListTable } from "../../../../components";
import { useCompanyContext } from "../../../../contexts";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { CompanyInterface } from "../../../company";
import { UserFields, UserInterface, UserService } from "../../data";
import { UserEditor } from "../forms";

type AdminUsersListProps = {
  company: CompanyInterface;
};

function AdminUsersListInternal({ company }: AdminUsersListProps) {
  const t = useTranslations();

  const data: DataListRetriever<UserInterface> = useDataListRetriever({
    retriever: (params) => UserService.findManyForAmin(params),
    retrieverParams: { companyId: company.id },
    module: Modules.User,
  });

  return (
    <ContentListTable
      title={t(`types.users`, { count: 2 })}
      data={data}
      fields={[UserFields.name, UserFields.email, UserFields.createdAt]}
      tableGeneratorType={Modules.User}
      functions={<UserEditor propagateChanges={data.refresh} adminCreated />}
    />
  );
}

export function AdminUsersList() {
  const { company } = useCompanyContext();
  if (!company) return null;

  return <AdminUsersListInternal company={company} />;
}
