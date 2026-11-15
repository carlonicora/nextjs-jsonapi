"use client";

import { useTranslations } from "next-intl";
import { RoundPageContainer } from "../../../../components/containers/RoundPageContainer";
import { Modules } from "../../../../core";
import { AdminCompanyPaymentsTab } from "../../../billing/admin-company/components/AdminCompanyPaymentsTab";
import { AdminCompanySubscriptionTab } from "../../../billing/admin-company/components/AdminCompanySubscriptionTab";
import { getRoleId } from "../../../../roles";
import { UserInterface } from "../../../user";
import { AdminUsersList } from "../../../user/components";
import { useCurrentUserContext } from "../../../user/contexts";
import { useCompanyContext } from "../../contexts/CompanyContext";
import { CompanyDetails } from "../details/CompanyDetails";

type AdminCompanyContainerProps = {
  /**
   * Draws the whole page itself as vertical tabs (Details, Subscription, Payments, Users). The
   * caller then must not wrap it in its own RoundPageContainer. Without it, the container renders
   * the details and the users list inside the caller's page container, as before.
   */
  showBilling?: boolean;
};

function AdminCompanyContainerInternal({ showBilling = false }: AdminCompanyContainerProps) {
  const t = useTranslations();
  const { company } = useCompanyContext();
  const { hasRole } = useCurrentUserContext<UserInterface>();

  if (!company || !hasRole(getRoleId().Administrator)) return null;

  if (!showBilling) {
    return (
      <>
        <CompanyDetails />
        <AdminUsersList />
      </>
    );
  }

  return (
    <RoundPageContainer
      module={Modules.Company}
      id={company.id}
      layout="rail"
      tabs={[
        {
          sectionKey: "details",
          label: t("billing.ui.admin_company.tabs.details"),
          content: <CompanyDetails />,
        },
        {
          sectionKey: "subscription",
          label: t("billing.ui.admin_company.subscription.title"),
          content: <AdminCompanySubscriptionTab />,
        },
        {
          sectionKey: "payments",
          label: t("billing.ui.admin_company.payments.title"),
          content: <AdminCompanyPaymentsTab />,
        },
        {
          sectionKey: "users",
          label: t("billing.ui.admin_company.tabs.users"),
          content: <AdminUsersList />,
        },
      ]}
    />
  );
}

export function AdminCompanyContainer({ showBilling = false }: AdminCompanyContainerProps = {}) {
  return <AdminCompanyContainerInternal showBilling={showBilling} />;
}
