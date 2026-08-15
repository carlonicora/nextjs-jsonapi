import { ModuleFactory, ModuleWithPermissions } from "../../permissions";
import { TokenUsageAdminBreakdown } from "./data/tokenusage-admin-breakdown";
import { TokenUsageAdminSummary } from "./data/tokenusage-admin-summary";
import { TokenUsageAdminTimeline } from "./data/tokenusage-admin-timeline";
import { TokenUsageReportBreakdown } from "./data/tokenusage-report-breakdown";
import { TokenUsageReportSummary } from "./data/tokenusage-report-summary";
import { TokenUsageReportTimeline } from "./data/tokenusage-report-timeline";

/**
 * Every read-only reporting resource behind the two token-usage pages, as one
 * object a consuming app spreads into its `allModules`.
 *
 * A bundle rather than six separate factories because registration is the APP'S
 * job — `allModules` is also the source of `AllModuleDefinitions` and what
 * `DataClassRegistry.bootstrap()` reads, so the package cannot self-register.
 * Six names is six chances to forget one, and a forgotten name is not a compile
 * error: `FoundationModuleDefinitions` declares them all, so `Modules.X`
 * typechecks and is `undefined` at runtime. One spread cannot be partially done.
 *
 * `name` is the endpoint path EndpointCreator builds URLs from. None has a
 * pageUrl — these are not navigable resources.
 *
 * The return type is the six named keys, NOT `Record<string,
 * ModuleWithPermissions>`: the consuming app derives `AllModuleDefinitions`
 * from `typeof allModules`, so spreading an index-signature type in would give
 * that object a string index signature and make every `Modules.<anything>`
 * lookup typecheck. `satisfies` keeps the constraint without widening.
 */
export const tokenUsageModules = (factory: ModuleFactory) =>
  ({
    TokenUsageAdminSummary: factory({ name: "tokenusages/administration/summary", model: TokenUsageAdminSummary }),
    TokenUsageAdminTimeline: factory({ name: "tokenusages/administration/timeline", model: TokenUsageAdminTimeline }),
    TokenUsageAdminBreakdown: factory({
      name: "tokenusages/administration/breakdown",
      model: TokenUsageAdminBreakdown,
    }),
    TokenUsageReportSummary: factory({ name: "tokenusages/reports/summary", model: TokenUsageReportSummary }),
    TokenUsageReportTimeline: factory({ name: "tokenusages/reports/timeline", model: TokenUsageReportTimeline }),
    TokenUsageReportBreakdown: factory({ name: "tokenusages/reports/breakdown", model: TokenUsageReportBreakdown }),
  }) satisfies Record<string, ModuleWithPermissions>;
