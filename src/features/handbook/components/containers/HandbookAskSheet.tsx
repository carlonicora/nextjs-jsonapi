"use client";

import { MessagesSquareIcon, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useState } from "react";

import { SectionHeader } from "../../../../components/typography";
import { Modules } from "../../../../core";
import { usePageUrlGenerator } from "../../../../hooks";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Switch,
} from "../../../../shadcnui";
import { AssistantComposer } from "../../../assistant/components/parts/AssistantComposer";
import { AssistantThread } from "../../../assistant/components/parts/AssistantThread";
import { useHandbookAsk } from "../../hooks/useHandbookAsk";

/**
 * The ask, reachable from every handbook surface.
 *
 * It is the same conversation as `/administration/handbook/chat`, not a second
 * one: both mount `useHandbookAsk`, so the threads listed here are the threads
 * listed there and a question asked in the sheet is readable on the route. Only
 * two things differ.
 *
 * 1. No url sync. A sheet floats over the page a reader is on; rewriting the
 *    address under it would send them somewhere else the moment they close it.
 *    `syncUrl: false` is exactly that difference.
 * 2. No thread sidebar. The full list belongs to the route — the sheet carries
 *    the five most recent threads in a menu and a link to the rest, which is
 *    what a side panel has room for.
 *
 * On the reader the sheet also knows which page is open, and offers to confine
 * the answer to it. The chip is off by default: a reader asking from inside a
 * page usually still wants the whole manual to answer, and the narrow search is
 * the deliberate choice.
 */
export function HandbookAskSheet({ handbookPageId }: HandbookAskSheetProps = {}) {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();

  const { threads, thread, messages, sending, ask, selectThread } = useHandbookAsk({ syncUrl: false });
  const [scoped, setScoped] = useState(false);

  const chatUrl = `${generateUrl({ page: Modules.HandbookPage })}/chat`;
  const showThread = !!thread || sending || messages.length > 0;

  const send = useCallback(
    async (question: string) => {
      await ask(question, { handbookPageId: scoped ? handbookPageId : undefined });
    },
    [ask, handbookPageId, scoped],
  );

  return (
    <Sheet>
      {/* `render`, never a nested <Button>: the trigger draws its own <button>,
          and wrapping one inside it is invalid HTML. */}
      <SheetTrigger render={<Button variant="outline" />}>
        <MessagesSquareIcon className="me-1 h-4 w-4" />
        {t("handbook.ask.open")}
      </SheetTrigger>
      <SheetContent side="end" className="flex w-full flex-col sm:max-w-lg">
        {/* pe-10 clears SheetContent's own close button, which sits at the
            inline end of the same row. */}
        <SheetHeader className="flex-row items-center gap-2 pe-10">
          <SheetTitle className="flex-1">{t("handbook.chat.title")}</SheetTitle>

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
              {t("handbook.ask.recent")}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {threads.slice(0, 5).map((item) => (
                <DropdownMenuItem key={item.id} onClick={() => void selectThread(item.id)}>
                  {item.title}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem>
                <Link href={chatUrl} className="text-primary w-full font-medium">
                  {t("handbook.ask.all")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {thread && (
            <Link href={`${chatUrl}/${thread.id}`} className="text-primary font-medium">
              {t("handbook.ask.expand")}
            </Link>
          )}
        </SheetHeader>

        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          {showThread ? (
            <AssistantThread
              messages={messages}
              sending={sending}
              status={t("handbook.chat.pending")}
              onSelectFollowUp={send}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center p-6">
              <div className="flex max-w-sm flex-col items-center text-center">
                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-white">
                  <Sparkles className="h-5 w-5" />
                </span>
                <SectionHeader>{t("handbook.chat.empty_state.title")}</SectionHeader>
                <p className="text-muted-foreground mt-1 text-sm">{t("handbook.chat.empty_state.subtitle")}</p>
              </div>
            </div>
          )}

          {handbookPageId && (
            <div className="flex items-center gap-2 border-t px-4 pt-3">
              <Switch checked={scoped} onCheckedChange={setScoped} aria-label={t("handbook.ask.thisPageOnly")} />
              <span className="text-muted-foreground text-xs">{t("handbook.ask.thisPageOnly")}</span>
            </div>
          )}

          <AssistantComposer
            onSend={send}
            disabled={sending}
            placeholder={t("handbook.chat.placeholder")}
            sendLabel={t("handbook.chat.ask")}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

type HandbookAskSheetProps = {
  /**
   * The page the reader has open. Present only on the reader; when set, the
   * sheet offers to confine the next question to that page.
   */
  handbookPageId?: string;
};
