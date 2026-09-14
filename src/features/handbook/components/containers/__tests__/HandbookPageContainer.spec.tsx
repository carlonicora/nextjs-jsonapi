import { render, screen, within } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { configureI18n } from "../../../../../i18n";
import { ApiRequestDataTypeInterface } from "../../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { HandbookPageService } from "../../../data/HandbookPageService";
import { HandbookSectionService } from "../../../data/HandbookSectionService";
import HandbookPageContainer from "../HandbookPageContainer";

// The fixtures are the contents surface's own (Task G), plus `content` for the
// page under test. `vi.mock` factories are hoisted above every module-scope
// const, so the rows come from `vi.hoisted()` rather than from a plain const.
const { pages, sections } = vi.hoisted(() => ({
  pages: [
    {
      id: "p1",
      title: "Reading order",
      section: "00-start-here",
      order: "00-start-here/reading-order.md",
      path: "00-start-here/reading-order.md",
      summary: "The three paths.",
      aiStatus: "completed",
      wordCount: 10,
      content: "# Reading order\n",
    },
    {
      id: "p2",
      title: "Testing the API",
      section: "03-backend",
      order: "03-backend/testing.md",
      path: "03-backend/testing.md",
      summary: undefined,
      aiStatus: "failed",
      wordCount: 20,
      content: "# Testing the API\n\n## What is mocked\n\nEverything.\n",
    },
    {
      id: "p3",
      title: "Frontend models",
      section: "02-framework",
      order: "02-framework/rulebook/frontend/01-models.md",
      path: "02-framework/rulebook/frontend/01-models.md",
      summary: "AbstractApiData.",
      aiStatus: "completed",
      wordCount: 30,
      content: "# Frontend models\n",
    },
  ],
  sections: [
    { id: "s1", key: "00-start-here", title: "Start here", summary: "Get the stack running.", order: "00-start-here" },
    { id: "s2", key: "02-framework", title: "Framework", summary: undefined, order: "02-framework" },
    { id: "s3", key: "03-backend", title: "Backend", summary: "The API.", order: "03-backend" },
  ],
}));

vi.mock("../../../data/HandbookPageService", () => ({
  HandbookPageService: { findOne: vi.fn(), findMany: vi.fn() },
}));

vi.mock("../../../data/HandbookSectionService", () => ({
  HandbookSectionService: { findMany: vi.fn() },
}));

// The header is the provider's job (Task F) and the sheet is the ask surface's
// (Task I). Neither is under test here, and both need providers this spec has
// no reason to mount.
vi.mock("../../../contexts/HandbookContext", () => ({
  HandbookProvider: ({ children }: { children?: ReactNode }) => <>{children}</>,
  useHandbookContext: () => ({}),
}));

vi.mock("../HandbookAskSheet", () => ({
  HandbookAskSheet: () => <div data-testid="handbook-ask-sheet" />,
}));

// RoundPageContainer is page chrome — header, details panel, url rewriting.
// Stubbed exactly as HandbookAskContainer.spec.tsx stubs it.
vi.mock("../../../../../components/containers/RoundPageContainer", () => ({
  RoundPageContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("HandbookPage", {
    name: "handbookpages",
    pageUrl: "/administration/handbook",
  } as any);

  // The package `Link` resolves the app's next-intl Link at runtime; without a
  // configured i18n it throws rather than rendering an anchor.
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
    usePathname: () => "/administration/handbook",
    Link: ({ href, children, ...props }: any) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  });
});

