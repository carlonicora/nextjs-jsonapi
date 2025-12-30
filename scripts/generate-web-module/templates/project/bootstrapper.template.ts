/**
 * Bootstrapper Template
 *
 * Generates initial Bootstrapper.ts with all foundation and Stripe modules
 */

import * as fs from "fs";
import * as path from "path";

export function generateBootstrapperTemplate(webBasePath: string): string | null {
  const outputPath = path.join(webBasePath, "apps/web/src/config/Bootstrapper.ts");

  if (fs.existsSync(outputPath)) {
    return null; // Skip if exists
  }

  return `import { FeatureIds } from "@/enums/feature.ids";
import {
  AuthModule,
  AuthorModule,
  BillingCustomerModule,
  BillingModule,
  CompanyModule,
  ContentModule,
  DataClassRegistry,
  FeatureModule,
  FieldSelector,
  InvoiceModule,
  ModuleModule,
  ModuleRegistry,
  ModuleWithPermissions,
  NotificationModule,
  PushModule,
  RoleModule,
  S3Module,
  setBootstrapper,
  StripePriceModule,
  StripeProductModule,
  SubscriptionModule,
  UsageRecordModule,
  UserModule,
} from "@carlonicora/nextjs-jsonapi/core";
import { LucideIcon } from "lucide-react";

const moduleFactory = (params: {
  pageUrl?: string;
  name: string;
  cache?: string;
  model: any;
  feature?: FeatureIds;
  moduleId?: string;
  icon?: LucideIcon;
  inclusions?: Record<string, { types?: string[]; fields?: FieldSelector<any>[] }>;
}): ModuleWithPermissions => ({
  pageUrl: params.pageUrl,
  name: params.name,
  model: params.model,
  feature: params.feature,
  moduleId: params.moduleId,
  cache: params.cache,
  icon: params.icon,
  inclusions: params.inclusions ?? {},
});

const allModules = {
  // Foundation modules
  Auth: AuthModule(moduleFactory),
  Company: CompanyModule(moduleFactory),
  Feature: FeatureModule(moduleFactory),
  Module: ModuleModule(moduleFactory),
  Notification: NotificationModule(moduleFactory),
  Push: PushModule(moduleFactory),
  Role: RoleModule(moduleFactory),
  S3: S3Module(moduleFactory),
  User: UserModule(moduleFactory),
  Author: AuthorModule(moduleFactory),
  Content: ContentModule(moduleFactory),
  // Billing modules (Stripe)
  Billing: BillingModule(moduleFactory),
  BillingCustomer: BillingCustomerModule(moduleFactory),
  Subscription: SubscriptionModule(moduleFactory),
  Invoice: InvoiceModule(moduleFactory),
  StripeProduct: StripeProductModule(moduleFactory),
  StripePrice: StripePriceModule(moduleFactory),
  UsageRecord: UsageRecordModule(moduleFactory),
} satisfies Record<string, ModuleWithPermissions>;

export type AllModuleDefinitions = typeof allModules;

let bootstrapped = false;

export function bootstrap(): void {
  if (bootstrapped) return;

  Object.entries(allModules).forEach(([name, module]) => {
    ModuleRegistry.register(name, module);
  });

  DataClassRegistry.bootstrap(allModules);

  bootstrapped = true;
}

setBootstrapper(bootstrap);
`;
}
