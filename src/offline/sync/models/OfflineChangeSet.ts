import { AbstractApiData } from "../../../core/abstracts/AbstractApiData";
import { JsonApiHydratedDataInterface } from "../../../core/interfaces/JsonApiHydratedDataInterface";
import { Modules } from "../../../core/registry/ModuleRegistry";
import { OfflineChangeResult, OfflineChangeSetInput, OfflineChangeSetInterface } from "./OfflineChangeSetInterface";

/**
 * The package of every waiting change the device sends in ONE request
 * (`POST /offline-change-sets`). The answer carries one result per change.
 */
export class OfflineChangeSet extends AbstractApiData implements OfflineChangeSetInterface {
  private _results?: OfflineChangeResult[];

  get results(): OfflineChangeResult[] {
    return this._results ?? [];
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._results = data.jsonApi.attributes?.results ?? [];

    return this;
  }

  createJsonApi(data: OfflineChangeSetInput) {
    return {
      data: {
        type: Modules.OfflineChangeSet.name,
        id: data.id,
        attributes: { changes: data.changes },
      },
    };
  }
}
