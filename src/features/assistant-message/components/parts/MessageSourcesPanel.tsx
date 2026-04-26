"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ApiDataInterface } from "../../../../core";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import type { AssistantMessageInterface } from "../../data/AssistantMessageInterface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../shadcnui/ui/tabs";
import { ReferencesTab } from "./tabs/ReferencesTab";
import { CitationsTab } from "./tabs/CitationsTab";
import { ContentsTab } from "./tabs/ContentsTab";
import { UsersTab } from "./tabs/UsersTab";
import { SuggestedQuestionsTab } from "./tabs/SuggestedQuestionsTab";

interface Props {
  message: AssistantMessageInterface;
  isLatestAssistant: boolean;
  onSelectFollowUp: (q: string) => void;
  /**
   * Map of resolved source entities keyed by `chunk.nodeId`. When provided, the
   * Contents and Citations tabs use these to render real entity names. The
   * library is presentational; the app fetches and supplies these.
   */
  sources?: Map<string, ApiDataInterface>;
  /**
   * Deduplicated list of authors derived from the resolved sources. When
   * provided, the Users tab is populated from this list.
   */
  users?: ApiDataInterface[];
}

type TabKey = "suggested" | "references" | "citations" | "contents" | "users";

export function MessageSourcesPanel({ message, isLatestAssistant, onSelectFollowUp, sources, users }: Props) {
  const t = useTranslations();

  // Filter out references whose module has no pageUrl: those are
  // intermediary/relational nodes (e.g., BomItem, BomTreeNode) that the user
  // shouldn't navigate to directly.
  const visibleReferences = useMemo(
    () =>
      message.references.filter((ref) => {
        try {
          return !!ModuleRegistry.findByName(ref.type).pageUrl;
        } catch {
          return false;
        }
      }),
    [message.references],
  );

  const refsCount = visibleReferences.length;
  const citationsCount = message.citations.length;
  const suggestionsCount = isLatestAssistant ? message.suggestedQuestions.length : 0;

  const contentsCount = useMemo(() => {
    if (sources) return sources.size;
    // Fallback: derive from unique nodeId on chunks when sources haven't been
    // supplied yet (e.g., during the initial fetch).
    const ids = new Set<string>();
    for (const c of message.citations) {
      if (c.nodeId) ids.add(c.nodeId);
    }
    return ids.size;
  }, [message.citations, sources]);

  const usersCount = users?.length ?? 0;

  const total = refsCount + citationsCount + contentsCount + usersCount + suggestionsCount;

  const visibleTabs: TabKey[] = [];
  if (suggestionsCount > 0) visibleTabs.push("suggested");
  if (refsCount > 0) visibleTabs.push("references");
  if (citationsCount > 0) visibleTabs.push("citations");
  if (contentsCount > 0) visibleTabs.push("contents");
  if (usersCount > 0) visibleTabs.push("users");

  const autoOpen = isLatestAssistant && suggestionsCount > 0;
  const initialTab: TabKey | undefined = autoOpen ? "suggested" : visibleTabs[0];
  const [open, setOpen] = useState(autoOpen);
  const [active, setActive] = useState<TabKey | undefined>(initialTab);

  if (total === 0) return null;

  const panelId = `sources-panel-${message.id}`;

  return (
    <div className="mt-2 w-full min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="text-primary inline-flex items-center gap-1 text-xs font-medium"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {open
          ? t("features.assistant.message.sources.toggle_hide")
          : t("features.assistant.message.sources.toggle", { count: total })}
      </button>

      {open && (
        <div id={panelId} className="mt-2 w-full min-w-0">
          <Tabs value={active} onValueChange={(v) => setActive(v as TabKey)}>
            <TabsList>
              {visibleTabs.map((key) => (
                <TabsTrigger key={key} value={key}>
                  {t(`features.assistant.message.sources.tabs.${key === "suggested" ? "suggested_questions" : key}`)}
                  <span className="text-muted-foreground ml-1.5 text-[10px]">
                    {key === "suggested" && suggestionsCount}
                    {key === "references" && refsCount}
                    {key === "citations" && citationsCount}
                    {key === "contents" && contentsCount}
                    {key === "users" && usersCount}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {suggestionsCount > 0 && (
              <TabsContent value="suggested">
                <SuggestedQuestionsTab questions={message.suggestedQuestions} onSelect={onSelectFollowUp} />
              </TabsContent>
            )}
            {refsCount > 0 && (
              <TabsContent value="references">
                <ReferencesTab references={visibleReferences} />
              </TabsContent>
            )}
            {citationsCount > 0 && (
              <TabsContent value="citations">
                <CitationsTab citations={message.citations} sources={sources} />
              </TabsContent>
            )}
            {contentsCount > 0 && (
              <TabsContent value="contents">
                <ContentsTab citations={message.citations} sources={sources} />
              </TabsContent>
            )}
            {usersCount > 0 && (
              <TabsContent value="users">
                <UsersTab users={users ?? []} citations={message.citations} sources={sources} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}
    </div>
  );
}
