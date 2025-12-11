"use client";

import { getRoleId } from "../../../../roles";
import { UserInterface } from "../../../user";
import { AdminUsersList } from "../../../user/components";
import { useCurrentUserContext } from "../../../user/contexts";
import { useCompanyContext } from "../../contexts/CompanyContext";
import { CompanyDetails } from "../details/CompanyDetails";

function AdminCompanyContainerInternal() {
  const { company } = useCompanyContext();
  const { hasRole } = useCurrentUserContext<UserInterface>();

  if (!company || !hasRole(getRoleId().Administrator)) return null;

  return (
    <>
      <CompanyDetails />
      <AdminUsersList />
    </>
  );
}

export function AdminCompanyContainer() {
  return <AdminCompanyContainerInternal />;
}
