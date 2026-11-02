import { ApiDataInterface } from "../interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { JsonApiHydratedDataInterface } from "../interfaces/JsonApiHydratedDataInterface";
import { DataClassRegistry } from "../registry/DataClassRegistry";

/**
 * The resources being rehydrated right now, along the current chain of relationships. A resource
 * met again inside its own chain (A's relationship leads to B, B's back to A) is a circle in the
 * `included` data: following it would recurse until the stack overflows, so it is skipped there.
 */
const inProgress = new Set<string>();

const keyOf = (data: JsonApiHydratedDataInterface): string | undefined => {
  const resource = data?.jsonApi;
  return resource?.type && resource?.id ? `${resource.type}:${resource.id}` : undefined;
};

function guarded<T>(data: JsonApiHydratedDataInterface, run: () => T): T {
  const key = keyOf(data);
  if (!key) return run();
  if (inProgress.has(key)) return undefined as T;
  inProgress.add(key);
  try {
    return run();
  } finally {
    inProgress.delete(key);
  }
}

export class RehydrationFactory {
  public static rehydrate<T extends ApiDataInterface>(
    classKey: ApiRequestDataTypeInterface,
    data: JsonApiHydratedDataInterface,
  ): T {
    const factoryClass = DataClassRegistry.get(classKey);

    return guarded(data, () => new factoryClass().rehydrate(data) as T);
  }

  public static rehydrateList<T extends ApiDataInterface>(
    classKey: ApiRequestDataTypeInterface,
    data: JsonApiHydratedDataInterface[],
  ): T[] {
    const factoryClass = DataClassRegistry.get(classKey);

    return data.map((item: JsonApiHydratedDataInterface) =>
      guarded(item, () => new factoryClass().rehydrate(item) as T),
    );
  }
}
