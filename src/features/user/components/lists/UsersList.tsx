"use client";

import { useTranslations } from "next-intl";
import { ReactElement } from "react";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever } from "../../../../hooks";
import { UserFields, UserInterface } from "../../data";

type UsersListProps = {
  data: DataListRetriever<UserInterface>;
  optionComponents?: ReactElement<any>[];
  removeFunction?: (user: UserInterface) => Promise<void>;
  hideOptions?: boolean;
  showRelevance?: boolean;
  restrictToJoinRequests?: boolean;
};

export function UsersList({ data, optionComponents, removeFunction, hideOptions, showRelevance }: UsersListProps) {
  const t = useTranslations();

  return (
    <ContentListTable
      data={data}
      fields={[UserFields.name, UserFields.email]}
      tableGeneratorType={Modules.User}
      title={t(`types.users`, { count: 2 })}
    />
  );
}
