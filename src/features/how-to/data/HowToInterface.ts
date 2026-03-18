import { UserInterface } from "@carlonicora/nextjs-jsonapi/core";
import { ContentInput, ContentInterface } from "@/features/content/data/ContentInterface";

export type HowToInput = ContentInput & {
  id: string;
  description: string;
  pages?: string;
  aiStatus?: string;
  authorId: string;
};

export interface HowToInterface extends ContentInterface {
  get description(): string;
  get pages(): string;
  get aiStatus(): string;
  get author(): UserInterface;
}
