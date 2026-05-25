import { _getStaticHelpContent } from "../../../core/registry/helpStore";
import type { HelpContentConfig } from "../interfaces/help-content-config.interface";

/**
 * Server-side accessor for the help-content config set via configureJsonApi().
 * Returns the same value <HelpProvider> exposes via React Context to client components.
 * Throws with a setup error if helpContent was never configured.
 */
export function getHelpContent(): HelpContentConfig {
  const cfg = _getStaticHelpContent<HelpContentConfig>();
  if (!cfg) {
    throw new Error(
      "Help content not configured — call configureJsonApi({ helpContent: {...} }) before importing help pages.",
    );
  }
  return cfg;
}
