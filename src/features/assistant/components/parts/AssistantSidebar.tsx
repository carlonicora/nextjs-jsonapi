"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "../../../../shadcnui";
import type { AssistantInterface } from "../../data/AssistantInterface";
import { groupThreadsByBucket } from "../../utils/groupThreadsByBucket";

interface Props {
  threads: AssistantInterface[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function AssistantSidebar({ threads, activeId, onSelect, onNew }: Props) {
  const t = useTranslations();
  const groups = groupThreadsByBucket(threads);

  const renderSection = (label: string, items: AssistantInterface[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-2">
        <div className="text-muted-foreground px-2 py-1 text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </div>
        {items.map((thread) => (
          <button
            key={thread.id}
            type="button"
            onClick={() => onSelect(thread.id)}
            className={
              "block w-full truncate rounded-md px-2 py-1.5 text-left text-sm " +
              (activeId === thread.id
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-foreground")
            }
          >
            {thread.title}
          </button>
        ))}
      </div>
    );
  };

  return (
    <aside className="bg-muted/30 flex w-64 flex-col border-r">
      <div className="border-b p-3">
        <Button onClick={onNew} className="w-full" size="sm">
          <Plus className="mr-1 h-4 w-4" /> {t("features.assistant.new")}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {threads.length === 0 ? (
          <div className="text-muted-foreground mt-6 text-center text-xs">
            {t("features.assistant.empty_sidebar")}
          </div>
        ) : (
          <>
            {renderSection(t("features.assistant.bucket_today"), groups.today)}
            {renderSection(t("features.assistant.bucket_week"), groups.thisWeek)}
            {renderSection(t("features.assistant.bucket_earlier"), groups.earlier)}
          </>
        )}
      </div>
    </aside>
  );
}
