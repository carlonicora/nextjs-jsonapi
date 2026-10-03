import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { AnalyticsPageViewInterface } from "./analytics-page-view.interface";
import { AnalyticsPageViewInput } from "./analytics.types";

/** One step of a session journey. */
export class AnalyticsPageView extends AbstractApiData implements AnalyticsPageViewInterface {
  private _path: string = "";
  private _route: string = "";
  private _section: string = "";

  get path(): string {
    return this._path;
  }

  get route(): string {
    return this._route;
  }

  get section(): string {
    return this._section;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes;
    // `createdAt` is inherited: the serialiser sends it in meta and
    // super.rehydrate() parses it into a Date. Honour it as an attribute too,
    // should the descriptor ever list it among the fields.
    if (attrs.createdAt) this._createdAt = new Date(attrs.createdAt);
    this._path = attrs.path ?? "";
    this._route = attrs.route ?? "";
    this._section = attrs.section ?? "";

    return this;
  }

  createJsonApi(data: AnalyticsPageViewInput) {
    const response: any = {
      data: {
        type: Modules.AnalyticsPageView.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    // type: "datetime" on the backend descriptor: an ISO 8601 instant.
    if (data.createdAt !== undefined) response.data.attributes.createdAt = data.createdAt.toISOString();
    if (data.path !== undefined) response.data.attributes.path = data.path;
    if (data.route !== undefined) response.data.attributes.route = data.route;
    if (data.section !== undefined) response.data.attributes.section = data.section;

    return response;
  }
}
