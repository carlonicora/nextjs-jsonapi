import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { AnalyticsEventInterface } from "./analytics-event.interface";
import { AnalyticsEventInput } from "./analytics.types";

/**
 * JSON:API resource type of a posted event. It must match `analyticsEventMeta.type`
 * in the API, whose DTO rejects any other value. It is not `Modules.AnalyticsEvent.name`:
 * that is the endpoint path ("analytics/events"), the same split the auth models
 * make (e.g. backup-code-verify.ts posts type "backup-codes").
 */
const ANALYTICS_EVENT_TYPE = "analytics-events";

/**
 * One page view as the tracker posts it. The API answers with the stored event,
 * so rehydrate reads back the two attributes every event carries.
 */
export class AnalyticsEvent extends AbstractApiData implements AnalyticsEventInterface {
  private _path: string = "";
  private _section: string = "";

  get path(): string {
    return this._path;
  }

  get section(): string {
    return this._section;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes;
    this._path = attrs.path ?? "";
    this._section = attrs.section ?? "";

    return this;
  }

  createJsonApi(data: AnalyticsEventInput) {
    const response: any = {
      data: {
        type: ANALYTICS_EVENT_TYPE,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    response.data.attributes.path = data.path;
    response.data.attributes.section = data.section;
    if (data.referrer !== undefined) response.data.attributes.referrer = data.referrer;
    if (data.utmSource !== undefined) response.data.attributes.utmSource = data.utmSource;
    if (data.utmMedium !== undefined) response.data.attributes.utmMedium = data.utmMedium;
    if (data.utmCampaign !== undefined) response.data.attributes.utmCampaign = data.utmCampaign;
    if (data.utmTerm !== undefined) response.data.attributes.utmTerm = data.utmTerm;
    if (data.utmContent !== undefined) response.data.attributes.utmContent = data.utmContent;
    if (data.visitorId !== undefined) response.data.attributes.visitorId = data.visitorId;
    if (data.screenWidth !== undefined) response.data.attributes.screenWidth = data.screenWidth;

    return response;
  }
}
