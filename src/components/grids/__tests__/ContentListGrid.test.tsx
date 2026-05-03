import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ContentListGrid } from "../ContentListGrid";
import { DataListRetriever } from "../../../hooks";

vi.mock("../../tables/ContentTableSearch", () => ({
  ContentTableSearch: () => <div data-testid="content-table-search">Search</div>,
}));

type Item = { id: string; title: string };

function createMockDataRetriever(overrides: Partial<DataListRetriever<Item>> = {}): DataListRetriever<Item> {
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
  } as DataListRetriever<Item>;
}

const mockModule = {
  name: "items",
  model: class MockItem {},
  icon: ({ className }: { className?: string }) => <svg data-testid="module-icon" className={className} />,
} as any;

function ItemComponent({ item }: { item: Item }) {
  return <div data-testid={`item-${item.id}`}>{item.title}</div>;
}

describe("ContentListGrid", () => {
  let observerCallback: ((entries: IntersectionObserverEntry[]) => void) | null;
  let observerInstance: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> } | null;

  beforeEach(() => {
    vi.clearAllMocks();
    observerCallback = null;
    observerInstance = null;
    (globalThis as any).IntersectionObserver = class {
      observe = vi.fn();
      disconnect = vi.fn();
      constructor(cb: any) {
        observerCallback = cb;
        observerInstance = { observe: this.observe, disconnect: this.disconnect };
      }
    };
  });

  it("renders the title and module icon", () => {
    const data = createMockDataRetriever({
      data: [{ id: "1", title: "Hello" }],
    });
    render(
      <ContentListGrid<Item>
        data={data}
        tableGeneratorType={mockModule}
        ItemComponent={ItemComponent}
        title="My Items"
      />,
    );

    expect(screen.getByText("My Items")).toBeInTheDocument();
    expect(screen.getByTestId("module-icon")).toBeInTheDocument();
  });

  it("renders one ItemComponent per item with stable keys", () => {
    const data = createMockDataRetriever({
      data: [
        { id: "a", title: "First" },
        { id: "b", title: "Second" },
      ],
    });
    render(<ContentListGrid<Item> data={data} tableGeneratorType={mockModule} ItemComponent={ItemComponent} />);

    expect(screen.getByTestId("item-a")).toHaveTextContent("First");
    expect(screen.getByTestId("item-b")).toHaveTextContent("Second");
  });

  it("renders the empty-state copy when there are no items", () => {
    const data = createMockDataRetriever({ data: [] });
    render(<ContentListGrid<Item> data={data} tableGeneratorType={mockModule} ItemComponent={ItemComponent} />);

    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("hides search by default and shows it when allowSearch is true", () => {
    const data = createMockDataRetriever({ data: [{ id: "1", title: "x" }] });
    const { rerender } = render(
      <ContentListGrid<Item> data={data} tableGeneratorType={mockModule} ItemComponent={ItemComponent} title="t" />,
    );
    expect(screen.queryByTestId("content-table-search")).not.toBeInTheDocument();

    rerender(
      <ContentListGrid<Item>
        data={data}
        tableGeneratorType={mockModule}
        ItemComponent={ItemComponent}
        title="t"
        allowSearch
      />,
    );
    expect(screen.getByTestId("content-table-search")).toBeInTheDocument();
  });

  it("does not render the sentinel when data.next is undefined", () => {
    const data = createMockDataRetriever({ data: [{ id: "1", title: "x" }], next: undefined });
    const { container } = render(
      <ContentListGrid<Item> data={data} tableGeneratorType={mockModule} ItemComponent={ItemComponent} />,
    );
    // Sentinel is the only 1px-tall div inline-styled; assert via inline style probe.
    const sentinel = container.querySelector('div[style*="height: 1px"]');
    expect(sentinel).toBeNull();
  });

  it("calls data.next when the sentinel intersects", () => {
    const next = vi.fn();
    const data = createMockDataRetriever({
      data: [{ id: "1", title: "x" }],
      next,
    });
    render(<ContentListGrid<Item> data={data} tableGeneratorType={mockModule} ItemComponent={ItemComponent} />);

    expect(observerInstance?.observe).toHaveBeenCalled();

    act(() => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry]);
    });

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("uses gridClassName when supplied", () => {
    const data = createMockDataRetriever({ data: [{ id: "1", title: "x" }] });
    const { container } = render(
      <ContentListGrid<Item>
        data={data}
        tableGeneratorType={mockModule}
        ItemComponent={ItemComponent}
        gridClassName="my-custom-grid"
      />,
    );
    const grid = container.querySelector(".my-custom-grid");
    expect(grid).not.toBeNull();
  });
});
