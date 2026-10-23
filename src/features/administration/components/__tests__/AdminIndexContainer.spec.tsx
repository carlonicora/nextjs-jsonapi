import { render, screen } from "@testing-library/react";
import { BookOpenIcon } from "lucide-react";
import { beforeEach, describe, expect, it } from "vitest";
import { configureJsonApi } from "../../../../client/config";
import { configureI18n } from "../../../../i18n";
import { ADMIN_PLATFORM_SECTIONS, AdminIndexGrid } from "../AdminIndexContainer";
import type { AdminGroup } from "../../data/admin-section.types";

// next-intl is globally mocked in vitest.setup.ts with `t = (key) => key`, so
// every label below renders as its own key. That is what the assertions match.
const configure = (stripePublishableKey?: string) => {
  configureJsonApi({ apiUrl: "http://api.test", stripePublishableKey });
  configureI18n({
    useRouter: () => ({
      push: () => {},
      replace: () => {},
      back: () => {},
      forward: () => {},
      refresh: () => {},
      prefetch: () => {},
    }),
    useTranslations: () => (key: string) => key,
    usePathname: () => "/administration",
    Link: ({ href, children, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  });
};

const extraGroup: AdminGroup = {
  key: "documentation",
  labelKey: "administration.group.documentation",
  sections: [
    {
      key: "howtos",
      icon: BookOpenIcon,
      labelKey: "entities.howtos",
      labelValues: { count: 2 },
      descriptionKey: "administration.howtos.description",
      href: "/administration/howtos",
    },
  ],
};

describe("AdminIndexGrid", () => {
  beforeEach(() => configure());

  it("renders the four unconditional platform entries with their hrefs", () => {
    render(<AdminIndexGrid />);

    expect(screen.getByTestId("admin-index-companies")).toHaveAttribute("href", "/administration/companies");
    expect(screen.getByTestId("admin-index-users")).toHaveAttribute("href", "/administration/users");
    expect(screen.getByTestId("admin-index-token-usage")).toHaveAttribute("href", "/administration/token-usage");
    expect(screen.getByTestId("admin-index-rbac")).toHaveAttribute("href", "/administration/rbac");
  });

  it("omits the billing entry when no Stripe publishable key is configured", () => {
    render(<AdminIndexGrid />);

    expect(screen.queryByTestId("admin-index-billing")).not.toBeInTheDocument();
  });

  it("includes the billing entry when a Stripe publishable key is configured", () => {
    configure("pk_test_123");
    render(<AdminIndexGrid />);

    expect(screen.getByTestId("admin-index-billing")).toHaveAttribute("href", "/administration/products");
  });

  it("appends additionalGroups after the platform group, in order", () => {
    render(<AdminIndexGrid additionalGroups={[extraGroup]} />);

    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(["administration.group.platform", "administration.group.documentation"]);
    expect(screen.getByTestId("admin-index-howtos")).toHaveAttribute("href", "/administration/howtos");
  });

  it("skips a group that has no sections", () => {
    render(
      <AdminIndexGrid additionalGroups={[{ key: "empty", labelKey: "administration.group.empty", sections: [] }]} />,
    );

    expect(screen.queryByText("administration.group.empty")).not.toBeInTheDocument();
  });

  it("renders the subtitle but not a page title of its own", () => {
    render(<AdminIndexGrid />);

    expect(screen.getByText("administration.subtitle")).toBeInTheDocument();
    // The page's name comes from AdministrationProvider via
    // RoundPageContainerTitle, so the grid must not repeat it.
    expect(screen.queryByText("administration.title")).not.toBeInTheDocument();
  });

  describe("groups", () => {
    const customGroups: AdminGroup[] = [
      {
        key: "customers",
        labelKey: "administration.group.customers",
        sections: [ADMIN_PLATFORM_SECTIONS.users, ADMIN_PLATFORM_SECTIONS.companies],
      },
      extraGroup,
      {
        key: "system",
        labelKey: "administration.group.system",
        sections: [ADMIN_PLATFORM_SECTIONS["ai-connections"], ADMIN_PLATFORM_SECTIONS.rbac],
      },
    ];

    it("replaces the platform group and additionalGroups with exactly the given groups, in order", () => {
      render(<AdminIndexGrid groups={customGroups} additionalGroups={[extraGroup]} />);

      const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
      expect(headings).toEqual([
        "administration.group.customers",
        "administration.group.documentation",
        "administration.group.system",
      ]);
      expect(screen.queryByText("administration.group.platform")).not.toBeInTheDocument();
      expect(screen.queryByTestId("admin-index-token-usage")).not.toBeInTheDocument();
      expect(screen.getAllByTestId("admin-index-howtos")).toHaveLength(1);
    });

    it("renders sections in the order each group lists them", () => {
      render(<AdminIndexGrid groups={customGroups} />);

      const ids = screen.getAllByRole("link").map((link) => link.getAttribute("data-testid"));
      expect(ids).toEqual([
        "admin-index-users",
        "admin-index-companies",
        "admin-index-howtos",
        "admin-index-ai-connections",
        "admin-index-rbac",
      ]);
      expect(screen.getByTestId("admin-index-companies")).toHaveAttribute("href", "/administration/companies");
    });

    it("applies hiddenSections inside the given groups and skips a group left empty", () => {
      render(
        <AdminIndexGrid
          groups={[
            ...customGroups,
            { key: "only-rbac", labelKey: "administration.group.only_rbac", sections: [ADMIN_PLATFORM_SECTIONS.rbac] },
          ]}
          hiddenSections={["rbac"]}
        />,
      );

      expect(screen.queryByTestId("admin-index-rbac")).not.toBeInTheDocument();
      expect(screen.getByTestId("admin-index-ai-connections")).toBeInTheDocument();
      expect(screen.queryByText("administration.group.only_rbac")).not.toBeInTheDocument();
    });
  });
});
