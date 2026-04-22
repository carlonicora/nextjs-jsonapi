"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AssistantMessageInterface } from "../data/AssistantMessageInterface";
import { ReferenceBadges } from "./parts/ReferenceBadges";
import { SuggestedFollowUps } from "./parts/SuggestedFollowUps";

interface Props {
  message: AssistantMessageInterface;
  isLatestAssistant: boolean;
  onSelectFollowUp: (q: string) => void;
}

export function MessageItem({ message, isLatestAssistant, onSelectFollowUp }: Props) {
  const t = useTranslations();
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground max-w-[72%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-[78%] flex-col gap-1.5">
      <div className="text-muted-foreground flex items-center gap-2 pl-1 text-xs">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-white">
          <Sparkles className="h-2.5 w-2.5" />
        </span>
        <span>{t("features.assistant.agent_name")}</span>
      </div>
      <div className="bg-muted text-foreground rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>
      <ReferenceBadges references={message.references} />
      {isLatestAssistant && (
        <SuggestedFollowUps questions={message.suggestedQuestions ?? []} onSelect={onSelectFollowUp} />
      )}
    </div>
  );
}
