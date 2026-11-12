import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentListTable } from "../ContentListTable";

// The columns the mocked table generator returns. Each test sets them; the
// generator maps every data item to a row that also carries `jsonApiData`, as
// the sibling ContentListTable specs do.
const mockColumns = vi.hoisted(() => ({ columns: [] as any[] }));

vi.mock("../../../hooks", async () => {
  const actual = await vi.importActual("../../../hooks");
  return {
    ...actual,
    useTableGenerator: vi.fn((_type: any, params: any) => ({
      data: params.data.map((item: any) => ({ ...item, jsonApiData: item })),
      columns: mockColumns.columns,
    })),
  };
});

vi.mock("../ContentTableSearch", () => ({
  ContentTableSearch: () => <div data-testid="content-table-search">Search</div>,
}));

const nameColumn = (enableSorting?: boolean) => ({
  id: "name",
  header: "Name",
  accessorKey: "name",
  cell: ({ row }: any) => row.original.name,
  ...(enableSorting !== undefined && { enableSorting }),
});

const updatedAtColumn = {
  id: "updatedAt",
  header: "Updated",
  accessorKey: "updatedAt",
  cell: ({ row }: any) => row.original.updatedAt,
  enableSorting: true,
};

const rows = [
  { id: "1", name: "Bravo", updatedAt: "2" },
  { id: "2", name: "Alpha", updatedAt: "3" },
  { id: "3", name: "Charlie", updatedAt: "1" },
];

const retriever = (overrides: Record<string, any> = {}) =>
  ({
    data: rows,
    isLoaded: true,
    ready: true,
    next: undefined,
    previous: undefined,
    refresh: vi.fn(),
    addAdditionalParameter: vi.fn(),
    removeAdditionalParameter: vi.fn(),
    setRefreshedElement: vi.fn(),
    removeElement: vi.fn(),
    search: vi.fn(),
    setReady: vi.fn(),
    setSort: vi.fn(),
    isSearch: false,
    ...overrides,
  }) as any;

const mockModule = { name: "things", icon: undefined } as any;

const renderedNames = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => row.textContent);

const headCell = (columnId: string) => screen.getByTestId(`list-sort-header-${columnId}`).closest("th")!;

