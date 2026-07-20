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
import { HEADER_ROW_MIN_H, RoundPageContainerTitle } from "@/components/containers/RoundPageContainerTitle";
import { Header, MobileNavigationBar } from "@/components/navigations";
import { useHeaderChildren, useHeaderLeftContent, useHeaderLogo, useHeaderMobileChildren } from "@/contexts";
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
  /**
   * `data-testid` for the page shell. Applied to the outermost content wrapper
   * of BOTH return branches — the pre-hydration one and the main one — so an
   * e2e suite gating page-readiness on the testid can attach before hydration
   * completes rather than racing it.
   */
  testId?: string;
  /**
   * Initial state of the `details` panel before the persisted preference (the
   * `round_page_details_state` cookie) is read. Defaults to `false` — the panel
   * starts collapsed, which suits an informational aside.
   *
   * Pass `true` when `details` holds PRIMARY navigation rather than an aside
   * (e.g. the chat / conversation list), where a collapsed-by-default panel
   * would hide the page's main affordance behind a toggle. The stored
   * preference still wins in both directions once the user sets one.
   *
   * Requires the title bar to be rendered (`!fullWidth || forceHeader`) —
   * that is where the toggle lives, so a `fullWidth` caller passing `details`
   * without `forceHeader` leaves the panel unreachable.
   */
  defaultDetailsOpen?: boolean;
  /**
   * Heading for the `details` panel. Rendered as a fixed header above the
   * panel's scroll area, used as the mobile `Sheet` title (replacing the old
   * hardcoded "Details"), and woven into the toggle's tooltip — so the control
   * reads "Show conversations" rather than an unlabelled icon.
   *
   * Strongly recommended whenever `details` holds primary navigation: without
   * it the panel is an unlabelled column and the toggle is unguessable.
   */
  detailsTitle?: ReactNode;
  /**
   * Icon for the `details` toggle. Defaults to an info glyph, which suits an
   * informational aside. Pass a panel/list glyph when `details` holds primary
   * navigation — an "info" icon actively misdescribes a conversation list.
   */
  detailsIcon?: ReactNode;
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
  testId,
  defaultDetailsOpen = false,
  detailsTitle,
  detailsIcon,
}: RoundPageContainerProps) {
  const headerChildren = useHeaderChildren();
  const headerLeftContent = useHeaderLeftContent();
  const headerLogo = useHeaderLogo();
  const headerMobileChildren = useHeaderMobileChildren();
  const [showDetails, setShowDetailsState] = useState(defaultDetailsOpen);
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const match = document.cookie.split("; ").find((row) => row.startsWith(`${detailsCookieName}=`));
    const stored = match?.split("=")[1];
    // Apply the stored preference in BOTH directions. Previously this only ever
    // opened the panel, which was harmless while the initial state was always
    // `false` — but with `defaultDetailsOpen` a caller can start open, and a user
    // who explicitly collapsed the panel must stay collapsed on the next load.
    if (stored === "true") setShowDetailsState(true);
    else if (stored === "false") setShowDetailsState(false);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scope the persisted preference PER MODULE. A single global cookie meant
  // collapsing an informational aside on one page silently collapsed a primary
  // navigation panel on another — so a page declaring `defaultDetailsOpen`
  // could still load collapsed because of an unrelated page's cookie.
  const detailsCookieName = module?.name ? `${DETAILS_COOKIE_NAME}_${module.name}` : DETAILS_COOKIE_NAME;

  const setShowDetails = useCallback(
    (value: boolean) => {
      setShowDetailsState(value);
      document.cookie = `${detailsCookieName}=${value}; path=/; max-age=${DETAILS_COOKIE_MAX_AGE}`;
    },
    [detailsCookieName],
  );

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

  const tabItems = useMemo(
    () => Object.fromEntries((tabs ?? []).map((tab) => [tabValue(tab), tab.contentLabel ?? tab.label])),
    [tabs],
  );

  const isReady = mounted;

  if (!isReady) {
    return (
      <>
        <Header
          leftContent={headerLeftContent}
          logo={headerLogo}
          mobileChildren={headerMobileChildren}
          className="bg-sidebar border-0"
        >
          {headerChildren}
        </Header>
        <div
          data-testid={testId}
          className={cn(
            "flex h-[calc(100svh-var(--app-header-h,3rem))] w-full flex-col",
            // The bottom safe-area inset is reserved HERE, not inside
            // MobileNavigationBar: padding within the bar's bordered card leaves
            // dead space inside the rounded box with the icons crammed against
            // its top edge (measured 78px tall for a 42px icon row). Held by the
            // shell instead, the bar keeps its natural height and the whole card
            // floats above the home indicator, which is what the detached-card
            // design intends. Resolves to plain p-1 wherever the inset is 0.
            isMobile ? "gap-1 p-1 pt-0 pb-[calc(0.25rem+env(safe-area-inset-bottom))]" : "p-2 pt-0 pl-0",
          )}
        >
          {/* `min-h-0 flex-1`, NOT `h-full`: the bar below is an in-flow sibling in
              this fixed-height flex column. `h-full` would resolve to 100% of the
              wrapper, leaving no room and pushing the bar below the fold (visible
              only after scrolling to the end of the page). */}
          <div className={cn("bg-background flex min-h-0 w-full flex-1", isMobile ? "" : "rounded-lg border p-0")}>
            <div className="flex w-full flex-col" />
          </div>
          <MobileNavigationBar />
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        leftContent={headerLeftContent}
        logo={headerLogo}
        mobileChildren={headerMobileChildren}
        className="bg-sidebar border-0"
      >
        {headerChildren}
      </Header>
      {/* svh, NOT dvh: iOS leaves dvh stale-short after the software keyboard
          closes (standalone PWAs especially), which opens a dead band under
          the bottom bar. svh is constant — the fully visible area in
          standalone, the chrome-visible area in Safari — so the bar can never
          end up above OR below the fold. */}
      <div
        data-testid={testId}
        className={cn(
          `flex h-[calc(100svh-var(--app-header-h,3rem))] w-full flex-col`,
          // The bottom safe-area inset is reserved HERE, not inside
          // MobileNavigationBar: padding within the bar's bordered card leaves
          // dead space inside the rounded box with the icons crammed against
          // its top edge (measured 78px tall for a 42px icon row). Held by the
          // shell instead, the bar keeps its natural height and the whole card
          // floats above the home indicator, which is what the detached-card
          // design intends. Resolves to plain p-1 wherever the inset is 0.
          isMobile ? "gap-1 p-1 pt-0 pb-[calc(0.25rem+env(safe-area-inset-bottom))]" : "p-2 pt-0 pl-0",
        )}
      >
        {/* `min-h-0 flex-1`, NOT `h-full`: MobileNavigationBar below is an in-flow
            sibling in this fixed-height flex column. `h-full` resolves to 100% of
            the wrapper, leaving the bar no room and pushing it below the fold —
            it then appears only after scrolling to the very end of the page. */}
        <div className="bg-background flex min-h-0 w-full flex-1 rounded-lg border p-0">
          <div className="flex w-full flex-col">
            {(!fullWidth || forceHeader) && (
              <RoundPageContainerTitle
                module={module}
                details={details}
                detailsTitle={detailsTitle}
                detailsIcon={detailsIcon}
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
                        items={tabItems}
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
                                items={tabItems}
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
                    <SheetTitle>{detailsTitle ?? "Details"}</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto p-6 pt-0">{details}</div>
                </SheetContent>
              </Sheet>
            ) : (
              <div
                className={cn(
                  // `flex-col` + a separate scroll body below: the header must stay
                  // put while the panel content scrolls. Scrolling on this element
                  // (as it did before) would carry the header away with the content.
                  "flex h-full shrink-0 flex-col overflow-hidden transition-all duration-300 ease-in-out",
                  showDetails ? "w-96 border-l opacity-100" : "ml-0 w-0 border-l-0 opacity-0",
                )}
              >
                {detailsTitle && (
                  // Mirrors RoundPageContainerTitle's structure exactly — border on an
                  // OUTER wrapper, height floor on the INNER row. Putting the border
                  // inside the measured row instead leaves this header 1px short of
                  // the page title bar, since `box-sizing: border-box` absorbs it.
                  <div className="shrink-0 border-b">
                    <div className={cn("flex items-center p-4", HEADER_ROW_MIN_H)}>
                      <span className="text-primary truncate text-sm font-semibold">{detailsTitle}</span>
                    </div>
                  </div>
                )}
                <div className="min-h-0 flex-1 overflow-y-auto p-4">{details}</div>
              </div>
            ))}
        </div>
        <MobileNavigationBar />
      </div>
    </>
  );
}
