import { ModuleWithPermissions } from "../../permissions/types";
import { ApiRequestDataTypeInterface } from "../interfaces/ApiRequestDataTypeInterface";
import { hasBootstrapper, tryBootstrap } from "./bootstrapStore";

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
  // Billing modules - READ: all users, UPDATE: CompanyAdministrator, ADMIN: Administrator
  Billing: ModuleWithPermissions;
  StripeCustomer: ModuleWithPermissions;
  StripePaymentMethod: ModuleWithPermissions;
  StripeSubscription: ModuleWithPermissions;
  StripeInvoice: ModuleWithPermissions;
  StripeProduct: ModuleWithPermissions;
  StripePrice: ModuleWithPermissions;
  StripeUsage: ModuleWithPermissions;
  StripePromotionCode: ModuleWithPermissions;
  // OAuth modules
  OAuth: ModuleWithPermissions;
  // Waitlist modules
  Waitlist: ModuleWithPermissions;
  WaitlistStats: ModuleWithPermissions;
}

// App-specific modules - apps will augment this interface ONLY

export interface AppModuleDefinitions {}

// Combined type for full autocompletion
export type ModuleDefinitions = FoundationModuleDefinitions & AppModuleDefinitions;

// Symbol key to avoid conflicts with other globals
const MODULES_KEY = Symbol.for("nextjs-jsonapi:modules");

// Use globalThis to persist module registry across HMR reloads
const globalStore = globalThis as unknown as {
  [MODULES_KEY]?: Map<string, ApiRequestDataTypeInterface>;
};

// Initialize global modules map if not set
if (!globalStore[MODULES_KEY]) {
  globalStore[MODULES_KEY] = new Map();
}

class ModuleRegistryClass {
  private get _modules(): Map<string, ApiRequestDataTypeInterface> {
    return globalStore[MODULES_KEY]!;
  }

  register<K extends string>(name: K, module: ApiRequestDataTypeInterface): void {
    this._modules.set(name, module);
  }

  get<K extends keyof ModuleDefinitions>(name: K): ModuleDefinitions[K] {
    let module = this._modules.get(name as string);

    // Self-healing: if module not found, try bootstrapping first
    if (!module) {
      const didBootstrap = tryBootstrap();
      if (didBootstrap) {
        // Retry after bootstrap
        module = this._modules.get(name as string);
      }
    }

    if (!module) {
      // Provide helpful error message based on state
      const hint = hasBootstrapper()
        ? "Bootstrap was called but module still not found. Check module registration."
        : "No bootstrapper registered. Ensure configureJsonApi({ bootstrapper }) is called before accessing modules.";
      throw new Error(`Module "${String(name)}" not registered. ${hint}`);
    }

    return module as ModuleDefinitions[K];
  }

  findByName(moduleName: string): ModuleWithPermissions {
    // Self-healing: try bootstrap if registry is empty
    if (this._modules.size === 0) {
      tryBootstrap();
    }

    // Search by module's name property (e.g., "topics", "articles")
    for (const module of this._modules.values()) {
      if ((module as ModuleWithPermissions).name === moduleName) {
        return module as ModuleWithPermissions;
      }
    }
    throw new Error(`Module not found: ${moduleName}`);
  }

  findByModelName(modelName: string): ModuleWithPermissions {
    // Direct lookup by registry key (e.g., "Article", "Document")
    let module = this._modules.get(modelName);

    // Self-healing: if not found, try bootstrapping
    if (!module) {
      const didBootstrap = tryBootstrap();
      if (didBootstrap) {
        module = this._modules.get(modelName);
      }
    }

    if (!module) {
      throw new Error(`Module not found for model: ${modelName}`);
    }
    return module as ModuleWithPermissions;
  }
}

export const ModuleRegistry = new ModuleRegistryClass();

// Proxy object for Modules.X syntax with autocompletion
export const Modules = new Proxy({} as ModuleDefinitions, {
  get(_, prop: string) {
    if (prop === "findByName") {
      return (name: string) => ModuleRegistry.findByName(name);
    }
    if (prop === "findByModelName") {
      return (name: string) => ModuleRegistry.findByModelName(name);
    }
    return ModuleRegistry.get(prop as keyof ModuleDefinitions);
  },
}) as ModuleDefinitions & {
  findByName: (name: string) => ModuleWithPermissions;
  findByModelName: (name: string) => ModuleWithPermissions;
};
