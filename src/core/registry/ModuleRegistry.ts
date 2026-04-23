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
  HowTo: ModuleWithPermissions;
  Assistant: ModuleWithPermissions;
  AssistantMessage: ModuleWithPermissions;
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
  // Referral modules
  Referral: ModuleWithPermissions;
  ReferralStats: ModuleWithPermissions;
  // Two-factor authentication modules
  TotpAuthenticator: ModuleWithPermissions;
  TotpSetup: ModuleWithPermissions;
  TotpVerify: ModuleWithPermissions;
  TotpVerifyLogin: ModuleWithPermissions;
  Passkey: ModuleWithPermissions;
  PasskeyRegistrationOptions: ModuleWithPermissions;
  PasskeyRegistrationVerify: ModuleWithPermissions;
  PasskeyRename: ModuleWithPermissions;
  PasskeyVerifyLogin: ModuleWithPermissions;
  PasskeyAuthenticationOptions: ModuleWithPermissions;
  TwoFactorEnable: ModuleWithPermissions;
  TwoFactorChallenge: ModuleWithPermissions;
  TwoFactorStatus: ModuleWithPermissions;
  BackupCodeVerify: ModuleWithPermissions;
  // RBAC modules
  PermissionMapping: ModuleWithPermissions;
  ModulePaths: ModuleWithPermissions;
  // Audit modules
  AuditLog: ModuleWithPermissions;
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

  getAllPageUrls(): { id: string; text: string }[] {
    if (this._modules.size === 0) {
      tryBootstrap();
    }

    const seen = new Set<string>();
    const result: { id: string; text: string }[] = [];
    for (const [key, module] of this._modules.entries()) {
      const m = module as ModuleWithPermissions;
      if (m.pageUrl && !seen.has(m.pageUrl)) {
        seen.add(m.pageUrl);
        result.push({ id: m.pageUrl, text: key });
        result.push({ id: `${m.pageUrl}/:id`, text: `${key} (detail)` });
      }
    }
    return result.sort((a, b) => a.text.localeCompare(b.text));
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

  findByFeature(feature: string): ModuleWithPermissions[] {
    const response: ModuleWithPermissions[] = [];

    for (const module of this._modules.values()) {
      const m = module as ModuleWithPermissions;
      if (m.feature === feature) {
        response.push(m);
      }
    }

    return response;
  }

  getAll(): ApiRequestDataTypeInterface[] {
    if (this._modules.size === 0) {
      tryBootstrap();
    }
    return Array.from(this._modules.values());
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
    if (prop === "findByFeature") {
      return (feature: string) => ModuleRegistry.findByFeature(feature);
    }
    return ModuleRegistry.get(prop as keyof ModuleDefinitions);
  },
}) as ModuleDefinitions & {
  findByName: (name: string) => ModuleWithPermissions;
  findByModelName: (name: string) => ModuleWithPermissions;
  findByFeature: (feature: string) => ModuleWithPermissions[];
};
