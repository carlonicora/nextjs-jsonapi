"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AssistantService } from "../data/AssistantService";
import { AssistantMessageService } from "../../assistant-message/data/AssistantMessageService";
import { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";
import { MessageList } from "../../assistant-message/components/MessageList";
import { MessageComposer } from "../../assistant-message/components/MessageComposer";

interface ChatContainerProps {
  assistantId: string;
}

export function ChatContainer({ assistantId }: ChatContainerProps) {
  const t = useTranslations();
  const [messages, setMessages] = useState<AssistantMessageInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const fetched = await AssistantMessageService.findByAssistant({ assistantId });
        if (!cancelled) setMessages(fetched);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assistantId]);

  const handleSend = useCallback(
    async (content: string) => {
      const newMessages = await AssistantService.appendMessage({ assistantId, content });
      setMessages((prev) => [...prev, ...newMessages]);
    },
    [assistantId],
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-muted-foreground">{t("ui.buttons.loading")}</div>
        ) : error ? (
          <div className="text-destructive">{error}</div>
        ) : (
          <MessageList messages={messages} />
        )}
      </div>
      <MessageComposer onSend={handleSend} disabled={loading} />
    </div>
  );
}
