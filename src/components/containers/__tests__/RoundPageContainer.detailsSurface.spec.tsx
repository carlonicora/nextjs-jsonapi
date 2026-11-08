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

function withShared(node: React.ReactNode) {
  return <SharedProvider value={{ breadcrumbs: [], title: { type: "" } }}>{node}</SharedProvider>;
}

async function detailsBody(): Promise<HTMLElement> {
  const content = await screen.findByText("d");
  const body = content.closest<HTMLElement>('[data-slot="details-body"]');
  if (!body) throw new Error("details body not found");
  return body;
}

describe("RoundPageContainer details surface", () => {
  it("default surface keeps the details body unpainted with p-4", async () => {
    render(
      withShared(
        <RoundPageContainer testId="shell" details={<div>d</div>} defaultDetailsOpen>
          content
        </RoundPageContainer>,
      ),
    );
    const body = await detailsBody();
    expect(body.classList.contains("p-4")).toBe(true);
    expect(body.classList.contains("bg-muted")).toBe(false);
  });

  it("muted surface paints the details body", async () => {
    render(
      withShared(
        <RoundPageContainer testId="shell" details={<div>d</div>} defaultDetailsOpen detailsSurface="muted">
          content
        </RoundPageContainer>,
      ),
    );
    const body = await detailsBody();
    expect(body.classList.contains("bg-muted")).toBe(true);
    expect(body.classList.contains("dark:bg-background")).toBe(true);
    expect(body.classList.contains("p-3")).toBe(true);
    expect(body.classList.contains("p-4")).toBe(false);
  });
});
