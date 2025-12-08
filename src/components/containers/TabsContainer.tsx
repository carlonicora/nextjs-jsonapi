"use client";

import { useCurrentUserContext } from "../../contexts";
import { UserInterface } from "../../features";
import { Action, ModuleWithPermissions } from "../../permissions";
import { ScrollArea, Tabs, TabsContent, TabsList, TabsTrigger } from "../../shadcnui";
import { cn } from "../../utils";

export type Tab = {
  label: string;
  contentLabel?: React.ReactNode;
  content: React.ReactNode;
  modules?: ModuleWithPermissions[];
  action?: Action;
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
