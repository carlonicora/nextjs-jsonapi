import { redirect } from "next/navigation";
// Imported through the package's own client subpath for the same reason as in
// AnalyticsAdminPage: the built server entry must reach the container through
// the "use client" bundle, not inline it.
import { AnalyticsJourneyPageContainer } from "@carlonicora/nextjs-jsonapi/analytics";
import { ServerSession } from "../../../../server";

type Props = {
  /** Role id the viewer must hold. The package has no role constants, so the host app passes its own. */
  adminRoleId: string;
  sessionId: string;
  /** Route of the dashboard; the journey pages live under `${pageUrl}/sessions`. */
  pageUrl?: string;
  /** Where a viewer without the role is sent. */
  deniedRedirect?: string;
};

/** Server page for one session's journey: role gate, then the client container. */
export async function AnalyticsJourneyPage({ adminRoleId, sessionId, pageUrl, deniedRedirect = "/" }: Props) {
  if (!(await ServerSession.hasRole(adminRoleId))) {
    redirect(deniedRedirect);
  }

  return <AnalyticsJourneyPageContainer sessionId={sessionId} pageUrl={pageUrl} />;
}
