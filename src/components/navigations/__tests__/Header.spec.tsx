import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SharedProvider } from "../../../contexts/SharedContext";
import { configureI18n } from "../../../i18n";
import { SidebarProvider } from "../../../shadcnui";
import { Header } from "../Header";

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

describe("Header", () => {
  it("renders the sidebar toggle inside a SidebarProvider", () => {
    render(withShared(<SidebarProvider>{<Header />}</SidebarProvider>));
    expect(screen.queryByRole("button", { name: "Toggle sidebar" })).not.toBeNull();
  });

  it("renders without a SidebarProvider and shows no sidebar toggle", () => {
    expect(() => render(withShared(<Header />))).not.toThrow();
    expect(screen.queryByRole("button", { name: "Toggle sidebar" })).toBeNull();
  });
});
