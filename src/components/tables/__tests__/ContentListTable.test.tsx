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

      expect(screen.getByText("No results.")).toBeInTheDocument();
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
    it("should show footer when functions are provided", () => {
      const dataRetriever = createMockDataRetriever({
        data: [{ id: "1", title: "Article 1" }],
      });

      render(
        <ContentListTable
          data={dataRetriever}
          tableGeneratorType={mockModule as any}
          fields={["id", "title"]}
          functions={<button>Action</button>}
        />,
      );

      // Footer should be present with buttons
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

      // Should have navigation buttons in footer
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
