import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContentListTable } from "../ContentListTable";

// `ContentListTable` imports `useTableGenerator` from the `../../hooks` barrel,
// which resolves columns through the table-generator registry. Mocking the
// barrel (spreading the actual module so the other exports survive) is the same
// approach the sibling `ContentListTable.test.tsx` in this folder uses; one
// plain column is enough here.
vi.mock("../../../hooks", async () => {
  const actual = await vi.importActual("../../../hooks");
  return {
    ...actual,
    useTableGenerator: vi.fn((_type: any, params: any) => ({
      data: params.data.map((item: any) => ({ ...item, jsonApiData: item })),
      columns: [
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
