import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { recentPagesAtom, type RecentPage } from "../../../atoms";
import { configureI18n } from "../../../i18n";
import { SidebarMenu, SidebarProvider } from "../../../shadcnui";
import { RecentPagesNavigator } from "../RecentPagesNavigator";

// usePathname is globally mocked to "/" in vitest.setup.ts. Override it here so
// the current-page filter can be exercised. A spec-level vi.mock takes
// precedence over the setup-file mock for this module.
const pathnameRef: { current: string | null } = { current: "/" };
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

beforeEach(() => {
  pathnameRef.current = "/";
});

beforeAll(() => {
  // The package Link resolves its inner component at runtime and throws if i18n
  // was never configured (src/i18n/config.ts).
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
    usePathname: () => "/",
    Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: any }) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  });
});

const PAGES: RecentPage[] = [
  { url: "/npcs/npc-1", title: "Charlie", moduleType: "npcs", timestamp: 2 },
  { url: "/campaigns/camp-1", title: "Venezia Obscura", moduleType: "campaigns", timestamp: 1 },
];

function renderNavigator({
  pages = PAGES,
  open = true,
  pathname = "/",
}: { pages?: RecentPage[]; open?: boolean; pathname?: string | null } = {}) {
  pathnameRef.current = pathname;
  const store = createStore();
  store.set(recentPagesAtom, pages);
  return render(
    <Provider store={store}>
      <SidebarProvider open={open}>
        <SidebarMenu>
          <RecentPagesNavigator />
        </SidebarMenu>
      </SidebarProvider>
    </Provider>,
  );
}

describe("RecentPagesNavigator", () => {
  it("renders nothing when no pages have been recorded", () => {
    renderNavigator({ pages: [] });
    expect(screen.queryByTestId("sidebar-recent-pages")).toBeNull();
  });

  it("renders exactly one trigger button", () => {
    // Regression: four apps wrapped this component in their own
    // SidebarMenuButton and rendered a second HistoryIcon beside it. The
    // wrapper had no handler, so the visible icon was dead in the collapsed
    // rail. Exactly one button, and it must be the trigger.
    renderNavigator();
    const triggers = screen.getAllByTestId("sidebar-recent-pages");
    expect(triggers).toHaveLength(1);
    expect(triggers[0].tagName).toBe("BUTTON");
  });

  it("opens the menu when the trigger is clicked in the collapsed rail", async () => {
    renderNavigator({ open: false });
    await userEvent.click(screen.getByTestId("sidebar-recent-pages"));
    expect(await screen.findByText("Charlie")).toBeInTheDocument();
  });

  it("opens the menu when the trigger is clicked while expanded", async () => {
    renderNavigator({ open: true });
    await userEvent.click(screen.getByTestId("sidebar-recent-pages"));
    expect(await screen.findByText("Venezia Obscura")).toBeInTheDocument();
  });

  it("shows the entity name over its translated singular type", async () => {
    renderNavigator();
    await userEvent.click(screen.getByTestId("sidebar-recent-pages"));
    expect(await screen.findByText("Charlie")).toBeInTheDocument();
    // The i18n mock echoes the key back, so the second line is the raw key.
    expect(screen.getByText("entities.npcs")).toBeInTheDocument();
    expect(screen.getByText("entities.campaigns")).toBeInTheDocument();
  });

  it("makes each entry an anchor pointing at the recorded url", async () => {
    renderNavigator();
    await userEvent.click(screen.getByTestId("sidebar-recent-pages"));
    const link = (await screen.findByText("Charlie")).closest("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "/npcs/npc-1");
  });

  it("hides the entry for the page the user is currently on", async () => {
    renderNavigator({ pathname: "/npcs/npc-1" });
    await userEvent.click(screen.getByTestId("sidebar-recent-pages"));
    expect(await screen.findByText("Venezia Obscura")).toBeInTheDocument();
    expect(screen.queryByText("Charlie")).toBeNull();
  });

  it("hides the entry for the entity whose sub-page the user is on", async () => {
    renderNavigator({ pathname: "/campaigns/camp-1/canvas" });
    await userEvent.click(screen.getByTestId("sidebar-recent-pages"));
    expect(await screen.findByText("Charlie")).toBeInTheDocument();
    expect(screen.queryByText("Venezia Obscura")).toBeNull();
  });

  it("does not hide an entry whose url is merely a string prefix of the current path", async () => {
    // "/npcs/npc-1" must not be hidden while on "/npcs/npc-10".
    renderNavigator({
      pages: [{ url: "/npcs/npc-1", title: "Charlie", moduleType: "npcs", timestamp: 1 }],
      pathname: "/npcs/npc-10",
    });
    await userEvent.click(screen.getByTestId("sidebar-recent-pages"));
    expect(await screen.findByText("Charlie")).toBeInTheDocument();
  });

  it("renders nothing when the only recorded page is the one being viewed", () => {
    renderNavigator({
      pages: [{ url: "/npcs/npc-1", title: "Charlie", moduleType: "npcs", timestamp: 1 }],
      pathname: "/npcs/npc-1",
    });
    expect(screen.queryByTestId("sidebar-recent-pages")).toBeNull();
  });

  it("hides nothing when the pathname is unavailable", async () => {
    // usePathname is typed non-nullable but can return null in practice; the
    // sidebar must degrade rather than throw.
    renderNavigator({ pathname: null as unknown as string });
    await userEvent.click(screen.getByTestId("sidebar-recent-pages"));
    expect(await screen.findByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("Venezia Obscura")).toBeInTheDocument();
  });
});
