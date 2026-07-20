import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeIcon, SearchIcon } from "lucide-react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MobileNavigationProvider, type MobileNavigationItem } from "../../../contexts/MobileNavigationContext";
import { ViewportProvider } from "../../../contexts/ViewportContext";
import { configureI18n } from "../../../i18n";
import { MobileNavigationBar } from "../MobileNavigationBar";

// usePathname is globally mocked to "/" in vitest.setup.ts. Override it here so
// the active-state rule can be exercised against a real route. A spec-level
// vi.mock takes precedence over the setup-file mock for this module.
const pathnameRef = { current: "/" };
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameRef.current,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

beforeAll(() => {
  // The package Link resolves its inner component at runtime and throws if i18n
  // was never configured (src/i18n/config.ts:53-58).
  configureI18n({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    useTranslations: () => (key: string) => key,
    usePathname: () => pathnameRef.current,
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: any }) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  });
});

beforeEach(() => {
  pathnameRef.current = "/";
  // jsdom defaults to 1024; ViewportProvider's effect measures immediately and
  // would otherwise overwrite the mobile seed with "desktop".
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
});

function renderBar(items: MobileNavigationItem[], { mobile = true }: { mobile?: boolean } = {}) {
  if (!mobile) {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
  }
  return render(
    <ViewportProvider initialIsMobile={mobile}>
      <MobileNavigationProvider items={items}>
        <MobileNavigationBar />
      </MobileNavigationProvider>
    </ViewportProvider>,
  );
}

const searchItem: MobileNavigationItem = { key: "search", label: "Cerca", icon: SearchIcon, onClick: vi.fn() };
const homeItem: MobileNavigationItem = { key: "home", label: "Dashboard", icon: HomeIcon, href: "/" };

describe("MobileNavigationBar", () => {
  it("renders nothing when the application supplied no items", () => {
    renderBar([]);
    expect(screen.queryByTestId("mobile-navigation-bar")).not.toBeInTheDocument();
  });

  it("renders nothing on desktop even when items exist", () => {
    renderBar([searchItem], { mobile: false });
    expect(screen.queryByTestId("mobile-navigation-bar")).not.toBeInTheDocument();
  });

  it("renders one slot per item, labelled by its accessible name", () => {
    renderBar([searchItem, homeItem]);
    expect(screen.getByTestId("mobile-navigation-bar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerca" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("does not render the label as visible text (icons-only bar)", () => {
    renderBar([searchItem]);
    expect(screen.queryByText("Cerca")).not.toBeInTheDocument();
  });

  it("fires onClick for action slots", async () => {
    const onClick = vi.fn();
    renderBar([{ ...searchItem, onClick }]);
    await userEvent.click(screen.getByRole("button", { name: "Cerca" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders the `render` escape hatch instead of an icon", () => {
    renderBar([
      { key: "profile", label: "Impostazioni", render: <span data-testid="avatar-stub" />, href: "/settings" },
    ]);
    expect(screen.getByTestId("avatar-stub")).toBeInTheDocument();
  });

  // The load-bearing case: a bare startsWith would make href="/" match everything.
  it("marks only the exactly-matching slot active when one href is '/'", () => {
    pathnameRef.current = "/conversations";
    renderBar([homeItem, { key: "ai", label: "Chiedi all'AI", icon: SearchIcon, href: "/conversations" }]);
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Chiedi all'AI" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps a section active on its detail route", () => {
    pathnameRef.current = "/conversations/abc-123";
    renderBar([{ key: "ai", label: "Chiedi all'AI", icon: SearchIcon, href: "/conversations" }]);
    expect(screen.getByRole("link", { name: "Chiedi all'AI" })).toHaveAttribute("aria-current", "page");
  });

  it("never marks an action slot active", () => {
    pathnameRef.current = "/";
    renderBar([searchItem]);
    expect(screen.getByRole("button", { name: "Cerca" })).not.toHaveAttribute("aria-current");
  });
});
