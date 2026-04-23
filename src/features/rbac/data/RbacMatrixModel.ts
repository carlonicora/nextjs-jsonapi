import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import type { RbacMatrix } from "./RbacTypes";

/**
 * Input shape accepted by `RbacMatrixModel.createJsonApi()` for a PUT request
 * to the dev matrix endpoint.
 */
export interface RbacMatrixInput {
  matrix: RbacMatrix;
  roleNames: Record<string, string>;
  moduleNames: Record<string, string>;
  outputPath: string;
}

/**
 * Frontend model for the dev-only `rbac-matrix` JSON:API resource.
 *
 * Backend contract (see `rbac-dev.controller.ts`):
 *  - `GET /_dev/rbac/matrix` → `{ data: { type: "rbac-matrix", id: "singleton",
 *      attributes: { matrix } } }`
 *  - `PUT /_dev/rbac/matrix` body: `{ data: { type: "rbac-matrix", attributes:
 *      { matrix, roleNames, moduleNames, outputPath } } }`
 *    → `{ data: { type: "rbac-matrix", id: "singleton", attributes: { bytesWritten, path } } }`
 *
 * The resource is a singleton (`id: "singleton"`) so there is no collection
 * listing; the "read" and "write" shapes share a single model with optional
 * fields populated depending on which endpoint produced the response.
 */
export class RbacMatrixModel extends AbstractApiData {
  private _matrix?: RbacMatrix;
  private _modulePaths?: Record<string, readonly string[]>;
  private _bytesWritten?: number;
  private _path?: string;

  /** The RBAC matrix object (populated after a GET). */
  get matrix(): RbacMatrix | undefined {
    return this._matrix;
  }

  /**
   * UUID-keyed map of each module's known BFS relationship paths (populated
   * after a GET). Fed to the permission picker as scope suggestions.
   */
  get modulePaths(): Record<string, readonly string[]> | undefined {
    return this._modulePaths;
  }

  /** Bytes written to the permissions.ts file (populated after a PUT). */
  get bytesWritten(): number | undefined {
    return this._bytesWritten;
  }

  /** Resolved absolute output path (populated after a PUT). */
  get path(): string | undefined {
    return this._path;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes ?? {};
    this._matrix = attrs.matrix;
    this._modulePaths = attrs.modulePaths;
    this._bytesWritten = attrs.bytesWritten;
    this._path = attrs.path;

    return this;
  }

  createJsonApi(data: RbacMatrixInput): any {
    return {
      data: {
        type: "rbac-matrix",
        id: "singleton",
        attributes: {
          matrix: data.matrix,
          roleNames: data.roleNames,
          moduleNames: data.moduleNames,
          outputPath: data.outputPath,
        },
      },
    };
  }
}
