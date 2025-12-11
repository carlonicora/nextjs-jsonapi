"use client";

import { useTranslations } from "next-intl";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { UserFields, UserInterface, UserService } from "../../data";

type RelevantUsersListProps = {
  id: string;
};

export function RelevantUsersList({ id }: RelevantUsersListProps) {
  const t = useTranslations();

  const data: DataListRetriever<UserInterface> = useDataListRetriever({
    module: Modules.User,
    retriever: (params) => UserService.findRelevant(params),
    retrieverParams: { id: id },
  }) as DataListRetriever<UserInterface>;

  return (
    <ContentListTable
      data={data}
      fields={[UserFields.name, UserFields.email, UserFields.relevance]}
      tableGeneratorType={Modules.User}
      title={t(`generic.relevant_users`)}
    />
  );
}
