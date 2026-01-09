"use client";

import { useMemo } from "react";
import { useCurrentUserContext } from "../../user/contexts/CurrentUserContext";

export interface TrialSubscriptionStatus {
  status: "loading" | "trial" | "active" | "expired";
  trialEndsAt: Date | null;
  daysRemaining: number;
  isGracePeriod: boolean; // Last 3 days
  isBlocked: boolean;
}

const TRIAL_DAYS = 14;
const GRACE_DAYS = 3;

export function useSubscriptionStatus(): TrialSubscriptionStatus {
  const { company, currentUser } = useCurrentUserContext();

  return useMemo(() => {
    // Still loading user data - don't block yet
    if (currentUser === null) {
      console.log("[useSubscriptionStatus] Loading - currentUser is null");
      return {
        status: "loading",
        trialEndsAt: null,
        daysRemaining: 0,
        isGracePeriod: false,
        isBlocked: false,
      };
    }

    // No company after loading = blocked
    if (!company) {
      console.log("[useSubscriptionStatus] No company - blocked");
      return {
        status: "expired",
        trialEndsAt: null,
        daysRemaining: 0,
        isGracePeriod: false,
        isBlocked: true,
      };
    }

    // Has active subscription = never blocked
    if (company.isActiveSubscription) {
      console.log("[useSubscriptionStatus] Active subscription - not blocked");
      return {
        status: "active",
        trialEndsAt: null,
        daysRemaining: 0,
        isGracePeriod: false,
        isBlocked: false,
      };
    }

    // Calculate trial status from createdAt
    const createdAt = new Date(company.createdAt);
    const trialEndsAt = new Date(createdAt);
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    const now = new Date();
    const msRemaining = trialEndsAt.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    console.log("[useSubscriptionStatus] company:", company.name);
    console.log("[useSubscriptionStatus] createdAt:", company.createdAt);
    console.log("[useSubscriptionStatus] trialEndsAt:", trialEndsAt.toISOString());
    console.log("[useSubscriptionStatus] daysRemaining:", daysRemaining);
    console.log("[useSubscriptionStatus] isBlocked:", daysRemaining <= 0);

    return {
      status: daysRemaining > 0 ? "trial" : "expired",
      trialEndsAt,
      daysRemaining: Math.max(0, daysRemaining),
      isGracePeriod: daysRemaining > 0 && daysRemaining <= GRACE_DAYS,
      isBlocked: daysRemaining <= 0,
    };
  }, [company, currentUser]);
}
