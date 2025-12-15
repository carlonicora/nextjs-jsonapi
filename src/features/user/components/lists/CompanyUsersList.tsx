"use client";

import { useTranslations } from "next-intl";
import { ReactNode, useEffect } from "react";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { useCurrentUserContext } from "../../contexts";
import { UserFields, UserInterface } from "../../data";
import { UserService } from "../../data/user.service";
import { UserEditor } from "../forms";

type CompanyUsersListProps = {
  isDeleted?: boolean;
};

export function CompanyUsersList({ isDeleted }: CompanyUsersListProps) {
  const { company } = useCurrentUserContext<UserInterface>();
  const t = useTranslations();

  const data: DataListRetriever<UserInterface> = useDataListRetriever({
    ready: !!company,
    retriever: (params) => UserService.findAllUsers(params),
    retrieverParams: { companyId: company?.id, isDeleted: isDeleted },
    module: Modules.User,
  }) as DataListRetriever<UserInterface>;

  useEffect(() => {
    if (company) data.setReady(true);
  }, [company]);

  const functions: ReactNode[] = [
    isDeleted ? undefined : <UserEditor key="create-user" propagateChanges={data.refresh} />,
  ];

  return (
    <ContentListTable
      data={data}
      fields={[UserFields.name, UserFields.email]}
      tableGeneratorType={Modules.User}
      functions={functions}
      title={t(`types.users`, { count: 2 })}
    />
  );
}
