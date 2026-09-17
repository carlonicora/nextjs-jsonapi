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

const ITEMS: Record<BlockNoteAiGenerateAction, Omit<AiGenerateMenuItem, "onItemClick">> = {
  "fill-template": {
    key: "generate_from_template",
    title: "Generate from Template",
    aliases: ["generate", "template", "fill"],
    icon: <LayoutTemplateIcon size={18} />,
    size: "small",
  },
  "draft-impression": {
    key: "suggest_impression",
    title: "Suggest impression",
    aliases: ["suggest", "impression"],
    icon: <SparklesIcon size={18} />,
    size: "small",
  },
};

export function generateActionItems(
  actions: BlockNoteAiGenerateAction[] | undefined,
  invoke: (type: BlockNoteAiGenerateAction) => void,
): AiGenerateMenuItem[] {
  return (actions ?? DEFAULT_AI_GENERATE_ACTIONS).map((type) => ({
    ...ITEMS[type],
    onItemClick: () => invoke(type),
  }));
}
