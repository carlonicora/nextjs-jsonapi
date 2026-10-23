import { ApiDataInterface } from "../../../core";
import { BlogCategoryTranslationInterface } from "./BlogCategoryTranslationInterface";

export type BlogCategoryInput = {
  id: string;
  originalLanguage?: string;
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
};

export interface BlogCategoryInterface extends ApiDataInterface {
  get originalLanguage(): string;
  get image(): string | undefined;
  get translations(): BlogCategoryTranslationInterface[];
  get original(): BlogCategoryTranslationInterface | undefined;

  // Resolved for one language by the public and list queries.
  get language(): string | undefined;
  get name(): string | undefined;
  get slug(): string | undefined;
  get description(): string | undefined;
}
