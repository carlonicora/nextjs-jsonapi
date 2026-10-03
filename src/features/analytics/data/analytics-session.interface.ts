import { ApiDataInterface } from "../../../core";
import { UserInterface } from "../../user/data/user.interface";

export interface AnalyticsSessionInterface extends ApiDataInterface {
  get visitorId(): string;
  get consented(): boolean;
  /** Backend declares this `type: "datetime"`, so it is a Date in memory. */
  get startedAt(): Date;
  /** Backend declares this `type: "datetime"`, so it is a Date in memory. */
  get lastSeenAt(): Date;
  get pageViews(): number;
  get section(): string;
  get landingRoute(): string;
  get referrerHost(): string | undefined;
  get utmSource(): string | undefined;
  get utmMedium(): string | undefined;
  get utmCampaign(): string | undefined;
  get utmTerm(): string | undefined;
  get utmContent(): string | undefined;
  get deviceType(): string;
  /** Present only when the session belongs to a signed-in user. */
  get user(): UserInterface | undefined;
}
