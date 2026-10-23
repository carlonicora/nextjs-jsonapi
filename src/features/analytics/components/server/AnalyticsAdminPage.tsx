import { redirect } from "next/navigation";
// The container is imported through the package's own client subpath, never by
// relative path. tsup keeps this specifier external, so the built server entry
// reaches the container through `features/analytics/index`, which carries the
// "use client" banner. A relative import would inline the container's hooks and
// contexts into this server bundle, outside any client boundary.
import { AnalyticsAdminPageContainer } from "@carlonicora/nextjs-jsonapi/analytics";
import { ServerSession } from "../../../../server";

type Props = {
  /** Role id the viewer must hold. The package has no role constants, so the host app passes its own. */
  adminRoleId: string;
  /**
   * @deprecated No longer read: the dashboard is the current page, so its
   * breadcrumb is not linked. Kept so existing callers still compile.
   */
  pageUrl?: string;
  /** Base route of the journey page each session row links to. */
  sessionPageUrl?: string;
  /** Where a viewer without the role is sent. */
  deniedRedirect?: string;
};

/**
 * Server page for the administrative analytics dashboard: role gate, then the client container.
 *
 * Reads the session: render inside a `<Suspense>` boundary (Cache Components).
 */
export async function AnalyticsAdminPage({ adminRoleId, sessionPageUrl, deniedRedirect = "/" }: Props) {
  if (!(await ServerSession.hasRole(adminRoleId))) {
    redirect(deniedRedirect);
  }

  return <AnalyticsAdminPageContainer sessionPageUrl={sessionPageUrl} />;
}
