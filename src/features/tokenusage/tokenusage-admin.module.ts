import { ModuleFactory } from "../../permissions";
import { TokenUsageAdminBreakdown } from "./data/tokenusage-admin-breakdown";
import { TokenUsageAdminSummary } from "./data/tokenusage-admin-summary";
import { TokenUsageAdminTimeline } from "./data/tokenusage-admin-timeline";

/**
 * Read-only reporting resources behind the administrative token-usage page.
 * `name` is the endpoint path EndpointCreator builds URLs from; there is no
 * pageUrl because these are not navigable resources.
 *
 * Distinct from the consuming app's own TokenUsage module (name "tokenusages",
 * pageUrl "/tokenusage") — that one is an AppModuleDefinitions entry the package
 * cannot reference, which is why these three exist.
 */
export const TokenUsageAdminSummaryModule = (factory: ModuleFactory) =>
  factory({ name: "tokenusages/administration/summary", model: TokenUsageAdminSummary });

export const TokenUsageAdminTimelineModule = (factory: ModuleFactory) =>
  factory({ name: "tokenusages/administration/timeline", model: TokenUsageAdminTimeline });

export const TokenUsageAdminBreakdownModule = (factory: ModuleFactory) =>
  factory({ name: "tokenusages/administration/breakdown", model: TokenUsageAdminBreakdown });
