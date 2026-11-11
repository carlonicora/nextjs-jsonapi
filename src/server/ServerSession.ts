import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { userAgent } from "next/server";
import { cache } from "react";
import { UserService } from "../features/user/data/user.service";
import { Action, checkPermissionsFromServer, ModuleWithPermissions } from "../permissions";
import { getRoleId } from "../roles/config";
import { VIEWPORT_COOKIE_NAME } from "../utils/use-mobile";

// The user's modules come from the api once per request. They no longer travel in a
// cookie: a non-admin user's scoped permissions push it past the browser's 4096-byte limit.
// No `cache` option on the request: it carries the user's token.
const getCachedFullUser = cache(async () => UserService.findFullUser());

export interface SessionSnapshot {
  isLogged: boolean;
  isAdministrator: boolean;
  token?: string;
  sidebarOpen: boolean;
  isMobile: boolean;
  /** The request's raw `Accept-Language` header; the date locale is resolved from it on the client. */
  acceptLanguage?: string;
}

export class ServerSession {
  static async read(): Promise<SessionSnapshot> {
    const cookieStore = await cookies();
    const headerStore = await headers();

    const token = cookieStore.get("token")?.value || undefined;
    const roles = cookieStore.get("roles")?.value;
    const viewportCookie = cookieStore.get(VIEWPORT_COOKIE_NAME)?.value;

    return {
      isLogged: !!token,
      isAdministrator: !!roles && roles.includes(getRoleId().Administrator),
      token,
      sidebarOpen: cookieStore.get("sidebar_state")?.value !== "false",
      isMobile: viewportCookie ? viewportCookie === "1" : userAgent({ headers: headerStore }).device.type === "mobile",
      acceptLanguage: headerStore.get("accept-language") ?? undefined,
    };
  }

  static async isLogged() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token || !token.value) return false;
    return true;
  }

  static async companyId() {
    const cookieStore = await cookies();
    return cookieStore.get("companyId")?.value ?? "";
  }

  static async userId() {
    const cookieStore = await cookies();
    return cookieStore.get("userId")?.value ?? "";
  }

  static async checkPermission<M extends ModuleWithPermissions>(params: { module: M; action: Action; data?: any }) {
    if (!(await this.hasPermissionToModule(params))) redirect(`/401`);
  }

  static async hasRole(roleId: string): Promise<boolean> {
    const cookieStore = await cookies();
    const roles = cookieStore.get("roles")?.value;

    if (!roles || !roles.includes(roleId)) return false;

    return true;
  }

  static async hasFeature(featureId: string): Promise<boolean> {
    const cookieStore = await cookies();
    const features = cookieStore.get("features")?.value;

    if (!features || !features.includes(featureId)) return false;

    return true;
  }

  static async hasPermissionToModule<M extends ModuleWithPermissions>(params: {
    module: M;
    action: Action;
    data?: any;
  }): Promise<boolean> {
    const cookieStore = await cookies();

    if (params.module.feature) {
      const features = cookieStore.get("features")?.value;

      if (features && !features.includes(params.module.feature)) return false;
    }

    const user = await getCachedFullUser();
    const selectedModule = user.modules.find((module) => module.id === params.module.moduleId);

    return checkPermissionsFromServer({
      module: params.module,
      action: params.action,
      data: params.data,
      userId: await this.userId(),
      selectedModule: selectedModule ? { id: selectedModule.id, permissions: selectedModule.permissions } : undefined,
    });
  }
}