describe("HandbookPageContainer", () => {
  beforeEach(() => {
    vi.mocked(HandbookPageService.findOne)
      .mockReset()
      .mockImplementation(async ({ id }: { id: string }) => pages.find((page) => page.id === id) as any);
    vi.mocked(HandbookPageService.findMany)
      .mockReset()
      .mockResolvedValue(pages as any);
    vi.mocked(HandbookSectionService.findMany)
      .mockReset()
      .mockResolvedValue(sections as any);
  });

  it("renders the page title in the body once, and no path line", async () => {
    render(<HandbookPageContainer handbookPageId="p2" />);

    // The markdown's own H1 stays; the body's SectionHeader and path line are gone.
    expect(await screen.findByRole("heading", { level: 1, name: "Testing the API" })).toBeInTheDocument();
    expect(screen.queryByText("03-backend/testing.md")).not.toBeInTheDocument();
  });

  it("lists every page in the navigator with the current one marked", async () => {
    render(<HandbookPageContainer handbookPageId="p2" />);

    const nav = await screen.findByRole("navigation", { name: /contents/i });
    expect(within(nav).getAllByRole("link")).toHaveLength(3);
    expect(within(nav).getByRole("link", { current: "page" })).toHaveTextContent("Testing the API");
  });

  it("orders the navigator by section then order", async () => {
    render(<HandbookPageContainer handbookPageId="p2" />);

    const nav = await screen.findByRole("navigation", { name: /contents/i });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((link) => link.textContent),
    ).toEqual(["Reading order", "Frontend models", "Testing the API"]);
  });

  it("links the ordered neighbours", async () => {
    render(<HandbookPageContainer handbookPageId="p2" />);

    // "Frontend models" is the page before this one, so it renders twice: once
    // in the navigator, once as the `previous` neighbour at the foot.
    const links = await screen.findAllByRole("link", { name: /Frontend models/ });
    expect(links).toHaveLength(2);
    const previous = links.find((link) => link.textContent?.includes("handbook.reader.previous"));
    expect(previous).toBeDefined();
    expect(previous).toHaveAttribute("href", "/administration/handbook/p3");
    // p2 is the last page in the order, so there is no `next` at all.
    expect(screen.queryByText("handbook.reader.next")).not.toBeInTheDocument();
  });

  it("builds a heading index from the rendered markdown", async () => {
    render(<HandbookPageContainer handbookPageId="p2" />);

    // The visible label and the landmark name are the same key, which
    // next-intl's spec mock renders verbatim.
    const toc = await screen.findByRole("navigation", { name: /onThisPage/i });
    expect(within(toc).getByRole("link", { name: "What is mocked" })).toHaveAttribute("href", "#what-is-mocked");
  });

  /**
   * Indexed in English, shown translated. The reader has three surfaces that
   * print handbook words — the body, the navigator and the prev/next pair — and
   * all three resolve the same way.
   *
   * Only p2 (the page under test) and p3 (its `previous`) carry a translation,
   * so one render proves both the translated and the fallback branch.
   */
  describe("display translation", () => {
    const translated = pages.map((page) => {
      if (page.id === "p2")
        return {
          ...page,
          displayTitle: "Testare le API",
          displayContent: "# Testare le API\n\n## Cosa è mockato\n\nTutto.\n",
        };
      if (page.id === "p3") return { ...page, displayTitle: "Modelli frontend" };
      return page;
    });

    beforeEach(() => {
      vi.mocked(HandbookPageService.findOne).mockImplementation(
        async ({ id }: { id: string }) => translated.find((page) => page.id === id) as any,
      );
      vi.mocked(HandbookPageService.findMany).mockResolvedValue(translated as any);
    });

    it("renders the translated body", async () => {
      render(<HandbookPageContainer handbookPageId="p2" />);

      expect(await screen.findByRole("heading", { level: 1, name: "Testare le API" })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { level: 1, name: "Testing the API" })).not.toBeInTheDocument();
    });

    it("renders the English body for a page with no translation", async () => {
      render(<HandbookPageContainer handbookPageId="p1" />);

      expect(await screen.findByRole("heading", { level: 1, name: "Reading order" })).toBeInTheDocument();
    });

    it("labels the navigator entries with the translation, falling back per page", async () => {
      render(<HandbookPageContainer handbookPageId="p2" />);

      const nav = await screen.findByRole("navigation", { name: /contents/i });
      // Still ordered by `section` then `order`, which stay English: only the
      // labels changed.
      expect(
        within(nav)
          .getAllByRole("link")
          .map((link) => link.textContent),
      ).toEqual(["Reading order", "Modelli frontend", "Testare le API"]);
      expect(within(nav).getByRole("link", { current: "page" })).toHaveTextContent("Testare le API");
    });

    it("labels the previous neighbour with its translation", async () => {
      render(<HandbookPageContainer handbookPageId="p2" />);

      const links = await screen.findAllByRole("link", { name: /Modelli frontend/ });
      const previous = links.find((link) => link.textContent?.includes("handbook.reader.previous"));
      expect(previous).toBeDefined();
      // The link still points at the same page: the translation changes the
      // words, never the destination.
      expect(previous).toHaveAttribute("href", "/administration/handbook/p3");
    });

    it("labels the navigator sections with their translation, falling back per section", async () => {
      vi.mocked(HandbookSectionService.findMany).mockResolvedValue(
        sections.map((section) =>
          section.key === "03-backend" ? { ...section, displayTitle: "Backend (API)" } : section,
        ) as any,
      );

      render(<HandbookPageContainer handbookPageId="p2" />);

      const nav = await screen.findByRole("navigation", { name: /contents/i });
      expect(
        within(nav)
          .getAllByRole("heading")
          .map((heading) => heading.textContent),
      ).toEqual(["Start here", "Framework", "Backend (API)"]);
    });
  });

  it("keeps the not-found branch when the id resolves to nothing", async () => {
    vi.mocked(HandbookPageService.findOne).mockResolvedValue(undefined as any);

    render(<HandbookPageContainer handbookPageId="ghost" />);

    expect(await screen.findByText("handbook.notFound")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /contents/i })).not.toBeInTheDocument();
  });

  it("still renders the navigator when the section load fails", async () => {
    vi.mocked(HandbookSectionService.findMany).mockRejectedValue(new Error("500"));

    render(<HandbookPageContainer handbookPageId="p2" />);

    const nav = await screen.findByRole("navigation", { name: /contents/i });
    expect(within(nav).getAllByRole("link")).toHaveLength(3);
    // Raw section keys as headings, in key order.
    expect(
      within(nav)
        .getAllByRole("heading")
        .map((heading) => heading.textContent),
    ).toEqual(["00-start-here", "02-framework", "03-backend"]);
  });
});
