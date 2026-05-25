import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { configureJsonApi } from "../../../../client/config";
import { HelpProvider } from "../../contexts/HelpContext";
import { HelpSideNav } from "../HelpSideNav";

const base = {
  tags: [],
  contextualKeys: [],
  aiIndexed: true,
  draft: false,
  contentHash: "h",
  headings: [],
  relatedSlugs: [],
  lastUpdated: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  configureJsonApi({
    apiUrl: "http://localhost",
    helpContent: {
      manifest: [
        { ...base, id: "a", slug: "a", mode: "how-to", title: "Alpha", summary: "s", order: 1, path: "how-to/a.mdx" },
        { ...base, id: "b", slug: "b", mode: "how-to", title: "Beta", summary: "s", order: 2, path: "how-to/b.mdx" },
      ],
      namespaceUuid: "00000000-0000-5000-8000-000000000000",
    },
  });
});

describe("HelpSideNav", () => {
  it("lists every non-draft article", () => {
    render(
      <HelpProvider>
        <HelpSideNav />
      </HelpProvider>,
    );
    expect(screen.getByText("Alpha")).toBeTruthy();
    expect(screen.getByText("Beta")).toBeTruthy();
  });

  it("filters by query", () => {
    render(
      <HelpProvider>
        <HelpSideNav />
      </HelpProvider>,
    );
    fireEvent.change(screen.getByPlaceholderText(/filter/i), { target: { value: "Bet" } });
    expect(screen.queryByText("Alpha")).toBeNull();
    expect(screen.getByText("Beta")).toBeTruthy();
  });
});
