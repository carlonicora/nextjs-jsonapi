import { ContentInput, ContentInterface } from "../../content/data/content.interface";

export type HowToInput = ContentInput & {
  description?: any;
  pages?: string | undefined | null;
  howToType?: string;
  slug?: string;
  order?: number;
  summary?: string;
  tags?: string[];
  contextualKeys?: string[];
  draft?: boolean;
};

export interface HowToInterface extends ContentInterface {
  get description(): any;
  get pages(): string | undefined;
  get howToType(): string | undefined;
  get slug(): string | undefined;
  get order(): number | undefined;
  get summary(): string | undefined;
  get tags(): string[];
  get contextualKeys(): string[];
  get draft(): boolean;
}
