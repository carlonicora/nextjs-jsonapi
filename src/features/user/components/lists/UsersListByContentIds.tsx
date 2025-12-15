"use client";

import { useTranslations } from "next-intl";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { UserFields, UserInterface } from "../../data";
import { UserService } from "../../data/user.service";

type UsersListByContentIdsProps = {
  contentIds: string[];
};

export function UsersListByContentIds({ contentIds }: UsersListByContentIdsProps) {
  const t = useTranslations();

  const data: DataListRetriever<UserInterface> = useDataListRetriever({
    module: Modules.User,
    retriever: (params) => UserService.findManyByContentIds(params),
    retrieverParams: { contentIds: contentIds },
  });

  return (
    <ContentListTable
      data={data}
      fields={[UserFields.name, UserFields.email]}
      tableGeneratorType={Modules.User}
      title={t(`generic.relevant_users`)}
    />
  );
}
