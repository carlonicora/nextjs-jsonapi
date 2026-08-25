"use client";

import { useTranslations } from "next-intl";
import { Sparkles, AlertCircle } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AssistantMessageInterface } from "../data/AssistantMessageInterface";
import { MessageSourcesContainer } from "./parts/MessageSourcesContainer";

/**
 * Render slot for `approval-request` messages. The approval card lives in the
 * consuming app (it depends on the app-registered AssistantAction module), so
 * the chat renderer receives it as a function instead of importing it.
 */
export type ApprovalActionRenderer = (message: AssistantMessageInterface) => ReactNode;

/**
 * Render slot for `mention://<type>/<id>` links inside assistant markdown. The
 * consuming app owns the entity chip (avatar, hovercard, navigation), so the
 * chat renderer receives it as a function instead of importing it.
 */
export type MentionRenderer = (p: { type: string; id: string; alias: string }) => ReactNode;

const MENTION_HREF = /^mention:\/\/([^/]+)\/(.+)$/;

/**
 * `react-markdown` strips every href whose protocol is not in its safe list,
 * which would empty `mention://…` before the custom `a` renderer ever sees it.
 * Let that one scheme through and defer everything else to the default.
 */
function mentionUrlTransform(url: string): string {
  return MENTION_HREF.test(url) ? url : defaultUrlTransform(url);
}

interface Props {
  message: AssistantMessageInterface;
  isLatestAssistant: boolean;
  onSelectFollowUp: (q: string) => void;
  failedMessageIds?: Set<string>;
  onRetry?: (tempId: string) => void;
  renderApprovalAction?: ApprovalActionRenderer;
  renderMention?: MentionRenderer;
}

export function MessageItem({
  message,
  isLatestAssistant,
  onSelectFollowUp,
  failedMessageIds,
  onRetry,
  renderApprovalAction,
  renderMention,
}: Props) {
  const t = useTranslations();
  const isUser = message.role === "user";
  const isFailed = isUser && !!failedMessageIds?.has(message.id);

  const markdownComponents = useMemo(
    () => ({
      a: ({ href, children }: { href?: string; children?: ReactNode }) => {
        const match = href ? MENTION_HREF.exec(href) : null;
        if (!match || !renderMention) return <a href={href}>{children}</a>;
        return <>{renderMention({ type: match[1], id: match[2], alias: String(children ?? "") })}</>;
      },
    }),
    [renderMention],
  );

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        {/*
          Rendered as markdown, not raw text: a message composed with mentions
          is stored as `[Alias](mention://<type>/<id>)`, which would otherwise
          show the link markup and a bare uuid to the person who just wrote it.
          `markdownComponents` routes those hrefs through `renderMention`.
        */}
        {/*
          Links inside this bubble sit on `bg-primary`. The mention chip and any
          markdown link default to `text-primary`, which is the same teal and
          renders invisible here, so force the on-primary colour and lean on
          weight for the affordance (links are never underlined in this UI).
        */}
        <div className="bg-primary text-primary-foreground max-w-[72%] rounded-2xl rounded-ee-sm px-3.5 py-2 text-sm [&_a]:text-primary-foreground [&_a]:font-semibold [&_p]:m-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={mentionUrlTransform} components={markdownComponents}>
            {message.content}
          </ReactMarkdown>
        </div>
        {isFailed && (
          <div className="text-destructive flex items-center gap-2 text-xs">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{t("features.assistant.send_failed")}</span>
            <button type="button" onClick={() => onRetry?.(message.id)}>
              {t("features.assistant.retry")}
            </button>
          </div>
        )}
      </div>
    );
  }

  const isApprovalRequest = message.messageType === "approval-request" && !!renderApprovalAction;

  return (
    <div className="flex min-w-0 max-w-[78%] flex-col gap-1.5">
      <div className="text-muted-foreground flex items-center gap-2 ps-1 text-xs">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-white">
          <Sparkles className="h-2.5 w-2.5" />
        </span>
        <span>{t("features.assistant.agent_name")}</span>
      </div>
      {isApprovalRequest ? (
        renderApprovalAction(message)
      ) : (
        // Markdown blocks arrive unstyled under Tailwind preflight (all margins
        // zeroed): restore flow spacing between sibling blocks and give
        // blockquotes a callout treatment — assistant answers use them for
        // proposals and asides that must stand apart from factual prose.
        <div className="bg-muted text-foreground rounded-2xl rounded-es-sm px-3.5 py-2.5 text-sm leading-relaxed [&>*+*]:mt-3 [&_blockquote]:border-s-2 [&_blockquote]:border-primary/50 [&_blockquote]:bg-primary/5 [&_blockquote]:rounded-md [&_blockquote]:px-3 [&_blockquote]:py-1.5">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents} urlTransform={mentionUrlTransform}>
            {message.content}
          </ReactMarkdown>
        </div>
      )}
      <MessageSourcesContainer
        message={message}
        isLatestAssistant={isLatestAssistant}
        onSelectFollowUp={onSelectFollowUp}
      />
    </div>
  );
}
