"use client";

import { useCompanyContext } from "../../contexts/CompanyContext";
import { CompanyContent } from "./CompanyContent";
import { TokenStatusIndicator } from "./TokenStatusIndicator";

export function CompanyDetails() {
  const { company } = useCompanyContext();
  if (!company) return null;

  // The page header carries the title and the delete/edit commands, so this
  // block draws no title of its own.
  return (
    <div className="flex w-full flex-col gap-y-2">
      <TokenStatusIndicator size="md" />
      <CompanyContent company={company} />
    </div>
  );
}
