"use client";

import { useEffect, useState } from "react";
import { isReferralEnabled } from "../config";
import { ReferralService } from "../data/ReferralService";
import { ReferralStatsInterface } from "../interfaces";

export function useReferralStats() {
  const [stats, setStats] = useState<ReferralStatsInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isReferralEnabled()) {
      setLoading(false);
      return;
    }

    ReferralService.getMyReferralStats()
      .then(setStats)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}
