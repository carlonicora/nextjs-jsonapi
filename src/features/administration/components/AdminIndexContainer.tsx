"use client";

import { Building2Icon, CoinsIcon, CreditCardIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { getStripePublishableKey } from "../../../client/config";
import { MicroLabel, RoundPageContainer } from "../../../components";
import { Link } from "../../../shadcnui";
import { AdministrationProvider } from "../contexts/AdministrationContext";
import type { AdminGroup, AdminSection } from "../data/admin-section.types";

/**
 * The sections every NJA project has. Hrefs are constants rather than props:
 * the path convention IS the contract that makes this component reusable, and
 * it already exists in the package (see TOKEN_USAGE_ADMIN_PAGE_URL in
 * features/tokenusage/contexts/TokenUsageAdminContext.tsx).
 */
const PLATFORM_SECTIONS: AdminSection[] = [
  {
    key: "companies",
    icon: Building2Icon,
    labelKey: "entities.companies",
    labelValues: { count: 2 },
    descriptionKey: "administration.companies.description",
    href: "/administration/companies",
  },
  {
    key: "users",
    icon: UsersIcon,
    labelKey: "entities.users",
    labelValues: { count: 2 },
    descriptionKey: "administration.users.description",
    href: "/administration/users",
  },
  {
    key: "token-usage",
    icon: CoinsIcon,
    labelKey: "token_usage.admin.title",
    descriptionKey: "administration.token_usage.description",
    href: "/administration/token-usage",
  },
  {
    key: "rbac",
    icon: ShieldCheckIcon,
    labelKey: "entities.rbac",
    labelValues: { count: 2 },
    descriptionKey: "administration.rbac.description",
    href: "/administration/rbac",
  },
];

/**
 * The only conditional entry. getStripePublishableKey comes from /client rather
 * than isStripeConfigured() from /billing on purpose: /billing exists to keep
 * Stripe.js out of the global bundle, and isStripeConfigured lives in
 * StripeProvider.tsx, which imports @stripe/stripe-js at module scope. The two
 * are the same check — isStripeConfigured is a one-line wrapper over this call.
 */
const BILLING_SECTION: AdminSection = {
  key: "billing",
  icon: CreditCardIcon,
  labelKey: "billing.admin.products.title",
  descriptionKey: "administration.billing.description",
  href: "/administration/products",
};

/** Keys of the built-in platform sections, for `hiddenSections`. */
export type PlatformSectionKey = "companies" | "users" | "token-usage" | "rbac" | "billing";

type AdminIndexProps = {
  /** Project-specific groups, appended after the built-in platform group. */
  additionalGroups?: AdminGroup[];
  /**
   * Built-in sections to leave out. Every NJA project gets the same platform
   * group by default, but a project whose backend does not wire a foundation
   * must be able to drop its entry rather than advertise a route that throws —
   * narr8, for instance, never calls `RbacModule.register()`, so it has no RBAC
   * controllers at all.
   */
  hiddenSections?: PlatformSectionKey[];
};

/**
 * The grid itself, with no page shell — this is what the specs render, because
 * RoundPageContainer pulls in the app Header and its four header contexts.
 */
export function AdminIndexGrid({ additionalGroups = [], hiddenSections = [] }: AdminIndexProps) {
  const t = useTranslations();

  const available = getStripePublishableKey() ? [...PLATFORM_SECTIONS, BILLING_SECTION] : PLATFORM_SECTIONS;

  const platformGroup: AdminGroup = {
    key: "platform",
    labelKey: "administration.group.platform",
    sections: available.filter((section) => !hiddenSections.includes(section.key as PlatformSectionKey)),
  };

  const groups = [platformGroup, ...additionalGroups].filter((group) => group.sections.length > 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 py-8">
      {/* No page title here: AdministrationProvider feeds "Administration" to
          RoundPageContainerTitle, which owns the page's name. Repeating it as a
          role-1 title would triple up with that strip and the breadcrumb. */}
      <p className="text-muted-foreground text-sm">{t("administration.subtitle")}</p>

      {groups.map((group) => (
        <div key={group.key}>
          <MicroLabel as="h3" className="mb-2 px-3">
            {t(group.labelKey, group.labelValues)}
          </MicroLabel>
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2 lg:grid-cols-3">
            {group.sections.map((section) => (
              <Link
                key={section.key}
                href={section.href}
                className="text-foreground font-normal"
                data-testid={`admin-index-${section.key}`}
              >
                <div className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2">
                  <section.icon className="text-muted-foreground h-4 w-4 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{t(section.labelKey, section.labelValues)}</span>
                    <span className="text-muted-foreground text-xs">
                      {t(section.descriptionKey, section.descriptionValues)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Drop-in administration landing page. Mount it bare — it brings its own shell
 * and its own page chrome (AdministrationProvider), so it does not inherit the
 * title and breadcrumb of whatever page rendered before it.
 */
export function AdminIndexContainer({ additionalGroups, hiddenSections }: AdminIndexProps) {
  return (
    <AdministrationProvider>
      <RoundPageContainer>
        <AdminIndexGrid additionalGroups={additionalGroups} hiddenSections={hiddenSections} />
      </RoundPageContainer>
    </AdministrationProvider>
  );
}
