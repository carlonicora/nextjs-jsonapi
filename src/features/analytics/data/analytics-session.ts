import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { UserInterface } from "../../user/data/user.interface";
import { AnalyticsSessionInterface } from "./analytics-session.interface";
import { AnalyticsSessionInput } from "./analytics.types";

/** One visit: a run of page views from one visitor with no 30-minute gap. */
export class AnalyticsSession extends AbstractApiData implements AnalyticsSessionInterface {
  private _visitorId: string = "";
  private _consented: boolean = false;
  private _startedAt: Date = new Date(0);
  private _lastSeenAt: Date = new Date(0);
  private _pageViews: number = 0;
  private _section: string = "";
  private _landingRoute: string = "";
  private _referrerHost?: string;
  private _utmSource?: string;
  private _utmMedium?: string;
  private _utmCampaign?: string;
  private _utmTerm?: string;
  private _utmContent?: string;
  private _deviceType: string = "";
  private _user?: UserInterface;

  get visitorId(): string {
    return this._visitorId;
  }

  get consented(): boolean {
    return this._consented;
  }

  get startedAt(): Date {
    return this._startedAt;
  }

  get lastSeenAt(): Date {
    return this._lastSeenAt;
  }

  get pageViews(): number {
    return this._pageViews;
  }

  get section(): string {
    return this._section;
  }

  get landingRoute(): string {
    return this._landingRoute;
  }

  get referrerHost(): string | undefined {
    return this._referrerHost;
  }

  get utmSource(): string | undefined {
    return this._utmSource;
  }

  get utmMedium(): string | undefined {
    return this._utmMedium;
  }

  get utmCampaign(): string | undefined {
    return this._utmCampaign;
  }

  get utmTerm(): string | undefined {
    return this._utmTerm;
  }

  get utmContent(): string | undefined {
    return this._utmContent;
  }

  get deviceType(): string {
    return this._deviceType;
  }

  get user(): UserInterface | undefined {
    return this._user;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes;
    this._visitorId = attrs.visitorId ?? "";
    this._consented = attrs.consented ?? false;
    // Wire format is an ISO 8601 instant; the interface promises a Date.
    this._startedAt = attrs.startedAt ? new Date(attrs.startedAt) : new Date(0);
    this._lastSeenAt = attrs.lastSeenAt ? new Date(attrs.lastSeenAt) : new Date(0);
    this._pageViews = attrs.pageViews ?? 0;
    this._section = attrs.section ?? "";
    this._landingRoute = attrs.landingRoute ?? "";
    this._referrerHost = attrs.referrerHost ?? undefined;
    this._utmSource = attrs.utmSource ?? undefined;
    this._utmMedium = attrs.utmMedium ?? undefined;
    this._utmCampaign = attrs.utmCampaign ?? undefined;
    this._utmTerm = attrs.utmTerm ?? undefined;
    this._utmContent = attrs.utmContent ?? undefined;
    this._deviceType = attrs.deviceType ?? "";

    this._user = this._readIncluded(data, "user", Modules.User) as UserInterface | undefined;

    return this;
  }

  createJsonApi(data: AnalyticsSessionInput) {
    const response: any = {
      data: {
        type: Modules.AnalyticsSession.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    if (data.visitorId !== undefined) response.data.attributes.visitorId = data.visitorId;
    if (data.consented !== undefined) response.data.attributes.consented = data.consented;
    // Both are type: "datetime" on the backend descriptor: ISO 8601 instants.
    if (data.startedAt !== undefined) response.data.attributes.startedAt = data.startedAt.toISOString();
    if (data.lastSeenAt !== undefined) response.data.attributes.lastSeenAt = data.lastSeenAt.toISOString();
    if (data.pageViews !== undefined) response.data.attributes.pageViews = data.pageViews;
    if (data.section !== undefined) response.data.attributes.section = data.section;
    if (data.landingRoute !== undefined) response.data.attributes.landingRoute = data.landingRoute;
    if (data.referrerHost !== undefined) response.data.attributes.referrerHost = data.referrerHost;
    if (data.utmSource !== undefined) response.data.attributes.utmSource = data.utmSource;
    if (data.utmMedium !== undefined) response.data.attributes.utmMedium = data.utmMedium;
    if (data.utmCampaign !== undefined) response.data.attributes.utmCampaign = data.utmCampaign;
    if (data.utmTerm !== undefined) response.data.attributes.utmTerm = data.utmTerm;
    if (data.utmContent !== undefined) response.data.attributes.utmContent = data.utmContent;
    if (data.deviceType !== undefined) response.data.attributes.deviceType = data.deviceType;

    if (data.userId) {
      response.data.relationships.user = {
        data: { type: Modules.User.name, id: data.userId },
      };
    }

    return response;
  }
}
