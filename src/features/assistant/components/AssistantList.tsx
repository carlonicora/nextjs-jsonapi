"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "../../../shadcnui";
import { AssistantService } from "../data/AssistantService";
import { AssistantInterface } from "../data/AssistantInterface";

export function AssistantList() {
  const t = useTranslations();
  const [assistants, setAssistants] = useState<AssistantInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await AssistantService.findMany();
      setAssistants(fetched);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleNewChat = async () => {
    setCreating(true);
    try {
      const id = crypto.randomUUID();
      const created = await AssistantService.create({
        id,
        firstMessage: t("features.assistant.new_chat_greeting"),
      });
      window.location.href = `/assistants/${created.id}`;
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("features.assistant.list_title")}</h1>
        <Button onClick={handleNewChat} disabled={creating}>
          {creating ? t("ui.buttons.creating") : t("features.assistant.new_chat")}
        </Button>
      </div>
      {loading ? (
        <div className="text-muted-foreground">{t("ui.buttons.loading")}</div>
      ) : assistants.length === 0 ? (
        <div className="text-muted-foreground">{t("features.assistant.no_threads")}</div>
      ) : (
        <ul className="flex flex-col gap-y-2">
          {assistants.map((a) => (
            <li key={a.id}>
              <Link href={`/assistants/${a.id}`} className="hover:bg-muted block rounded-md border p-3">
                <div className="font-medium">{a.title}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
