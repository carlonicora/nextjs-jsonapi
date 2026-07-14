import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContentListTable } from "../ContentListTable";
import { DataListRetriever } from "../../../hooks";
import React from "react";

// Mock useTableGenerator hook
vi.mock("../../../hooks", async () => {
  const actual = await vi.importActual("../../../hooks");
  return {
    ...actual,
    useTableGenerator: vi.fn((_, params) => ({
      data: params.data.map((item: any, index: number) => ({
        ...item,
        jsonApiData: item,
        _rowIndex: index,
      })),
      columns: [
        {
          id: "id",
          header: "ID",
          accessorKey: "id",
          cell: ({ row }: any) => row.original.id,
        },
        {
          id: "title",
          header: "Title",
          accessorKey: "title",
          cell: ({ row }: any) => row.original.title,
        },
      ],
    })),
  };
});

// Mock ContentTableSearch
vi.mock("../ContentTableSearch", () => ({
  ContentTableSearch: () => <div data-testid="content-table-search">Search</div>,
}));

// Create a mock DataListRetriever
function createMockDataRetriever(overrides: Partial<DataListRetriever<any>> = {}): DataListRetriever<any> {
  return {
    ready: true,
    setReady: vi.fn(),
    isLoaded: true,
    data: [],
    search: vi.fn(),
    refresh: vi.fn(),
    addAdditionalParameter: vi.fn(),
    removeAdditionalParameter: vi.fn(),
    setRefreshedElement: vi.fn(),
    removeElement: vi.fn(),
    isSearch: false,
    ...overrides,
  };
}

const mockModule = {
  name: "articles",
  model: class MockArticle {},
};

