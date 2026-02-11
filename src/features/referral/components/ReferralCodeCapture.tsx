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
    // Skip if feature is disabled
    if (!isReferralEnabled()) {
      return;
    }

    const config = getReferralConfig();
    const refCode = searchParams.get(config.urlParamName);

    if (refCode) {
      const existingCode = getReferralCode();

      // First referrer wins - only set if no existing cookie
      if (!existingCode) {
        setReferralCode(refCode);
      }
    }
  }, [searchParams]);

  return null;
}
