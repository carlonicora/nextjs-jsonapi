import { SignupSource } from "../../signup-source/signup-source";

/**
 * The one-line source shown in the waitlist admin table, first rule that applies:
 * ref; utm source (with " / utm campaign" when present); referring host.
 * Undefined means a direct visit.
 */
export function formatSignupSource(entry: SignupSource): string | undefined {
  if (entry.sourceRef) return entry.sourceRef;
  if (entry.sourceUtmSource)
    return entry.sourceUtmCampaign ? `${entry.sourceUtmSource} / ${entry.sourceUtmCampaign}` : entry.sourceUtmSource;
  if (entry.sourceReferrer) return entry.sourceReferrer;
  return undefined;
}
