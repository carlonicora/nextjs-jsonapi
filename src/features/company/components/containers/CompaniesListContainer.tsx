"use client";

import { RoundPageContainer } from "../../../../components";
import { Modules } from "../../../../core";
import { CompanyProvider } from "../../contexts/CompanyContext";
import { CompaniesList } from "../lists/CompaniesList";

/**
 * Page container for the administrative company list.
 *
 * This has to be a client component: `module={Modules.Company}` is a registry
 * entry carrying an icon component and methods, and a Server Component cannot
 * pass it across the boundary ("Only plain objects can be passed to Client
 * Components"). Routes mount this container instead — the same shape as every
 * other list page.
 */
export function CompaniesListContainer() {
  return (
    <CompanyProvider>
      <RoundPageContainer module={Modules.Company} fullWidth>
        <CompaniesList fullWidth />
      </RoundPageContainer>
    </CompanyProvider>
  );
}
