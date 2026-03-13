"use client";

import { ReactNode } from "react";
import { UserInterface } from "../../../user";
import { useCurrentUserContext } from "../../../user/contexts";
import { CompanyProvider } from "../../contexts/CompanyContext";
import { CompanyDetails } from "../details/CompanyDetails";

type CompanyContainerProps = {
  configurationEditorSlot?: ReactNode;
};

export function CompanyContainer({ configurationEditorSlot }: CompanyContainerProps) {
  const { currentUser } = useCurrentUserContext<UserInterface>();
  if (!currentUser) return null;

  return (
    <CompanyProvider dehydratedCompany={currentUser.company} configurationEditorSlot={configurationEditorSlot}>
      <CompanyDetails />
    </CompanyProvider>
  );
}
