import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnalyticsPageListCard } from "../AnalyticsPageListCard";

const row = (dimension: string, key: string, values: Partial<Record<"visitors" | "sessions" | "pageViews", number>>) =>
  ({
    id: `${dimension}|${key}`,
    dimension,
    key,
    visitors: 0,
    sessions: 0,
    pageViews: 0,
    ...values,
  }) as any;

const headers = () => screen.getAllByRole("columnheader").map((header) => header.textContent);

describe("AnalyticsPageListCard", () => {
  it("drops the other row and keeps server order, at most 10 rows", () => {
    const rows = [
      ...Array.from({ length: 12 }, (_, index) => row("route", `/page-${index}`, { pageViews: index })),
      row("route", "other", { pageViews: 999 }),
    ];

    render(<AnalyticsPageListCard variant="top-pages" title="Most viewed" rows={rows} />);

    const rendered = screen.getAllByTestId(/^analytics-page-list-top-pages-row-/);
    expect(rendered).toHaveLength(10);
    expect(rendered.map((r) => within(r).getAllByRole("cell")[0].textContent)).toEqual(
      Array.from({ length: 10 }, (_, index) => `/page-${index}`),
    );
    expect(screen.queryByText("other")).not.toBeInTheDocument();
    expect(screen.queryByText("analytics.admin.other")).not.toBeInTheDocument();
  });

  it("top-pages shows page views and visitors", () => {
    render(
      <AnalyticsPageListCard
        variant="top-pages"
        title="Most viewed"
        rows={[row("route", "/pricing", { visitors: 3, pageViews: 7 })]}
      />,
    );

    expect(headers()).toEqual([
      "analytics.admin.columns.page",
      "analytics.admin.columns.page_views",
      "analytics.admin.columns.visitors",
    ]);
    const cells = within(screen.getByTestId("analytics-page-list-top-pages-row-route|/pricing")).getAllByRole("cell");
    expect(cells.map((cell) => cell.textContent)).toEqual(["/pricing", "7", "3"]);
  });

  it("most-used-pages labels people as users", () => {
    render(
      <AnalyticsPageListCard
        variant="most-used-pages"
        title="Most used"
        rows={[row("route", "/campaigns", { visitors: 2, pageViews: 5 })]}
      />,
    );

    expect(headers()[2]).toBe("analytics.admin.columns.users");
  });

  it("entry-pages shows pages per session", () => {
    render(
      <AnalyticsPageListCard
        variant="entry-pages"
        title="Entry"
        rows={[row("landing", "/home", { sessions: 4, pageViews: 10 })]}
      />,
    );

    expect(headers()).toEqual([
      "analytics.admin.columns.page",
      "analytics.admin.columns.sessions",
      "analytics.admin.tiles.pages_per_session",
    ]);
    const cells = within(screen.getByTestId("analytics-page-list-entry-pages-row-landing|/home")).getAllByRole("cell");
    expect(cells[2]).toHaveTextContent("2.5");
  });

  it("exit-pages shows the share of sessions", () => {
    const rows = [row("exit", "/pricing", { sessions: 2 })];
    const { unmount } = render(
      <AnalyticsPageListCard variant="exit-pages" title="Exit" rows={rows} totalSessions={8} />,
    );

    expect(headers()).toEqual([
      "analytics.admin.columns.page",
      "analytics.admin.columns.exits",
      "analytics.admin.columns.exit_share",
    ]);
    let cells = within(screen.getByTestId("analytics-page-list-exit-pages-row-exit|/pricing")).getAllByRole("cell");
    expect(cells[1]).toHaveTextContent("2");
    expect(cells[2]).toHaveTextContent("25%");
    unmount();

    render(<AnalyticsPageListCard variant="exit-pages" title="Exit" rows={rows} totalSessions={0} />);
    cells = within(screen.getByTestId("analytics-page-list-exit-pages-row-exit|/pricing")).getAllByRole("cell");
    expect(cells[2]).toHaveTextContent("—");
  });

  it("shows the empty text", () => {
    render(<AnalyticsPageListCard variant="top-pages" title="Most viewed" rows={[]} />);

    expect(screen.getByText("analytics.admin.no_data")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("carries the card and row test ids and the title", () => {
    render(
      <AnalyticsPageListCard
        variant="exit-pages"
        title="Exit pages"
        rows={[row("exit", "/a", { sessions: 1 })]}
        totalSessions={1}
      />,
    );

    const card = screen.getByTestId("analytics-page-list-exit-pages");
    expect(card).toHaveTextContent("Exit pages");
    expect(within(card).getByTestId("analytics-page-list-exit-pages-row-exit|/a")).toBeInTheDocument();
  });
});
