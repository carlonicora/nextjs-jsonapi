import { ContentInput, ContentInterface } from "../../content/data/content.interface";

export type HowToInput = ContentInput & {
  description?: any;
  pages?: string | undefined | null;
};

export interface HowToInterface extends ContentInterface {
  get description(): any;
  get pages(): string | undefined;
}
