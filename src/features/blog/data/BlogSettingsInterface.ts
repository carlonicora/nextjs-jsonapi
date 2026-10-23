import { ApiDataInterface } from "../../../core";
import { BlogListLayout } from "../types/blog.constants";

export type BlogSettingsInput = {
  id: string;
  listLayout: BlogListLayout;
};

export interface BlogSettingsInterface extends ApiDataInterface {
  get listLayout(): BlogListLayout;
}
