import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { configureI18n } from "../../../../i18n";
import { EntityMentionLink } from "../EntityMentionLink";

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
    Link: ({
      href,
      children,
      prefetch: _prefetch,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
      [key: string]: any;
    }) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  });
  ModuleRegistry.register("Account" as any, { name: "accounts", pageUrl: "/accounts" } as any);
});

describe("EntityMentionLink", () => {
  it("renders a link to the entity page for a registered module", () => {
    render(<>{EntityMentionLink({ type: "accounts", id: "a1", alias: "Rossi" })}</>);
    const link = screen.getByRole("link", { name: "Rossi" });
    expect(link).toHaveAttribute("href", "/accounts/a1");
    expect(link).toHaveTextContent("Rossi");
  });

  it("renders through the package Link (locale-aware, link typography role)", () => {
    render(<>{EntityMentionLink({ type: "accounts", id: "a1", alias: "Rossi" })}</>);
    const link = screen.getByRole("link", { name: "Rossi" });
    expect(link.className).toContain("text-primary font-medium");
  });

  it("renders plain text with no link for an unknown type", () => {
    render(<>{EntityMentionLink({ type: "unknown-things", id: "x1", alias: "Mystery" })}</>);
    expect(screen.getByText("Mystery")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
