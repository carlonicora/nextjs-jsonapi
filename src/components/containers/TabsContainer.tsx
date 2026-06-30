"use client";

import { useCurrentUserContext } from "../../contexts";
import { UserInterface } from "../../features/user/data";
import { Action, ModuleWithPermissions } from "../../permissions";
import { ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger } from "../../shadcnui";
import { cn } from "../../utils";

export type Tab = {
  key?: ModuleWithPermissions;
  label: string;
  contentLabel?: React.ReactNode;
  content: React.ReactNode;
  modules?: ModuleWithPermissions[];
  action?: Action;
  /**
   * Section header this tab clusters under in the `RoundPageContainer`
   * `layout="rail"` navigation. Tabs without a `group` render at the top of the
   * rail (the "pinned" stratum) in declared order; groups render in first-seen
   * order. Ignored by the default `layout="tabs"` (flat) rendering.
   */
  group?: string;
  /**
   * Stable identifier used for the URL `?section=` value and active-tab
   * matching. Defaults to `key?.name ?? label`. Provide this for tabs that have
   * no `key` (no backing module) but still need a stable, locale-independent
   * deep link — e.g. `"dashboard"`, `"analysis"`, `"timeline"`.
   */
  sectionKey?: string;
  /**
   * When true, the tab content fills the available viewport height inside its
   * container. The tab's wrapper chain switches to a flex-column layout with
   * `flex-1 min-h-0`, the outer page scroll is suppressed, and the tab content
   * becomes the only scroll context. The tabs strip stays sticky at the top.
   *
   * Honoured by `RoundPageContainer`. `TabsContainer` (this file) ignores it
   * because it doesn't own the surrounding scroll container.
   */
  fillHeight?: boolean;
};

type TabsContainerProps = {
  tabs: Tab[];
  defaultTab?: string;
  tabsListClassName?: string;
  tabsTriggerClassName?: string;
  scrollAreaClassName?: string;
  style?: "navigation";
  additionalComponent?: React.ReactNode;
};

export function TabsContainer({
  tabs,
  defaultTab,
  tabsListClassName,
  tabsTriggerClassName,
  scrollAreaClassName,
  style,
  additionalComponent,
}: TabsContainerProps) {
  const { hasPermissionToModules } = useCurrentUserContext<UserInterface>();

  const validTabs = tabs.filter((tab) =>
    tab.modules && tab.action ? hasPermissionToModules({ modules: tab.modules, action: tab.action }) : true,
  );

  if (validTabs.length === 0) return null;

  const defaultValue = defaultTab ?? tabs[0].label;

  if (validTabs.length === 1) {
    return validTabs[0].content;
  }

  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      <div className="flex w-full items-center justify-between">
        <TabsList
          className={cn(
            `${style ? `my-4 flex w-full justify-start rounded-none border-b bg-transparent pb-0` : ``}`,
            tabsListClassName,
          )}
        >
          {validTabs.map((tab) => (
            <TabsTrigger
              key={tab.label}
              value={tab.label}
              className={cn(
                `${style ? `text-muted-foreground border-accent data-[state=active]:text-foreground hover:text-foreground cursor-pointer rounded-none bg-transparent pb-2 text-sm font-light hover:border-0 data-[state=active]:border-b data-[state=active]:font-medium data-[state=active]:shadow-none` : `text-primary text-xs`}`,
                tabsTriggerClassName,
              )}
            >
              {tab.contentLabel ?? tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {additionalComponent && additionalComponent}
      </div>
      {scrollAreaClassName ? (
        <ScrollArea className={scrollAreaClassName}>
          {validTabs.map((tab) => (
            <TabsContent key={tab.label} value={tab.label}>
              {tab.content}
            </TabsContent>
          ))}
        </ScrollArea>
      ) : (
        <>
          {validTabs.map((tab) => (
            <TabsContent key={tab.label} value={tab.label}>
              {tab.content}
            </TabsContent>
          ))}
        </>
      )}
    </Tabs>
  );
}
