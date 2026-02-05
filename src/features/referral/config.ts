/**
 * Configuration interface for frontend referral feature.
 */
export interface ReferralConfig {
  /**
   * Whether the referral feature is enabled.
   * When false, components render nothing and hooks return null.
   * @default false
   */
  enabled?: boolean;

  /**
   * Name of the cookie used to store referral codes.
   * @default "referral_code"
   */
  cookieName?: string;

  /**
   * Number of days the referral cookie is valid.
   * @default 30
   */
  cookieDays?: number;

  /**
   * Query parameter name for referral code in URL.
   * @default "ref"
   */
  urlParamName?: string;

  /**
   * Base URL for referral links.
   * @default window.location.origin (client-side only)
   */
  referralUrlBase?: string;

  /**
   * Path to append to base URL for referral links.
   * @default "/"
   */
  referralPath?: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_REFERRAL_CONFIG: Required<ReferralConfig> = {
  enabled: false,
  cookieName: "referral_code",
  cookieDays: 30,
  urlParamName: "ref",
  referralUrlBase: "",
  referralPath: "/",
};

// Private storage for configuration
let _referralConfig: Required<ReferralConfig> = { ...DEFAULT_REFERRAL_CONFIG };

/**
 * Configure referral feature settings.
 * Call this at app startup to enable and configure referral functionality.
 *
 * @example
 * ```typescript
 * import { configureReferral } from "@carlonicora/nextjs-jsonapi";
 *
 * configureReferral({
 *   enabled: process.env.NEXT_PUBLIC_REFERRAL_ENABLED === 'true',
 *   cookieDays: 30,
 * });
 * ```
 */
export function configureReferral(config: ReferralConfig): void {
  _referralConfig = { ...DEFAULT_REFERRAL_CONFIG, ...config };
}

/**
 * Get the current referral configuration.
 * @internal
 */
export function getReferralConfig(): Required<ReferralConfig> {
  return _referralConfig;
}

/**
 * Check if referral feature is enabled.
 */
export function isReferralEnabled(): boolean {
  return _referralConfig.enabled;
}
