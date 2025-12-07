import { ApiDataInterface } from "../../../core";

export type S3Input = {
  key: string;
  contentType?: string;
};

export interface S3Interface extends ApiDataInterface {
  get url(): string;
  get headers(): Record<string, string>;
}
