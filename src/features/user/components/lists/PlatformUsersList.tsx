"use client";

import { useTranslations } from "next-intl";
import { ContentListTable } from "../../../../components";
import { Modules } from "../../../../core";
import { DataListRetriever, useDataListRetriever } from "../../../../hooks";
import { UserFields, UserInterface } from "../../data";
import { UserService } from "../../data/user.service";

type PlatformUsersListProps = {
  includeDeleted?: boolean;
  fullWidth?: boolean;
};

/**
 * Every user on the platform, across all companies.
 *
 * Deliberately NOT company-scoped: `CompanyUsersList` and `AdminUsersList` both
 * build `/companies/{id}/users` and need a company in context, so they render
 * nothing for a system administrator — who has no Company. This one calls
 * `UserService.findMany`, which hits `GET /users`; that controller widens the
 * result set itself when the caller holds Administrator or CompanyAdministrator
 * (see the backend user controller's `isAdmin` flag), so the same component is
 * safe for both.
 */
export function PlatformUsersList({ includeDeleted, fullWidth }: PlatformUsersListProps) {
  const t = useTranslations();

  const data: DataListRetriever<UserInterface> = useDataListRetriever({
    retriever: (params) => UserService.findMany(params),
    retrieverParams: { includeDeleted: includeDeleted },
    module: Modules.User,
  }) as DataListRetriever<UserInterface>;

  return (
    <ContentListTable
      data={data}
      fields={[UserFields.name, UserFields.email, UserFields.company]}
      tableGeneratorType={Modules.User}
      fullWidth={fullWidth}
      allowSearch
      title={t(`entities.users`, { count: 2 })}
    />
  );
}
