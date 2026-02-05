"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { getReferralConfig, isReferralEnabled } from "../config";
import { getReferralCode, setReferralCode } from "../utils/referral-cookie";

/**
 * ReferralCodeCapture captures referral codes from URL parameters.
 *
 * Behavior:
 * - Checks if referral feature is enabled before processing
 * - Reads the configured query param (default "ref") from the URL
 * - Checks if a referral cookie already exists
 * - If ref param is present AND no existing cookie, sets the cookie (first referrer wins)
 * - Renders nothing (null) - component only captures the code
 */
export function ReferralCodeCapture(): null {
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log("[REFERRAL] ReferralCodeCapture mounted");
    console.log("[REFERRAL] isReferralEnabled():", isReferralEnabled());

    // Skip if feature is disabled
    if (!isReferralEnabled()) {
      console.log("[REFERRAL] Feature DISABLED - not capturing");
      return;
    }

    const config = getReferralConfig();
    const refCode = searchParams.get(config.urlParamName);
    console.log("[REFERRAL] URL param '" + config.urlParamName + "':", refCode);

    if (refCode) {
      const existingCode = getReferralCode();
      console.log("[REFERRAL] Existing cookie:", existingCode);

      // First referrer wins - only set if no existing cookie
      if (!existingCode) {
        setReferralCode(refCode);
        console.log("[REFERRAL] Cookie SET to:", refCode);
      } else {
        console.log("[REFERRAL] Cookie already exists, not overwriting");
      }
    }
  }, [searchParams]);

  return null;
}