describe("ContentListTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render table", () => {
      const dataRetriever = createMockDataRetriever({
        data: [
          { id: "1", title: "Article 1" },
          { id: "2", title: "Article 2" },
        ],
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("should render title when provided", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
      });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          title="Articles"
        />,
      );

      expect(screen.getByText("Articles")).toBeInTheDocument();
    });

    it("should render table headers", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      expect(screen.getByText("ID")).toBeInTheDocument();
      expect(screen.getByText("Title")).toBeInTheDocument();
    });

    it("should render table rows with data", () => {
      const dataRetriever = createMockDataRetriever({
        data: [
          { id: "1", title: "First Article" },
          { id: "2", title: "Second Article" },
        ],
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("First Article")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("Second Article")).toBeInTheDocument();
    });

    it("should render 'No results' when data is empty", () => {
      const dataRetriever = createMockDataRetriever({
        data: [],
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      expect(screen.getByText("ui.empty_states.no_results")).toBeInTheDocument();
    });
  });

  describe("search", () => {
    it("should render search component when allowSearch is true and title is set", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
      });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          title="Articles"
          allowSearch={true}
        />,
      );

      expect(screen.getByTestId("content-table-search")).toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    it("should render pagination buttons when next or previous is available", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
        next: vi.fn(),
        previous: vi.fn(),
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      // Should have navigation buttons
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it("should disable previous button when no previous page", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
        next: vi.fn(),
        previous: undefined,
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      const buttons = screen.getAllByRole("button");
      const previousButton = buttons[0];
      expect(previousButton).toBeDisabled();
    });

    it("should disable next button when no next page", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
        next: undefined,
        previous: vi.fn(),
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      const buttons = screen.getAllByRole("button");
      const nextButton = buttons[buttons.length - 1];
      expect(nextButton).toBeDisabled();
    });

    it("should call next when next button is clicked", async () => {
      const user = userEvent.setup();
      const nextFn = vi.fn();

      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
        next: nextFn,
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      const buttons = screen.getAllByRole("button");
      const nextButton = buttons[buttons.length - 1];
      await user.click(nextButton);

      expect(nextFn).toHaveBeenCalledWith(true);
    });

    it("should call previous when previous button is clicked", async () => {
      const user = userEvent.setup();
      const previousFn = vi.fn();

      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
        previous: previousFn,
        next: vi.fn(), // Need both to show footer
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      const buttons = screen.getAllByRole("button");
      const previousButton = buttons[0];
      await user.click(previousButton);

      expect(previousFn).toHaveBeenCalledWith(true);
    });

    it("should display page info when available", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
        next: vi.fn(),
        pageInfo: {
          startItem: 1,
          endItem: 25,
          pageSize: 25,
        },
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      expect(screen.getByText("1-25")).toBeInTheDocument();
    });
  });

  describe("functions and filters", () => {
    it("should render functions when provided", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
      });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          title="Articles"
          functions={<button data-testid="custom-function">Custom</button>}
        />,
      );

      expect(screen.getByTestId("custom-function")).toBeInTheDocument();
    });

    it("should render filters when provided", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
      });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          title="Articles"
          filters={<div data-testid="custom-filter">Filter</div>}
        />,
      );

      expect(screen.getByTestId("custom-filter")).toBeInTheDocument();
    });
  });

  describe("footer visibility", () => {
    it("should show functions in header when title is provided", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
      });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          title="Test Table"
          functions={<button>Action</button>}
        />,
      );

      // Functions should be present in header with buttons
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should show footer when next page is available", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
        next: vi.fn(),
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      // Should have navigation buttons in footer
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it("should show footer when previous page is available", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
        previous: vi.fn(),
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("grouping", () => {
    it("should not group rows when groupBy is not provided", () => {
      const dataRetriever = createMockDataRetriever({
        data: [
          { id: "1", title: "Article 1", category: "A" },
          { id: "2", title: "Article 2", category: "B" },
          { id: "3", title: "Article 3", category: "A" },
        ],
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      expect(screen.getByText("Article 1")).toBeInTheDocument();
      expect(screen.getByText("Article 2")).toBeInTheDocument();
      expect(screen.getByText("Article 3")).toBeInTheDocument();
    });

    it("should group rows by attribute and show group headers", () => {
      const dataRetriever = createMockDataRetriever({
        data: [
          { id: "1", title: "Article 1", category: "B" },
          { id: "2", title: "Article 2", category: "A" },
          { id: "3", title: "Article 3", category: "B" },
        ],
      });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          groupBy="category"
        />,
      );

      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("B")).toBeInTheDocument();
      expect(screen.getByText("Article 1")).toBeInTheDocument();
      expect(screen.getByText("Article 2")).toBeInTheDocument();
      expect(screen.getByText("Article 3")).toBeInTheDocument();
    });

    it("should sort groups alphabetically", () => {
      const dataRetriever = createMockDataRetriever({
        data: [
          { id: "1", title: "C Article", category: "C" },
          { id: "2", title: "A Article", category: "A" },
          { id: "3", title: "B Article", category: "B" },
        ],
      });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          groupBy="category"
        />,
      );

      const allCells = screen.getAllByRole("cell");
      const texts = allCells.map((cell) => cell.textContent);
      const groupIndices = ["A", "B", "C"].map((g) => texts.indexOf(g));
      expect(groupIndices[0]).toBeLessThan(groupIndices[1]);
      expect(groupIndices[1]).toBeLessThan(groupIndices[2]);
    });

    it("should group by relationship using the name property", () => {
      const dataRetriever = createMockDataRetriever({
        data: [
          { id: "1", title: "Article 1", campaign: { id: "c1", name: "Campaign Alpha" } },
          { id: "2", title: "Article 2", campaign: { id: "c2", name: "Campaign Beta" } },
          { id: "3", title: "Article 3", campaign: { id: "c1", name: "Campaign Alpha" } },
        ],
      });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          groupBy="campaign"
        />,
      );

      expect(screen.getByText("Campaign Alpha")).toBeInTheDocument();
      expect(screen.getByText("Campaign Beta")).toBeInTheDocument();
    });

    it("should handle null/undefined group values", () => {
      const dataRetriever = createMockDataRetriever({
        data: [
          { id: "1", title: "Article 1", category: null },
          { id: "2", title: "Article 2", category: "A" },
          { id: "3", title: "Article 3", category: undefined },
        ],
      });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          groupBy="category"
        />,
      );

      expect(screen.getByText("A")).toBeInTheDocument();
      const groupHeaders = screen
        .getAllByRole("cell")
        .filter((cell) => cell.textContent === "" && cell.classList.contains("bg-muted"));
      expect(groupHeaders.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle empty data with groupBy", () => {
      const dataRetriever = createMockDataRetriever({ data: [] });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          groupBy="category"
        />,
      );

      expect(screen.getByText("ui.empty_states.no_results")).toBeInTheDocument();
    });

    it("should group by to-many relationship, duplicating rows across groups", () => {
      const dataRetriever = createMockDataRetriever({
        data: [
          {
            id: "1",
            title: "Article 1",
            tags: [
              { id: "t1", name: "Alpha" },
              { id: "t2", name: "Beta" },
            ],
          },
          { id: "2", title: "Article 2", tags: [{ id: "t1", name: "Alpha" }] },
          {
            id: "3",
            title: "Article 3",
            tags: [
              { id: "t2", name: "Beta" },
              { id: "t3", name: "Gamma" },
            ],
          },
        ],
      });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          groupBy="tags"
        />,
      );

      expect(screen.getByText("Alpha")).toBeInTheDocument();
      expect(screen.getByText("Beta")).toBeInTheDocument();
      expect(screen.getByText("Gamma")).toBeInTheDocument();

      const allText = screen.getAllByRole("cell").map((c) => c.textContent);
      const article1Count = allText.filter((t) => t === "Article 1").length;
      expect(article1Count).toBe(2);
      const article2Count = allText.filter((t) => t === "Article 2").length;
      expect(article2Count).toBe(1);
      const article3Count = allText.filter((t) => t === "Article 3").length;
      expect(article3Count).toBe(2);
    });
  });

  describe("onRowClick", () => {
    it("calls onRowClick with the row's jsonApiData when a row is clicked", () => {
      const onRowClick = vi.fn();
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "First Article" }],
      });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          onRowClick={onRowClick}
        />,
      );

      fireEvent.click(screen.getByText("First Article"));
      expect(onRowClick).toHaveBeenCalledTimes(1);
      expect(onRowClick).toHaveBeenCalledWith({ id: "1", title: "First Article" });
    });

    it("does not attach a row click handler when onRowClick is absent", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "First Article" }],
      });

      render(<ContentListTable data={dataRetriever} tableGeneratorType={mockModule as any} fields={["id", "title"]} />);

      // No throw on click, and the row has no cursor-pointer affordance class.
      const cell = screen.getByText("First Article");
      const row = cell.closest("tr")!;
      expect(row.className).not.toContain("cursor-pointer");
      fireEvent.click(cell); // must not throw
    });
  });
});
