import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { SharedProvider } from "../../../contexts/SharedContext";
import { configureI18n } from "../../../i18n";
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

describe("RoundPageContainer title", () => {
  it("draws the page title as a heading", async () => {
    render(
      <SharedProvider value={{ breadcrumbs: [], title: { type: "Company", element: "Acme" } }}>
        <RoundPageContainer testId="shell">content</RoundPageContainer>
      </SharedProvider>,
    );
    expect(await screen.findByRole("heading", { level: 1, name: "Acme" })).toBeInTheDocument();
  });

  it("draws no heading when the title has no element", async () => {
    render(
      <SharedProvider value={{ breadcrumbs: [], title: { type: "Company" } }}>
        <RoundPageContainer testId="shell">content</RoundPageContainer>
      </SharedProvider>,
    );
    await screen.findByText("content");
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });
});
