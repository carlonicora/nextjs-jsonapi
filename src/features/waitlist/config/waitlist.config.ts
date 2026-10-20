import { useI18nTranslations } from "../../../i18n";

export type QuestionnaireFieldType = "text" | "textarea" | "select" | "checkbox";

export interface QuestionnaireOption {
  value: string;
  label: string;
  description?: string;
}

export interface QuestionnaireField {
  id: string;
  type: QuestionnaireFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options?: QuestionnaireOption[];
}

export interface WaitlistConfig {
  questionnaire?: QuestionnaireField[];
  heroTitle?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  benefits?: string[];
  /**
   * When true, every text above (hero title, subtitle, description, benefits and
   * the questionnaire's labels, descriptions, placeholders and option labels) is
   * a message key and renders through `t()`. Defaults to false: the strings
   * render as given.
   */
  translate?: boolean;
}

let _waitlistConfig: WaitlistConfig = {};

export function configureWaitlist(config: WaitlistConfig): void {
  _waitlistConfig = config;
}

export function getWaitlistConfig(): WaitlistConfig {
  return _waitlistConfig;
}

/**
 * Resolves a waitlist config text: `t(value)` when the config sets
 * `translate`, the value itself otherwise. Empty values stay undefined.
 */
export function useWaitlistText(): (value?: string) => string | undefined {
  const t = useI18nTranslations();
  const translate = getWaitlistConfig().translate === true;

  return (value?: string) => {
    if (!value) return undefined;
    return translate ? t(value) : value;
  };
}
