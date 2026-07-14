"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { partitionTabs, Tab } from "@/components/containers";
import { RoundPageContainerTitle } from "@/components/containers/RoundPageContainerTitle";
import { Header } from "@/components/navigations";
import { useHeaderChildren, useHeaderLeftContent } from "@/contexts";
import { useUrlRewriter } from "@/hooks";
import { cn, useIsMobile } from "@/index";
import { ModuleWithPermissions } from "@/permissions";
import { useSearchParams } from "next/navigation";
import { Fragment, ReactNode, useCallback, useEffect, useMemo, useState } from "react";

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
  header?: ReactNode;
  /**
   * Section-navigation layout for `tabs`.
   * - `"tabs"` (default) — horizontal `TabsList` (desktop) / `Select` (mobile).
   *   Unchanged from prior behaviour; existing callers need no edits.
   * - `"rail"` — vertical 220px left rail grouped by each tab's `group`, with a
   *   `<md` grouped `Select` fallback. Mirrors the retired
   *   `PageContainerContentDetails` rail.
   */
  layout?: "tabs" | "rail";
  /**
   * Fired with the new section value (`tabValue`) on every tab change. Lets a
   * parent mirror the rail's active section (e.g. to drive a breadcrumb) since
   * the rail writes the URL via history.replaceState, which does not re-render
   * ancestors.
   */
  onSectionChange?: (section: string) => void;
};

// Rail trigger class: override the horizontal TabsTrigger defaults for a
// vertical, left-aligned, dark-filled active state. tailwind-merge inside cn()
// resolves the conflicts with the base classes.
const railTriggerClass = cn(
  "flex w-full items-center justify-start rounded-md px-3 py-1.5 text-left text-sm leading-tight whitespace-normal",
  "text-muted-foreground",
  "hover:bg-muted hover:text-foreground",
  "data-[state=active]:bg-foreground data-[state=active]:text-background",
  "data-[state=active]:font-semibold data-[state=active]:shadow-none",
);

/** Stable value for the URL `?section=` and active-tab matching. */
const tabValue = (tab: Tab): string => tab.sectionKey ?? tab.key?.name ?? tab.label;

export function RoundPageContainer({
  module,
  id,
  details,
  tabs,
  children,
  fullWidth,
  forceHeader,
  header,
  layout = "tabs",
  onSectionChange,
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
    ? (section && tabs.find((i) => tabValue(i) === section) ? section : null) || tabValue(tabs[0])
    : undefined;

  const [activeTab, setActiveTab] = useState(initialValue);

  useEffect(() => {
    if (tabs && section) {
      const tab = tabs.find((i) => tabValue(i) === section);
      if (tab) {
        setActiveTab(section);
      }
    }
  }, [section, tabs]);

  const handleTabChange = useCallback(
    (key: string) => {
      setActiveTab(key);
      if (module && id) {
        rewriteUrl({ page: module, id: id, additionalParameters: { section: key } });
      } else {
        // No backing entity (e.g. the settings hub): still reflect the active
        // section in the URL by rewriting ?section= against the current path.
        rewriteUrl({ page: window.location.pathname, additionalParameters: { section: key } });
      }
      onSectionChange?.(key);
    },
    [module, id, rewriteUrl, onSectionChange],
  );

  const activeFillHeight = tabs?.find((t) => tabValue(t) === activeTab)?.fillHeight === true;

  // Rail partition — only consumed by `layout="rail"` but cheap to compute.
  const { ungrouped, groups } = useMemo(() => partitionTabs(tabs ?? []), [tabs]);

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
              {layout === "rail" && tabs ? (
                // Rail layout: the vertical-tab navigation is a flush-left
                // sidebar of the card and the content fills the full remaining
                // width (like `fullWidth`) — NOT the centred max-w-6xl column.
                <Tabs
                  value={activeTab}
                  onValueChange={handleTabChange}
                  // Horizontal orientation (NOT vertical): shadcn Tabs style their
                  // list/triggers off the ancestor `group/tabs` data-orientation, so a
                  // vertical rail leaks `flex-col` etc. into any nested horizontal
                  // sub-tabs in the content (stacking them into a broken column). The
                  // flush-left rail is produced purely by the explicit flex classes on
                  // the <aside>/<TabsList> below, so orientation is free to be
                  // horizontal here. `data-[orientation=horizontal]:flex-row` overrides
                  // the shadcn root's default `data-[orientation=horizontal]:flex-col`
                  // to keep the rail and content side by side.
                  orientation="horizontal"
                  className="flex h-full min-w-0 grow overflow-hidden data-[orientation=horizontal]:flex-row"
                >
                  {/* Flush-left section rail — md and up */}
                  <aside
                    data-testid="round-page-rail"
                    className="hidden shrink-0 border-r p-4 md:flex md:w-56 md:flex-col md:overflow-y-auto"
                  >
                    <TabsList className="flex h-auto flex-col items-stretch gap-0.5 bg-transparent p-0">
                      {ungrouped.map((tab) => (
                        <TabsTrigger key={tab.label} value={tabValue(tab)} className={railTriggerClass}>
                          {tab.contentLabel ?? tab.label}
                        </TabsTrigger>
                      ))}
                      {groups.map((group) => (
                        <Fragment key={group.label}>
                          <div
                            role="presentation"
                            className="text-muted-foreground px-3 pt-3 pb-1 text-[10px] font-bold tracking-wider uppercase"
                          >
                            {group.label}
                          </div>
                          {group.items.map((tab) => (
                            <TabsTrigger key={tab.label} value={tabValue(tab)} className={railTriggerClass}>
                              {tab.contentLabel ?? tab.label}
                            </TabsTrigger>
                          ))}
                        </Fragment>
                      ))}
                    </TabsList>
                  </aside>

                  {/* Content — full width, fills the remaining space */}
                  <div className="flex min-w-0 grow flex-col overflow-hidden">
                    {/* Section Select — below md */}
                    <div data-testid="round-page-rail-select" className="p-2 md:hidden">
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
                          {ungrouped.map((tab) => (
                            <SelectItem key={tab.label} value={tabValue(tab)}>
                              {tab.contentLabel ?? tab.label}
                            </SelectItem>
                          ))}
                          {groups.map((group) => (
                            <SelectGroup key={group.label}>
                              <SelectLabel>{group.label}</SelectLabel>
                              {group.items.map((tab) => (
                                <SelectItem key={tab.label} value={tabValue(tab)}>
                                  {tab.contentLabel ?? tab.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div
                      className={cn(
                        `min-w-0 grow`,
                        activeFillHeight ? `flex flex-col overflow-hidden` : `overflow-y-auto p-4`,
                      )}
                    >
                      {/* Centre and constrain rail content (like the non-rail
                          layout). Fill-height tabs keep the full width. */}
                      <div
                        className={cn(
                          activeFillHeight ? `flex min-h-0 w-full flex-1 flex-col` : `mx-auto w-full max-w-6xl`,
                        )}
                      >
                        {header}
                        {tabs.map((tab) => (
                          <TabsContent
                            key={tab.label}
                            value={tabValue(tab)}
                            className={tab.fillHeight ? `flex min-h-0 w-full flex-1 flex-col` : ``}
                          >
                            {tab.content}
                          </TabsContent>
                        ))}
                        {children && <div className="flex">{children}</div>}
                      </div>
                    </div>
                  </div>
                </Tabs>
              ) : (
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
                    {header}
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
                                    <SelectItem key={tab.label} value={tabValue(tab)}>
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
                                  <TabsTrigger key={tab.label} value={tabValue(tab)} className="px-4">
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
                                value={tabValue(tab)}
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
    </>
  );
}
