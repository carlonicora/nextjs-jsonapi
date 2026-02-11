import { RehydrationFactory } from "../factories/RehydrationFactory";
import { ApiDataInterface } from "../interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { JsonApiHydratedDataInterface } from "../interfaces/JsonApiHydratedDataInterface";

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

  ingestJsonApi(_data: JsonApiHydratedDataInterface): void {}

  generateApiUrl(_params?: any): string {
    throw new Error("Method not implemented.");
  }

  createJsonApi(_data?: any): any {
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

  /**
   * Read included relationships with polymorphic type resolution.
   * Determines the correct model class based on the JSON:API type in included data.
   */
  protected _readIncludedPolymorphic<T extends ApiDataInterface>(
    data: JsonApiHydratedDataInterface,
    relationshipKey: string,
    candidateModules: ApiRequestDataTypeInterface[],
  ): T | T[] | undefined {
    // Validate relationship exists
    if (!data.included?.length || !data.jsonApi.relationships?.[relationshipKey]?.data) {
      return undefined;
    }

    const relData = data.jsonApi.relationships[relationshipKey].data;

    // Build lookup map: JSON:API type -> module
    const typeToModule = new Map<string, ApiRequestDataTypeInterface>();
    for (const mod of candidateModules) {
      typeToModule.set(mod.name, mod);
    }

    if (Array.isArray(relData)) {
      // Many relationship
      const result: T[] = [];
      for (const item of relData) {
        const includedItem = data.included.find((inc: any) => inc.id === item.id && inc.type === item.type);
        if (!includedItem) continue;

        // Resolve module by JSON:API type
        const module = typeToModule.get(includedItem.type);
        if (!module) continue;

        result.push(
          RehydrationFactory.rehydrate(module, {
            jsonApi: includedItem,
            included: data.included,
          }) as T,
        );
      }
      return result.length > 0 ? result : undefined;
    }

    // Single relationship
    const includedItem = data.included.find((inc: any) => inc.id === relData.id && inc.type === relData.type);
    if (!includedItem) return undefined;

    const module = typeToModule.get(includedItem.type);
    if (!module) return undefined;

    return RehydrationFactory.rehydrate(module, {
      jsonApi: includedItem,
      included: data.included,
    }) as T;
  }

  /**
   * Read included relationship data and augment with relationship meta properties.
   * Handles both single relationships (one-to-one) and array relationships (one-to-many).
   *
   * For single relationships: meta is read from `relationships[type].meta`
   * For array relationships: per-item meta is read from `relationships[type].data[].meta`
   *
   * @param data - Hydrated JSON:API data
   * @param type - Relationship type key (e.g., "guide", "persons")
   * @param dataType - Module reference for rehydration
   * @returns Related object(s) augmented with meta properties, or undefined
   */
  protected _readIncludedWithMeta<T extends ApiDataInterface, M extends Record<string, any>>(
    data: JsonApiHydratedDataInterface,
    type: string,
    dataType: ApiRequestDataTypeInterface,
  ): (T & M) | (T & M)[] | undefined {
    // Check if relationship exists
    if (
      data.included === undefined ||
      data.included.length === 0 ||
      data.jsonApi.relationships === undefined ||
      data.jsonApi.relationships[type] === undefined ||
      data.jsonApi.relationships[type].data === undefined
    ) {
      return undefined;
    }

    const relationshipData = data.jsonApi.relationships[type].data;

    // Handle array relationships with per-item meta
    if (Array.isArray(relationshipData)) {
      const result: (T & M)[] = [];

      for (const item of relationshipData) {
        const includedData = data.included.find((inc: any) => inc.id === item.id && inc.type === item.type);

        if (!includedData) continue;

        const entity = RehydrationFactory.rehydrate(dataType, {
          jsonApi: includedData,
          included: data.included,
        }) as T;

        // Merge per-item meta from relationships[type].data[].meta
        if (item.meta) {
          Object.assign(entity, item.meta);
        }

        result.push(entity as T & M);
      }

      return result;
    }

    // Handle single relationship
    const includedData = data.included.find(
      (inc: any) => inc.id === relationshipData.id && inc.type === relationshipData.type,
    );

    if (!includedData) {
      // Try to find in allData as a fallback
      if (data.allData !== undefined) {
        const fallbackData = data.allData.find(
          (inc: any) => inc.id === relationshipData.id && inc.type === relationshipData.type,
        );
        if (fallbackData) {
          const entity = RehydrationFactory.rehydrate(dataType, {
            jsonApi: fallbackData,
            included: data.included,
          }) as T;

          // Merge relationship-level meta for single relationships
          const relationshipMeta = data.jsonApi.relationships[type].meta;
          if (relationshipMeta) {
            Object.assign(entity, relationshipMeta);
          }
          return entity as T & M;
        }
      }
      return undefined;
    }

    const entity = RehydrationFactory.rehydrate(dataType, {
      jsonApi: includedData,
      included: data.included,
    }) as T;

    // Merge relationship-level meta for single relationships
    const relationshipMeta = data.jsonApi.relationships[type].meta;
    if (relationshipMeta) {
      Object.assign(entity, relationshipMeta);
    }

    return entity as T & M;
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
