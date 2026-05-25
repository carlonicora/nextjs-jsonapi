import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { configureJsonApi } from "../../../../client/config";
import { HelpProvider } from "../../contexts/HelpContext";
import { HelpHint } from "../HelpHint";

const article = {
  id: "1",
  slug: "x",
  mode: "how-to",
  title: "X",
  summary: "S",
  order: 1,
  tags: [],
  contextualKeys: ["npc.editor"],
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

describe("HelpHint", () => {
  it("renders null when no article matches the contextKey", () => {
    const { container } = render(
      <HelpProvider>
        <HelpHint contextKey="nope.absent" />
      </HelpProvider>,
    );
    expect(container.querySelector("button")).toBeNull();
  });

  it("renders the trigger when at least one article matches", () => {
    render(
      <HelpProvider>
        <HelpHint contextKey="npc.editor" />
      </HelpProvider>,
    );
    expect(screen.getByLabelText(/help on this|hint/i)).toBeTruthy();
  });
});
