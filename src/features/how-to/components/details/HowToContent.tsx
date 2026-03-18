"use client";

import { BlockNoteEditorContainer } from "../../../../components";
import { Card } from "../../../../shadcnui";
import { useHowToContext } from "../../contexts/HowToContext";

export default function HowToContent() {
  const { howTo } = useHowToContext();
  if (!howTo) return null;

  return (
    <Card className="flex w-full flex-col p-4">
      <BlockNoteEditorContainer id={howTo.id} type="howto" initialContent={howTo.description} />
    </Card>
  );
}
