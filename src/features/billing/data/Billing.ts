import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";

/**
 * Billing is a namespace module used for permissions and non-entity endpoints.
 * It doesn't correspond to a specific backend entity but provides routing for
 * meter-related endpoints and permission checks.
 */
export class Billing extends AbstractApiData {
  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    return this;
  }

  createJsonApi(_data?: any): any {
    throw new Error("Billing is a namespace module and cannot be created");
  }
}
