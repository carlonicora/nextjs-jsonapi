import { ApiDataInterface } from "../interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { JsonApiHydratedDataInterface } from "../interfaces/JsonApiHydratedDataInterface";
import { RehydrationFactory } from "../factories/RehydrationFactory";

export abstract class AbstractApiData implements ApiDataInterface {
  protected _jsonApi?: any;
  protected _included?: any[];

  protected _id?: string;
  protected _type?: string;
  protected _createdAt?: Date;
  protected _updatedAt?: Date;

  protected _self?: string;

  get type(): string {
    if (!this._type) throw new Error("Type is not set.");
    return this._type;
  }

  get id(): string {
    if (!this._id) throw new Error("Id is not set.");
    return this._id;
  }

  get self(): string | undefined {
    return this._self;
  }

  get createdAt(): Date {
    return this._createdAt ?? new Date();
  }

  get updatedAt(): Date {
    return this._updatedAt ?? new Date();
  }

  get included(): any[] {
    return this._included ?? [];
  }

  get jsonApi(): any {
    return this._jsonApi;
  }

  ingestJsonApi(data: JsonApiHydratedDataInterface): void {}

  generateApiUrl(params?: any): string {
    throw new Error("Method not implemented.");
  }

  createJsonApi(data?: any): any {
    throw new Error("Method not implemented.");
  }

  protected _readIncluded<T extends ApiDataInterface>(
    data: JsonApiHydratedDataInterface,
    type: string,
    dataType: ApiRequestDataTypeInterface,
  ): T | T[] | undefined {
    if (
      data.included === undefined ||
      data.included.length === 0 ||
      data.jsonApi.relationships === undefined ||
      data.jsonApi.relationships[type] === undefined ||
      data.jsonApi.relationships[type].data === undefined
    ) {
      return undefined;
    }

    if (Array.isArray(data.jsonApi.relationships[type].data)) {
      const response: T[] = data.jsonApi.relationships[type].data.map((jsonApiData: any) => {
        const includedData = data.included.find(
          (includedData: any) => includedData.id === jsonApiData.id && includedData.type === jsonApiData.type,
        );

        if (includedData === undefined) return undefined;

        return RehydrationFactory.rehydrate(dataType, {
          jsonApi: includedData,
          included: data.included,
        }) as T;
      });

      return response.filter((item: T | undefined) => item !== undefined) as T[];
    }

    const includedData = data.included.find(
      (includedData: any) =>
        includedData.id === data.jsonApi.relationships[type].data.id &&
        includedData.type === data.jsonApi.relationships[type].data.type,
    );

    if (includedData === undefined && data.allData !== undefined) {
      // Try to find in allData as a fallback
      const fallbackData = data.allData.find(
        (includedData: any) =>
          includedData.id === data.jsonApi.relationships[type].data.id &&
          includedData.type === data.jsonApi.relationships[type].data.type,
      );
      if (fallbackData !== undefined) {
        return RehydrationFactory.rehydrate(dataType, {
          jsonApi: fallbackData,
          included: data.included,
        }) as T;
      }
    }

    if (includedData === undefined) return undefined;

    return RehydrationFactory.rehydrate(dataType, {
      jsonApi: includedData,
      included: data.included,
    }) as T;
  }

  dehydrate(): JsonApiHydratedDataInterface {
    return {
      jsonApi: this._jsonApi,
      included: this._included ?? [],
    };
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    this._jsonApi = data.jsonApi;
    this._included = data.included;

    this._type = this._jsonApi.type;
    this._id = this._jsonApi.id;
    this._createdAt = this._jsonApi.meta?.createdAt !== undefined ? new Date(this._jsonApi.meta.createdAt) : undefined;
    this._updatedAt = this._jsonApi.meta?.updatedAt !== undefined ? new Date(this._jsonApi.meta.updatedAt) : undefined;

    this._self = this._jsonApi.links?.self ?? undefined;

    return this;
  }
}
