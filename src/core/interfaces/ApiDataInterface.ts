import { JsonApiHydratedDataInterface } from "./JsonApiHydratedDataInterface";

export interface ApiDataInterface {
  get included(): any[];
  get type(): string;
  get id(): string;
  get createdAt(): Date;
  get updatedAt(): Date;
  get self(): string | undefined;
  get jsonApi(): any;
  generateApiUrl(params?: any): string;
  dehydrate(): JsonApiHydratedDataInterface;
  rehydrate(data: JsonApiHydratedDataInterface): this;
  createJsonApi(data: any): any;
}
