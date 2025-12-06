import { FieldSelector } from "../fields/FieldSelector";

export type ApiRequestDataTypeInterface = {
  name: string;
  cache?: string;
  inclusions?: Record<
    string,
    {
      types?: string[];
      fields?: FieldSelector<any>[];
    }
  >;
  model: new () => any;
};
