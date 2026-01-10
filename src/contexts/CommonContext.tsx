"use client";

import { useTranslations } from "next-intl";

import { createContext, ReactNode, useContext } from "react";
import { useCurrentUserContext } from "../features/user/contexts";
import { UserInterface } from "../features/user/data";
import { BreadcrumbItemData } from "../interfaces";
import { SharedProvider } from "./SharedContext";

interface CommonContextType {}

const CommonContext = createContext<CommonContextType | undefined>(undefined);

type CommonProviderProps = {
  children: ReactNode;
};

export const CommonProvider = ({ children }: CommonProviderProps) => {
  const { company } = useCurrentUserContext<UserInterface>();
  const t = useTranslations();

  const breadcrumb = () => {
    const response: BreadcrumbItemData[] = [];

    return response;
  };

  const title = () => {
    const response: any = {
      type: t(`common.title`),
    };

    if (company) response.element = company.name;

    return response;
  };

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <CommonContext.Provider value={{}}>{children}</CommonContext.Provider>
    </SharedProvider>
  );
};

export const useCommonContext = (): CommonContextType => {
  const context = useContext(CommonContext);
  if (context === undefined) {
    throw new Error("useCommonContext must be used within a CommonProvider");
  }
  return context;
};
