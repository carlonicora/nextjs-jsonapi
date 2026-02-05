"use client";

import { useState } from "react";
import { isReferralEnabled } from "../config";
import { ReferralService } from "../data/ReferralService";

export function useReferralInvite() {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [success, setSuccess] = useState(false);

  const sendInvite = async (email: string) => {
    if (!isReferralEnabled()) {
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(false);

    try {
      await ReferralService.sendReferralEmail(email);
      setSuccess(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setSending(false);
    }
  };

  return { sendInvite, sending, error, success };
}
