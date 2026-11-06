import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SharedProvider } from "../../../contexts/SharedContext";
import { configureI18n } from "../../../i18n";
import { SidebarProvider } from "../../../shadcnui";
import { RoundPageContainer } from "../../containers/RoundPageContainer";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
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

function withShared(node: React.ReactNode) {
  return <SharedProvider value={{ breadcrumbs: [], title: { type: "" } }}>{node}</SharedProvider>;
}

describe("RoundPageContainer shell padding", () => {
  it("drops the start padding next to a sidebar", async () => {
    render(
      withShared(<SidebarProvider>{<RoundPageContainer testId="shell">content</RoundPageContainer>}</SidebarProvider>),
    );
    expect((await screen.findByTestId("shell")).classList.contains("ps-0")).toBe(true);
  });

  it("keeps the start padding when the page has no sidebar", async () => {
    render(withShared(<RoundPageContainer testId="shell">content</RoundPageContainer>));
    const shell = await screen.findByTestId("shell");
    expect(shell.classList.contains("p-2")).toBe(true);
    expect(shell.classList.contains("ps-0")).toBe(false);
  });

  it("keeps the page above a bottom panel: the height also subtracts --app-footer-h", async () => {
    render(withShared(<RoundPageContainer testId="shell">content</RoundPageContainer>));
    const shell = await screen.findByTestId("shell");
    expect(shell.className).toContain("-var(--app-footer-h,0px))]");
  });

  it("a page that grows with its content gets the bottom panel's height as margin; a full-height one does not", async () => {
    const { unmount } = render(
      withShared(
        <RoundPageContainer testId="doc" scroll="document">
          content
        </RoundPageContainer>,
      ),
    );
    expect((await screen.findByTestId("doc")).classList.contains("mb-[var(--app-footer-h,0px)]")).toBe(true);
    unmount();

    render(withShared(<RoundPageContainer testId="fixed">content</RoundPageContainer>));
    expect((await screen.findByTestId("fixed")).classList.contains("mb-[var(--app-footer-h,0px)]")).toBe(false);
  });
});
