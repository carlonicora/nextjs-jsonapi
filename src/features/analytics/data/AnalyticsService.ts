import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { AnalyticsEventInput } from "./analytics.types";

export class AnalyticsService extends AbstractService {
  /**
   * Posts one page view. Fire-and-forget: a lost page view must never surface
   * an error to the visitor, so the global handler is suppressed and any
   * rejection is logged at debug level and swallowed here.
   */
  static async track(input: AnalyticsEventInput): Promise<void> {
    try {
      await this.callApi({
        type: Modules.AnalyticsEvent,
        method: HttpMethod.POST,
        endpoint: new EndpointCreator({ endpoint: Modules.AnalyticsEvent }).generate(),
        input,
        suppressGlobalError: true,
      });
    } catch (error) {
      console.debug("Analytics event not sent", error);
    }
  }
}
