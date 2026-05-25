"use client";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../../../shadcnui";
import { AssistantProvider, useAssistantContext } from "../../assistant/contexts/AssistantContext";
import { AssistantThread } from "../../assistant/components/parts/AssistantThread";
import { AssistantComposer } from "../../assistant/components/parts/AssistantComposer";
import { AssistantEmptyState } from "../../assistant/components/parts/AssistantEmptyState";

export function HelpAssistantSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col data-[side=right]:sm:max-w-2xl data-[side=right]:lg:max-w-3xl"
      >
        <AssistantProvider manageUrl={false}>
          <HelpAssistantSheetBody />
        </AssistantProvider>
      </SheetContent>
    </Sheet>
  );
}

function HelpAssistantSheetBody() {
  const t = useTranslations();
  const ctx = useAssistantContext();
  const showThread = !!ctx.assistant || ctx.sending || ctx.messages.length > 0;
  const send = (content: string) => ctx.sendMessage(content, { howToMode: true });

  return (
    <>
      <SheetHeader>
        <SheetTitle>{t("help.askAi.sheet.title")}</SheetTitle>
        <SheetDescription>{t("help.askAi.sheet.subtitle")}</SheetDescription>
      </SheetHeader>
      {!showThread ? (
        <AssistantEmptyState onSend={send} />
      ) : (
        <>
          <AssistantThread
            messages={ctx.messages}
            sending={ctx.sending}
            status={ctx.status}
            onSelectFollowUp={send}
            failedMessageIds={ctx.failedMessageIds}
            onRetry={ctx.retrySend}
          />
          <AssistantComposer onSend={send} disabled={ctx.sending} />
        </>
      )}
    </>
  );
}