describe("ContentListTable sortable headers", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/things");
  });

  afterEach(() => {
    window.history.replaceState(null, "", "/");
    vi.restoreAllMocks();
    mockColumns.columns = [];
  });

  it("renders a sort button only for a column with enableSorting: true", () => {
    mockColumns.columns = [nameColumn(true)];
    render(<ContentListTable data={retriever()} fields={["name"]} tableGeneratorType={mockModule} />);
    expect(screen.getByTestId("list-sort-header-name")).toBeInTheDocument();
  });

  it("renders no sort button when the column omits enableSorting", () => {
    mockColumns.columns = [nameColumn()];
    render(<ContentListTable data={retriever()} fields={["name"]} tableGeneratorType={mockModule} />);
    expect(screen.queryByTestId("list-sort-header-name")).toBeNull();
    expect(screen.getByText("Name").closest("th")).not.toHaveAttribute("aria-sort");
  });

  it("renders a plain header in server mode when a hand-built retriever has no setSort", () => {
    mockColumns.columns = [nameColumn(true)];
    render(
      <ContentListTable data={retriever({ setSort: undefined })} fields={["name"]} tableGeneratorType={mockModule} />,
    );
    expect(screen.queryByTestId("list-sort-header-name")).toBeNull();
    expect(screen.getByText("Name").closest("th")).not.toHaveAttribute("aria-sort");
  });

  it("still sorts in client mode when the retriever has no setSort", () => {
    mockColumns.columns = [nameColumn(true)];
    render(
      <ContentListTable
        data={retriever({ setSort: undefined })}
        fields={["name"]}
        tableGeneratorType={mockModule}
        sortMode="client"
        sortKey="things"
      />,
    );
    fireEvent.click(screen.getByTestId("list-sort-header-name"));
    expect(renderedNames()).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("renders no sort button when enableSorting is false", () => {
    mockColumns.columns = [nameColumn(false)];
    render(<ContentListTable data={retriever()} fields={["name"]} tableGeneratorType={mockModule} />);
    expect(screen.queryByTestId("list-sort-header-name")).toBeNull();
  });

  it("cycles none -> asc -> desc -> none through data.setSort, with aria-sort following", () => {
    mockColumns.columns = [nameColumn(true)];
    const setSort = vi.fn();

    const { rerender } = render(
      <ContentListTable data={retriever({ setSort })} fields={["name"]} tableGeneratorType={mockModule} />,
    );
    expect(headCell("name")).toHaveAttribute("aria-sort", "none");
    fireEvent.click(screen.getByTestId("list-sort-header-name"));
    expect(setSort).toHaveBeenLastCalledWith("name");

    rerender(
      <ContentListTable
        data={retriever({ setSort, sort: "name" })}
        fields={["name"]}
        tableGeneratorType={mockModule}
      />,
    );
    expect(headCell("name")).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(screen.getByTestId("list-sort-header-name"));
    expect(setSort).toHaveBeenLastCalledWith("-name");

    rerender(
      <ContentListTable
        data={retriever({ setSort, sort: "-name" })}
        fields={["name"]}
        tableGeneratorType={mockModule}
      />,
    );
    expect(headCell("name")).toHaveAttribute("aria-sort", "descending");
    fireEvent.click(screen.getByTestId("list-sort-header-name"));
    expect(setSort).toHaveBeenLastCalledWith(null);
    expect(setSort).toHaveBeenCalledTimes(3);
  });

  it("does not reorder rows in server mode", () => {
    mockColumns.columns = [nameColumn(true)];
    render(<ContentListTable data={retriever({ sort: "name" })} fields={["name"]} tableGeneratorType={mockModule} />);
    expect(renderedNames()).toEqual(["Bravo", "Alpha", "Charlie"]);
  });

  it("shows the defaultSort column with a muted arrow and aria-sort none", () => {
    mockColumns.columns = [nameColumn(true), updatedAtColumn];
    render(
      <ContentListTable
        data={retriever({ defaultSort: "-updatedAt" })}
        fields={["name", "updatedAt"]}
        tableGeneratorType={mockModule}
      />,
    );

    expect(headCell("updatedAt")).toHaveAttribute("aria-sort", "none");
    const icon = within(screen.getByTestId("list-sort-header-updatedAt")).getByTestId("list-sort-icon");
    expect(icon).toHaveAttribute("data-direction", "desc");
    expect(icon.getAttribute("class")).toContain("text-muted-foreground");
    expect(screen.getByTestId("list-sort-header-updatedAt").className).toContain("text-muted-foreground");

    expect(within(screen.getByTestId("list-sort-header-name")).getByTestId("list-sort-icon")).toHaveAttribute(
      "data-direction",
      "none",
    );
  });

  it("drops the muted default arrow once a sort is chosen", () => {
    mockColumns.columns = [nameColumn(true), updatedAtColumn];
    render(
      <ContentListTable
        data={retriever({ defaultSort: "-updatedAt", sort: "name" })}
        fields={["name", "updatedAt"]}
        tableGeneratorType={mockModule}
      />,
    );

    expect(within(screen.getByTestId("list-sort-header-updatedAt")).getByTestId("list-sort-icon")).toHaveAttribute(
      "data-direction",
      "none",
    );
    expect(screen.getByTestId("list-sort-header-name").className).toContain("text-primary");
  });

  it("sorts the loaded rows in the browser in client mode, without calling setSort", () => {
    mockColumns.columns = [nameColumn(true)];
    const setSort = vi.fn();
    render(
      <ContentListTable
        data={retriever({ setSort })}
        fields={["name"]}
        tableGeneratorType={mockModule}
        sortMode="client"
        sortKey="things"
      />,
    );
    expect(renderedNames()).toEqual(["Bravo", "Alpha", "Charlie"]);

    fireEvent.click(screen.getByTestId("list-sort-header-name"));
    expect(renderedNames()).toEqual(["Alpha", "Bravo", "Charlie"]);
    expect(headCell("name")).toHaveAttribute("aria-sort", "ascending");
    expect(new URLSearchParams(window.location.search).get("sort[things]")).toBe("name");

    fireEvent.click(screen.getByTestId("list-sort-header-name"));
    expect(renderedNames()).toEqual(["Charlie", "Bravo", "Alpha"]);
    expect(headCell("name")).toHaveAttribute("aria-sort", "descending");

    fireEvent.click(screen.getByTestId("list-sort-header-name"));
    expect(renderedNames()).toEqual(["Bravo", "Alpha", "Charlie"]);
    expect(headCell("name")).toHaveAttribute("aria-sort", "none");

    expect(setSort).not.toHaveBeenCalled();
  });

  it("restores a client sort from the address on mount", () => {
    window.history.replaceState(null, "", "/things?sort%5Bthings%5D=-name");
    mockColumns.columns = [nameColumn(true)];
    render(
      <ContentListTable
        data={retriever()}
        fields={["name"]}
        tableGeneratorType={mockModule}
        sortMode="client"
        sortKey="things"
      />,
    );
    expect(renderedNames()).toEqual(["Charlie", "Bravo", "Alpha"]);
  });

  it("renders the order clientSort returns, called with (rows, sort)", () => {
    window.history.replaceState(null, "", "/things?sort%5Bthings%5D=name");
    mockColumns.columns = [nameColumn(true)];
    const clientSort = vi.fn((items: any[]) => [items[2], items[0], items[1]]);
    render(
      <ContentListTable
        data={retriever()}
        fields={["name"]}
        tableGeneratorType={mockModule}
        sortMode="client"
        sortKey="things"
        clientSort={clientSort}
      />,
    );

    expect(clientSort).toHaveBeenLastCalledWith(rows, "name");
    expect(renderedNames()).toEqual(["Charlie", "Bravo", "Alpha"]);
  });
});
