import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentListTable } from "../ContentListTable";

// `ContentListTable` imports `useTableGenerator` from the `../../hooks` barrel,
// which resolves columns through the table-generator registry. Mocking the
// barrel (spreading the actual module so the other exports survive) is the same
// approach the sibling `ContentListTable.test.tsx` in this folder uses; one
// plain column is enough here.
// `mockColumns.expandToggle` switches the mocked name cell to a button that
// toggles row expansion (the `renderExpandedRow` suite), plus a second column so
// the detail row's colSpan is checked against more than one column.
const mockColumns = vi.hoisted(() => ({ expandToggle: false }));

vi.mock("../../../hooks", async () => {
  const actual = await vi.importActual("../../../hooks");
  return {
    ...actual,
    useTableGenerator: vi.fn((_type: any, params: any) => ({
      data: params.data.map((item: any) => ({ ...item, jsonApiData: item })),
      columns: mockColumns.expandToggle
        ? [
            {
              id: "name",
              header: "Name",
              accessorKey: "name",
              cell: ({ row }: any) => <button onClick={row.getToggleExpandedHandler()}>{row.original.name}</button>,
            },
            {
              id: "id",
              header: "Id",
              accessorKey: "id",
              cell: ({ row }: any) => row.original.id,
            },
          ]
        : [
            {
              id: "name",
              header: "Name",
              accessorKey: "name",
              cell: ({ row }: any) => row.original.name,
            },
          ],
    })),
  };
});

vi.mock("../ContentTableSearch", () => ({
  ContentTableSearch: () => <div data-testid="content-table-search">Search</div>,
}));

const baseData = {
  data: [{ id: "1", name: "Row one" }],
  isLoaded: true,
  ready: true,
  next: vi.fn(),
  previous: undefined,
  pageInfo: { startItem: 1, endItem: 1 },
  refresh: vi.fn(),
  addAdditionalParameter: vi.fn(),
  removeAdditionalParameter: vi.fn(),
  setRefreshedElement: vi.fn(),
  removeElement: vi.fn(),
  search: vi.fn(),
  setReady: vi.fn(),
  isSearch: false,
} as any;

const mockModule = { name: "things", icon: undefined } as any;

describe("ContentListTable pagination footer", () => {
  it("renders the prev/next footer when the retriever has a next page", () => {
    render(<ContentListTable data={baseData} fields={["name"]} tableGeneratorType={mockModule} />);
    expect(screen.getByText("1-1")).toBeInTheDocument();
  });

  it("renders no footer at all when hidePagination is set, even with a next page", () => {
    render(<ContentListTable data={baseData} fields={["name"]} tableGeneratorType={mockModule} hidePagination />);
    expect(screen.queryByText("1-1")).not.toBeInTheDocument();
    expect(screen.getByText("Row one")).toBeInTheDocument();
  });
});

describe("ContentListTable renderExpandedRow", () => {
  beforeEach(() => {
    mockColumns.expandToggle = true;
  });

  afterEach(() => {
    mockColumns.expandToggle = false;
  });

  // The callback receives `row.original.jsonApiData`; the mocked generator sets
  // that to the raw data item, so `d` is `{ id, name }`.
  const renderExpandedRow = (d: any) => `Detail for ${d.name}`;

  it("renders no detail row until a row is expanded", () => {
    render(
      <ContentListTable
        data={baseData}
        fields={["name", "id"]}
        tableGeneratorType={mockModule}
        renderExpandedRow={renderExpandedRow}
      />,
    );
    expect(screen.queryByTestId("content-list-table-expanded-row")).toBeNull();
  });

  it("renders the callback output in a full-width row after toggling", () => {
    render(
      <ContentListTable
        data={baseData}
        fields={["name", "id"]}
        tableGeneratorType={mockModule}
        renderExpandedRow={renderExpandedRow}
      />,
    );
    fireEvent.click(screen.getByText("Row one"));
    const detailRow = screen.getByTestId("content-list-table-expanded-row");
    expect(detailRow).toHaveTextContent("Detail for Row one");
    const cells = detailRow.querySelectorAll("td");
    expect(cells).toHaveLength(1);
    expect(cells[0].getAttribute("colspan")).toBe("2");

    fireEvent.click(screen.getByText("Row one"));
    expect(screen.queryByTestId("content-list-table-expanded-row")).toBeNull();
  });

  it("keeps the expansion on the record, not on the row position, when the rows change", () => {
    const twoRows = {
      ...baseData,
      data: [
        { id: "1", name: "Row one" },
        { id: "2", name: "Row two" },
      ],
    };
    const { rerender } = render(
      <ContentListTable
        data={twoRows}
        fields={["name", "id"]}
        tableGeneratorType={mockModule}
        renderExpandedRow={renderExpandedRow}
      />,
    );
    fireEvent.click(screen.getByText("Row one"));
    expect(screen.getByTestId("content-list-table-expanded-row")).toHaveTextContent("Detail for Row one");

    // A search narrows the list: "Row two" now sits where "Row one" was.
    rerender(
      <ContentListTable
        data={{ ...baseData, data: [{ id: "2", name: "Row two" }] }}
        fields={["name", "id"]}
        tableGeneratorType={mockModule}
        renderExpandedRow={renderExpandedRow}
      />,
    );
    expect(screen.queryByTestId("content-list-table-expanded-row")).toBeNull();
  });

  it("rows cannot expand without the prop", () => {
    render(<ContentListTable data={baseData} fields={["name", "id"]} tableGeneratorType={mockModule} />);
    fireEvent.click(screen.getByText("Row one"));
    expect(screen.queryByTestId("content-list-table-expanded-row")).toBeNull();
    expect(screen.queryByText("Detail for Row one")).toBeNull();
  });

  it("grouped rows also expand", () => {
    render(
      <ContentListTable
        data={baseData}
        fields={["name", "id"]}
        tableGeneratorType={mockModule}
        groupBy="name"
        renderExpandedRow={renderExpandedRow}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Row one" }));
    const detailRow = screen.getByTestId("content-list-table-expanded-row");
    expect(detailRow).toHaveTextContent("Detail for Row one");
    // The detail row sits directly under the grouped data row, after the group header.
    const dataRow = screen.getByRole("button", { name: "Row one" }).closest("tr")!;
    expect(dataRow.nextElementSibling).toBe(detailRow);
    expect(dataRow.previousElementSibling).toHaveTextContent("Row one");
  });
});
