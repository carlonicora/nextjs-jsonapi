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
}

let _waitlistConfig: WaitlistConfig = {};

export function configureWaitlist(config: WaitlistConfig): void {
  _waitlistConfig = config;
}

export function getWaitlistConfig(): WaitlistConfig {
  return _waitlistConfig;
}
