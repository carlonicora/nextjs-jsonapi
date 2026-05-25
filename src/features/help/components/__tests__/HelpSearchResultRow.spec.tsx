import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Command, CommandList } from "../../../../shadcnui";
import { configureJsonApi } from "../../../../client/config";
import { HelpProvider } from "../../contexts/HelpContext";
import { HelpSearchResultRow } from "../HelpSearchResultRow";

const article = {
  id: "abc",
  slug: "x",
  mode: "how-to" as const,
  title: "X title",
  summary: "S",
  order: 1,
  tags: [],
  contextualKeys: [],
  aiIndexed: true,
  draft: false,
  contentHash: "h",
  path: "how-to/x.mdx",
  headings: [],
  relatedSlugs: [],
  lastUpdated: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  configureJsonApi({
    apiUrl: "http://localhost",
    helpContent: { manifest: [article], namespaceUuid: "00000000-0000-5000-8000-000000000000" },
  });
});

describe("HelpSearchResultRow", () => {
  it("renders the article title when manifest contains the id", () => {
    render(
      <HelpProvider>
        <Command>
          <CommandList>
            <HelpSearchResultRow result={{ id: "abc", name: "ignored", entityType: "howtos" }} />
          </CommandList>
        </Command>
      </HelpProvider>,
    );
    expect(screen.getByText("X title")).toBeTruthy();
  });

  it("renders disabled removed-state row when id is missing", () => {
    render(
      <HelpProvider>
        <Command>
          <CommandList>
            <HelpSearchResultRow result={{ id: "ghost", name: "ignored", entityType: "howtos" }} />
          </CommandList>
        </Command>
      </HelpProvider>,
    );
    expect(screen.queryByText("X title")).toBeNull();
  });
});
