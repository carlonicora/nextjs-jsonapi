import { FieldSelector } from "../fields/FieldSelector";

export type ApiRequestDataTypeInterface = {
  name: string;
  cache?: string;
  inclusions?: Record<
    string,
    {
      types?: string[];
      fields?: FieldSelector<any>[];
      include?: string[];
    }
  >;
  model: new () => any;
};
