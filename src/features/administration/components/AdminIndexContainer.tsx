"use client";

import { Building2Icon, CoinsIcon, CreditCardIcon, PlugZapIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { getStripePublishableKey } from "../../../client/config";
import { MicroLabel, RoundPageContainer } from "../../../components";
import { Link } from "../../../shadcnui";
import { AdministrationProvider } from "../contexts/AdministrationContext";
import type { AdminGroup, AdminSection } from "../data/admin-section.types";

/** Keys of the built-in platform sections, for `hiddenSections`. */
export type PlatformSectionKey = "companies" | "users" | "token-usage" | "ai-connections" | "rbac" | "billing";

/**
 * The sections every NJA project has, by key. Hrefs are constants rather than
 * props: the path convention IS the contract that makes this component
 * reusable. Exported so an app that passes its own `groups` places these
 * entries without retyping their keys, icons and copy.
 *
 * `billing` is the only conditional entry: the default platform group shows it
 * only when Stripe is configured (see AdminIndexGrid). An app that places it in
 * its own `groups` applies the same check itself.
 */
export const ADMIN_PLATFORM_SECTIONS: Record<PlatformSectionKey, AdminSection> = {
  companies: {
    key: "companies",
    icon: Building2Icon,
    labelKey: "entities.companies",
    labelValues: { count: 2 },
    descriptionKey: "administration.companies.description",
    href: "/administration/companies",
  },
  users: {
    key: "users",
    icon: UsersIcon,
    labelKey: "entities.users",
    labelValues: { count: 2 },
    descriptionKey: "administration.users.description",
    href: "/administration/users",
  },
  "token-usage": {
    key: "token-usage",
    icon: CoinsIcon,
    labelKey: "token_usage.admin.title",
    descriptionKey: "administration.token_usage.description",
    href: "/administration/token-usage",
  },
  "ai-connections": {
    key: "ai-connections",
    icon: PlugZapIcon,
    labelKey: "ai_connections.admin.title",
    descriptionKey: "administration.ai_connections.description",
    href: "/administration/ai-connections",
  },
  rbac: {
    key: "rbac",
    icon: ShieldCheckIcon,
    labelKey: "entities.rbac",
    labelValues: { count: 2 },
    descriptionKey: "administration.rbac.description",
    href: "/administration/rbac",
  },
  billing: {
    key: "billing",
    icon: CreditCardIcon,
    labelKey: "billing.admin.products.title",
    descriptionKey: "administration.billing.description",
    href: "/administration/products",
  },
};

/** The unconditional platform entries, in the default group's order. */
const PLATFORM_SECTIONS: AdminSection[] = [
  ADMIN_PLATFORM_SECTIONS.companies,
  ADMIN_PLATFORM_SECTIONS.users,
  ADMIN_PLATFORM_SECTIONS["token-usage"],
  ADMIN_PLATFORM_SECTIONS["ai-connections"],
  ADMIN_PLATFORM_SECTIONS.rbac,
];

type AdminIndexProps = {
  /**
   * Replaces the default groups (the built-in platform group plus
   * `additionalGroups`) with exactly these, in this order. For an app that
   * arranges its administration by its own headings; it places the platform
   * entries it wants from ADMIN_PLATFORM_SECTIONS. When set, `additionalGroups`
   * is ignored and the Stripe check on `billing` is the app's to apply.
   */
  groups?: AdminGroup[];
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
export function AdminIndexGrid({ groups: customGroups, additionalGroups = [], hiddenSections = [] }: AdminIndexProps) {
  const t = useTranslations();

  const available = getStripePublishableKey()
    ? [...PLATFORM_SECTIONS, ADMIN_PLATFORM_SECTIONS.billing]
    : PLATFORM_SECTIONS;

  const platformGroup: AdminGroup = {
    key: "platform",
    labelKey: "administration.group.platform",
    sections: available.filter((section) => !hiddenSections.includes(section.key as PlatformSectionKey)),
  };

  // Custom groups still honour hiddenSections, so a project that cannot serve
  // a platform route drops it the same way in either mode.
  const groups = (
    customGroups
      ? customGroups.map((group) => ({
          ...group,
          sections: group.sections.filter((section) => !hiddenSections.includes(section.key as PlatformSectionKey)),
        }))
      : [platformGroup, ...additionalGroups]
  ).filter((group) => group.sections.length > 0);

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
export function AdminIndexContainer({ groups, additionalGroups, hiddenSections }: AdminIndexProps) {
  const t = useTranslations();

  // The index is the "Administration" page itself, so it names itself in the
  // breadcrumb like every administration page does ("Home > Companies").
  return (
    <AdministrationProvider section={t("administration.title")}>
      <RoundPageContainer>
        <AdminIndexGrid groups={groups} additionalGroups={additionalGroups} hiddenSections={hiddenSections} />
      </RoundPageContainer>
    </AdministrationProvider>
  );
}
