// Client-only public barrel for the administrative token-usage feature.
// Consumed via `@carlonicora/nextjs-jsonapi/tokenusage`. Tsup adds a top-level
// "use client" directive to the bundled output via clientEntries.
//
// Deliberately NOT re-exported from `src/index.ts` — keeping the feature off the
// main barrel is what keeps its chart (recharts) out of the main client bundle,
// exactly as the `help` feature does.
//
// Pair this with `@carlonicora/nextjs-jsonapi/tokenusage/server` for the ready
// made server page (default export + generateMetadata).

export { TokenUsageAdminProvider, useTokenUsageAdmin } from "./contexts/TokenUsageAdminContext";
export type { TokenUsageAdminContextType, TokenUsageAdminFilterState } from "./contexts/TokenUsageAdminContext";

export { TokenUsageAdminContainer } from "./components/TokenUsageAdminContainer";
export { TokenUsageAdminFilterBar } from "./components/TokenUsageAdminFilterBar";
export { TokenUsageAdminTiles } from "./components/TokenUsageAdminTiles";
export { TokenUsageRankedBar } from "./components/TokenUsageRankedBar";
export { TokenUsageBreakdownTable } from "./components/TokenUsageBreakdownTable";
export { TokenUsageTimelineChart } from "./components/TokenUsageTimelineChart";

export * from "./data";

export {
  TokenUsageAdminBreakdownModule,
  TokenUsageAdminSummaryModule,
  TokenUsageAdminTimelineModule,
} from "./tokenusage-admin.module";

export { TOKEN_USAGE_ADMIN_I18N_KEYS } from "./i18n-keys";
