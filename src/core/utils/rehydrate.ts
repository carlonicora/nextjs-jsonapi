import { ApiDataInterface } from "../interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { JsonApiHydratedDataInterface } from "../interfaces/JsonApiHydratedDataInterface";
import { RehydrationFactory } from "../factories/RehydrationFactory";

/**
 * Rehydrate a single dehydrated object back into its typed class instance.
 */
export function rehydrate<T extends ApiDataInterface>(
  classKey: ApiRequestDataTypeInterface,
  data: JsonApiHydratedDataInterface,
): T {
  return RehydrationFactory.rehydrate(classKey, data) as T;
}

/**
 * Rehydrate a list of dehydrated objects back into typed class instances.
 */
export function rehydrateList<T extends ApiDataInterface>(
  classKey: ApiRequestDataTypeInterface,
  data: JsonApiHydratedDataInterface[],
): T[] {
  return RehydrationFactory.rehydrateList(classKey, data) as T[];
}
