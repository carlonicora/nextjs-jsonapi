import { GiftIcon } from "lucide-react";
import { ModuleFactory, ModuleWithPermissions } from "../../permissions";
import { ReferralAdminReferral } from "./data/ReferralAdminReferral";
import { ReferralAdminReferrer } from "./data/ReferralAdminReferrer";
import { ReferralAdminSummary } from "./data/ReferralAdminSummary";
import { ReferralVisit } from "./data/ReferralVisit";

/**
 * The referral visit and administrative report resources, as one object a
 * consuming app spreads into its `allModules` (same rationale as
 * `analyticsModules`). An app records link visits only once it spreads this.
 * None has a pageUrl: these are not navigable resources.
 */
export const referralAdminModules = (factory: ModuleFactory) =>
  ({
    ReferralVisit: factory({ name: "referrals/visits", model: ReferralVisit }),
    ReferralAdminSummary: factory({
      name: "referrals/administration/summary",
      model: ReferralAdminSummary,
      icon: GiftIcon,
    }),
    ReferralAdminReferrer: factory({
      name: "referrals/administration/referrers",
      model: ReferralAdminReferrer,
      icon: GiftIcon,
    }),
    ReferralAdminReferral: factory({
      name: "referrals/administration/referrals",
      model: ReferralAdminReferral,
      icon: GiftIcon,
    }),
  }) satisfies Record<string, ModuleWithPermissions>;
