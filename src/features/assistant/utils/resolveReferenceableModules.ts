import type { ApiRequestDataTypeInterface } from "../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";

/**
 * Returns every registered Module whose model class has a non-empty `identifierFields`
 * (so `entity.identifier` produces a meaningful string). Lazy — reads at call time so
 * modules registered after import-time are picked up.
 */
export function resolveReferenceableModules(): ApiRequestDataTypeInterface[] {
  return ModuleRegistry.getAll().filter((m) => {
    const cls = m.model as any;
    return cls && Array.isArray(cls.identifierFields) && cls.identifierFields.length > 0;
  });
}
