import { getReferralConfig } from "../config";

/**
 * Sets the referral code cookie with configured expiry
 * @param code - The referral code to store
 */
export function setReferralCode(code: string): void {
  const config = getReferralConfig();
  const maxAge = config.cookieDays * 24 * 60 * 60; // days to seconds
  document.cookie = `${config.cookieName}=${encodeURIComponent(code)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Gets the referral code from the cookie
 * @returns The referral code or null if not found
 */
export function getReferralCode(): string | null {
  const config = getReferralConfig();
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === config.cookieName && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Clears the referral code cookie (typically called after registration)
 */
export function clearReferralCode(): void {
  const config = getReferralConfig();
  document.cookie = `${config.cookieName}=; path=/; max-age=0; SameSite=Lax`;
}
