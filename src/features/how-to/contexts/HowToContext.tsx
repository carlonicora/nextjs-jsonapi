"use client";

import { JsonApiHydratedDataInterface, Modules, rehydrate } from "../../../core";
import { BreadcrumbItemData } from "../../../interfaces";
import { usePageUrlGenerator } from "../../../hooks";
import { SharedProvider } from "../../../contexts/SharedContext";
import { HowToInterface } from "../data/HowToInterface";
import { HowToService } from "../data/HowToService";
import HowToDeleter from "../components/forms/HowToDeleter";
import HowToEditor from "../components/forms/HowToEditor";
import { useTranslations } from "next-intl";
import { createContext, ReactNode, useContext, useState } from "react";

interface HowToContextType {
  howTo: HowToInterface | undefined;
  setHowTo: (value: HowToInterface | undefined) => void;
  reloadHowTo: () => Promise<void>;
}

const HowToContext = createContext<HowToContextType | undefined>(undefined);

type HowToProviderProps = {
  children: ReactNode;
  dehydratedHowTo?: JsonApiHydratedDataInterface;
};

export const HowToProvider = ({ children, dehydratedHowTo }: HowToProviderProps) => {
  const generateUrl = usePageUrlGenerator();
  const t = useTranslations();

  const [howTo, setHowTo] = useState<HowToInterface | undefined>(
    dehydratedHowTo ? rehydrate<HowToInterface>(Modules.HowTo, dehydratedHowTo) : undefined,
  );

  const reloadHowTo = async () => {
    if (!howTo) return;

    const freshHowTo = await HowToService.findOne({ id: howTo.id });
    setHowTo(freshHowTo);
  };

  const breadcrumb = () => {
    const response: BreadcrumbItemData[] = [];

    response.push({
      name: t(`entities.howtos`, { count: 2 }),
      href: generateUrl({ page: Modules.HowTo }),
    });

    if (howTo)
      response.push({
        name: howTo.name,
        href: generateUrl({ page: Modules.HowTo, id: howTo.id }),
      });

    return response;
  };

  const title = () => {
    const response: any = {
      type: t(`entities.howtos`, { count: howTo ? 1 : 2 }),
    };

    const functions: ReactNode[] = [];

    if (howTo) {
      response.element = howTo.name;

      functions.push(<HowToDeleter key={`HowToDeleter`} howTo={howTo} />);
      functions.push(<HowToEditor key={`HowToEditor`} howTo={howTo} propagateChanges={setHowTo} />);
    } else {
      functions.push(<HowToEditor key={`HowToEditor`} />);
    }

    if (functions.length > 0) response.functions = functions;

    return response;
  };

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <HowToContext.Provider
        value={{
          howTo: howTo,
          setHowTo: setHowTo,
          reloadHowTo: reloadHowTo,
        }}
      >
        {children}
      </HowToContext.Provider>
    </SharedProvider>
  );
};

export const useHowToContext = (): HowToContextType => {
  const context = useContext(HowToContext);
  if (context === undefined) {
    throw new Error("useHowToContext must be used within a HowToProvider");
  }
  return context;
};
