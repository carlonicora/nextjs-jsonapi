"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useContext, useState } from "react";
import { SharedProvider } from "../../../contexts";
import { JsonApiHydratedDataInterface, Modules, rehydrate } from "../../../core";
import { usePageUrlGenerator } from "../../../hooks";
import { BreadcrumbItemData } from "../../../interfaces";
import { Action } from "../../../permissions";
import { getRoleId } from "../../../roles";
import { UserInterface } from "../../user";
import { useCurrentUserContext } from "../../user/contexts";
import { CompanyDeleter, CompanyEditor } from "../components";
import { CompanyInterface } from "../data";

interface CompanyContextType {
  company: CompanyInterface | undefined;
  setCompany: (value: CompanyInterface | undefined) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

type CompanyProviderProps = {
  children: ReactNode;
  dehydratedCompany?: JsonApiHydratedDataInterface;
};

const defaultContextValue: CompanyContextType = {
  company: undefined,
  setCompany: () => {},
};

export const CompanyProvider = ({ children, dehydratedCompany }: CompanyProviderProps) => {
  const generateUrl = usePageUrlGenerator();
  const t = useTranslations();
  const { hasPermissionToModule, hasRole } = useCurrentUserContext<UserInterface>();

  const [company, setCompany] = useState<CompanyInterface | undefined>(
    dehydratedCompany ? rehydrate<CompanyInterface>(Modules.Company, dehydratedCompany) : undefined,
  );

  const breadcrumb = () => {
    const response: BreadcrumbItemData[] = [];

    if (company)
      response.push({
        name: company.name,
        href: generateUrl({ page: Modules.Company }),
      });

    return response;
  };

  const title = () => {
    const response: any = {
      type: t(`entities.companies`, { count: company ? 1 : 2 }),
    };

    if (company) response.element = company.name;

    const functions: ReactNode[] = [];

    if (
      company &&
      (hasRole(getRoleId().Administrator) || hasRole(getRoleId().CompanyAdministrator)) &&
      hasPermissionToModule({ module: Modules.Company, action: Action.Delete })
    )
      functions.push(<CompanyDeleter key="companyDeleter" company={company} />);

    if (
      hasRole(getRoleId().Administrator) ||
      hasPermissionToModule({ module: Modules.Company, action: Action.Update })
    ) {
      // if (company) functions.push(<CompanyConfigurationEditor key="companyConfigurationEditor" company={company} />);
      functions.push(<CompanyEditor key="companyEditor" company={company} propagateChanges={setCompany} />);
    }

    if (functions.length > 0) response.functions = functions;

    return response;
  };

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <CompanyContext.Provider
        value={{
          company: company,
          setCompany: setCompany,
        }}
      >
        {children}
      </CompanyContext.Provider>
    </SharedProvider>
  );
};

export const useCompanyContext = (): CompanyContextType => {
  return useContext(CompanyContext) ?? defaultContextValue;
};
