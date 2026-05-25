import { HELP_MODES } from "../types/help-article.types";

export function generateHelpModeStaticParams(): { mode: string }[] {
  return HELP_MODES.map((mode) => ({ mode }));
}
