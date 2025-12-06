export type GetterKeys<T> = {
  [K in keyof T]: T[K] extends () => any ? never : K;
}[keyof T];

export type FieldSelector<T> = {
  type: string;
  fields: ReadonlyArray<GetterKeys<T>>;
};

export function createJsonApiInclusion<T>(dataType: string, fields: ReadonlyArray<GetterKeys<T>>): FieldSelector<T> {
  return {
    type: dataType,
    fields,
  };
}
