import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import pako from "pako";
import { Action, checkPermissionsFromServer, ModuleWithPermissions } from "../permissions";

export class ServerSession {
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

    const rawModules = cookieStore.get("modules")?.value;
    if (!rawModules) return false;

    const modules: {
      id: string;
      permissions: {
        create: boolean | string;
        read: boolean | string;
        update: boolean | string;
        delete: boolean | string;
      };
    }[] = JSON.parse(pako.ungzip(Buffer.from(rawModules, "base64"), { to: "string" }));

    const selectedModule = modules.find((module) => module.id === params.module.moduleId);

    return checkPermissionsFromServer({
      module: params.module,
      action: params.action,
      data: params.data,
      userId: await this.userId(),
      selectedModule: selectedModule,
    });

    // if (!selectedModule) return false;

    // if (!selectedModule.permissions[params.action]) return false;
    // if (typeof selectedModule.permissions[params.action] === "boolean")
    //   return selectedModule.permissions[params.action] as boolean;

    // if (!params.data) return false;

    // return params.data[selectedModule.permissions[params.action] as string] === this.userId;
  }
}
