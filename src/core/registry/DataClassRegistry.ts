import { ApiDataInterface } from "../interfaces/ApiDataInterface";
import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";

export class DataClassRegistry {
  // Use Map with string key (module.name) for reliable lookup
  // String keys are stable across HMR and module re-evaluations
  // Note: WeakMap with object identity was tried but fails during Next.js navigation
  // because module re-evaluation creates new object instances with different identity
  private static _map = new Map<string, { new (): ApiDataInterface }>();

  public static registerObjectClass(
    key: ApiRequestDataTypeInterface,
    classConstructor: { new (): ApiDataInterface },
  ): void {
    const classKey = key.name;
    if (!this._map.has(classKey)) {
      this._map.set(classKey, classConstructor);
    }
  }

  public static get(classKey: ApiRequestDataTypeInterface): {
    new (): ApiDataInterface;
  } {
    const response = this._map.get(classKey.name);
    if (!response) {
      throw new Error(
        `Class not registered for key: ${typeof classKey === "string" ? classKey : classKey.name}. Ensure bootstrap() was called.`,
      );
    }

    return response;
  }

  /**
   * Bootstrap the registry with all modules.
   * This is a convenience method for apps to register all their modules at once.
   *
   * @param modules - An object with module definitions (like the app's Modules class)
   */
  public static bootstrap(modules: Record<string, ApiRequestDataTypeInterface>): void {
    Object.values(modules).forEach((module) => {
      if (module && module.model) {
        this.registerObjectClass(module, module.model);
      }
    });
  }

  /**
   * Clear all registered classes. Useful for testing.
   */
  public static clear(): void {
    this._map.clear();
  }
}

// Export alias for backward compatibility
export { DataClassRegistry as DataClass };
