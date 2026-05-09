"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components";
import { Tab } from "@/components/containers";
import { RoundPageContainerTitle } from "@/components/containers/RoundPageContainerTitle";
import { Header } from "@/components/navigations";
import { useHeaderChildren, useHeaderLeftContent } from "@/contexts";
import { useUrlRewriter } from "@/hooks";
import { cn, useIsMobile } from "@/index";
import { ModuleWithPermissions } from "@/permissions";
import { useSearchParams } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";

const DETAILS_COOKIE_NAME = "round_page_details_state";
const DETAILS_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

type RoundPageContainerProps = {
  module?: ModuleWithPermissions;
  id?: string;
  details?: ReactNode;
  tabs?: Tab[];
  children?: ReactNode;
  fullWidth?: boolean;
  forceHeader?: boolean;
};

export function RoundPageContainer({
  module,
  id,
  details,
  tabs,
  children,
  fullWidth,
  forceHeader,
}: RoundPageContainerProps) {
  const headerChildren = useHeaderChildren();
  const headerLeftContent = useHeaderLeftContent();
  const [showDetails, setShowDetailsState] = useState(false);
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const match = document.cookie.split("; ").find((row) => row.startsWith(`${DETAILS_COOKIE_NAME}=`));
    if (match?.split("=")[1] === "true") setShowDetailsState(true);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const setShowDetails = useCallback((value: boolean) => {
    setShowDetailsState(value);
    document.cookie = `${DETAILS_COOKIE_NAME}=${value}; path=/; max-age=${DETAILS_COOKIE_MAX_AGE}`;
  }, []);

  const searchParams = useSearchParams();
  const section = searchParams.get("section");

  const rewriteUrl = useUrlRewriter();

  const initialValue = tabs
    ? (section && tabs.find((i) => (i.key?.name ?? i.label) === section) ? section : null) ||
      (tabs[0].key?.name ?? tabs[0].label)
    : undefined;

  const [activeTab, setActiveTab] = useState(initialValue);

  useEffect(() => {
    if (tabs && section) {
      const tab = tabs.find((i) => (i.key?.name ?? i.label) === section);
      if (tab) {
        setActiveTab(section);
      }
    }
  }, [section, tabs]);

  const handleTabChange = useCallback(
    (key: string) => {
      setActiveTab(key);
      if (module && id) rewriteUrl({ page: module, id: id, additionalParameters: { section: key } });
    },
    [module, id, rewriteUrl],
  );

  const activeFillHeight = tabs?.find((t) => (t.key?.name ?? t.label) === activeTab)?.fillHeight === true;

  const isReady = mounted && isMobile !== undefined;

  if (!isReady) {
    return (
      <>
        <Header leftContent={headerLeftContent} className="bg-sidebar border-0">
          {headerChildren}
        </Header>
        <div className={cn("flex h-[calc(100vh-3rem)] w-full flex-col", isMobile ? "" : "p-2 pt-0 pl-0")}>
          <div className={cn("bg-background flex h-full w-full", isMobile ? "" : "rounded-lg border p-0")}>
            <div className="flex w-full flex-col" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header leftContent={headerLeftContent} className="bg-sidebar border-0">
        {headerChildren}
      </Header>
      <div className={cn(`flex h-[calc(100vh-3rem)] w-full flex-col`, isMobile ? "p-1 pt-0" : "p-2 pt-0 pl-0")}>
        <div className="bg-background flex h-full w-full rounded-lg border p-0">
          <div className="flex w-full flex-col">
            {(!fullWidth || forceHeader) && (
              <RoundPageContainerTitle
                module={module}
                details={details}
                showDetails={showDetails}
                setShowDetails={setShowDetails}
                fullWidth={fullWidth}
              />
            )}
            <div className="flex h-full w-full overflow-hidden">
              <div
                className={cn(
                  `grow`,
                  isMobile ? `p-2` : `p-4`,
                  activeFillHeight ? `flex flex-col overflow-hidden` : `overflow-y-auto`,
                  fullWidth && `p-0`,
                )}
              >
                <div
                  className={cn(
                    `mx-auto max-w-6xl space-y-8`,
                    activeFillHeight && `flex w-full flex-1 min-h-0 flex-col space-y-0`,
                    fullWidth && `max-w-full w-full p-0 h-full`,
                  )}
                >
                  {tabs ? (
                    <>
                      <Tabs
                        value={activeTab}
                        className={cn(`w-full`, activeFillHeight && `flex flex-1 min-h-0 flex-col`)}
                        onValueChange={handleTabChange}
                      >
                        {isMobile ? (
                          <div className="p-0">
                            <Select
                              value={activeTab}
                              onValueChange={(value) => {
                                if (value) handleTabChange(value);
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {tabs.map((tab) => (
                                  <SelectItem key={tab.label} value={tab.key?.name ?? tab.label}>
                                    {tab.contentLabel ?? tab.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="p-4">
                            <TabsList>
                              {tabs.map((tab) => (
                                <TabsTrigger key={tab.label} value={tab.key?.name ?? tab.label} className="px-4">
                                  {tab.contentLabel ?? tab.label}
                                </TabsTrigger>
                              ))}
                            </TabsList>
                          </div>
                        )}
                        <div
                          className={cn(
                            `flex w-full `,
                            isMobile ? `` : `px-4`,
                            activeFillHeight ? `flex-1 min-h-0` : `overflow-y-auto`,
                          )}
                        >
                          {tabs.map((tab) => (
                            <TabsContent
                              key={tab.label}
                              value={tab.key?.name ?? tab.label}
                              className={tab.fillHeight ? `flex flex-1 min-h-0 w-full flex-col` : `pb-20`}
                            >
                              {tab.content}
                            </TabsContent>
                          ))}
                        </div>
                      </Tabs>
                      {children && <div className={cn(`flex`, isMobile ? `px-2` : `px-4`)}>{children}</div>}
                    </>
                  ) : (
                    children
                  )}
                </div>
              </div>
              {details &&
                (isMobile ? (
                  <Sheet open={showDetails} onOpenChange={setShowDetails}>
                    <SheetContent side="right">
                      <SheetHeader>
                        <SheetTitle>Details</SheetTitle>
                      </SheetHeader>
                      <div className="overflow-y-auto p-6 pt-0">{details}</div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <div
                    className={cn(
                      "h-full shrink-0 overflow-hidden overflow-y-auto transition-all duration-300 ease-in-out",
                      showDetails ? "w-96 border-l p-4 opacity-100" : "ml-0 w-0 border-l-0 p-0 opacity-0",
                    )}
                  >
                    {details}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
