"use client";

import { AnalyticsJourneyContainer } from "./AnalyticsJourneyContainer";

type Props = {
  sessionId: string;
  /** Route the breadcrumb links back to. Defaults to the container's default. */
  pageUrl?: string;
};

/** The single-session journey page as one client component. */
export function AnalyticsJourneyPageContainer({ sessionId, pageUrl }: Props) {
  return <AnalyticsJourneyContainer sessionId={sessionId} pageUrl={pageUrl} />;
}
