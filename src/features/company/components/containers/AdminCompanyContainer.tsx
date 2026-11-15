"use client";

import { AdminCompanyBilling } from "../../../billing/admin-company/components/AdminCompanyBilling";
import { getRoleId } from "../../../../roles";
import { UserInterface } from "../../../user";
import { AdminUsersList } from "../../../user/components";
import { useCurrentUserContext } from "../../../user/contexts";
import { useCompanyContext } from "../../contexts/CompanyContext";
import { CompanyDetails } from "../details/CompanyDetails";

type AdminCompanyContainerProps = {
  showBilling?: boolean;
};

function AdminCompanyContainerInternal({ showBilling = false }: AdminCompanyContainerProps) {
  const { company } = useCompanyContext();
  const { hasRole } = useCurrentUserContext<UserInterface>();

  if (!company || !hasRole(getRoleId().Administrator)) return null;

  return (
    <>
      <CompanyDetails />
      {showBilling && <AdminCompanyBilling />}
      <AdminUsersList />
    </>
  );
}

export function AdminCompanyContainer({ showBilling = false }: AdminCompanyContainerProps = {}) {
  return <AdminCompanyContainerInternal showBilling={showBilling} />;
}
