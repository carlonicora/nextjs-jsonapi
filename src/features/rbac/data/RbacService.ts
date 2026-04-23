import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import type { RbacMatrixModel } from "./RbacMatrixModel";
import type { RbacMatrix } from "./RbacTypes";

/**
 * RbacService — fetches RBAC configuration for the admin UI.
 *
 * Declarative-matrix methods (`fetchMatrix`, `saveMatrix`) talk to the
 * dev-only endpoints added in
 * `packages/nestjs-neo4jsonapi/.../rbac-dev.controller.ts`. The controller
 * speaks JSON:API (singleton resource with `type: "rbac-matrix"`, `id:
 * "singleton"`), so these methods go through the standard `callApi()`
 * pipeline like every other service in the codebase.
 *
 * The backend only registers these routes when `devMode` is enabled on
 * `RbacModule.register` (see `apps/api/src/features/features.modules.ts`).
 * In production the routes return 404; callers should guard with a dev-mode
 * check.
 */
export class RbacService extends AbstractService {
  /**
   * Fetch the current RBAC matrix plus each module's known BFS relationship
   * paths (used by the permission picker as scope suggestions).
   *
   * Dev-only endpoint — see class header.
   */
  static async fetchMatrix(): Promise<{
    matrix: RbacMatrix;
    modulePaths: Record<string, readonly string[]>;
  }> {
    const endpoint = new EndpointCreator({ endpoint: Modules.RbacMatrix }).generate();

    const model = await this.callApi<RbacMatrixModel>({
      type: Modules.RbacMatrix,
      method: HttpMethod.GET,
      endpoint,
    });

    return {
      matrix: model.matrix ?? {},
      modulePaths: model.modulePaths ?? {},
    };
  }

  /**
   * Persist a matrix back to the declarative `permissions.ts` file.
   *
   * The backend serializes the matrix to formatted TypeScript using the
   * provided `roleNames` / `moduleNames` lookup tables (so the emitted file
   * references `RoleId.X` / `ModuleId.X` rather than raw UUIDs) and writes
   * it to `outputPath` (absolute, or relative to the repo root).
   *
   * Dev-only endpoint — see class header.
   */
  static async saveMatrix(args: {
    matrix: RbacMatrix;
    roleNames: Record<string, string>;
    moduleNames: Record<string, string>;
    outputPath: string;
  }): Promise<{ bytesWritten: number; path: string }> {
    const endpoint = new EndpointCreator({ endpoint: Modules.RbacMatrix }).generate();

    const model = await this.callApi<RbacMatrixModel>({
      type: Modules.RbacMatrix,
      method: HttpMethod.PUT,
      endpoint,
      input: args,
    });

    return {
      bytesWritten: model.bytesWritten ?? 0,
      path: model.path ?? "",
    };
  }
}
