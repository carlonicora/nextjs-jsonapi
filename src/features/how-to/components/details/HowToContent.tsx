"use client";

import { useHowToContext } from "@/features/essentials/how-to/contexts/HowToContext";
import { BlockNoteEditorContainer } from "@carlonicora/nextjs-jsonapi/components";
import { Card } from "@carlonicora/nextjs-jsonapi/components";

export default function HowToContent() {
  const { howTo } = useHowToContext();

  return (
    <Card className="flex w-full flex-col p-4">
      <BlockNoteEditorContainer id={howTo.id} type="howTo" initialContent={howTo.content} />
    </Card>
  );
}
