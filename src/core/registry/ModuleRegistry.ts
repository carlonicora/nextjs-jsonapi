import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { ModuleWithPermissions } from "../../permissions/types";

// Foundation module types - defined by LIBRARY
export interface FoundationModuleDefinitions {
  S3: ModuleWithPermissions;
  Auth: ModuleWithPermissions;
  User: ModuleWithPermissions;
  Author: ModuleWithPermissions;
  Company: ModuleWithPermissions;
  Role: ModuleWithPermissions;
  Notification: ModuleWithPermissions;
  Push: ModuleWithPermissions;
  Feature: ModuleWithPermissions;
  Module: ModuleWithPermissions;
  Content: ModuleWithPermissions;
  UserTopic: ModuleWithPermissions;
  UserExpertise: ModuleWithPermissions;
}

// App-specific modules - apps will augment this interface ONLY

export interface AppModuleDefinitions {}

// Combined type for full autocompletion
export type ModuleDefinitions = FoundationModuleDefinitions & AppModuleDefinitions;

class ModuleRegistryClass {
  private _modules: Map<string, ApiRequestDataTypeInterface> = new Map();

  register<K extends string>(name: K, module: ApiRequestDataTypeInterface): void {
    this._modules.set(name, module);
  }

  get<K extends keyof ModuleDefinitions>(name: K): ModuleDefinitions[K] {
    const module = this._modules.get(name as string);
    if (!module) {
      throw new Error(`Module "${String(name)}" not registered. Call bootstrap() first.`);
    }
    return module as ModuleDefinitions[K];
  }

  findByName(moduleName: string): ModuleWithPermissions {
    // Search by module's name property (e.g., "topics", "articles")
    for (const module of this._modules.values()) {
      if ((module as ModuleWithPermissions).name === moduleName) {
        return module as ModuleWithPermissions;
      }
    }
    throw new Error(`Module not found: ${moduleName}`);
  }
}

export const ModuleRegistry = new ModuleRegistryClass();

// Proxy object for Modules.X syntax with autocompletion
export const Modules = new Proxy({} as ModuleDefinitions, {
  get(_, prop: string) {
    if (prop === "findByName") {
      return (name: string) => ModuleRegistry.findByName(name);
    }
    return ModuleRegistry.get(prop as keyof ModuleDefinitions);
  },
}) as ModuleDefinitions & { findByName: (name: string) => ModuleWithPermissions };
