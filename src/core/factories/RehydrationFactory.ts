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

/**
 * The included resources already rehydrated during the current top-level `rehydrate` /
 * `rehydrateList` call, by model class and `type:id`, with the `included` array they were read from.
 * A resource reached again through another relationship reuses that model instead of being built
 * again: without it every distinct path through a densely linked `included` (a campaign, its PCs,
 * their locations, the scenes there, back to the campaign...) is rehydrated, which grows
 * exponentially with the number of linked resources. A reused model keeps what it read the first
 * time, so a relationship back to a resource that was mid-rehydration then stays unset.
 * The top-level resources are always rehydrated from scratch, so each one is complete.
 */
let built: Map<unknown, Map<string, { included: unknown; model: unknown }>> | undefined;
let depth = 0;

const keyOf = (data: JsonApiHydratedDataInterface): string | undefined => {
  const resource = data?.jsonApi;
  return resource?.type && resource?.id ? `${resource.type}:${resource.id}` : undefined;
};

function session<T>(run: () => T): T {
  const outermost = depth === 0;
  if (outermost) built = new Map();
  depth++;
  try {
    return run();
  } finally {
    depth--;
    if (outermost) built = undefined;
  }
}

function guarded<T>(factoryClass: unknown, data: JsonApiHydratedDataInterface, run: () => T): T {
  const key = keyOf(data);
  if (!key) return run();
  if (inProgress.has(key)) return undefined as T;

  if (inProgress.size > 0) {
    const previous = built?.get(factoryClass)?.get(key);
    if (previous && previous.included === data.included) return previous.model as T;
  }

  inProgress.add(key);
  try {
    const model = run();
    if (built) {
      let byKey = built.get(factoryClass);
      if (!byKey) {
        byKey = new Map();
        built.set(factoryClass, byKey);
      }
      byKey.set(key, { included: data.included, model });
    }
    return model;
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

    return session(() => guarded(factoryClass, data, () => new factoryClass().rehydrate(data) as T));
  }

  public static rehydrateList<T extends ApiDataInterface>(
    classKey: ApiRequestDataTypeInterface,
    data: JsonApiHydratedDataInterface[],
  ): T[] {
    const factoryClass = DataClassRegistry.get(classKey);

    return session(() =>
      data.map((item: JsonApiHydratedDataInterface) =>
        guarded(factoryClass, item, () => new factoryClass().rehydrate(item) as T),
      ),
    );
  }
}
