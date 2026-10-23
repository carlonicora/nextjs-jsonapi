"use client";

import { AnalyticsAdminProvider } from "../contexts/AnalyticsAdminContext";
import { AnalyticsAdminContainer } from "./AnalyticsAdminContainer";

type Props = {
  /**
   * @deprecated No longer read: the dashboard is the current page, so its
   * breadcrumb is not linked. Kept so existing callers still compile.
   */
  pageUrl?: string;
  /** Base route of the journey page each session row links to. */
  sessionPageUrl?: string;
};

/**
 * The whole administrative analytics page as one client component, so a host
 * app's server page renders a single element. `AnalyticsAdminContainer` owns
 * the `RoundPageContainer`; the provider sits above it because it publishes the
 * filter bar into the title bar.
 */
export function AnalyticsAdminPageContainer({ sessionPageUrl }: Props) {
  return (
    <AnalyticsAdminProvider sessionPageUrl={sessionPageUrl}>
      <AnalyticsAdminContainer />
    </AnalyticsAdminProvider>
  );
}
