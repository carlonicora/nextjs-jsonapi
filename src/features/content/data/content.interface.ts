import { ApiDataInterface } from "../../../core";
import { UserInterface } from "../../user";

export type ContentInput = {
  id: string;
  name?: string;

  authorId: string;
  editorIds?: string[];
};

export interface ContentInterface extends ApiDataInterface {
  get contentType(): string | undefined;
  get name(): string;
  get abstract(): string | undefined;
  get tldr(): string | undefined;
  get aiStatus(): string;

  get relevance(): number | undefined;

  get author(): UserInterface;
  get editors(): UserInterface[];
}
