"use client";

import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { CompanyProvider } from "../../contexts/CompanyContext";
import { CompanyDetails } from "../details/CompanyDetails";

export function CompanyContainer() {
  const { currentUser } = useCurrentUserContext<UserInterface>();
  if (!currentUser) return null;

  return (
    <CompanyProvider dehydratedCompany={currentUser.company}>
      <CompanyDetails />
    </CompanyProvider>
  );
}
