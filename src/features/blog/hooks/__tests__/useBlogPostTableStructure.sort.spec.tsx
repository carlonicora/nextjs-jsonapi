import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlogPostFields } from "../../data";
import { useBlogPostTableStructure } from "../useBlogPostTableStructure";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key, useLocale: () => "en" }));
vi.mock("../useBlogCategoryNames", () => ({ useBlogCategoryNames: () => () => "" }));

/** Spec row A14: status, publishedAt. Only an explicit `enableSorting: true` opts a column in (call C3). */
describe("useBlogPostTableStructure sorting", () => {
  it("opts in exactly the row's sortable columns", () => {
    const { result } = renderHook(() =>
      useBlogPostTableStructure({ data: [], fields: Object.values(BlogPostFields) as any }),
    );
    const columns = result.current.columns as any[];
    const sortable = columns.filter((column) => column.enableSorting === true).map((column) => column.id);
    expect(sortable.sort()).toEqual(["publishedAt", "status"]);
  });
});
