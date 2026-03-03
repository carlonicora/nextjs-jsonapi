"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components";
import { Tab } from "@/components/containers";
import { RoundPageContainerTitle } from "@/components/containers/RoundPageContainerTitle";
import { Header } from "@/components/navigations";
import { useHeaderChildren } from "@/contexts";
import { useUrlRewriter } from "@/hooks";
import { cn } from "@/index";
import { ModuleWithPermissions } from "@/permissions";
import { useSearchParams } from "next/navigation";
import { ReactNode, useState } from "react";

type RoundPageContainerProps = {
  module?: ModuleWithPermissions;
  id?: string;
  details?: ReactNode;
  tabs?: Tab[];
  children?: ReactNode;
  fullWidth?: boolean;
};

export function RoundPageContainer({ module, id, details, tabs, children, fullWidth }: RoundPageContainerProps) {
  const headerChildren = useHeaderChildren();
  const [showDetails, setShowDetails] = useState(false);

  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  const rewriteUrl = useUrlRewriter();

  const defaultValue = tabs ? (section && tabs.find((i) => i.key?.name === section)?.key) || tabs[0].key : undefined;

  return (
    <>
      <Header className="bg-sidebar border-0">{headerChildren}</Header>
      <div className="flex h-[calc(100vh-3rem)] w-full flex-col p-2 pt-0 pl-0">
        <div className="bg-background flex h-full w-full rounded-lg border p-0">
          <div className="flex w-full flex-col">
            <RoundPageContainerTitle
              module={module}
              details={details}
              showDetails={showDetails}
              setShowDetails={setShowDetails}
            />
            <div className="flex h-full w-full overflow-hidden">
              <div className={cn(`grow overflow-y-auto p-4`, fullWidth && `p-0`)}>
                <div className={cn(`mx-auto max-w-6xl space-y-12 p-8`, fullWidth && `max-w-full w-full p-0`)}>
                  {tabs ? (
                    <Tabs
                      defaultValue={defaultValue}
                      className="w-full"
                      onValueChange={(key) =>
                        module && id && rewriteUrl({ page: module, id: id, additionalParameters: { section: key } })
                      }
                    >
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
                    children
                  )}
                </div>
              </div>
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
