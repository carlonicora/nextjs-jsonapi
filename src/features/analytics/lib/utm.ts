import { AnalyticsEventInput } from "../data/analytics.types";

type UtmFields = Pick<AnalyticsEventInput, "utmSource" | "utmMedium" | "utmCampaign" | "utmTerm" | "utmContent">;

const MAX_LENGTH = 255;

const UTM_PARAMS: [string, keyof UtmFields][] = [
  ["utm_source", "utmSource"],
  ["utm_medium", "utmMedium"],
  ["utm_campaign", "utmCampaign"],
  ["utm_term", "utmTerm"],
  ["utm_content", "utmContent"],
];

/**
 * Reads the five utm_* parameters from a query string. Absent or empty values
 * are left out; every value is cut to 255 characters.
 */
export function readUtm(search: string): UtmFields {
  const params = new URLSearchParams(search);
  const response: UtmFields = {};

  for (const [param, field] of UTM_PARAMS) {
    const value = params.get(param);
    if (value) response[field] = value.slice(0, MAX_LENGTH);
  }

  return response;
}
