import { render, screen, within } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestDataTypeInterface } from "../../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { configureI18n } from "../../../../../i18n";
import { HandbookPageService } from "../../../data/HandbookPageService";
import { HandbookSectionService } from "../../../data/HandbookSectionService";
import HandbookContents from "../HandbookContents";

// `vi.mock` factories are hoisted above every module-scope const, so the rows
// come from `vi.hoisted()` rather than from a plain const.
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
    },
  ],
  sections: [
    { id: "s1", key: "00-start-here", title: "Start here", summary: "Get the stack running.", order: "00-start-here" },
    { id: "s2", key: "02-framework", title: "Framework", summary: undefined, order: "02-framework" },
    { id: "s3", key: "03-backend", title: "Backend", summary: "The API.", order: "03-backend" },
  ],
}));

vi.mock("../../../data/HandbookPageService", () => ({
  HandbookPageService: { findMany: vi.fn(), sync: vi.fn() },
}));

vi.mock("../../../data/HandbookSectionService", () => ({
  HandbookSectionService: { findMany: vi.fn() },
}));

// The sheet is the ask surface's (Task I). It is not under test here, and it
// needs providers this spec has no reason to mount.
vi.mock("../../containers/HandbookAskSheet", () => ({
  HandbookAskSheet: () => <div data-testid="handbook-ask-sheet" />,
}));

// The suite-wide next-intl stub returns the key and drops the values, which
// would hide the two numbers the status line exists to show. This one keeps
// them, so `{count} pagine · sincronizzato {date}` is still asserted on the
// numbers rather than on a translated string this package does not own.
vi.mock("next-intl", () => {
  const makeT = () => {
    const t = (key: string, values?: Record<string, unknown>) =>
      values ? `${key} ${Object.values(values).join(" ")}`.trimEnd() : key;
    (t as any).has = () => true;
    return t;
  };
  return {
    useTranslations: () => makeT(),
    useLocale: () => "en",
    useNow: () => new Date(),
    useTimeZone: () => "UTC",
    useFormatter: () => ({
      dateTime: () => "sync-date",
      number: (value: unknown) => String(value),
      relativeTime: () => "",
    }),
  };
});

// The header is the provider's job (Task F). Stubbed as
// HandbookPageContainer.spec.tsx stubs it, except that this stub renders
// `functions`: the ask launcher, Sincronizza and the status line are handed to
// the header through that prop, so dropping it would delete half of this
// component's output from the test.
vi.mock("../../../contexts/HandbookContext", () => ({
  HandbookProvider: ({ children, functions }: { children?: ReactNode; functions?: ReactNode }) => (
    <>
      <div data-testid="page-functions">{functions}</div>
      {children}
    </>
  ),
  useHandbookContext: () => ({}),
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

describe("HandbookContents", () => {
  beforeEach(() => {
    vi.mocked(HandbookPageService.findMany)
      .mockReset()
      .mockResolvedValue(pages as any);
    vi.mocked(HandbookSectionService.findMany)
      .mockReset()
      .mockResolvedValue(sections as any);
  });

  it("renders sections in order with their blurbs", async () => {
    render(<HandbookContents />);
    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["Start here", "Framework", "Backend"]);
    expect(screen.getByText("Get the stack running.")).toBeInTheDocument();
  });

  it("renders a page summary when it has one and nothing when it does not", async () => {
    render(<HandbookContents />);
    expect(await screen.findByText("The three paths.")).toBeInTheDocument();
    const row = screen.getByRole("link", { name: /Testing the API/ });
    expect(within(row).queryByText("—")).not.toBeInTheDocument();
    expect(row.textContent).toBe("Testing the API");
  });

  it("groups a nested page under its intermediate directory", async () => {
    render(<HandbookContents />);
    expect(await screen.findByText("rulebook / frontend")).toBeInTheDocument();
  });

  it("counts failures in the status line", async () => {
    render(<HandbookContents />);
    expect(await screen.findByText(/1/)).toBeInTheDocument();
  });

  it("renders no table", async () => {
    render(<HandbookContents />);
    await screen.findAllByRole("heading", { level: 2 });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  /**
   * The manual is INDEXED in English and SHOWN translated: every string on this
   * surface prefers the translation that travels beside the English original,
   * and falls back to the original when the ingest matched none.
   *
   * The fixtures are the suite's own, with a translation added to exactly one
   * page and one section — so the same render proves both halves of the rule.
   */
  describe("display translation", () => {
    const translatedPages = pages.map((page) =>
      page.id === "p1" ? { ...page, displayTitle: "Ordine di lettura", displaySummary: "I tre percorsi." } : page,
    );
    const translatedSections = sections.map((section) =>
      section.key === "00-start-here"
        ? { ...section, displayTitle: "Da qui si parte", displaySummary: "Avvia lo stack." }
        : section,
    );

    beforeEach(() => {
      vi.mocked(HandbookPageService.findMany).mockResolvedValue(translatedPages as any);
      vi.mocked(HandbookSectionService.findMany).mockResolvedValue(translatedSections as any);
    });

    it("renders a translated section heading and blurb, and the English ones where there is no translation", async () => {
      render(<HandbookContents />);
      const headings = await screen.findAllByRole("heading", { level: 2 });
      expect(headings.map((h) => h.textContent)).toEqual(["Da qui si parte", "Framework", "Backend"]);
      expect(screen.getByText("Avvia lo stack.")).toBeInTheDocument();
      expect(screen.queryByText("Get the stack running.")).not.toBeInTheDocument();
      // The untranslated section still reads in English.
      expect(screen.getByText("The API.")).toBeInTheDocument();
    });

    it("renders a translated page row and falls back to English for an untranslated one", async () => {
      render(<HandbookContents />);
      expect(await screen.findByRole("link", { name: /Ordine di lettura/ })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /Reading order/ })).not.toBeInTheDocument();
      expect(screen.getByText("I tre percorsi.")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Frontend models/ })).toBeInTheDocument();
    });

    it("orders sections and pages by the untranslated keys", async () => {
      render(<HandbookContents />);
      const headings = await screen.findAllByRole("heading", { level: 2 });
      // `order` and `section` stay English, so the translated section keeps its
      // place rather than sorting under its Italian initial.
      expect(headings.map((h) => h.textContent)).toEqual(["Da qui si parte", "Framework", "Backend"]);
      expect(await screen.findByText("rulebook / frontend")).toBeInTheDocument();
    });
  });

  it("falls back to raw section keys when the section load fails", async () => {
    vi.mocked(HandbookSectionService.findMany).mockRejectedValueOnce(new Error("500"));
    render(<HandbookContents />);
    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["00-start-here", "02-framework", "03-backend"]);
    expect(screen.getByRole("link", { name: /Reading order/ })).toBeInTheDocument();
  });
});
