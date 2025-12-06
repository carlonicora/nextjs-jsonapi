import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { DataClassRegistry } from "./DataClassRegistry";

/**
 * Helper class to bootstrap the registry from a Modules-style class.
 * This supports the pattern where modules are defined as static getters.
 */
export class ModuleRegistrar {
  private static _isBootstrapped = false;

  /**
   * Bootstrap the registry from a Modules class.
   * Automatically detects static getters and registers their models.
   *
   * @param modulesClass - The Modules class with static getters
   */
  static bootstrap<T extends object>(modulesClass: T): void {
    if (this._isBootstrapped) return;

    const data = Object.getOwnPropertyNames(modulesClass)
      .filter((key) => {
        const descriptor = Object.getOwnPropertyDescriptor(modulesClass, key);
        return descriptor && typeof descriptor.get === "function";
      })
      .map((key) => (modulesClass as any)[key] as ApiRequestDataTypeInterface);

    data.forEach((item) => {
      if (item && item.model) {
        DataClassRegistry.registerObjectClass(item, item.model);
      }
    });

    this._isBootstrapped = true;
  }

  /**
   * Reset the bootstrapped state. Useful for testing.
   */
  static reset(): void {
    this._isBootstrapped = false;
    DataClassRegistry.clear();
  }
}
