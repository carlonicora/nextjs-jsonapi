import { LayoutTemplateIcon, SparklesIcon } from "lucide-react";
import React from "react";

/**
 * Whole-document AI actions an editor can offer in its AI menu when nothing
 * is selected. Each maps to a backend `type` discriminator; NO prompt text
 * lives here. Selection-edit actions (Improve, Fix spelling, …) are separate
 * and always available.
 */
export type BlockNoteAiGenerateAction = "fill-template" | "draft-impression";

export const DEFAULT_AI_GENERATE_ACTIONS: BlockNoteAiGenerateAction[] = ["fill-template"];

export type AiGenerateMenuItem = {
  key: string;
  title: string;
  aliases: string[];
  /** BlockNote's DefaultReactSuggestionItem types icon as an element, not ReactNode. */
  icon: React.JSX.Element;
  size: "small";
  onItemClick: () => void;
};

/** `titleKey` is a message key; the caller's translator resolves it to the shown title. */
type AiGenerateItemDefinition = Omit<AiGenerateMenuItem, "onItemClick" | "title"> & { titleKey: string };

const ITEMS: Record<BlockNoteAiGenerateAction, AiGenerateItemDefinition> = {
  "fill-template": {
    key: "generate_from_template",
    titleKey: "ui.editor.ai.generate_from_template",
    aliases: ["generate", "template", "fill"],
    icon: <LayoutTemplateIcon size={18} />,
    size: "small",
  },
  "draft-impression": {
    key: "suggest_impression",
    titleKey: "ui.editor.ai.suggest_impression",
    aliases: ["suggest", "impression"],
    icon: <SparklesIcon size={18} />,
    size: "small",
  },
};

export function generateActionItems(
  actions: BlockNoteAiGenerateAction[] | undefined,
  invoke: (type: BlockNoteAiGenerateAction) => void,
  translate: (key: string) => string,
): AiGenerateMenuItem[] {
  return (actions ?? DEFAULT_AI_GENERATE_ACTIONS).map((type) => {
    const { titleKey, ...item } = ITEMS[type];
    return { ...item, title: translate(titleKey), onItemClick: () => invoke(type) };
  });
}
