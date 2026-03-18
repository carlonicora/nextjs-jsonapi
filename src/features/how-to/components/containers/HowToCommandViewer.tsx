"use client";

import { ArrowLeft, BookOpen, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

import { BlockNoteEditorContainer } from "../../../../components";
import { Button } from "../../../../shadcnui";
import { HowToInterface } from "../../data/HowToInterface";
import { calculateReadingTime, extractHeadings } from "../../utils/blocknote";

type HowToCommandViewerProps = {
  howTo: HowToInterface;
  onBack: () => void;
  onStartChat?: () => void;
};

export default function HowToCommandViewer({ howTo, onBack, onStartChat }: HowToCommandViewerProps) {
  const t = useTranslations();

  const readingTime = useMemo(() => calculateReadingTime(howTo.description), [howTo.description]);
  const headings = useMemo(() => extractHeadings(howTo.description), [howTo.description]);

  return (
    <div className="flex h-full flex-col">
      {/* Header with back button, title, and reading time */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="ml-1">{t("howto.command.back")}</span>
        </Button>
        <h2 className="flex-1 truncate text-lg font-semibold">{howTo.name}</h2>
        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <BookOpen className="h-4 w-4" />
          <span>{t("howto.reading_time.label", { minutes: readingTime })}</span>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex min-h-0 flex-1">
        {/* Left sidebar - table of contents */}
        {headings.length > 0 && (
          <div className="w-50 shrink-0 overflow-y-auto border-r p-4">
            <nav className="space-y-1">
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className="text-muted-foreground hover:text-foreground block truncate text-sm"
                  style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        )}

        {/* Right content - scrollable */}
        <div id="howto-viewer-content" className="min-w-0 flex-1 overflow-y-auto p-4">
          <BlockNoteEditorContainer id={howTo.id} type="howto" initialContent={howTo.description} />
        </div>
      </div>

      {/* Full-width footer */}
      {onStartChat && (
        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <Button onClick={onStartChat} variant="default" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            {t("howto.command.chat_button")}
          </Button>
        </div>
      )}
    </div>
  );
}
