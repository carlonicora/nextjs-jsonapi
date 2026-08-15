import { render, screen } from "@testing-library/react";
import { BookOpenIcon } from "lucide-react";
import { beforeEach, describe, expect, it } from "vitest";
import { configureJsonApi } from "../../../../client/config";
import { configureI18n } from "../../../../i18n";
import { AdminIndexGrid } from "../AdminIndexContainer";
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
});
