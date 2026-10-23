import { render, screen } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { ModuleRegistry } from "../../../../../core/registry/ModuleRegistry";
import { BlogPostsList } from "../BlogPostsList";

vi.mock("../../../../../hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../hooks")>()),
  useDataListRetriever: () => ({ data: [], refresh: vi.fn(), search: vi.fn() }),
}));
vi.mock("../../../../../components/tables/ContentListTable", () => ({
  ContentListTable: ({ functions }: { functions: ReactNode[] }) => <div data-testid="functions">{functions}</div>,
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
// The editor sheet itself is not under test: render only the trigger the list hands it.
vi.mock("../BlogPostEditor", () => ({
  BlogPostEditor: ({ trigger }: { trigger?: ReactNode }) => <>{trigger}</>,
}));

beforeAll(() => {
  ModuleRegistry.register("BlogPost" as any, { name: "blog-posts" } as any);
});

describe("BlogPostsList", () => {
  it("offers the new-post editor", () => {
    render(<BlogPostsList />);
    expect(screen.getByText("blog.admin.newPost")).toBeInTheDocument();
  });
});
