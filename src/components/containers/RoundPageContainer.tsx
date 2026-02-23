"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components";
import { Tab } from "@/components/containers";
import { RoundPageContainerTitle } from "@/components/containers/RoundPageContainerTitle";
import { Header } from "@/components/navigations";
import { useHeaderChildren } from "@/contexts";
import { cn } from "@/index";
import { ModuleWithPermissions } from "@/permissions";
import { ReactNode, useState } from "react";

type RoundPageContainerTabProps = {
  module: ModuleWithPermissions;
  details?: ReactNode;
  tabs: Tab[];
  children?: never;
};

type RoundPageContainerChildrenProps = {
  module: ModuleWithPermissions;
  details?: ReactNode;
  tabs: never;
  children: ReactNode;
};

type RoundPageContainerProps = RoundPageContainerTabProps | RoundPageContainerChildrenProps;

export function RoundPageContainer({ module, details, tabs, children }: RoundPageContainerProps) {
  const headerChildren = useHeaderChildren();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Header className="bg-sidebar border-0">{headerChildren}</Header>
      <div className="flex h-[calc(100vh-3rem)] w-full flex-col p-2 pt-0">
        <div className="bg-background flex h-full w-full rounded border p-0">
          <div className="flex w-full flex-col">
            <RoundPageContainerTitle
              module={module}
              details={details}
              showDetails={showDetails}
              setShowDetails={setShowDetails}
            />
            <div className="flex h-full w-full overflow-hidden">
              {tabs ? (
                <Tabs defaultValue={tabs[0].label} className="w-full">
                  <div className="p-4">
                    <TabsList className={``}>
                      {tabs.map((tab) => (
                        <TabsTrigger key={tab.label} value={tab.label} className={`px-4`}>
                          {tab.contentLabel ?? tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>
                  <div className="flex w-full overflow-y-auto px-4">
                    {tabs.map((tab) => (
                      <TabsContent key={tab.label} value={tab.label} className={`pb-20`}>
                        {tab.content}
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              ) : (
                <>{children && <div className="grow overflow-y-auto p-4">{children}</div>}</>
              )}
              {details && (
                <div
                  className={cn(
                    "h-full shrink-0 overflow-hidden overflow-y-auto transition-all duration-300 ease-in-out",
                    showDetails ? "w-96 border-l p-4 opacity-100" : "ml-0 w-0 border-l-0 p-0 opacity-0",
                  )}
                >
                  {details}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
